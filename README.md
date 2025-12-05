# docpkg: Documentation Package Manager

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
docpkg add npm:docpkg
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
docpkg add npm:docpkg

# Add from Git (branch/tag/commit)
docpkg add git:https://github.com/brianoneil/docpkg.git#v1.0.0 --name docpkg-v1

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

**AI Enrichment (Optional):**
You can use an LLM to automatically summarize and tag your documentation for better retrieval.

1. Set your API Key: `export OPENAI_API_KEY=sk-...`
2. Run enrichment:
   ```bash
   docpkg enrich
   ```

Bundle documentation into a single context file for LLMs:

```bash
docpkg bundle --output context.md

# Filter what to bundle
docpkg bundle --tag ai,security --output ai-context.md
docpkg bundle --source docpkg-docs
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

## Command Reference

### `init`
Initialize a new project with a `docpkg.json` file. If you are in an NPM project, use `--npm` to add configuration to `package.json` instead.

```bash
docpkg init
docpkg init --npm
```

### `add`
Add a documentation source. This updates your config, installs the docs, and updates the index.

```bash
docpkg add npm:commander
docpkg add git:https://github.com/org/repo.git#main --name my-docs
```

### `install`
Install all sources defined in your configuration file (`docpkg.json` or `package.json`).

```bash
docpkg install
```

### `list`
View all installed documentation packages, including version, file count, and token estimates.

```bash
docpkg list
```

**Output:**
```text
📦 commander
   ├─ Source: npm:commander
   ├─ Installed: 11.0.0 (at 12/4/2025)
   └─ Stats: 5 files, ~12k tokens
```

### `info`
Get detailed information about a specific package, including a file breakdown and token counts.

```bash
docpkg info commander
```

**Output:**
```text
📦 commander (11.0.0)
────────────────────────────────────────
📍 Location:  docs/commander
📅 Installed: 12/4/2025
🔗 Source:    npm:commander

📂 Files (3)
   ├─ README.md (~2,100 tokens)
   ├─ guides/parsing.md (~1,200 tokens)
   └─ ...
```

### `bundle`
Concatenate documentation into a single Markdown file (`context.md`) optimized for LLM context windows.

```bash
# Bundle everything
docpkg bundle --output context.md

# Bundle specific sources or tags
docpkg bundle --source commander --tag api --output api-context.md
```

### `index`
Generate a `docs/index.json` file containing metadata (tags, descriptions, token counts) for all installed documentation. Used by `bundle` and AI agents.

```bash
docpkg index
```

### `manifest`
Interactive wizard to generate a `.docpkg-manifest.json` file. Run this in your own repository to make it compatible with `docpkg`.

```bash
docpkg manifest
```

### `clean`
Remove the `docs/` directory and optionally the global cache.

```bash
docpkg clean
docpkg clean --cache
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