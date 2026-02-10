package commands

import (
	"encoding/json"
	"fmt"
	"net/url"

	"github.com/magnet-run/magnet-cli/internal"
	"github.com/spf13/cobra"
)

func NewIssuesCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "issues",
		Short: "List, get, or create Magnet issues",
	}
	cmd.AddCommand(newIssuesListCmd())
	cmd.AddCommand(newIssuesGetCmd())
	cmd.AddCommand(newIssuesCreateCmd())
	return cmd
}

func newIssuesListCmd() *cobra.Command {
	var search string
	var limit int
	var cursor string
	cmd := &cobra.Command{
		Use:   "list",
		Short: "List issues",
		RunE: func(cmd *cobra.Command, args []string) error {
			client := internal.NewClient()
			params := url.Values{}
			if search != "" {
				params.Set("search", search)
			}
			pageSize := limit
			if cursor != "" && pageSize <= 0 {
				pageSize = internal.DefaultListLimit
			}
			if pageSize > 0 {
				params.Set("limit", fmt.Sprintf("%d", pageSize))
			}
			if cursor != "" {
				params.Set("cursor", cursor)
			}
			var out internal.ListIssuesResponse
			client.Get("/api/issues", params, &out)
			enc := json.NewEncoder(cmd.OutOrStdout())
			enc.SetIndent("", "  ")
			return enc.Encode(out)
		},
	}
	cmd.Flags().StringVar(&search, "search", "", "Search query")
	cmd.Flags().IntVar(&limit, "limit", 0, "Page size (default from API). Use with --cursor for pagination.")
	cmd.Flags().StringVar(&cursor, "cursor", "", "Pagination cursor (use pagination.nextCursor from previous response)")
	return cmd
}

func newIssuesGetCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "get [id]",
		Short: "Get an issue by ID",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			id := args[0]
			client := internal.NewClient()
			path := "/api/issues/" + url.PathEscape(id)
			data, _ := client.Do("GET", path, nil)
			// API may return { issue: ... } or raw issue
			var wrapped internal.GetIssueResponse
			if err := json.Unmarshal(data, &wrapped); err == nil && wrapped.Issue != nil {
				enc := json.NewEncoder(cmd.OutOrStdout())
				enc.SetIndent("", "  ")
				return enc.Encode(wrapped.Issue)
			}
			var issue internal.IssueDetail
			if err := json.Unmarshal(data, &issue); err != nil {
				fmt.Fprintf(cmd.ErrOrStderr(), "Response parse error: %v\n", err)
				return err
			}
			enc := json.NewEncoder(cmd.OutOrStdout())
			enc.SetIndent("", "  ")
			return enc.Encode(issue)
		},
	}
}

func newIssuesCreateCmd() *cobra.Command {
	var description, title, baseBranch string
	cmd := &cobra.Command{
		Use:   "create",
		Short: "Create an issue from markdown",
		RunE: func(cmd *cobra.Command, args []string) error {
			if description == "" {
				fmt.Fprintln(cmd.ErrOrStderr(), "Missing required flag: --description")
				return fmt.Errorf("missing --description")
			}
			client := internal.NewClient()
			req := internal.CreateIssueMarkdownRequest{
				Markdown:    description,
				Description: description,
				BaseBranch:  baseBranch,
			}
			if title != "" {
				req.Title = &title
			}
			var result internal.CreateIssueResponse
			client.Post("/api/issues/markdown", &req, &result)
			enc := json.NewEncoder(cmd.OutOrStdout())
			enc.SetIndent("", "  ")
			return enc.Encode(result)
		},
	}
	cmd.Flags().StringVar(&description, "description", "", "Issue description (markdown); required")
	cmd.Flags().StringVar(&title, "title", "", "Issue title (optional)")
	cmd.Flags().StringVar(&baseBranch, "base-branch", "main", "Base branch name")
	_ = cmd.MarkFlagRequired("description")
	return cmd
}
