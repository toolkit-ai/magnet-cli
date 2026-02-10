package commands

import (
	"bytes"
	"testing"
)

func TestIssuesListHelp(t *testing.T) {
	cmd := NewIssuesCmd()
	cmd.SetArgs([]string{"list", "--help"})
	var out bytes.Buffer
	cmd.SetOut(&out)
	if err := cmd.Execute(); err != nil {
		t.Fatal(err)
	}
	if out.Len() == 0 {
		t.Fatal("expected help output")
	}
}

func TestPagesListHelp(t *testing.T) {
	cmd := NewPagesCmd()
	cmd.SetArgs([]string{"list", "--help"})
	var out bytes.Buffer
	cmd.SetOut(&out)
	if err := cmd.Execute(); err != nil {
		t.Fatal(err)
	}
	if out.Len() == 0 {
		t.Fatal("expected help output")
	}
}

func TestSearchHelp(t *testing.T) {
	cmd := NewSearchCmd()
	cmd.SetArgs([]string{"--help"})
	var out bytes.Buffer
	cmd.SetOut(&out)
	if err := cmd.Execute(); err != nil {
		t.Fatal(err)
	}
	if out.Len() == 0 {
		t.Fatal("expected help output")
	}
}
