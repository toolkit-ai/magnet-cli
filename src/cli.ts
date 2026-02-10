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
  ListPagesResponse,
  GetPageResponse,
  PageDetail,
  CreatePageMarkdownRequest,
  CreatePageResponse,
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
  .description("Get an issue by ID")
  .action(async (id: string) => {
    try {
      getApiKey();
      const api = createClient();
      const data = await api.get<GetIssueResponse | IssueDetail>(
        `/api/issues/${encodeURIComponent(id)}`
      );
      const wrapped = data as GetIssueResponse;
      if (wrapped?.issue) {
        jsonOut(wrapped.issue);
      } else {
        jsonOut(data as IssueDetail);
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
  .description("Get a page by ID")
  .action(async (id: string) => {
    try {
      getApiKey();
      const api = createClient();
      const data = await api.get<GetPageResponse | PageDetail>(
        `/api/pages/${encodeURIComponent(id)}`
      );
      const wrapped = data as GetPageResponse;
      if (wrapped?.page) {
        jsonOut(wrapped.page);
      } else {
        jsonOut(data as PageDetail);
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
