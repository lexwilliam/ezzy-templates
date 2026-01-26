# GitHub Setup Guide for Ezzy Templates

This guide explains how to set up the GitHub repository for hosting templates that users can install via the CLI.

## Repository Structure

Create a new GitHub repository (e.g., `ezzy-templates`) with the following structure:

```
ezzy-templates/
├── registry.json          # Template registry (required)
├── blog/                  # Template directory
│   ├── component.tsx      # Template component file
│   ├── styles.css         # Template styles (optional)
│   └── README.md          # Template documentation (optional)
└── README.md              # Repository README
```

## Step 1: Create the Repository

1. Go to GitHub and create a new repository
2. Name it `ezzy-templates` (or your preferred name)
3. Make it public (or private if you prefer, but public is easier for users)
4. Initialize with a README

## Step 2: Upload Files

### 2.1 Upload `registry.json`

Create/upload the `registry.json` file at the root of your repository:

```json
{
  "templates": {
    "blog": {
      "name": "Blog Page",
      "description": "A React component to display blogs from internal",
      "version": "1.0.0",
      "files": [
        {
          "path": "components/blog.tsx",
          "content": "component.tsx"
        },
        {
          "path": "components/blog.css",
          "content": "styles.css",
          "optional": true
        }
      ],
      "dependencies": [],
      "devDependencies": [],
      "envVars": [
        {
          "name": "EZZY_API_KEY",
          "description": "Your internal API key",
          "required": false
        },
        {
          "name": "EZZY_API_BASE_URL",
          "description": "Base URL of your internal instance",
          "required": false
        }
      ]
    }
  }
}
```

### 2.2 Upload Template Files

Create a directory for each template (e.g., `blog/`) and upload:

- `component.tsx` - The main component file
- `styles.css` - Optional styles file
- `README.md` - Optional documentation

**Important:** The `content` field in `registry.json` should reference the filename relative to the template directory (e.g., `component.tsx`, `styles.css`).

## Step 3: Update CLI Configuration

After creating the repository, update the GitHub configuration in `cli/src/utils/download.ts`:

```typescript
const GITHUB_OWNER = "your-org"; // Your GitHub username or organization
const GITHUB_REPO = "ezzy-templates"; // Your repository name
const GITHUB_BRANCH = "master"; // Your default branch (main or master)
```

## Step 4: Test the Setup

1. Make sure your repository is accessible via raw GitHub URLs:
   - `https://raw.githubusercontent.com/YOUR_ORG/ezzy-templates/master/registry.json`
   - `https://raw.githubusercontent.com/YOUR_ORG/ezzy-templates/master/blog/component.tsx`

2. Test the CLI:
   ```bash
   npx @ezzy/templates@latest add blog
   ```

## File Structure Details

### registry.json

The registry file defines all available templates. Each template entry includes:

- `name`: Display name
- `description`: Template description
- `version`: Template version
- `files`: Array of files to install
  - `path`: Where to install the file in the user's project (relative to project root)
  - `content`: Filename in the template directory (e.g., `component.tsx`, `styles.css`)
  - `optional`: Whether the file is optional (defaults to false)
- `dependencies`: npm packages to install
- `devDependencies`: dev npm packages to install
- `envVars`: Environment variables to configure

### Template Directory Structure

Each template should have its own directory containing:

- `component.tsx` (or similar): Main component file
- `styles.css` (optional): Stylesheet
- `README.md` (optional): Template-specific documentation

The `content` field in `registry.json` should reference the filename relative to the template directory.

## Example: Adding a New Template

1. Create a new directory in your GitHub repo: `new-template/`
2. Add your files: `new-template/component.tsx`, `new-template/styles.css`, etc.
3. Update `registry.json` to include the new template:

```json
{
  "templates": {
    "blog": { ... },
    "new-template": {
      "name": "New Template",
      "description": "Description of new template",
      "version": "1.0.0",
      "files": [
        {
          "path": "components/new-template.tsx",
          "content": "component.tsx"
        },
        {
          "path": "components/new-template.css",
          "content": "styles.css",
          "optional": true
        }
      ],
      "dependencies": [],
      "devDependencies": [],
      "envVars": []
    }
  }
}
```

4. Commit and push to GitHub
5. Users can now install it: `npx @ezzy/templates@latest add new-template`

## Quick Start Checklist

- [ ] Create GitHub repository
- [ ] Upload `registry.json` to root
- [ ] Create template directories (e.g., `blog/`)
- [ ] Upload template files (`component.tsx`, `styles.css`, etc.)
- [ ] Update `GITHUB_OWNER` and `GITHUB_REPO` in `cli/src/utils/download.ts`
- [ ] Verify `GITHUB_BRANCH` matches your default branch
- [ ] Test with `npx @ezzy/templates@latest add blog`
- [ ] Publish CLI to npm: `cd cli && npm publish`

## Publishing the CLI

Once your templates are on GitHub:

1. Update version in `cli/package.json`
2. Build: `cd cli && npm run build`
3. Publish: `cd cli && npm publish`

Users can then install templates with:
```bash
npx @ezzy/templates@latest add blog
```

## Troubleshooting

### Template Not Found

- Verify the template name in `registry.json` matches the directory name
- Check that `registry.json` is accessible at the raw GitHub URL
- Ensure the branch name in `download.ts` matches your repository's default branch

### Files Not Downloading

- Verify file paths in `registry.json` match actual files in template directories
- Check that the `content` field references the correct filename
- Ensure files are committed and pushed to GitHub

### Local Development

The CLI falls back to local templates when GitHub fetch fails, which is useful for development. Make sure your local `templates/` directory structure matches the GitHub repository structure.
