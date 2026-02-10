package main

import (
	"github.com/magnet-run/magnet-cli/internal/commands"
	"github.com/spf13/cobra"
)

func main() {
	root := &cobra.Command{
		Use:   "magnet",
		Short: "Magnet CLI — issues, pages, and search",
		Long:  "Magnet CLI talks to the Magnet API. Set MAGNET_API_KEY. Optional: MAGNET_API_URL (default https://www.magnet.run).",
	}
	root.AddCommand(commands.NewIssuesCmd())
	root.AddCommand(commands.NewPagesCmd())
	root.AddCommand(commands.NewSearchCmd())
	root.Execute()
}
