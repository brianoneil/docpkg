# docpkg: Documentation Package Manager

`docpkg` is a command-line tool for managing documentation dependencies. It allows you to install, version, and bundle documentation from various sources (NPM, Git, HTTP, local files) specifically for AI context generation and developer reference.

## Installation

```bash
# Install globally
npm install -g docpkg

# Or run directly with npx
npx docpkg <command>
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