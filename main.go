package main

import (
	"fmt"

	"github.com/magnet-run/magnet-cli/internal/commands"
	"github.com/spf13/cobra"
)

var Version = "dev"

func main() {
	root := &cobra.Command{
		Use:   "magnet",
		Short: "Magnet CLI — issues, pages, and search",
		Long: fmt.Sprintf(`Magnet CLI %s — issues, pages, and search.

Magnet CLI talks to the Magnet API. Set MAGNET_API_KEY. Optional: MAGNET_API_URL (default https://www.magnet.run).`, Version),
		Version: Version,
	}
	root.AddCommand(commands.NewIssuesCmd())
	root.AddCommand(commands.NewPagesCmd())
	root.AddCommand(commands.NewSearchCmd())
	root.Execute()
}
