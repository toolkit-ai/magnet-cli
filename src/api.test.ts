import { describe, test, expect } from "bun:test";
import { createClient, ApiError } from "./api";

describe("api", () => {
  test("createClient uses config when no args", () => {
    const orig = process.env.MAGNET_API_KEY;
    process.env.MAGNET_API_KEY = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
    const client = createClient();
    process.env.MAGNET_API_KEY = orig ?? "";
    expect(client).toBeDefined();
    expect(typeof client.get).toBe("function");
    expect(typeof client.post).toBe("function");
    expect(typeof client.put).toBe("function");
  });

  test("createClient with explicit key and baseUrl", () => {
    const client = createClient("test-key", "https://api.test.com");
    expect(client).toBeDefined();
  });

  test("ApiError has code and body", () => {
    const err = new ApiError("msg", 404, { error: "not found" });
    expect(err.message).toBe("msg");
    expect(err.code).toBe(404);
    expect(err.body).toEqual({ error: "not found" });
  });
});
