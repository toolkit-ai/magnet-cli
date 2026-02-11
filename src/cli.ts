import { Command } from "commander";
import { createClient } from "./api";
import { getApiKey } from "./config";
import { DEFAULT_LIST_LIMIT_VALUE } from "./config";
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

program.parse();
