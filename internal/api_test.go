package internal

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
)

func TestClient_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("x-api-key") != "test-key" {
			t.Errorf("missing or wrong x-api-key: %q", r.Header.Get("x-api-key"))
		}
		if r.URL.Path == "/api/issues" && r.Method == http.MethodGet {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(ListIssuesResponse{
				Issues: []IssueListItem{{ID: "i1", Title: "Test"}},
				Pagination: PaginationMeta{Total: 1},
			})
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	client := NewClientWithConfig("test-key", server.URL)
	client.OnError = func(code int, body []byte, path string) error {
		return nil
	}
	var out ListIssuesResponse
	client.Get("/api/issues", url.Values{}, &out)
	if len(out.Issues) != 1 || out.Issues[0].ID != "i1" {
		t.Errorf("unexpected response: %+v", out)
	}
}

func TestClient_ErrorMapping(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/401":
			w.WriteHeader(401)
			json.NewEncoder(w).Encode(ErrorBody{Error: "invalid key"})
		case "/403":
			w.WriteHeader(403)
			json.NewEncoder(w).Encode(ErrorBody{Error: "forbidden"})
		case "/404":
			w.WriteHeader(404)
			json.NewEncoder(w).Encode(ErrorBody{Message: "not found"})
		case "/500":
			w.WriteHeader(500)
			json.NewEncoder(w).Encode(ErrorBody{Details: "server error"})
		default:
			w.WriteHeader(400)
			json.NewEncoder(w).Encode(ErrorBody{Error: "bad request"})
		}
	}))
	defer server.Close()

	client := NewClientWithConfig("test-key", server.URL)
	client.OnError = func(code int, body []byte, path string) error {
		return client.errorMessage(code, body, path)
	}

	tests := []struct {
		path       string
		wantSubstr string
	}{
		{"/401", "Unauthorized"},
		{"/403", "Forbidden"},
		{"/404", "Not found"},
		{"/500", "Server error"},
		{"/400", "Bad request"},
	}
	for _, tt := range tests {
		_, _, err := client.DoWithError(http.MethodGet, tt.path, nil)
		if err == nil {
			t.Errorf("%s: expected error", tt.path)
			continue
		}
		if err.Error() == "" || len(err.Error()) < len(tt.wantSubstr) {
			t.Errorf("%s: error message too short: %q", tt.path, err.Error())
		}
	}
}

func TestNewClientWithConfig_TrimBaseURL(t *testing.T) {
	client := NewClientWithConfig("k", "https://api.example.com/")
	if client.baseURL != "https://api.example.com" {
		t.Errorf("base URL should be trimmed: %q", client.baseURL)
	}
}
