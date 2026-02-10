package commands

import (
	"encoding/json"
	"fmt"
	"net/url"

	"github.com/magnet-run/magnet-cli/internal"
	"github.com/spf13/cobra"
)

func NewPagesCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "pages",
		Short: "List, get, or create Magnet pages",
	}
	cmd.AddCommand(newPagesListCmd())
	cmd.AddCommand(newPagesGetCmd())
	cmd.AddCommand(newPagesCreateCmd())
	return cmd
}

func newPagesListCmd() *cobra.Command {
	var search string
	var limit int
	var cursor string
	cmd := &cobra.Command{
		Use:   "list",
		Short: "List pages",
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
			var out internal.ListPagesResponse
			client.Get("/api/pages", params, &out)
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

func newPagesGetCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "get [id]",
		Short: "Get a page by ID",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			id := args[0]
			client := internal.NewClient()
			path := "/api/pages/" + url.PathEscape(id)
			data, _ := client.Do("GET", path, nil)
			var wrapped internal.GetPageResponse
			if err := json.Unmarshal(data, &wrapped); err == nil && wrapped.Page != nil {
				enc := json.NewEncoder(cmd.OutOrStdout())
				enc.SetIndent("", "  ")
				return enc.Encode(wrapped.Page)
			}
			var page internal.PageDetail
			if err := json.Unmarshal(data, &page); err != nil {
				fmt.Fprintf(cmd.ErrOrStderr(), "Response parse error: %v\n", err)
				return err
			}
			enc := json.NewEncoder(cmd.OutOrStdout())
			enc.SetIndent("", "  ")
			return enc.Encode(page)
		},
	}
}

func newPagesCreateCmd() *cobra.Command {
	var title, markdown string
	cmd := &cobra.Command{
		Use:   "create",
		Short: "Create a page from markdown",
		RunE: func(cmd *cobra.Command, args []string) error {
			if title == "" {
				fmt.Fprintln(cmd.ErrOrStderr(), "Missing required flag: --title")
				return fmt.Errorf("missing --title")
			}
			client := internal.NewClient()
			body := internal.CreatePageMarkdownRequest{
				Title:    title,
				Markdown: markdown,
			}
			if body.Markdown == "" {
				body.Markdown = title
			}
			var result internal.CreatePageResponse
			client.Post("/api/pages/markdown", &body, &result)
			enc := json.NewEncoder(cmd.OutOrStdout())
			enc.SetIndent("", "  ")
			return enc.Encode(result)
		},
	}
	cmd.Flags().StringVar(&title, "title", "", "Page title; required")
	cmd.Flags().StringVar(&markdown, "markdown", "", "Page content (markdown); defaults to title if empty")
	_ = cmd.MarkFlagRequired("title")
	return cmd
}
