# docpkg Cheatsheet

## Quick Start
```bash
npm install -g docpkg
docpkg init
docpkg add npm:@anthropic/prompt-docs
```

## Core Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize docpkg in current directory |
| `add <source>` | Add and install a documentation source |
| `install` | Install all sources from config |
| `sync` | Extract docs from `node_modules` (NPM projects) |
| `update [name]` | Update specific or all packages |
| `remove <name>` | Remove a package |
| `list` | List installed packages |
| `clean` | Remove installed docs and cache |
| `verify` | Verify integrity of installed docs |

## AI Workflows

**Generate Search Index**
```bash
docpkg index
```
Creates `docs/index.json` for AI agents to search.

**Create Context Bundle**
```bash
docpkg bundle --output context.md
```
Concatenates all docs into one file for LLM prompting.

**Filtered Bundle**
```bash
docpkg bundle --tag api,security --output context.md
```

## Source Formats

| Type | Format | Example |
|------|--------|---------|
| **NPM** | `npm:<pkg>@<ver>` | `npm:uuid@latest` |
| **Git** | `git:<url>#<ref>` | `git:https://github.com/org/repo.git#main` |
| **HTTP** | `https://<url>` | `https://example.com/api.md` |
| **File** | `file:<path>` | `file:./local-docs` |
