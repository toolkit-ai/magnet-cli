import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import {
  buildRulesContent,
  detectRulesTargets,
  upsertMarkedBlock,
  writeAgentRules,
} from "./agentRules";

const LINK = { orgId: "org_123", orgSlug: "toolkit", orgName: "Toolkit" };
const ALL = ["claude", "cursor", "codex"] as const;

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "magnet-rules-test-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("agentRules", () => {
  test("writes CLAUDE.md, AGENTS.md, and .cursor/rules/magnet.mdc for all targets", async () => {
    const written = await writeAgentRules(dir, LINK, [...ALL]);
    expect(written).toEqual([
      join(dir, "CLAUDE.md"),
      join(dir, "AGENTS.md"),
      join(dir, ".cursor", "rules", "magnet.mdc"),
    ]);

    const claude = await readFile(join(dir, "CLAUDE.md"), "utf8");
    const codex = await readFile(join(dir, "AGENTS.md"), "utf8");
    const cursor = await readFile(join(dir, ".cursor", "rules", "magnet.mdc"), "utf8");

    expect(claude).toContain("<!-- BEGIN MAGNET RULES -->");
    expect(claude).toContain("magnet issues create");
    expect(claude).toContain("Toolkit");
    expect(codex).toContain("<!-- BEGIN MAGNET RULES -->");
    expect(cursor).toStartWith("---");
    expect(cursor).toContain("alwaysApply: true");
    expect(cursor).toContain("Agent wishlist");
  });

  test("only writes requested targets", async () => {
    const written = await writeAgentRules(dir, LINK, ["codex"]);
    expect(written).toEqual([join(dir, "AGENTS.md")]);
    await expect(readFile(join(dir, "CLAUDE.md"), "utf8")).rejects.toThrow();
  });

  test("re-running replaces the block instead of duplicating", async () => {
    await writeAgentRules(dir, LINK, [...ALL]);
    await writeAgentRules(dir, LINK, [...ALL]);
    for (const file of ["CLAUDE.md", "AGENTS.md"]) {
      const content = await readFile(join(dir, file), "utf8");
      expect(content.match(/BEGIN MAGNET RULES/g)?.length).toBe(1);
    }
  });

  test("preserves existing content around the block", async () => {
    await writeFile(join(dir, "CLAUDE.md"), "# My project\n\nUse tabs.\n");
    await writeAgentRules(dir, LINK, ["claude"]);
    await writeAgentRules(dir, { ...LINK, orgName: "Renamed" }, ["claude"]);
    const claude = await readFile(join(dir, "CLAUDE.md"), "utf8");

    expect(claude).toStartWith("# My project");
    expect(claude).toContain("Use tabs.");
    expect(claude).toContain("Renamed");
    expect(claude).not.toContain("**Toolkit**");
  });

  test("detectRulesTargets finds tools by their config files", async () => {
    expect(await detectRulesTargets(dir)).toEqual([]);
    await writeFile(join(dir, "CLAUDE.md"), "x");
    await mkdir(join(dir, ".cursor"));
    expect(await detectRulesTargets(dir)).toEqual(["claude", "cursor"]);
    await writeFile(join(dir, "AGENTS.md"), "x");
    expect(await detectRulesTargets(dir)).toEqual(["claude", "cursor", "codex"]);
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
