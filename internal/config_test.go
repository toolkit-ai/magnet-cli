package internal

import (
	"os"
	"testing"
)

func TestGetAPIKeyOrError(t *testing.T) {
	const validKey = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
	restore := setEnv("MAGNET_API_KEY", "")
	defer restore()

	// Missing key
	_, err := GetAPIKeyOrError()
	if err == nil {
		t.Fatal("expected error when MAGNET_API_KEY is empty")
	}
	if err.Error() != "missing Magnet API key. Set MAGNET_API_KEY" {
		t.Errorf("unexpected error: %v", err)
	}

	// Invalid UUID (wrong variant)
	setEnv("MAGNET_API_KEY", "a1b2c3d4-e5f6-4a7b-0c9d-0e1f2a3b4c5d") // 0 = invalid
	_, err = GetAPIKeyOrError()
	if err == nil {
		t.Fatal("expected error for invalid UUID")
	}

	// Valid key
	setEnv("MAGNET_API_KEY", validKey)
	key, err := GetAPIKeyOrError()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if key != validKey {
		t.Errorf("got key %q", key)
	}

	// Key with whitespace is trimmed
	setEnv("MAGNET_API_KEY", "  "+validKey+"  ")
	key, err = GetAPIKeyOrError()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if key != validKey {
		t.Errorf("got key %q", key)
	}
}

func TestGetBaseURL(t *testing.T) {
	restore := setEnv("MAGNET_API_URL", "")
	defer restore()

	u := GetBaseURL()
	if u != defaultBaseURL {
		t.Errorf("default base URL: got %q", u)
	}

	setEnv("MAGNET_API_URL", " https://custom.example.com/ ")
	u = GetBaseURL()
	if u != "https://custom.example.com" {
		t.Errorf("custom base URL: got %q", u)
	}
}

func TestAPIKeyRegex(t *testing.T) {
	valid := []string{
		"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
		"A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D",
		"00000000-0000-4000-8000-000000000000",
	}
	for _, s := range valid {
		if !apiKeyRegex.MatchString(s) {
			t.Errorf("expected valid: %q", s)
		}
	}
	invalid := []string{
		"",
		"not-a-uuid",
		"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d-extra",
		"a1b2c3d4e5f64a7b8c9d0e1f2a3b4c5d", // no dashes
		"a1b2c3d4-e5f6-6a7b-8c9d-0e1f2a3b4c5d", // version 6
	}
	for _, s := range invalid {
		if apiKeyRegex.MatchString(s) {
			t.Errorf("expected invalid: %q", s)
		}
	}
}

func setEnv(key, value string) func() {
	old := os.Getenv(key)
	if value == "" {
		os.Unsetenv(key)
	} else {
		os.Setenv(key, value)
	}
	return func() {
		if old == "" {
			os.Unsetenv(key)
		} else {
			os.Setenv(key, old)
		}
	}
}
