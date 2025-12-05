# docpkg: Documentation Package Manager

![License](https://img.shields.io/npm/l/docpkg)
![Version](https://img.shields.io/npm/v/docpkg)

**docpkg** is a modern package manager for documentation. It treats documentation as a first-class dependency, allowing you to install, version, and bundle markdown files from NPM, Git, and URLs.

It automatically manages **syncing** from node_modules and **indexing** your documentation for AI context, providing a seamless developer experience.

## Why?

- **For Developers**: Centralize documentation from multiple repos/libraries into one `docs/` folder with a single command.
- **For AI Agents**: Auto-generates a `docs/index.json` and `context.md` bundle for LLMs.
- **For Teams**: Share internal guides via private Git repos or NPM packages.

## Installation

```bash
npm install -g docpkg
```

## Usage

### Quick Start

If you are in a project with a `package.json`, simply add a source. `docpkg` will automatically initialize and configure itself.

```bash
docpkg add npm:@anthropic/prompt-docs
```

### Managing Sources

Prepare your own repo for consumption (like this one!):

```bash
docpkg manifest
```

Add documentation sources:

```bash
# Add docpkg's own documentation (Meta example!)
docpkg add git:https://github.com/brianoneil/docpkg.git#main --name docpkg-docs

# Add from NPM
docpkg add npm:@anthropic/prompt-docs@latest

# Add from Git (branch/tag/commit)
docpkg add git:https://github.com/org/repo.git#main

# Add from URL (Gist example)
docpkg add https://gist.githubusercontent.com/brianoneil/12345/raw/cheatsheet.md --name cheatsheet

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
    "docpkg": "git:https://github.com/brianoneil/docpkg.git#main",
    "my-docs": "npm:my-pkg-docs@^1.0.0"
  }
}
```

## License

MIT