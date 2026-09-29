export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  dbCaCert: process.env.DB_CA_CERT ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  ownerEmail: process.env.OWNER_EMAIL?.trim().toLowerCase() ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  s3PublicUrl: process.env.S3_PUBLIC_URL ?? "",
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
};

export function assertProductionConfig() {
  if (!ENV.isProduction) return;
  const missing = [
    ["DATABASE_URL", ENV.databaseUrl],
    ["JWT_SECRET", ENV.cookieSecret],
    ["CRON_SECRET", ENV.cronSecret],
  ].filter(([, value]) => !value.trim()).map(([name]) => name);
  if (missing.length) throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
}
