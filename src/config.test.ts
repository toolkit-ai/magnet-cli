import { describe, test, expect } from "bun:test";
import {
  getApiKeyOrError,
  getBaseUrl,
  DEFAULT_LIST_LIMIT_VALUE,
} from "./config";

const validKey = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

describe("config", () => {
  test("getApiKeyOrError returns error when MAGNET_API_KEY empty", () => {
    const orig = process.env.MAGNET_API_KEY;
    delete process.env.MAGNET_API_KEY;
    const r = getApiKeyOrError();
    if (orig !== undefined) process.env.MAGNET_API_KEY = orig;
    expect(r).toBeInstanceOf(Error);
    expect((r as Error).message).toContain("missing");
  });

  test("getApiKeyOrError returns error for invalid UUID", () => {
    const orig = process.env.MAGNET_API_KEY;
    process.env.MAGNET_API_KEY = "not-a-uuid";
    const r = getApiKeyOrError();
    if (orig !== undefined) process.env.MAGNET_API_KEY = orig;
    else delete process.env.MAGNET_API_KEY;
    expect(r).toBeInstanceOf(Error);
  });

  test("getApiKeyOrError returns key for valid UUID", () => {
    const orig = process.env.MAGNET_API_KEY;
    process.env.MAGNET_API_KEY = validKey;
    const r = getApiKeyOrError();
    process.env.MAGNET_API_KEY = orig ?? "";
    expect(r).toBe(validKey);
  });

  test("getBaseUrl returns default when MAGNET_API_URL unset", () => {
    const orig = process.env.MAGNET_API_URL;
    delete process.env.MAGNET_API_URL;
    const u = getBaseUrl();
    if (orig !== undefined) process.env.MAGNET_API_URL = orig;
    expect(u).toBe("https://www.magnet.run");
  });

  test("getBaseUrl trims and strips trailing slash", () => {
    const orig = process.env.MAGNET_API_URL;
    process.env.MAGNET_API_URL = " https://custom.example.com/ ";
    const u = getBaseUrl();
    process.env.MAGNET_API_URL = orig ?? "";
    expect(u).toBe("https://custom.example.com");
  });

  test("DEFAULT_LIST_LIMIT_VALUE is 50", () => {
    expect(DEFAULT_LIST_LIMIT_VALUE).toBe(50);
  });
});
