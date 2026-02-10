package internal

// API error response (optional fields from server)
type ErrorBody struct {
	Error   string   `json:"error"`
	Details string   `json:"details"`
	Message string   `json:"message"`
	Issues  []string `json:"issues"`
}

// Pagination
type PaginationMeta struct {
	Total      int     `json:"total"`
	HasMore    bool    `json:"hasMore"`
	NextCursor *string `json:"nextCursor"`
}

// GET /api/issues
type ListIssuesResponse struct {
	Issues     []IssueListItem `json:"issues"`
	Users      []User          `json:"users"`
	Pagination PaginationMeta  `json:"pagination"`
}

type IssueListItem struct {
	ID             string  `json:"id"`
	Title          string  `json:"title"`
	Status         string  `json:"status"`
	BaseBranch     string  `json:"baseBranch"`
	BranchName     *string `json:"branchName"`
	CreatedAt      string  `json:"createdAt"`
	UpdatedAt      string  `json:"updatedAt"`
	CreatedClerkId string  `json:"createdClerkId"`
}

// GET /api/issues/:id — response can be { issue: Issue } or single Issue
type GetIssueResponse struct {
	Issue *IssueDetail `json:"issue,omitempty"`
	// If API returns issue at top level, we use IssueDetail for that too
}

type IssueDetail struct {
	ID             string `json:"id"`
	Title          string `json:"title"`
	Description    string `json:"description"`
	Status         string `json:"status"`
	BaseBranch     string `json:"baseBranch"`
	BranchName     string `json:"branchName"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
	CreatedClerkId string `json:"createdClerkId"`
	OrganizationId string `json:"organizationId"`
}

// POST /api/issues/markdown request
type CreateIssueMarkdownRequest struct {
	Markdown    string  `json:"markdown"`
	Description string  `json:"description"`
	Title       *string `json:"title,omitempty"`
	BaseBranch  string  `json:"baseBranch"`
	Status      *string `json:"status,omitempty"`
}

// POST /api/issues/markdown response: often raw Issue
type CreateIssueResponse struct {
	ID string `json:"id"`
	// other fields optional for success check
}

// GET /api/pages
type ListPagesResponse struct {
	Pages      []PageListItem `json:"pages"`
	Users      []User         `json:"users"`
	Pagination PaginationMeta `json:"pagination"`
}

type PageListItem struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// GET /api/pages/:id
type GetPageResponse struct {
	Page *PageDetail `json:"page,omitempty"`
}

type PageDetail struct {
	ID             string `json:"id"`
	Title          string `json:"title"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
	OrganizationId string `json:"organizationId"`
}

// POST /api/pages/markdown request
type CreatePageMarkdownRequest struct {
	Markdown string `json:"markdown"`
	Title    string `json:"title"`
}

// POST /api/pages/markdown response
type CreatePageResponse struct {
	ID string `json:"id"`
}

// GET /api/search
type SearchResponse struct {
	Results []SearchResult `json:"results"`
	Total   int            `json:"total"`
	Query   string         `json:"query"`
	Users   []User         `json:"users"`
}

type SearchResult struct {
	ID       string `json:"id"`
	Type     string `json:"type"` // "issue" | "page"
	Title    string `json:"title"`
	Preview  string `json:"preview,omitempty"`
	Markdown string `json:"markdown,omitempty"`
}

type User struct {
	ID        string `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}
