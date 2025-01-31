# vscode-chat-ext

Chat with a local ollama model within `vscode`

Derived from: [Hello World Extension](https://code.visualstudio.com/api/get-started/your-first-extension)

## Roadmap

- Better markdown support (tables)
- add code as context

## Development

Note:

Recommended to use the `vscode` extension below because there's html code in a javascript String, this extension
renders the HTML with syntax color highlighting making it easier to read and fix issues.

- ES6 String HTML

This extension uses the following `npm` packages:

- ollama
- markdown-it (and types)
- highlight.js (and types)