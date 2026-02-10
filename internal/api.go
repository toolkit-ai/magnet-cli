package internal

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
)

// Client is the Magnet API HTTP client.
type Client struct {
	baseURL string
	apiKey  string
	http    *http.Client
	// OnError if set is called instead of exiting on API errors (for tests).
	OnError func(code int, body []byte, path string) error
}

// NewClient builds a client from config (env). Exits if API key is missing.
func NewClient() *Client {
	key := GetAPIKey()
	return NewClientWithConfig(key, GetBaseURL())
}

// NewClientWithConfig builds a client with explicit key and base URL (for tests).
func NewClientWithConfig(apiKey, baseURL string) *Client {
	return &Client{
		baseURL: strings.TrimSuffix(strings.TrimSpace(baseURL), "/"),
		apiKey:  apiKey,
		http:    &http.Client{},
	}
}

// RequestOptions holds optional query params and body for a request.
type RequestOptions struct {
	Query url.Values
	Body  interface{}
}

// Do performs a request: method, path (e.g. "/api/issues"), optional query and body.
// On non-2xx, if OnError is set returns (nil, code); else parses error body, prints to stderr and exits non-zero.
func (c *Client) Do(method, path string, opts *RequestOptions) ([]byte, int) {
	data, code, err := c.DoWithError(method, path, opts)
	if err != nil {
		if c.OnError == nil {
			fmt.Fprint(os.Stderr, err.Error())
			os.Exit(1)
		}
		return nil, code
	}
	return data, code
}

// DoWithError performs the request and returns error on non-2xx instead of exiting (for tests).
func (c *Client) DoWithError(method, path string, opts *RequestOptions) ([]byte, int, error) {
	if opts == nil {
		opts = &RequestOptions{}
	}
	rawURL := c.baseURL + path
	if len(opts.Query) > 0 {
		rawURL += "?" + opts.Query.Encode()
	}
	var body io.Reader
	if opts.Body != nil && (method == http.MethodPost || method == http.MethodPut) {
		encoded, err := json.Marshal(opts.Body)
		if err != nil {
			return nil, 0, fmt.Errorf("request encode error: %w", err)
		}
		body = bytes.NewReader(encoded)
	}
	req, err := http.NewRequest(method, rawURL, body)
	if err != nil {
		return nil, 0, fmt.Errorf("network error: %w", err)
	}
	req.Header.Set("x-api-key", c.apiKey)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, 0, fmt.Errorf("network error: %w", err)
	}
	defer resp.Body.Close()
	slurp, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		err := c.errorMessage(resp.StatusCode, slurp, path)
		if c.OnError != nil {
			return slurp, resp.StatusCode, err
		}
		c.handleError(resp.StatusCode, slurp, path)
	}
	return slurp, resp.StatusCode, nil
}

// errorMessage returns the error message for a failed response (for OnError and tests).
func (c *Client) errorMessage(code int, body []byte, path string) error {
	var errBody ErrorBody
	_ = json.Unmarshal(body, &errBody)
	msg := errBody.Error
	if msg == "" {
		msg = errBody.Details
	}
	if msg == "" {
		msg = errBody.Message
	}
	if msg == "" && len(errBody.Issues) > 0 {
		msg = strings.Join(errBody.Issues, "; ")
	}
	if msg == "" {
		msg = strings.TrimSpace(string(body))
	}
	if msg == "" {
		msg = http.StatusText(code)
	}
	switch code {
	case 401:
		return fmt.Errorf("Unauthorized: %s Check your API key. Set MAGNET_API_KEY.", msg)
	case 403:
		return fmt.Errorf("Forbidden: %s", msg)
	case 400:
		return fmt.Errorf("Bad request: %s", msg)
	case 404:
		return fmt.Errorf("Not found: %s", msg)
	case 500:
		return fmt.Errorf("Server error: %s", msg)
	default:
		return fmt.Errorf("Error %d: %s", code, msg)
	}
}

func (c *Client) handleError(code int, body []byte, path string) {
	err := c.errorMessage(code, body, path)
	fmt.Fprintln(os.Stderr, err.Error())
	os.Exit(1)
}

// Get performs GET and unmarshals into v.
func (c *Client) Get(path string, query url.Values, v interface{}) {
	opts := &RequestOptions{Query: query}
	data, _ := c.Do(http.MethodGet, path, opts)
	if v != nil && len(data) > 0 {
		if err := json.Unmarshal(data, v); err != nil {
			fmt.Fprintf(os.Stderr, "Response parse error: %v\n", err)
			os.Exit(1)
		}
	}
}

// Post performs POST with body and unmarshals into v.
func (c *Client) Post(path string, body interface{}, v interface{}) {
	opts := &RequestOptions{Body: body}
	data, _ := c.Do(http.MethodPost, path, opts)
	if v != nil && len(data) > 0 {
		if err := json.Unmarshal(data, v); err != nil {
			fmt.Fprintf(os.Stderr, "Response parse error: %v\n", err)
			os.Exit(1)
		}
	}
}
