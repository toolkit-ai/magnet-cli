export interface ErrorBody {
  error?: string;
  details?: string;
  message?: string;
  issues?: string[];
}

export interface PaginationMeta {
  total: number;
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface ListIssuesResponse {
  issues: IssueListItem[];
  users: User[];
  pagination: PaginationMeta;
}

export interface IssueListItem {
  id: string;
  title: string;
  status: string;
  baseBranch: string;
  branchName?: string | null;
  createdAt: string;
  updatedAt: string;
  createdClerkId: string;
}

export interface IssueDetail {
  id: string;
  title: string;
  description?: string;
  status: string;
  baseBranch: string;
  branchName?: string;
  createdAt: string;
  updatedAt: string;
  createdClerkId?: string;
  organizationId?: string;
  /** Full markdown body when fetched via GET /api/issues/:id/markdown */
  docContent?: string;
  /** Truncated markdown when fetched with previewOnly=true */
  markdownPreview?: string;
}

export interface GetIssueResponse {
  issue?: IssueDetail;
}

export interface CreateIssueMarkdownRequest {
  markdown: string;
  description: string;
  title?: string;
  baseBranch: string;
  status?: string;
}

export interface CreateIssueResponse {
  issue?: IssueDetail;
  id?: string;
}

export interface UpdateIssueMarkdownRequest {
  markdown: string;
  title?: string;
  status?: "todo" | "in_progress" | "done" | "blocked";
  assigneeClerkId?: string;
  skipYjsSync?: boolean;
}

export interface UpdateIssueResponse {
  issue: IssueDetail;
}

export interface ListPagesResponse {
  pages: PageListItem[];
  users: User[];
  pagination: PaginationMeta;
}

export interface PageListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  organizationId?: string;
  /** Full markdown body when fetched via GET /api/pages/:id/markdown */
  docContent?: string;
  markdownPreview?: string;
}

export interface GetPageResponse {
  page?: PageDetail;
}

export interface CreatePageMarkdownRequest {
  markdown: string;
  title: string;
}

export interface CreatePageResponse {
  page?: PageDetail;
  id?: string;
}

export interface UpdatePageMarkdownRequest {
  markdown: string;
  title?: string;
  properties?: Record<string, unknown>;
  skipYjsSync?: boolean;
}

export interface UpdatePageResponse {
  page: PageDetail;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  users: User[];
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  preview?: string;
  markdown?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
}
