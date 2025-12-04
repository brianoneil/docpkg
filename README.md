# docpkg: Documentation Package Manager

![License](https://img.shields.io/npm/l/docpkg)
![Version](https://img.shields.io/npm/v/docpkg)

**docpkg** is a modern package manager for documentation. It treats documentation as a first-class dependency, allowing you to install, version, and bundle markdown files from NPM, Git, and URLs.

It is specifically designed for the AI era, providing tools to **index** and **bundle** documentation into optimized context for LLMs.

## Why?

- **For Developers**: Centralize documentation from multiple repos/libraries into one `docs/` folder.
- **For AI Agents**: Generate a single `context.md` or JSON index of all your project's dependencies to feed into LLMs.
- **For Teams**: Share internal guides via private Git repos or NPM packages without copy-pasting files.

## Installation

```bash
npm install -g docpkg
```

## Usage

### Initialization

Initialize a new project:

```bash
docpkg init
# Or integrate with existing package.json
docpkg init --npm
```

### Managing Sources

Prepare your own repo for consumption:

```bash
# Interactive wizard to generate .docpkg-manifest.json
docpkg manifest
```

Add documentation sources:

```bash
# Add from NPM
docpkg add npm:@anthropic/prompt-docs@latest

# Add from Git (branch/tag/commit)
docpkg add git:https://github.com/org/repo.git#main

# Add from URL
docpkg add https://example.com/api-spec.json --name api

# Add local folder
docpkg add file:./internal-docs --name internal
```

Install everything defined in config:

```bash
docpkg install
```

Sync docs from installed node_modules (for NPM projects):

```bash
# Automatically finds packages with .docpkg-manifest.json in node_modules
docpkg sync
```

### AI Features

Generate a searchable index of all documentation:

```bash
docpkg index
# Creates docs/index.json
```

Bundle documentation into a single context file for LLMs:

```bash
docpkg bundle --output context.md

# Filter what to bundle
docpkg bundle --tag ai,security --output ai-context.md
docpkg bundle --source anthropic-prompting
```

### Maintenance

```bash
# Update packages
docpkg update

# Verify installation integrity
docpkg verify

# Clean installation directory
docpkg clean
```

## Configuration

`docpkg` supports `docpkg.json`, `package.json` ("docs" field), or `.docpkg.yaml`.

**docpkg.json**
```json
{
  "version": "1",
  "installPath": "docs",
  "sources": {
    "my-docs": "npm:my-pkg-docs@^1.0.0",
    "api": "https://api.com/spec.md"
  }
}
```

## License

MIT
