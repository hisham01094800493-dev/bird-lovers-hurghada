import type { PoolOptions, SslOptions } from "mysql2";

export function getAivenSslOptions(
  connectionUrl: string,
  rawCa = process.env.AIVEN_CA_CERT,
): SslOptions | undefined {
  const hostname = new URL(connectionUrl).hostname.toLowerCase();
  if (!hostname.endsWith(".aivencloud.com")) return undefined;

  const ca = rawCa?.replace(/\\n/g, "\n").trim();
  if (!ca) {
    throw new Error(
      "AIVEN_CA_CERT is required for verified TLS connections to Aiven MySQL.",
    );
  }

  return {
    ca,
    rejectUnauthorized: true,
    verifyIdentity: true,
  };
}

export function createMySqlPoolOptions(
  connectionUrl: string,
  rawCa = process.env.AIVEN_CA_CERT,
): PoolOptions {
  const ssl = getAivenSslOptions(connectionUrl, rawCa);
  const normalizedUrl = new URL(connectionUrl);
  // Aiven's sample URLs may specify this libmysql-specific parameter; mysql2
  // warns about it and TLS is configured explicitly below instead.
  normalizedUrl.searchParams.delete("ssl-mode");
  return {
    uri: normalizedUrl.toString(),
    connectionLimit: 1,
    maxIdle: 1,
    idleTimeout: 60_000,
    waitForConnections: true,
    queueLimit: 10,
    ...(ssl ? { ssl } : {}),
  };
}
