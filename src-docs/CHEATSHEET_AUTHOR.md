# Author Cheatsheet

Use `docpkg` to distribute your documentation with AI-ready metadata.

## 1. Preparation

**Create Manifest**
Run this in your repository root.
```bash
docpkg manifest
```
*Follow the interactive prompts.*

## 2. AI Enrichment (Optional but Recommended)

Pre-compute summaries and tags for your users.

**Configure AI**
```bash
export OPENAI_API_KEY="sk-..."
# Or configure locally in docpkg.json
```

**Run Enrichment**
```bash
docpkg enrich
```
*This generates `.docpkg-index.json`.*

## 3. Distribution

**Git Distribution**
1. Commit the new files:
   ```bash
   git add .docpkg-manifest.json .docpkg-index.json
   git commit -m "Add docpkg support"
   ```
2. Push to your repo.

**NPM Distribution**
1. Ensure files are included in `package.json`:
   ```json
   "files": [
     ".docpkg-manifest.json",
     ".docpkg-index.json",
     "docs/"
   ]
   ```
2. Publish:
   ```bash
   npm publish
   ```
