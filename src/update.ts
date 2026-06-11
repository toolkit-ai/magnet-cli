import { chmod, mkdtemp, rename, rm } from "fs/promises";
import { spawn } from "child_process";
import { tmpdir } from "os";
import { dirname, join } from "path";

const REPO = "toolkit-ai/magnet-cli";
const BINARY = process.platform === "win32" ? "magnet.exe" : "magnet";

export function artifactName(): string | null {
  const os = process.platform;
  const arch = process.arch;
  if (os === "darwin" && arch === "x64") return "magnet-cli-darwin-amd64.tar.gz";
  if (os === "darwin" && arch === "arm64") return "magnet-cli-darwin-arm64.tar.gz";
  if (os === "linux" && arch === "x64") return "magnet-cli-linux-amd64.tar.gz";
  if (os === "linux" && arch === "arm64") return "magnet-cli-linux-arm64.tar.gz";
  if (os === "win32" && arch === "x64") return "magnet-cli-windows-amd64.tar.gz";
  return null;
}

/** "v0.1.7" and "0.1.7" compare equal. "dev" builds never match a release. */
export function isSameVersion(current: string, latestTag: string): boolean {
  return current.replace(/^v/, "") === latestTag.replace(/^v/, "");
}

/** Package-manager installs should be updated through the manager, not in place. */
export function detectManagedInstall(
  execPath: string
): { manager: string; command: string } | null {
  if (execPath.includes(".volta")) {
    return { manager: "Volta", command: "volta install @magnet-ai/cli@latest" };
  }
  if (execPath.includes("node_modules") || execPath.includes("npm")) {
    return { manager: "npm", command: "npm install -g @magnet-ai/cli@latest" };
  }
  return null;
}

export async function fetchLatestTag(): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to check for updates: HTTP ${res.status}`);
  }
  const json = (await res.json()) as { tag_name?: string };
  if (!json.tag_name) {
    throw new Error("Failed to check for updates: no tag_name in latest release");
  }
  return json.tag_name;
}

function extractTarball(tarball: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("tar", ["xzf", tarball, "-C", dest], { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`tar exited with code ${code}`))
    );
  });
}

/** Download the latest release binary and atomically replace the running executable. */
export async function selfUpdate(latestTag: string, execPath: string): Promise<void> {
  const artifact = artifactName();
  if (!artifact) {
    throw new Error(
      `No prebuilt binary for ${process.platform}/${process.arch}. ` +
        `Install from https://github.com/${REPO}/releases.`
    );
  }

  const url = `https://github.com/${REPO}/releases/download/${latestTag}/${artifact}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status}`);
  }

  const workDir = await mkdtemp(join(tmpdir(), "magnet-update-"));
  try {
    const tarballPath = join(workDir, artifact);
    await Bun.write(tarballPath, await res.arrayBuffer());
    await extractTarball(tarballPath, workDir);

    const newBinary = join(workDir, BINARY);
    await chmod(newBinary, 0o755);

    // Stage next to the target so the final rename is atomic (same filesystem).
    // On Windows the running exe can't be overwritten, so move it aside first.
    const staged = join(dirname(execPath), `.${BINARY}.new`);
    await rename(newBinary, staged).catch(async (err) => {
      if (err?.code !== "EXDEV") throw err;
      await Bun.write(staged, Bun.file(newBinary));
      await chmod(staged, 0o755);
    });
    if (process.platform === "win32") {
      await rename(execPath, join(dirname(execPath), `.${BINARY}.old`));
    }
    await rename(staged, execPath);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
