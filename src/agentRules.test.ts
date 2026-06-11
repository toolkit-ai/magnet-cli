import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, readFile, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { buildRulesContent, upsertMarkedBlock, writeAgentRules } from "./agentRules";

const LINK = { orgId: "org_123", orgSlug: "toolkit", orgName: "Toolkit" };

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "magnet-rules-test-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("agentRules", () => {
  test("writes CLAUDE.md and .cursor/rules/magnet.mdc", async () => {
    const result = await writeAgentRules(dir, LINK);
    const claude = await readFile(result.claudePath, "utf8");
    const cursor = await readFile(result.cursorPath, "utf8");

    expect(claude).toContain("<!-- BEGIN MAGNET RULES -->");
    expect(claude).toContain("magnet issues create");
    expect(claude).toContain("Toolkit");
    expect(cursor).toStartWith("---");
    expect(cursor).toContain("alwaysApply: true");
    expect(cursor).toContain("Agent wishlist");
  });

  test("re-running replaces the block instead of duplicating", async () => {
    await writeAgentRules(dir, LINK);
    await writeAgentRules(dir, LINK);
    const claude = await readFile(join(dir, "CLAUDE.md"), "utf8");
    expect(claude.match(/BEGIN MAGNET RULES/g)?.length).toBe(1);
  });

  test("preserves existing CLAUDE.md content around the block", async () => {
    await writeFile(join(dir, "CLAUDE.md"), "# My project\n\nUse tabs.\n");
    await writeAgentRules(dir, LINK);
    await writeAgentRules(dir, { ...LINK, orgName: "Renamed" });
    const claude = await readFile(join(dir, "CLAUDE.md"), "utf8");

    expect(claude).toStartWith("# My project");
    expect(claude).toContain("Use tabs.");
    expect(claude).toContain("Renamed");
    expect(claude).not.toContain("**Toolkit**");
  });

  test("upsertMarkedBlock appends to non-empty file with separator", () => {
    const out = upsertMarkedBlock("existing", "<!-- BEGIN MAGNET RULES -->x<!-- END MAGNET RULES -->");
    expect(out).toStartWith("existing\n\n<!-- BEGIN MAGNET RULES -->");
  });

  test("buildRulesContent falls back to orgId when name and slug missing", () => {
    const content = buildRulesContent({ orgId: "org_9", orgSlug: null, orgName: "" });
    expect(content).toContain("org_9");
  });
});
