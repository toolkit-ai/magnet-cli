package internal

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

// SetBaseURLForTest overrides base URL (used in tests). Restore with os.Unsetenv("MAGNET_API_URL").
func SetBaseURLForTest(u string) { os.Setenv("MAGNET_API_URL", u) }

const defaultBaseURL = "https://www.magnet.run"

// DefaultListLimit is used when --cursor is set but --limit is not (API needs a consistent page size for cursor).
const DefaultListLimit = 50

// UUID v4 regex (RFC 4122): xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8, 9, a, or b
var apiKeyRegex = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`)

// GetAPIKey reads MAGNET_API_KEY from env. If missing or invalid, prints to stderr and exits non-zero.
func GetAPIKey() string {
	key, err := GetAPIKeyOrError()
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}
	return key
}

// GetAPIKeyOrError returns the API key or an error (for testing without exiting).
func GetAPIKeyOrError() (string, error) {
	key := strings.TrimSpace(os.Getenv("MAGNET_API_KEY"))
	if key == "" {
		return "", fmt.Errorf("missing Magnet API key. Set MAGNET_API_KEY")
	}
	if !apiKeyRegex.MatchString(key) {
		return "", fmt.Errorf("invalid MAGNET_API_KEY: must be a valid UUID (e.g. xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)")
	}
	return key, nil
}

// GetBaseURL reads MAGNET_API_URL from env or returns default. Trims and strips trailing slash.
func GetBaseURL() string {
	u := os.Getenv("MAGNET_API_URL")
	if u == "" {
		u = defaultBaseURL
	}
	u = strings.TrimSpace(u)
	u = strings.TrimSuffix(u, "/")
	return u
}
