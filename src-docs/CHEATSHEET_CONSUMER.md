# Consumer Cheatsheet

Use `docpkg` to manage documentation dependencies in your project.

## 1. Setup

**Initialize**
```bash
# New project
docpkg init

# Existing NPM project
docpkg init --npm
```

## 2. Install Docs

**Add Sources**
```bash
# From NPM
docpkg add npm:docpkg

# From Git
docpkg add git:https://github.com/org/repo.git

# From URL
docpkg add https://example.com/guide.md --name guide
```

**Sync/Install**
```bash
# Install from config
docpkg install

# Sync from node_modules
docpkg sync
```

## 3. Use Docs (AI)

**Enrich Docs (Optional)**
Generate summaries and tags using AI.
```bash
# Interactive selection
docpkg enrich

# Specific packages only
docpkg enrich commander
```

**Bundle for LLM**
Create a single file to paste into ChatGPT/Claude.
```bash
docpkg bundle --output context.md
```

**Filtered Bundle**
```bash
# By Tag
docpkg bundle --tag api --output api-context.md

# By Source
docpkg bundle --source commander
```

## 4. Maintenance

```bash
# Check what you have
docpkg list

# Get details
docpkg info <package>

# Update
docpkg update

# Remove
docpkg remove <package>
```
