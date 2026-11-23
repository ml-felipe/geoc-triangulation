.PHONY: test serve
test:
	node tests/test.js
	node tests/demo.js
serve:
	python3 -m http.server 8000
