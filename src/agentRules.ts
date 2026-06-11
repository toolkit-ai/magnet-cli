import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { ProjectLink } from "./linkFile";

const BEGIN_MARKER = "<!-- BEGIN MAGNET RULES -->";
const END_MARKER = "<!-- END MAGNET RULES -->";

const CLAUDE_FILE = "CLAUDE.md";
const CURSOR_RULES_FILE = join(".cursor", "rules", "magnet.mdc");

export function buildRulesContent(link: ProjectLink): string {
  const workspaceLabel = link.orgSlug
    ? `**${link.orgName}** (\`${link.orgSlug}\`)`
    : `**${link.orgName || link.orgId}**`;

  return `## Magnet workspace

This repository is linked to the Magnet workspace ${workspaceLabel}. Magnet ([magnet.run](https://www.magnet.run)) is a shared workspace for building software with AI agents: issues, pages (docs), and agent sessions live there. You can read and write it with the \`magnet\` CLI. All commands output JSON. If a command fails with an auth error, ask the user to run \`magnet login\`.

### CLI cheatsheet

- \`magnet whoami\` — check authentication
- \`magnet search "<query>" [--types issue,page]\` — search issues and pages. Always search before creating, to avoid duplicates.
- \`magnet issues list --search "<q>"\` / \`magnet issues get <id>\` — read issues (content is markdown)
- \`magnet issues create --title "..." --description "<markdown>"\` — create an issue
- \`magnet issues update <id> --status todo|in_progress|done|blocked\` — track progress
- \`magnet pages list --search "<q>"\` / \`magnet pages get <id>\` — read pages
- \`magnet pages create --title "..." --markdown "<markdown>"\` — create a page
- \`magnet pages update <id> --markdown "<body>"\` — replace a page body. To append, \`pages get\` first, then write the merged content.
- \`magnet open --web\` or \`magnet open --desktop\` — open this workspace

### When to use Magnet

Treat Magnet as this project's shared memory and project management — use it the way a thoughtful human teammate would:

- Before starting non-trivial work, \`magnet search\` for related issues and pages.
- Create an issue for substantial work; set it \`in_progress\` while you work and \`done\` when it ships. Reference the issue URL in commits and PRs.
- Persist plans, design decisions, and research as pages instead of leaving them in chat. Prefer one well-titled page over many fragments.

### Reflect on your workspace

Magnet is a new kind of software-building workspace meant to complement tools like Claude Code and Cursor. While working, if you find yourself wishing your workspace could do something it can't — publish a runnable mini app or live demo, attach a proof that a change works, render diagrams, richer project-management views, anything that would have helped your current task — capture the wish in the shared wishlist page:

1. \`magnet search "Agent wishlist" --types page\`
2. If the page exists: \`magnet pages get <id>\`, append a bullet (\`- <date>: <wish> — <one-line context>\`) to its markdown, and \`magnet pages update <id> --markdown "<full merged body>"\`.
3. If it doesn't exist: \`magnet pages create --title "Agent wishlist" --markdown "<your first bullet>"\`.

Add at most one wish per session, and only when it is concrete and would genuinely have helped.`;
}

function claudeBlock(content: string): string {
  return `${BEGIN_MARKER}\n${content}\n${END_MARKER}`;
}

function cursorRulesFileContent(content: string): string {
  return `---
description: Magnet workspace integration — how and when to use the magnet CLI
alwaysApply: true
---

${content}
`;
}

async function readFileOrEmpty(path: string): Promise<string> {
  try {
    return await readFile(path, "utf8");
  } catch (_) {
    return "";
  }
}

/** Insert or replace the marked Magnet block, leaving surrounding content untouched. */
export function upsertMarkedBlock(existing: string, block: string): string {
  const begin = existing.indexOf(BEGIN_MARKER);
  const end = existing.indexOf(END_MARKER);
  if (begin !== -1 && end !== -1 && end > begin) {
    return (
      existing.slice(0, begin) + block + existing.slice(end + END_MARKER.length)
    );
  }
  if (existing.trim() === "") {
    return block + "\n";
  }
  const separator = existing.endsWith("\n") ? "\n" : "\n\n";
  return existing + separator + block + "\n";
}

export interface AgentRulesResult {
  claudePath: string;
  cursorPath: string;
}

export async function writeAgentRules(
  dir: string,
  link: ProjectLink
): Promise<AgentRulesResult> {
  const content = buildRulesContent(link);

  const claudePath = join(dir, CLAUDE_FILE);
  const existing = await readFileOrEmpty(claudePath);
  await writeFile(claudePath, upsertMarkedBlock(existing, claudeBlock(content)));

  const cursorPath = join(dir, CURSOR_RULES_FILE);
  await mkdir(join(dir, ".cursor", "rules"), { recursive: true });
  await writeFile(cursorPath, cursorRulesFileContent(content));

  return { claudePath, cursorPath };
}
