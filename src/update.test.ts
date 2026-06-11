import { describe, test, expect } from "bun:test";
import { artifactName, detectManagedInstall, isSameVersion } from "./update";

describe("update", () => {
  test("isSameVersion ignores leading v", () => {
    expect(isSameVersion("v0.1.7", "v0.1.7")).toBe(true);
    expect(isSameVersion("0.1.7", "v0.1.7")).toBe(true);
    expect(isSameVersion("v0.1.6", "v0.1.7")).toBe(false);
    expect(isSameVersion("dev", "v0.1.7")).toBe(false);
  });

  test("detectManagedInstall recognizes volta and npm paths", () => {
    expect(detectManagedInstall("/Users/x/.volta/bin/magnet")?.manager).toBe("Volta");
    expect(detectManagedInstall("/usr/lib/node_modules/@magnet-ai/cli/bin/magnet")?.manager).toBe(
      "npm"
    );
    expect(detectManagedInstall("/usr/local/bin/magnet")).toBeNull();
  });

  test("artifactName matches a release artifact on this platform", () => {
    const name = artifactName();
    expect(name).toMatch(/^magnet-cli-(darwin|linux|windows)-(amd64|arm64)\.tar\.gz$/);
  });
});
