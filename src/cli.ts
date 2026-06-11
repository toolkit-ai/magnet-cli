import { Command } from "commander";
import { basename } from "path";
import { createClient, createClientWithHeaders, uploadToPresignedUrl } from "./api";
import { getApiKey } from "./config";
import {
  DEFAULT_LIST_LIMIT_VALUE,
  getBaseUrl,
  resolveCredential,
  credentialHeaders,
  type Credential,
} from "./config";
import {
  authFilePath,
  getStoredCredential,
  removeCredential,
  saveCredential,
} from "./authStore";
import { runDeviceFlow, tryOpenBrowser } from "./deviceFlow";
import {
  RULES_TARGETS,
  detectRulesTargets,
  writeAgentRules,
  type RulesTarget,
} from "./agentRules";
import type { ProjectLink } from "./linkFile";
import {
  ensureGitignoreHasMagnet,
  findProjectLink,
  readProjectLink,
  writeProjectLink,
} from "./linkFile";
import {
  isInteractive,
  promptConfirm,
  promptMultiSelect,
  promptSelect,
  promptText,
} from "./prompt";
import { parseDurationToSeconds } from "./duration";
import type {
  ListIssuesResponse,
  GetIssueResponse,
  IssueDetail,
  CreateIssueMarkdownRequest,
  CreateIssueResponse,
  UpdateIssueMarkdownRequest,
  UpdateIssueResponse,
  ListPagesResponse,
  GetPageResponse,
  PageDetail,
  CreatePageMarkdownRequest,
  CreatePageResponse,
  UpdatePageMarkdownRequest,
  UpdatePageResponse,
  SearchResponse,
  SandboxImageUploadInitResponse,
  SandboxImageUploadCompleteResponse,
  SandboxImageUploadStatusResponse,
} from "./types";

const VERSION = process.env.MAGNET_CLI_VERSION ?? "dev";

function jsonOut(obj: unknown) {
  console.log(JSON.stringify(obj, null, 2));
}

function handleError(err: unknown): never {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(String(err));
  }
  process.exit(1);
}

const program = new Command();

program
  .name("magnet")
  .description(
    `Magnet CLI ${VERSION} — issues, pages, and search.\n\nMagnet CLI talks to the Magnet API. Set MAGNET_API_KEY. Optional: MAGNET_API_URL (default https://www.magnet.run).`
  )
  .version(VERSION);

// --- issues ---
const issues = program
  .command("issues")
  .description("List, get, or create Magnet issues");

issues
  .command("list")
  .description("List issues")
  .option("--search <query>", "Search query")
  .option("--limit <n>", "Page size (default from API). Use with --cursor for pagination.", parseInt)
  .option("--cursor <c>", "Pagination cursor (use pagination.nextCursor from previous response)")
  .action(async (opts) => {
    try {
      getApiKey();
      const api = createClient();
      const params: Record<string, string> = {};
      if (opts.search) params.search = opts.search;
      let limit = opts.limit;
      if (opts.cursor && (limit == null || limit <= 0)) limit = DEFAULT_LIST_LIMIT_VALUE;
      if (limit != null && limit > 0) params.limit = String(limit);
      if (opts.cursor) params.cursor = opts.cursor;
      const out = await api.get<ListIssuesResponse>("/api/issues", params);
      jsonOut(out);
    } catch (e) {
      handleError(e);
    }
  });

issues
  .command("get <id>")
  .description("Get an issue by ID (markdown API; returns docContent)")
  .option("--preview-only", "Return truncated markdownPreview instead of full body")
  .action(async (id: string, opts: { previewOnly?: boolean }) => {
    try {
      getApiKey();
      const api = createClient();
      const params: Record<string, string> = {};
      if (opts.previewOnly) params.previewOnly = "true";
      const data = await api.get<GetIssueResponse>(
        `/api/issues/${encodeURIComponent(id)}/markdown`,
        params
      );
      if (data?.issue) {
        jsonOut(data.issue);
      } else {
        jsonOut(data);
      }
    } catch (e) {
      handleError(e);
    }
  });

issues
  .command("create")
  .description("Create an issue from markdown")
  .requiredOption("--description <text>", "Issue description (markdown); required")
  .option("--title <text>", "Issue title (optional)")
  .option("--base-branch <branch>", "Base branch name", "main")
  .action(async (opts) => {
    try {
      getApiKey();
      const api = createClient();
      const body: CreateIssueMarkdownRequest = {
        markdown: opts.description,
        description: opts.description,
        baseBranch: opts.baseBranch ?? "main",
      };
      if (opts.title) body.title = opts.title;
      const out = await api.post<CreateIssueResponse>("/api/issues/markdown", body);
      jsonOut(out);
    } catch (e) {
      handleError(e);
    }
  });

issues
  .command("update <id>")
  .description("Update an issue (markdown API)")
  .requiredOption("--markdown <text>", "New issue body (markdown)")
  .option("--title <text>", "New title")
  .option("--status <status>", "Status: todo | in_progress | done | blocked")
  .option("--assignee-clerk-id <id>", "Clerk user ID to assign")
  .option("--skip-yjs-sync", "Skip syncing to Yjs (e.g. for bulk updates)")
  .action(async (id: string, opts: { markdown: string; title?: string; status?: string; assigneeClerkId?: string; skipYjsSync?: boolean }) => {
    try {
      getApiKey();
      const api = createClient();
      const body: UpdateIssueMarkdownRequest = { markdown: opts.markdown };
      if (opts.title !== undefined) body.title = opts.title;
      if (opts.status !== undefined) body.status = opts.status as UpdateIssueMarkdownRequest["status"];
      if (opts.assigneeClerkId !== undefined) body.assigneeClerkId = opts.assigneeClerkId;
      if (opts.skipYjsSync === true) body.skipYjsSync = true;
      const out = await api.put<UpdateIssueResponse>(
        `/api/issues/${encodeURIComponent(id)}/markdown`,
        body
      );
      jsonOut(out);
    } catch (e) {
      handleError(e);
    }
  });

// --- pages ---
const pages = program
  .command("pages")
  .description("List, get, or create Magnet pages");

pages
  .command("list")
  .description("List pages")
  .option("--search <query>", "Search query")
  .option("--limit <n>", "Page size (default from API). Use with --cursor for pagination.", parseInt)
  .option("--cursor <c>", "Pagination cursor (use pagination.nextCursor from previous response)")
  .action(async (opts) => {
    try {
      getApiKey();
      const api = createClient();
      const params: Record<string, string> = {};
      if (opts.search) params.search = opts.search;
      let limit = opts.limit;
      if (opts.cursor && (limit == null || limit <= 0)) limit = DEFAULT_LIST_LIMIT_VALUE;
      if (limit != null && limit > 0) params.limit = String(limit);
      if (opts.cursor) params.cursor = opts.cursor;
      const out = await api.get<ListPagesResponse>("/api/pages", params);
      jsonOut(out);
    } catch (e) {
      handleError(e);
    }
  });

pages
  .command("get <id>")
  .description("Get a page by ID (markdown API; returns docContent)")
  .option("--preview-only", "Return truncated markdownPreview instead of full body")
  .action(async (id: string, opts: { previewOnly?: boolean }) => {
    try {
      getApiKey();
      const api = createClient();
      const params: Record<string, string> = {};
      if (opts.previewOnly) params.previewOnly = "true";
      const data = await api.get<GetPageResponse>(
        `/api/pages/${encodeURIComponent(id)}/markdown`,
        params
      );
      if (data?.page) {
        jsonOut(data.page);
      } else {
        jsonOut(data);
      }
    } catch (e) {
      handleError(e);
    }
  });

pages
  .command("create")
  .description("Create a page from markdown")
  .requiredOption("--title <text>", "Page title; required")
  .option("--markdown <text>", "Page content (markdown); defaults to title if empty")
  .action(async (opts) => {
    try {
      getApiKey();
      const api = createClient();
      const body: CreatePageMarkdownRequest = {
        title: opts.title,
        markdown: opts.markdown?.trim() ? opts.markdown : opts.title,
      };
      const out = await api.post<CreatePageResponse>("/api/pages/markdown", body);
      jsonOut(out);
    } catch (e) {
      handleError(e);
    }
  });

pages
  .command("update <id>")
  .description("Update a page (markdown API)")
  .requiredOption("--markdown <text>", "New page body (markdown)")
  .option("--title <text>", "New title")
  .option("--skip-yjs-sync", "Skip syncing to Yjs (e.g. for bulk updates)")
  .action(async (id: string, opts: { markdown: string; title?: string; skipYjsSync?: boolean }) => {
    try {
      getApiKey();
      const api = createClient();
      const body: UpdatePageMarkdownRequest = { markdown: opts.markdown };
      if (opts.title !== undefined) body.title = opts.title;
      if (opts.skipYjsSync === true) body.skipYjsSync = true;
      const out = await api.put<UpdatePageResponse>(
        `/api/pages/${encodeURIComponent(id)}/markdown`,
        body
      );
      jsonOut(out);
    } catch (e) {
      handleError(e);
    }
  });

// --- search ---
program
  .command("search <query>")
  .description("Search issues and pages")
  .option("--types <list>", "Comma-separated types: issue, page (default: both)")
  .action(async (query: string, opts) => {
    try {
      getApiKey();
      const api = createClient();
      const params: Record<string, string> = { query };
      if (opts.types) params.types = opts.types;
      const out = await api.get<SearchResponse>("/api/search", params);
      jsonOut(out);
    } catch (e) {
      handleError(e);
    }
  });

// --- sandbox-image ---
const sandboxImage = program
  .command("sandbox-image")
  .description("Sandbox image operations");

const DEFAULT_POLL_INTERVAL = "2s";
const DEFAULT_TIMEOUT = "20m";

sandboxImage
  .command("register <tarball>")
  .description("Register a custom sandbox image from a Docker save tarball. Uploads the tarball and polls until the image is ready or failed.")
  .requiredOption("--name <name>", "Display name for the custom image")
  .requiredOption("--description <description>", "Description for the image")
  .option("--poll-interval <duration>", "Interval between status polls (e.g. 2s, 3s)", DEFAULT_POLL_INTERVAL)
  .option("--timeout <duration>", "Max time to wait for ready/failed (e.g. 15m, 20m)", DEFAULT_TIMEOUT)
  .addHelpText("after", `
Prerequisites:
  Create a tarball with: docker save -o image.tar <image:tag>
  For Cloudflare compatibility use: docker save --platform linux/amd64 -o image.tar <image:tag>

Environment:
  MAGNET_API_KEY  Required. Set to your Magnet API key (scoped to your workspace).
  MAGNET_API_URL  Optional. Default: https://www.magnet.run (use http://localhost:3000 for local testing)

Examples:
  $ magnet sandbox-image register ./image.tar --name "My Image" --description "Test image"
  $ MAGNET_API_URL=http://localhost:3000 magnet sandbox-image register ./image.tar --name "Local" --description "Local test"
`)
  .action(async (tarball: string, opts: { name: string; description: string; pollInterval?: string; timeout?: string }) => {
    try {
      getApiKey();
      const name = opts.name;
      const description = opts.description;

      const pollIntervalSec = parseDurationToSeconds(opts.pollInterval ?? DEFAULT_POLL_INTERVAL);
      const timeoutSec = parseDurationToSeconds(opts.timeout ?? DEFAULT_TIMEOUT);

      const file = Bun.file(tarball);
      if (!(await file.exists())) {
        console.error(`File not found or not readable: ${tarball}`);
        process.exit(1);
      }

      const api = createClient();

      const initRes = await api.post<SandboxImageUploadInitResponse>("/api/sandbox-images/upload/init", { name, description });
      const uploadId = initRes.uploadId;
      const presignedUrl = initRes.presignedUrl;
      const expiresAt = initRes.expiresAt;
      if (!uploadId || !presignedUrl || !expiresAt) {
        console.error("Invalid init response: missing uploadId, presignedUrl, or expiresAt");
        process.exit(1);
      }
      const expiresAtMs = new Date(expiresAt).getTime();
      if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
        console.error("Presigned URL has already expired");
        process.exit(1);
      }

      const totalBytes = file.size;
      const progressIntervalMs = 2000;
      let lastProgress = 0;
      await uploadToPresignedUrl(presignedUrl, tarball, (bytesUploaded) => {
        const now = Date.now();
        if (now - lastProgress >= progressIntervalMs || bytesUploaded >= totalBytes) {
          lastProgress = now;
          const pct = totalBytes > 0 ? Math.round((bytesUploaded / totalBytes) * 100) : 0;
          console.error(`Uploading… ${pct}% (${bytesUploaded}/${totalBytes} bytes)`);
        }
      });

      const completeRes = await api.post<SandboxImageUploadCompleteResponse>("/api/sandbox-images/upload/complete", { uploadId });
      const statusUrl = completeRes.statusUrl ?? `/api/sandbox-images/upload/status/${uploadId}`;

      const pollStart = Date.now();
      for (;;) {
        const statusRes = await api.get<SandboxImageUploadStatusResponse>(statusUrl);
        if (statusRes.status === "ready") {
          console.log(statusRes.sandboxImageId
            ? `Sandbox image registered. sandboxImageId: ${statusRes.sandboxImageId}`
            : "Sandbox image registered.");
          return;
        }
        if (statusRes.status === "failed") {
          console.error("Registration failed:", statusRes.errorMessage ?? "Unknown error");
          process.exit(1);
        }
        console.error("Status:", statusRes.status);
        if (Date.now() - pollStart >= timeoutSec * 1000) {
          console.error("Timeout waiting for image to become ready");
          process.exit(1);
        }
        await new Promise((r) => setTimeout(r, pollIntervalSec * 1000));
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("fetch")) {
        console.error("Network error:", e.message);
      } else {
        handleError(e);
      }
      process.exit(1);
    }
  });

// --- auth & linking ---

async function requireUserClient(): Promise<{
  api: ReturnType<typeof createClientWithHeaders>;
  credential: Credential;
}> {
  let credential = await resolveCredential();
  if (!credential) {
    if (!isInteractive()) {
      console.error(
        "Not logged in. Run magnet login, or set MAGNET_API_KEY for workspace-key access."
      );
      process.exit(1);
    }
    console.error("Not logged in. Starting login...");
    credential = await loginWithDeviceFlow({});
  }
  return {
    api: createClientWithHeaders(credentialHeaders(credential)),
    credential,
  };
}

async function loginWithDeviceFlow(opts: {
  noBrowser?: boolean;
}): Promise<Credential> {
  const baseUrl = getBaseUrl();
  const token = await runDeviceFlow(baseUrl, { noBrowser: opts.noBrowser });
  const credential: Credential = { kind: "cliToken", value: token };
  const me = await fetchMe(credential);
  await saveCredential(baseUrl, { token, userEmail: me.email ?? undefined });
  console.error(
    `\n✔ Logged in as ${me.email ?? me.id} (token saved to ${authFilePath()})`
  );
  return credential;
}

async function fetchMe(
  credential: Credential
): Promise<{ id: string; email: string | null; firstName?: string | null; lastName?: string | null }> {
  const api = createClientWithHeaders(credentialHeaders(credential));
  return api.get("/api/me");
}

program
  .command("login")
  .description("Log in to Magnet (browser device flow, or paste a token)")
  .option("--token <token>", "Use an existing CLI token instead of the browser flow")
  .option("--no-browser", "Don't open a browser; print the URL and code instead")
  .action(async (opts: { token?: string; browser?: boolean }) => {
    try {
      const baseUrl = getBaseUrl();
      if (opts.token) {
        const credential: Credential = { kind: "cliToken", value: opts.token.trim() };
        const me = await fetchMe(credential);
        await saveCredential(baseUrl, {
          token: credential.value,
          userEmail: me.email ?? undefined,
        });
        console.error(`✔ Token valid. Logged in as ${me.email ?? me.id}`);
        return;
      }
      await loginWithDeviceFlow({ noBrowser: opts.browser === false });
    } catch (e) {
      handleError(e);
    }
  });

program
  .command("logout")
  .description("Revoke the stored CLI token and remove it from this machine")
  .action(async () => {
    try {
      const baseUrl = getBaseUrl();
      const stored = await getStoredCredential(baseUrl);
      if (!stored) {
        console.error("Not logged in (no stored token for " + baseUrl + ").");
        return;
      }
      try {
        const api = createClientWithHeaders(
          credentialHeaders({ kind: "cliToken", value: stored.token })
        );
        await api.delete("/api/cli/tokens");
      } catch (e) {
        // Best effort: still remove locally even if revocation fails (e.g. already revoked)
        console.error(
          "Warning: could not revoke token on the server:",
          e instanceof Error ? e.message : String(e)
        );
      }
      await removeCredential(baseUrl);
      console.error("✔ Logged out.");
    } catch (e) {
      handleError(e);
    }
  });

program
  .command("whoami")
  .description("Show the user or workspace the CLI is authenticated as")
  .action(async () => {
    try {
      const credential = await resolveCredential();
      if (!credential) {
        console.error("Not logged in. Run magnet login.");
        process.exit(1);
      }
      if (credential.kind === "orgApiKey") {
        console.error(
          "Authenticated with a workspace API key (MAGNET_API_KEY). Workspace keys have no user identity."
        );
        return;
      }
      const me = await fetchMe(credential);
      jsonOut(me);
    } catch (e) {
      handleError(e);
    }
  });

interface OrgSummary {
  id: string;
  name: string;
  slug: string | null;
}

program
  .command("link")
  .alias("init")
  .description("Link this directory to a Magnet workspace (creates .magnet/project.json)")
  .option("--workspace <idOrSlug>", "Workspace id or slug (skips the picker)")
  .option("--org <idOrSlug>", "Alias for --workspace")
  .option("--yes", "Skip confirmation prompts (for CI)")
  .option("--rules", "Also write Claude Code and Cursor agent rules without asking")
  .action(async (opts: { workspace?: string; org?: string; yes?: boolean; rules?: boolean }) => {
    try {
      const cwd = process.cwd();
      const requestedWorkspace = opts.workspace ?? opts.org;
      const { api } = await requireUserClient();

      const existing = await readProjectLink(cwd);
      if (existing && !opts.yes) {
        console.error(
          `This directory is linked to ${existing.orgName || existing.orgId}` +
            (existing.orgSlug ? ` (${existing.orgSlug})` : "") +
            "."
        );
        if (!isInteractive()) {
          console.error("Pass --yes to re-link.");
          process.exit(1);
        }
        const relink = await promptConfirm("Re-link to a different workspace?");
        if (!relink) return;
      }

      const { orgs } = await api.get<{ orgs: OrgSummary[] }>("/api/organizations");

      let chosen: OrgSummary | null = null;
      if (requestedWorkspace) {
        chosen =
          orgs.find((o) => o.id === requestedWorkspace || o.slug === requestedWorkspace) ?? null;
        if (!chosen) {
          console.error(`No workspace found matching "${requestedWorkspace}".`);
          console.error(
            "Available: " +
              orgs.map((o) => o.slug ?? o.id).join(", ")
          );
          process.exit(1);
        }
      } else if (orgs.length === 1 && opts.yes) {
        chosen = orgs[0];
      } else {
        if (!isInteractive()) {
          console.error(
            "Multiple workspaces available. Pass --workspace <idOrSlug> in non-interactive mode."
          );
          process.exit(1);
        }
        const labels = orgs.map(
          (o) => `${o.name}${o.slug ? ` (${o.slug})` : ""}`
        );
        labels.push("+ Create a new workspace");
        const idx = await promptSelect(
          `Link ${basename(cwd)} to which workspace?`,
          labels
        );
        if (idx === orgs.length) {
          const name = await promptText("Name for the new workspace:");
          if (!name) {
            console.error("Workspace name is required.");
            process.exit(1);
          }
          const created = await api.post<{
            organization: OrgSummary;
          }>("/api/organizations", { name });
          chosen = created.organization;
        } else {
          chosen = orgs[idx];
        }
      }

      if (!chosen) {
        console.error("No workspace selected.");
        process.exit(1);
      }

      const path = await writeProjectLink(cwd, {
        orgId: chosen.id,
        orgSlug: chosen.slug,
        orgName: chosen.name,
      });
      const gitignoreUpdated = await ensureGitignoreHasMagnet(cwd);
      console.error(
        `✔ Linked ${basename(cwd)} to ${chosen.name}` +
          (chosen.slug ? ` (${chosen.slug})` : "")
      );
      console.error(
        `  Created ${path}` +
          (gitignoreUpdated ? " (added .magnet to .gitignore)" : "")
      );

      const setupRules =
        opts.rules === true ||
        (!opts.yes &&
          isInteractive() &&
          (await promptConfirm(
            "Set up agent rules so coding agents (Claude Code, Cursor, Codex) know how to use Magnet?",
            true
          )));
      if (setupRules) {
        await chooseAndWriteRules(
          cwd,
          { orgId: chosen.id, orgSlug: chosen.slug, orgName: chosen.name },
          {}
        );
      }
    } catch (e) {
      handleError(e);
    }
  });

/**
 * Resolve which tools get rules: explicit flags win; otherwise detected tools
 * (all three when nothing is detected), confirmed interactively when possible.
 */
async function chooseAndWriteRules(
  dir: string,
  link: ProjectLink,
  flags: { claude?: boolean; cursor?: boolean; codex?: boolean }
): Promise<void> {
  const flagged = RULES_TARGETS.map((r) => r.target).filter((t) => flags[t] === true);

  let targets: RulesTarget[];
  if (flagged.length > 0) {
    targets = flagged;
  } else {
    const detected = await detectRulesTargets(dir);
    const defaults = detected.length > 0 ? detected : RULES_TARGETS.map((r) => r.target);
    if (isInteractive()) {
      const labels = RULES_TARGETS.map(
        (r) => r.label + (detected.includes(r.target) ? " — detected" : "")
      );
      const preselected = defaults.map((t) =>
        RULES_TARGETS.findIndex((r) => r.target === t)
      );
      const chosen = await promptMultiSelect("Which tools should get Magnet rules?", labels, preselected);
      targets = chosen.map((i) => RULES_TARGETS[i].target);
    } else {
      targets = defaults;
    }
  }

  if (targets.length === 0) {
    console.error("No tools selected; skipping agent rules.");
    return;
  }
  const written = await writeAgentRules(dir, link, targets);
  console.error(`✔ Wrote agent rules to:`);
  for (const path of written) {
    console.error(`    ${path}`);
  }
  console.error("  Commit these so your whole team's agents pick them up.");
  console.error("  Re-run magnet rules anytime to refresh them after CLI updates.");
}

program
  .command("rules")
  .description(
    "Write agent rules that teach coding agents to use the magnet CLI (requires a linked project)"
  )
  .option("--claude", "Write CLAUDE.md rules (Claude Code)")
  .option("--cursor", "Write .cursor/rules/magnet.mdc (Cursor)")
  .option("--codex", "Write AGENTS.md rules (Codex and other AGENTS.md tools)")
  .action(async (opts: { claude?: boolean; cursor?: boolean; codex?: boolean }) => {
    try {
      const found = await findProjectLink(process.cwd());
      if (!found) {
        console.error("No project linked. Run magnet link to link this directory to a workspace.");
        process.exit(1);
      }
      await chooseAndWriteRules(found.dir, found.link, opts);
    } catch (e) {
      handleError(e);
    }
  });

// The desktop app registers magnet-ai:// (magnet-ai-dev:// for dev builds)
const DESKTOP_PROTOCOL = process.env.MAGNET_DESKTOP_PROTOCOL ?? "magnet-ai";

program
  .command("open")
  .description("Open the linked workspace on web or in the desktop app")
  .option("--web", "Open on the web without asking")
  .option("--desktop", "Open in the desktop app without asking")
  .action(async (opts: { web?: boolean; desktop?: boolean }) => {
    try {
      const found = await findProjectLink(process.cwd());
      if (!found) {
        console.error("No project linked. Run magnet link to link this directory to a workspace.");
        process.exit(1);
      }
      const { link } = found;
      const label = link.orgName || link.orgSlug || link.orgId;

      let target: "web" | "desktop";
      if (opts.web && opts.desktop) {
        console.error("Pass only one of --web or --desktop.");
        process.exit(1);
      } else if (opts.web) {
        target = "web";
      } else if (opts.desktop) {
        target = "desktop";
      } else {
        if (!isInteractive()) {
          console.error("Pass --web or --desktop in non-interactive mode.");
          process.exit(1);
        }
        const idx = await promptSelect(`Open ${label} in:`, [
          "Web browser",
          "Desktop app",
        ]);
        target = idx === 0 ? "web" : "desktop";
      }

      const url =
        target === "web"
          ? `${getBaseUrl()}/cli/open?org=${encodeURIComponent(link.orgId)}`
          : `${DESKTOP_PROTOCOL}://open-workspace?id=${encodeURIComponent(link.orgId)}`;

      if (tryOpenBrowser(url)) {
        console.error(`✔ Opening ${label} ${target === "web" ? "on the web" : "in the desktop app"}`);
      } else {
        console.error(`Open this URL to continue: ${url}`);
      }
    } catch (e) {
      handleError(e);
    }
  });

program.parse();
