# Magnet CLI – build and test

.PHONY: build test test-smoke clean

build:
	go build -ldflags="-s -w" -o magnet .

test:
	go test -v ./...

# Unit tests + build + smoke: binary runs and fails without API key
test-smoke: test build
	@echo "--- Smoke: magnet --help ---"
	./magnet --help
	@echo "--- Smoke: missing API key exits 1 ---"
	@! MAGNET_API_KEY= ./magnet issues list 2>/dev/null
	@echo "--- Smoke: invalid API key exits 1 ---"
	@! MAGNET_API_KEY=not-a-uuid ./magnet issues list 2>/dev/null
	@echo "smoke OK"

clean:
	rm -f magnet magnet.exe
