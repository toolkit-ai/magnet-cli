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
  description: string;
  status: string;
  baseBranch: string;
  branchName: string;
  createdAt: string;
  updatedAt: string;
  createdClerkId: string;
  organizationId: string;
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
  id: string;
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
  organizationId: string;
}

export interface GetPageResponse {
  page?: PageDetail;
}

export interface CreatePageMarkdownRequest {
  markdown: string;
  title: string;
}

export interface CreatePageResponse {
  id: string;
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
