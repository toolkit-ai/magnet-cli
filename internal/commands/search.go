package commands

import (
	"encoding/json"
	"net/url"

	"github.com/magnet-run/magnet-cli/internal"
	"github.com/spf13/cobra"
)

func NewSearchCmd() *cobra.Command {
	var types string
	cmd := &cobra.Command{
		Use:   "search [query]",
		Short: "Search issues and pages",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			query := args[0]
			client := internal.NewClient()
			params := url.Values{}
			params.Set("query", query)
			if types != "" {
				params.Set("types", types)
			}
			var out internal.SearchResponse
			client.Get("/api/search", params, &out)
			enc := json.NewEncoder(cmd.OutOrStdout())
			enc.SetIndent("", "  ")
			return enc.Encode(out)
		},
	}
	cmd.Flags().StringVar(&types, "types", "", "Comma-separated types: issue, page (default: both)")
	return cmd
}
