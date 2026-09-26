import { describe, expect, it } from "vitest";
import {
  createMySqlPoolOptions,
  getAivenSslOptions,
} from "./mysqlConnection";

const aivenUrl =
  "mysql://avnadmin:encoded%40password@bird-db.aivencloud.com:12345/defaultdb";
const ca = "-----BEGIN CERTIFICATE-----\\nexample-ca\\n-----END CERTIFICATE-----";

describe("Aiven MySQL connection settings", () => {
  it("requires a CA certificate for Aiven and enables strict certificate and host verification", () => {
    expect(() => getAivenSslOptions(aivenUrl, undefined)).toThrow(
      "AIVEN_CA_CERT is required",
    );
    expect(getAivenSslOptions(aivenUrl, ca)).toEqual({
      ca: "-----BEGIN CERTIFICATE-----\nexample-ca\n-----END CERTIFICATE-----",
      rejectUnauthorized: true,
      verifyIdentity: true,
    });
  });

  it("limits each runtime pool to one connection for a shared small database tier", () => {
    expect(createMySqlPoolOptions(aivenUrl, ca)).toMatchObject({
      uri: aivenUrl,
      connectionLimit: 1,
      maxIdle: 1,
      waitForConnections: true,
      ssl: {
        rejectUnauthorized: true,
        verifyIdentity: true,
      },
    });
  });

  it("removes mysql ssl-mode URL options because TLS is configured explicitly", () => {
    const options = createMySqlPoolOptions(
      `${aivenUrl}?ssl-mode=REQUIRED&charset=utf8mb4`,
      ca,
    );
    expect(options.uri).not.toContain("ssl-mode");
    expect(options.uri).toContain("charset=utf8mb4");
    expect(options.ssl).toMatchObject({ rejectUnauthorized: true });
  });

  it("does not apply Aiven-specific certificate requirements to other MySQL hosts", () => {
    expect(
      getAivenSslOptions("mysql://user:pass@db.example.com:3306/app", undefined),
    ).toBeUndefined();
  });
});
