import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import {
  ensureGitignoreHasMagnet,
  findProjectLink,
  readProjectLink,
  writeProjectLink,
} from "./linkFile";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "magnet-link-test-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("linkFile", () => {
  test("readProjectLink returns null when missing", async () => {
    expect(await readProjectLink(dir)).toBeNull();
  });

  test("write then read round-trips", async () => {
    const link = { orgId: "org_123", orgSlug: "toolkit", orgName: "Toolkit" };
    const path = await writeProjectLink(dir, link);
    expect(path).toBe(join(dir, ".magnet", "project.json"));
    expect(await readProjectLink(dir)).toEqual(link);
  });

  test("readProjectLink returns null for malformed json", async () => {
    await mkdir(join(dir, ".magnet"), { recursive: true });
    await writeFile(join(dir, ".magnet", "project.json"), "not json");
    expect(await readProjectLink(dir)).toBeNull();
  });

  test("findProjectLink walks up from a subdirectory", async () => {
    const link = { orgId: "org_123", orgSlug: null, orgName: "Toolkit" };
    await writeProjectLink(dir, link);
    const nested = join(dir, "a", "b");
    await mkdir(nested, { recursive: true });
    const found = await findProjectLink(nested);
    expect(found?.dir).toBe(dir);
    expect(found?.link).toEqual(link);
  });

  test("ensureGitignoreHasMagnet skips non-git directories", async () => {
    expect(await ensureGitignoreHasMagnet(dir)).toBe(false);
  });

  test("ensureGitignoreHasMagnet appends in a git repo", async () => {
    await mkdir(join(dir, ".git"));
    await writeFile(join(dir, ".gitignore"), "node_modules");
    expect(await ensureGitignoreHasMagnet(dir)).toBe(true);
    const content = await readFile(join(dir, ".gitignore"), "utf8");
    expect(content).toBe("node_modules\n.magnet\n");
    // Second run is a no-op
    expect(await ensureGitignoreHasMagnet(dir)).toBe(false);
  });

  test("ensureGitignoreHasMagnet creates .gitignore when missing", async () => {
    await mkdir(join(dir, ".git"));
    expect(await ensureGitignoreHasMagnet(dir)).toBe(true);
    const content = await readFile(join(dir, ".gitignore"), "utf8");
    expect(content).toBe(".magnet\n");
  });
});
