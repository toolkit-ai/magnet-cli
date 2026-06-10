import { mkdir, readFile, writeFile, access } from "fs/promises";
import { dirname, join } from "path";

export interface ProjectLink {
  orgId: string;
  orgSlug: string | null;
  orgName: string;
}

const LINK_DIR = ".magnet";
const LINK_FILE = "project.json";
const README_FILE = "README.txt";

const README_CONTENT = `> Why do I have a folder named ".magnet" in my project?
The ".magnet" folder is created when you link a directory to a Magnet organization.

> What does the "project.json" file contain?
The "project.json" file contains:
- The ID of the Magnet organization that you linked ("orgId")
- The slug and name of that organization ("orgSlug", "orgName")

> Should I commit the ".magnet" folder?
No, you should not share the ".magnet" folder with anyone.
Upon creation, it will be automatically added to your ".gitignore" file.
`;

export function linkFilePath(dir: string): string {
  return join(dir, LINK_DIR, LINK_FILE);
}

export async function readProjectLink(dir: string): Promise<ProjectLink | null> {
  try {
    const raw = await readFile(linkFilePath(dir), "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.orgId === "string") {
      return {
        orgId: parsed.orgId,
        orgSlug: typeof parsed.orgSlug === "string" ? parsed.orgSlug : null,
        orgName: typeof parsed.orgName === "string" ? parsed.orgName : "",
      };
    }
  } catch (_) {}
  return null;
}

/** Walk up from startDir looking for .magnet/project.json (like git does for .git). */
export async function findProjectLink(
  startDir: string
): Promise<{ dir: string; link: ProjectLink } | null> {
  let dir = startDir;
  for (;;) {
    const link = await readProjectLink(dir);
    if (link) return { dir, link };
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export async function writeProjectLink(
  dir: string,
  link: ProjectLink
): Promise<string> {
  const target = join(dir, LINK_DIR);
  await mkdir(target, { recursive: true });
  const path = join(target, LINK_FILE);
  await writeFile(path, JSON.stringify(link, null, 2) + "\n");
  await writeFile(join(target, README_FILE), README_CONTENT);
  return path;
}

/** Append .magnet to .gitignore if the directory is a git repo and it's missing. */
export async function ensureGitignoreHasMagnet(dir: string): Promise<boolean> {
  try {
    await access(join(dir, ".git"));
  } catch (_) {
    return false;
  }

  const gitignorePath = join(dir, ".gitignore");
  let content = "";
  try {
    content = await readFile(gitignorePath, "utf8");
  } catch (_) {}

  const hasEntry = content
    .split(/\r?\n/)
    .some((line) => line.trim() === ".magnet" || line.trim() === ".magnet/");
  if (hasEntry) return false;

  const suffix = content.length > 0 && !content.endsWith("\n") ? "\n" : "";
  await writeFile(gitignorePath, content + suffix + ".magnet\n");
  return true;
}
