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

  it("does not apply Aiven-specific certificate requirements to other MySQL hosts", () => {
    expect(
      getAivenSslOptions("mysql://user:pass@db.example.com:3306/app", undefined),
    ).toBeUndefined();
  });
});
