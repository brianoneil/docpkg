# docpkg: Documentation Package Manager

## Overview

`docpkg` is a language-agnostic documentation package manager that brings package management concepts (versioning, dependencies, distribution) to documentation files. It treats documentation as first-class dependencies, making them easy to install, update, and version control.

### Core Philosophy

- **Markdown-first**: Focus on markdown documentation files
- **Human and AI accessible**: Serve both human developers and AI agents
- **Language-agnostic**: Work across any development ecosystem
- **NPM-enhanced**: Richer experience in NPM environments without requiring it
- **Dev-only**: Documentation is a development dependency, never shipped to production

## Key Features

- Install documentation from multiple sources (npm, PyPI, git, URLs, local files)
- Version management with lockfile support
- Smart extraction from package managers (npm, pip, gem, etc.)
- Cross-platform CLI tool
- Integration with existing package.json workflow
- AI agent-friendly metadata generation
- Production-safe (respects NODE_ENV)

## Requirements

### Functional Requirements

1. **Multi-source support**
   - npm packages
   - PyPI packages (future)
   - Ruby gems (future)
   - Git repositories
   - Direct URLs (HTTP/HTTPS)
   - Local file paths

2. **Installation & Management**
   - Install documentation packages
   - Update specific or all packages
   - Remove packages
   - List installed packages
   - Verify integrity
   - Clean/reset documentation directory

3. **Version Control**
   - Semantic versioning support
   - Lockfile for reproducible installs
   - Version resolution and conflict handling

4. **Configuration**
   - Multiple config file formats (docpkg.json, package.json, pyproject.toml, .docpkg.yaml)
   - Priority-based config resolution
   - Environment-specific settings

5. **NPM Integration**
   - Use devDependencies for doc packages
   - Automatic detection of doc packages in node_modules
   - Postinstall hook support
   - Respect NODE_ENV for production builds

6. **AI Agent Support**
   - Generate searchable index of documentation
   - Parse frontmatter metadata
   - Bundle documentation into single context file
   - Export structured metadata (JSON)

### Non-Functional Requirements

1. **Performance**
   - Parallel downloads/installations
   - Global caching to avoid re-downloads
   - Incremental updates

2. **Reliability**
   - Integrity checking (checksums/SRI)
   - Graceful degradation when tools unavailable
   - Idempotent operations

3. **Usability**
   - Clear error messages
   - Progress indicators for long operations
   - Helpful CLI output

4. **Security**
   - Never execute arbitrary code from doc packages
   - Verify package integrity
   - Respect .gitignore patterns

## Architecture

### Core Components

```
docpkg/
├── cli/                    # Command-line interface
│   ├── commands/          # Command implementations
│   │   ├── add.js
│   │   ├── install.js
│   │   ├── update.js
│   │   ├── remove.js
│   │   ├── sync.js
│   │   ├── list.js
│   │   └── init.js
│   └── index.js           # CLI entry point
├── core/
│   ├── config.js          # Configuration management
│   ├── lockfile.js        # Lockfile operations
│   ├── resolver.js        # Version resolution
│   ├── installer.js       # Installation orchestration
│   └── cache.js           # Global cache management
├── adapters/              # Source adapters
│   ├── npm.js            # NPM registry adapter
│   ├── git.js            # Git repository adapter
│   ├── http.js           # HTTP/HTTPS adapter
│   ├── file.js           # Local file adapter
│   └── base.js           # Base adapter interface
├── utils/
│   ├── integrity.js       # Checksum/hash utilities
│   ├── extract.js         # Archive extraction
│   ├── fs.js             # File system utilities
│   └── logger.js         # Logging utilities
└── plugins/               # Plugin system (optional)
    ├── markdown-index.js
    └── frontmatter.js
```

### Data Flow

```
User runs command
    ↓
CLI parses arguments
    ↓
Config loader finds and merges config files
    ↓
Resolver determines what needs to be installed/updated
    ↓
Installer coordinates adapters
    ↓
Adapters fetch from sources
    ↓
Cache stores downloaded packages
    ↓
Extractor places docs in target directory
    ↓
Lockfile updated
```

## Configuration

### Config File Priority (highest to lowest)

1. `docpkg.json` - Standalone config (universal)
2. `package.json` "docs" field - NPM projects
3. `pyproject.toml` [tool.docpkg] - Python projects
4. `.docpkg.yaml` - Alternative YAML format
5. Environment variables - Global defaults

### Configuration Schema

```json
{
  "version": "1",
  "installPath": "docs",
  "structure": "nested",
  "sources": {
    "package-name": "source-spec"
  },
  "cache": {
    "enabled": true,
    "path": "~/.docpkg/cache"
  },
  "plugins": []
}
```

### Source Specification Format

```
npm:<package-name>@<version>
pypi:<package-name>@<version>
gem:<package-name>@<version>
git:<url>#<ref>
https://<url>
file:<path>
```

### Example Configurations

**docpkg.json (Universal)**
```json
{
  "version": "1",
  "installPath": "docs",
  "structure": "nested",
  "sources": {
    "anthropic-prompting": "npm:@anthropic/prompt-docs@^1.0.0",
    "api-reference": "https://api.example.com/docs.md",
    "agent-rules": "git:https://github.com/org/agent-rules#v2.1.0",
    "local-guides": "file:./internal-docs"
  }
}
```

**package.json (NPM Integration)**
```json
{
  "name": "my-app",
  "devDependencies": {
    "docpkg": "^1.0.0",
    "@anthropic/prompt-docs": "^1.0.0",
    "@stripe/api-docs": "^2.0.0"
  },
  "scripts": {
    "postinstall": "docpkg sync"
  }
}
```

**pyproject.toml (Python)**
```toml
[tool.docpkg]
install-path = "docs"
structure = "nested"

[tool.docpkg.sources]
anthropic-docs = "npm:@anthropic/prompt-docs@^1.0.0"
django-guide = "pypi:django-docs@latest"
```

## NPM Integration Strategy

### Doc Package Structure

NPM packages that contain documentation should follow this structure:

```
@anthropic/prompt-docs/
├── package.json
├── .docpkg-manifest.json
├── docs/
│   ├── index.md
│   ├── prompting.md
│   └── best-practices.md
└── index.js (optional)
```

**package.json**
```json
{
  "name": "@anthropic/prompt-docs",
  "version": "1.2.3",
  "description": "Prompt engineering documentation",
  "main": "index.js",
  "files": [
    "docs/**/*.md",
    ".docpkg-manifest.json"
  ],
  "scripts": {
    "postinstall": "node -e \"try{require('docpkg/register')(require('./.docpkg-manifest.json'))}catch(e){}\""
  }
}
```

**.docpkg-manifest.json**
```json
{
  "name": "@anthropic/prompt-docs",
  "version": "1.2.3",
  "type": "npm",
  "docsPath": "docs",
  "files": [
    "docs/index.md",
    "docs/prompting.md",
    "docs/best-practices.md"
  ],
  "metadata": {
    "title": "Anthropic Prompt Engineering Guide",
    "tags": ["ai", "prompting", "anthropic"],
    "category": "ai-development"
  }
}
```

### Installation Workflows

**Workflow 1: Direct NPM Install + Sync**
```bash
npm install --save-dev @anthropic/prompt-docs
docpkg sync
```

**Workflow 2: Using docpkg add (recommended)**
```bash
docpkg add @anthropic/prompt-docs
# Internally runs:
# 1. npm install --save-dev @anthropic/prompt-docs
# 2. Extracts docs to configured location
# 3. Updates docpkg-lock.json
```

**Workflow 3: Automatic via postinstall**
```json
{
  "scripts": {
    "postinstall": "docpkg sync"
  }
}
```
```bash
npm install  # Automatically syncs docs
```

### Production Safety

```javascript
// docpkg sync command
function sync() {
  // Skip in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping docpkg sync in production');
    return;
  }
  
  // Find doc packages in devDependencies
  const packageJson = readPackageJson();
  const devDeps = packageJson.devDependencies || {};
  
  // Scan node_modules for packages with .docpkg-manifest.json
  const docPackages = scanForDocPackages(devDeps);
  
  // Extract docs from each
  docPackages.forEach(extractDocs);
  
  // Update lockfile
  updateLockfile();
}
```

## Lockfile Format

**docpkg-lock.json**
```json
{
  "version": "1",
  "lockfileVersion": 1,
  "generatedAt": "2024-12-04T10:30:00Z",
  "sources": {
    "anthropic-prompting": {
      "type": "npm",
      "resolved": "npm:@anthropic/prompt-docs@1.2.3",
      "integrity": "sha512-abc123...",
      "extractedPath": "docs/anthropic-prompting",
      "installedAt": "2024-12-04T10:30:00Z",
      "files": [
        "docs/anthropic-prompting/index.md",
        "docs/anthropic-prompting/prompting.md"
      ]
    },
    "api-reference": {
      "type": "https",
      "resolved": "https://api.example.com/docs.md",
      "integrity": "sha256-xyz789...",
      "extractedPath": "docs/api-reference.md",
      "installedAt": "2024-12-04T10:30:00Z",
      "files": [
        "docs/api-reference.md"
      ]
    },
    "agent-rules": {
      "type": "git",
      "resolved": "git:https://github.com/org/agent-rules#v2.1.0",
      "commit": "abc123def456",
      "integrity": "sha256-...",
      "extractedPath": "docs/agent-rules",
      "installedAt": "2024-12-04T10:30:00Z",
      "files": [
        "docs/agent-rules/rules.md"
      ]
    }
  }
}
```

## CLI Commands

### Command Specifications

**docpkg init**
```
Usage: docpkg init [options]

Initialize docpkg in current project

Options:
  --npm           Initialize with package.json integration
  --python        Initialize with pyproject.toml integration
  --yaml          Create .docpkg.yaml config
  --force         Overwrite existing config

Examples:
  docpkg init
  docpkg init --npm
  docpkg init --python
```

**docpkg add**
```
Usage: docpkg add <source> [options]

Add a documentation source

Arguments:
  source          Source specification (npm:, git:, https:, file:)

Options:
  --name <name>   Custom name for the source
  --npm           Use npm install for npm sources
  --save-dev      Add to devDependencies (npm only, default)

Examples:
  docpkg add npm:@anthropic/prompt-docs@^1.0.0
  docpkg add https://docs.example.com/api.md
  docpkg add git:https://github.com/org/docs#main
  docpkg add file:./internal-docs --name internal
```

**docpkg install**
```
Usage: docpkg install [options]

Install all documentation sources from config

Options:
  --force         Force reinstall even if already installed
  --no-cache      Don't use cached downloads

Examples:
  docpkg install
  docpkg install --force
```

**docpkg sync**
```
Usage: docpkg sync [options]

Sync documentation from node_modules (NPM projects)

Options:
  --force         Force re-extraction
  --dry-run       Show what would be synced without doing it

Examples:
  docpkg sync
  docpkg sync --dry-run
```

**docpkg update**
```
Usage: docpkg update [name] [options]

Update documentation sources

Arguments:
  name            Optional: specific source to update

Options:
  --latest        Update to latest version (ignore semver)

Examples:
  docpkg update
  docpkg update anthropic-prompting
  docpkg update --latest
```

**docpkg remove**
```
Usage: docpkg remove <name>

Remove a documentation source

Arguments:
  name            Name of source to remove

Examples:
  docpkg remove anthropic-prompting
```

**docpkg list**
```
Usage: docpkg list [options]

List installed documentation sources

Options:
  --json          Output as JSON
  --outdated      Show outdated sources

Examples:
  docpkg list
  docpkg list --outdated
  docpkg list --json
```

**docpkg clean**
```
Usage: docpkg clean [options]

Remove all installed documentation

Options:
  --cache         Also clean global cache

Examples:
  docpkg clean
  docpkg clean --cache
```

**docpkg info**
```
Usage: docpkg info <name>

Show detailed information about a source

Arguments:
  name            Name of source

Examples:
  docpkg info anthropic-prompting
```

**docpkg verify**
```
Usage: docpkg verify

Verify integrity of installed documentation

Examples:
  docpkg verify
```

**docpkg index**
```
Usage: docpkg index [options]

Generate AI-friendly index of documentation

Options:
  --output <file> Output file (default: docs/index.json)
  --format <fmt>  Output format: json, yaml (default: json)

Examples:
  docpkg index
  docpkg index --output docs/ai-index.json
```

## Source Adapters

### Base Adapter Interface

```javascript
class BaseAdapter {
  constructor(source, config) {
    this.source = source;
    this.config = config;
  }
  
  // Parse source specification
  parse() {
    throw new Error('Not implemented');
  }
  
  // Resolve to specific version
  async resolve() {
    throw new Error('Not implemented');
  }
  
  // Download/fetch source
  async fetch(cacheDir) {
    throw new Error('Not implemented');
  }
  
  // Extract documentation files
  async extract(sourceDir, targetDir) {
    throw new Error('Not implemented');
  }
  
  // Calculate integrity hash
  async calculateIntegrity(sourceDir) {
    throw new Error('Not implemented');
  }
  
  // Check if source needs update
  async needsUpdate(currentVersion) {
    throw new Error('Not implemented');
  }
}
```

### NPM Adapter

**Responsibilities:**
- Parse npm package specifications (name@version)
- Resolve versions using npm registry API
- Download packages (use npm CLI if available, fallback to registry)
- Extract docs based on .docpkg-manifest.json
- Calculate integrity from package tarball

**Implementation notes:**
- Detect available package manager (npm, pnpm, yarn, bun)
- Use package manager's cache when possible
- Support scoped packages (@org/package)
- Handle version ranges (^, ~, *, etc.)

### Git Adapter

**Responsibilities:**
- Parse git URLs and refs (branch, tag, commit)
- Clone or fetch repositories
- Checkout specific refs
- Extract documentation files from repo
- Track commit hashes for integrity

**Implementation notes:**
- Support shallow clones for performance
- Cache cloned repos
- Support subdirectory extraction (git:url#ref:path/to/docs)
- Handle authentication (SSH keys, tokens)

### HTTP/HTTPS Adapter

**Responsibilities:**
- Download files from URLs
- Support .md extension appending pattern
- Calculate content hashes
- Handle redirects and authentication

**Implementation notes:**
- Follow redirects
- Support basic auth
- Verify SSL certificates
- Respect cache headers
- Handle rate limiting

### File Adapter

**Responsibilities:**
- Copy or symlink local files
- Watch for changes (optional)
- Handle relative paths

**Implementation notes:**
- Resolve paths relative to config file
- Support glob patterns for multiple files
- Preserve directory structure

## AI Agent Features

### Index Generation

Generate a searchable index of all documentation:

```json
{
  "generatedAt": "2024-12-04T10:30:00Z",
  "sources": [
    {
      "name": "anthropic-prompting",
      "type": "npm",
      "version": "1.2.3",
      "path": "docs/anthropic-prompting"
    }
  ],
  "files": [
    {
      "path": "docs/anthropic-prompting/index.md",
      "source": "anthropic-prompting",
      "title": "Prompt Engineering Guide",
      "description": "Best practices for prompt engineering",
      "tags": ["ai", "prompting"],
      "wordCount": 1500,
      "lastModified": "2024-12-04T10:30:00Z",
      "sections": [
        {
          "title": "Introduction",
          "level": 2,
          "wordCount": 200
        }
      ]
    }
  ],
  "tags": {
    "ai": ["docs/anthropic-prompting/index.md"],
    "prompting": ["docs/anthropic-prompting/index.md"]
  }
}
```

### Frontmatter Parsing

Support YAML frontmatter in markdown:

```markdown
---
title: Prompt Engineering Guide
description: Best practices for AI prompting
tags: [ai, prompting, anthropic]
category: ai-development
version: 1.2.3
lastUpdated: 2024-12-04
---

# Prompt Engineering Guide

Content here...
```

### Bundle Command

```bash
docpkg bundle --output docs/context.md
```

Concatenates selected documentation into a single file for AI context, with optional filtering.

**Filtering Options:**
- `--source <name>`: Filter by source name(s) (comma-separated)
- `--tag <tag>`: Filter by tag(s) (comma-separated)
- `--include <glob>`: Include files matching glob pattern

**Output Format:**

```markdown
# Documentation Bundle
Generated by docpkg

---
## Source: anthropic-prompting
File: docs/prompting.md
Tags: ai, prompting

[File Content...]

---
## Source: react-docs
File: docs/hooks.md
...
```

## Caching Strategy

### Global Cache

Location: `~/.docpkg/cache/`

Structure:
```
~/.docpkg/cache/
├── npm/
│   ├── @anthropic-prompt-docs-1.2.3.tgz
│   └── @stripe-api-docs-2.0.0.tgz
├── git/
│   ├── github.com-org-docs-abc123/
│   └── gitlab.com-team-docs-def456/
├── http/
│   ├── api.example.com-docs.md-sha256-xyz/
│   └── docs.other.com-guide.md-sha256-abc/
└── metadata.json
```

### Cache Metadata

```json
{
  "npm": {
    "@anthropic/prompt-docs@1.2.3": {
      "path": "npm/@anthropic-prompt-docs-1.2.3.tgz",
      "integrity": "sha512-abc...",
      "downloadedAt": "2024-12-04T10:30:00Z",
      "lastAccessedAt": "2024-12-04T10:30:00Z",
      "size": 102400
    }
  },
  "git": {
    "https://github.com/org/docs#abc123": {
      "path": "git/github.com-org-docs-abc123",
      "commit": "abc123",
      "downloadedAt": "2024-12-04T10:30:00Z",
      "lastAccessedAt": "2024-12-04T10:30:00Z"
    }
  }
}
```

### Cache Management

- Expire entries after 30 days of no access
- Clean cache with `docpkg clean --cache`
- Verify integrity before using cached files
- Respect `--no-cache` flag

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Invalid config file syntax
   - Missing required fields
   - Invalid source specifications

2. **Network Errors**
   - Download failures
   - Timeout
   - DNS resolution failures
   - Authentication failures

3. **File System Errors**
   - Permission denied
   - Disk full
   - Path not found

4. **Integrity Errors**
   - Checksum mismatch
   - Corrupted downloads
   - Tampered packages

5. **Version Resolution Errors**
   - Version not found
   - Conflicting version requirements
   - Invalid version specification

### Error Messages

Error messages should:
- Clearly state what went wrong
- Suggest possible solutions
- Include relevant context (file paths, URLs, versions)
- Use color coding (red for errors, yellow for warnings)

Example:
```
✗ Failed to download @anthropic/prompt-docs@1.2.3

Reason: Network timeout after 30s
URL: https://registry.npmjs.org/@anthropic/prompt-docs/-/prompt-docs-1.2.3.tgz

Possible solutions:
  • Check your internet connection
  • Try again with --retry flag
  • Use a different npm registry with --registry option

For more information, run: docpkg info anthropic-prompting
```

## Testing Strategy

### Unit Tests

- Config parsing and merging
- Source specification parsing
- Version resolution logic
- Integrity calculations
- Cache operations
- Each adapter in isolation

### Integration Tests

- Full install workflow
- NPM integration (with mock npm registry)
- Git integration (with mock git server)
- HTTP downloads (with mock HTTP server)
- Lockfile generation and reading
- Multi-source installations

### End-to-End Tests

- Real npm package installation
- Real git repository cloning
- Real HTTP downloads
- Cross-platform compatibility (Linux, macOS, Windows)
- Different Node.js versions
- Production environment detection

### Test Fixtures

Create example doc packages:
- `@docpkg/test-docs` - Simple npm package with docs
- `@docpkg/test-nested` - Package with nested doc structure
- Mock HTTP server with test markdown files
- Mock git repository with documentation

## Distribution

### NPM Package

```json
{
  "name": "docpkg",
  "version": "1.0.0",
  "description": "Documentation package manager",
  "bin": {
    "docpkg": "./bin/docpkg.js"
  },
  "main": "lib/index.js",
  "engines": {
    "node": ">=14"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "chalk": "^5.0.0",
    "ora": "^6.0.0",
    "semver": "^7.5.0",
    "yaml": "^2.3.0"
  }
}
```

Install:
```bash
npm install -g docpkg
# or
npm install --save-dev docpkg
```

### Standalone Binary (future)

Compile to standalone binaries for each platform:
- Linux (x64, arm64)
- macOS (x64, arm64)
- Windows (x64)

Install:
```bash
curl -fsSL https://docpkg.dev/install.sh | sh
# or
brew install docpkg
```

## Implementation Roadmap

### Phase 1: MVP (Core Functionality)

1. **CLI Foundation**
   - Argument parsing
   - Command routing
   - Help text

2. **Config Management**
   - Parse docpkg.json
   - Parse package.json "docs" field
   - Config validation

3. **NPM Adapter**
   - Parse npm package specs
   - Download from npm registry
   - Extract docs based on manifest
   - Integration with npm install

4. **Basic Commands**
   - `docpkg init`
   - `docpkg add` (npm sources only)
   - `docpkg install`
   - `docpkg sync`
   - `docpkg list`
   - `docpkg remove`

5. **Lockfile**
   - Generate docpkg-lock.json
   - Read and validate lockfile
   - Update lockfile on changes

6. **Documentation**
   - README with examples
   - CLI help text
   - Basic troubleshooting guide

### Phase 2: Multi-Source Support

1. **Git Adapter**
   - Clone repositories
   - Checkout refs
   - Extract docs

2. **HTTP Adapter**
   - Download from URLs
   - Handle redirects
   - Cache downloads

3. **File Adapter**
   - Copy/symlink local files
   - Handle relative paths

4. **Additional Commands**
   - `docpkg update`
   - `docpkg clean`
   - `docpkg verify`
   - `docpkg info`

### Phase 3: AI Features

1. **Index Generation**
   - Scan all documentation
   - Parse frontmatter
   - Generate searchable index
   - `docpkg index` command

2. **Metadata Extraction**
   - Parse markdown headers
   - Extract tags and categories
   - Count words and sections

3. **Bundle Command**
   - Concatenate documentation
   - Generate AI context file
   - `docpkg bundle` command

### Phase 4: Advanced Features

1. **Plugin System**
   - Plugin API
   - Custom transformations
   - Custom metadata extractors

2. **Watch Mode**
   - Watch for changes
   - Auto-update on source changes
   - `docpkg watch` command

3. **Global & MCP Support (Future)**
   - `docpkg -g add <source>`: Global documentation registry.
   - `docpkg mcp`: Model Context Protocol server to expose docs to AI agents.
   - `docpkg link`: Link local project docs to global MCP registry.

4. **Additional Package Managers**
   - PyPI adapter
   - RubyGems adapter
   - Other language ecosystems

4. **Doc Server**
   - Local documentation server
   - Search interface
   - `docpkg serve` command

### Phase 5: Polish & Distribution

1. **Standalone Binaries**
   - Compile for each platform
   - Distribution via package managers

2. **Registry (optional)**
   - Central registry for doc packages
   - Search functionality
   - Package discovery

3. **Extensive Testing**
   - Cross-platform testing
   - Performance testing
   - Security audit

4. **Documentation & Examples**
   - Complete user guide
   - Example doc packages
   - Video tutorials
   - Best practices guide

## Best Practices for Doc Package Authors

### Package Structure

```
your-docs-package/
├── package.json
├── .docpkg-manifest.json
├── README.md
├── docs/
│   ├── index.md          # Entry point
│   ├── getting-started.md
│   ├── api/
│   │   ├── overview.md
│   │   └── reference.md
│   └── guides/
│       ├── basics.md
│       └── advanced.md
└── examples/             # Optional: code examples
```

### Manifest Best Practices

```json
{
  "name": "@your-org/your-docs",
  "version": "1.0.0",
  "type": "npm",
  "docsPath": "docs",
  "files": ["docs/**/*.md"],
  "metadata": {
    "title": "Your Product Documentation",
    "description": "Comprehensive guide to Your Product",
    "tags": ["tag1", "tag2"],
    "category": "category-name",
    "homepage": "https://docs.yourproduct.com",
    "entryPoint": "docs/index.md"
  }
}
```

### Markdown Best Practices

1. **Use Frontmatter**
```markdown
---
title: Getting Started
description: Quick start guide
tags: [tutorial, basics]
---
```

2. **Organize with Headers**
```markdown
# Main Title

## Section 1

### Subsection 1.1

## Section 2
```

3. **Use Relative Links**
```markdown
See [API Reference](./api/reference.md) for more details.
```

4. **Include AI-Friendly Context**
```markdown
<!-- AI Context: This document explains authentication flow -->
```

### Versioning

- Use semantic versioning
- Document breaking changes
- Maintain changelog
- Tag releases in git

### Publishing Checklist

- [ ] Update version in package.json and manifest
- [ ] Update CHANGELOG.md
- [ ] Test installation with docpkg
- [ ] Verify all links work
- [ ] Check frontmatter on all files
- [ ] Run `npm publish`
- [ ] Tag release in git

## Security Considerations

1. **No Code Execution**
   - Never execute postinstall scripts from doc packages
   - Only extract static markdown files

2. **Integrity Verification**
   - Always verify checksums
   - Warn on integrity mismatches
   - Fail on corrupt downloads

3. **Path Traversal Prevention**
   - Sanitize all file paths
   - Never extract outside target directory
   - Validate symlinks

4. **HTTPS Enforcement**
   - Require HTTPS for URL sources
   - Verify SSL certificates
   - Warn on HTTP URLs

5. **Dependency Safety**
   - Keep dependencies minimal
   - Regular security audits
   - Use lock files

## FAQs

**Q: Can I use docpkg without npm?**
A: Yes! docpkg works independently of npm. NPM integration is optional but provides a richer experience.

**Q: Are docs committed to git?**
A: Recommendation: Don't commit the `docs/` directory. Commit `docpkg-lock.json` instead for reproducibility.

**Q: How do I create a doc package?**
A: Create a regular npm package with markdown files and a `.docpkg-manifest.json` file. See "Best Practices for Doc Package Authors" section.

**Q: Can I use docpkg in CI/CD?**
A: Yes! Run `docpkg install` or `docpkg sync` in your CI pipeline. It respects NODE_ENV and skips in production.

**Q: How do I update docs?**
A: Run `docpkg update` to update all docs, or `docpkg update <name>` for a specific package.

**Q: What happens in production builds?**
A: When NODE_ENV=production, docpkg commands exit immediately without doing anything. Doc packages in devDependencies aren't installed.

**Q: Can I customize where docs are installed?**
A: Yes! Set `installPath` in your config file.

**Q: How do I share private documentation?**
A: Use private npm packages, private git repos, or authenticated URLs. docpkg respects npm/git authentication.

**Q: Can I convert existing docs to a doc package?**
A: Yes! Run `docpkg init`, add a `.docpkg-manifest.json`, and publish to npm.

## Glossary

- **Doc package**: A package (npm, git repo, etc.) that contains markdown documentation
- **Source**: A reference to where documentation comes from (npm package, URL, etc.)
- **Manifest**: `.docpkg-manifest.json` file that describes a doc package
- **Sync**: Extract docs from node_modules to the configured docs directory
- **Adapter**: Module that knows how to fetch from a specific source type
- **Lockfile**: `docpkg-lock.json` that tracks installed versions

## References

- [npm CLI documentation](https://docs.npmjs.com/cli/)
- [Semantic Versioning](https://semver.org/)
- [CommonMark Specification](https://spec.commonmark.org/)
- [YAML Frontmatter](https://jekyllrb.com/docs/front-matter/)

## License Recommendation

MIT License - permissive and widely adopted for open source tools

---

**Version**: 1.0.0
**Last Updated**: 2024-12-04
**Status**: Specification Document