# Testing Guide

This guide explains how to test the CLI and templates setup.

## Prerequisites

1. Install CLI dependencies:
   ```bash
   cd ezzy-templates/cli
   npm install
   ```

## Testing Methods

### Method 1: Local Testing (Development Mode)

This tests the CLI using local templates (fallback mode when GitHub fetch fails).

1. **Install CLI dependencies:**
   ```bash
   cd ezzy-templates/cli
   npm install
   ```

2. **Create a test project** (or use an existing Next.js/React project):
   ```bash
   # Create a test Next.js project
   cd /tmp  # or wherever you want to test
   npx create-next-app@latest test-blog-install
   cd test-blog-install
   ```

3. **Run the CLI in dev mode:**
   ```bash
   # From the test project directory
   cd /Users/alex/Documents/EzzyApp/ezzy-projects/ezzy-templates/cli
   npm run dev add ezzy-template
   ```

   The CLI will:
   - Try to fetch from GitHub (will fail if repo doesn't exist)
   - Fall back to local templates in `ezzy-templates/templates/`
   - Prompt you for installation options
   - Install the template to your test project

4. **Verify installation:**
   - Check that `components/ezzy-template.tsx` (or your chosen path) exists
   - Check that `components/ezzy-template.css` exists (if styles were included)
   - Verify the component can be imported and used

### Method 2: Testing with GitHub Repository

If you've already created a GitHub repository:

1. **Update GitHub configuration in `cli/src/utils/download.ts`:**
   ```typescript
   const GITHUB_OWNER = "your-github-username";  // Your GitHub username/org
   const GITHUB_REPO = "internal-blog-templates"; // Your repo name
   const GITHUB_BRANCH = "main"; // Your default branch
   ```

2. **Build the CLI:**
   ```bash
   cd ezzy-templates/cli
   npm run build
   ```

3. **Test locally (will fetch from GitHub):**
   ```bash
   # From a test project
   cd /path/to/test-project
   node /Users/alex/Documents/EzzyApp/ezzy-projects/ezzy-templates/cli/dist/index.js add ezzy-template
   ```

4. **Or publish to npm and test:**
   ```bash
   cd ezzy-templates/cli
   npm publish
   
   # Then from any project:
   npx internal-blog@latest add ezzy-template
   ```

### Method 3: Quick Local Test (No GitHub)

Test the local fallback without setting up GitHub:

1. **Install dependencies:**
   ```bash
   cd ezzy-templates/cli
   npm install
   ```

2. **Create a minimal test project:**
   ```bash
   mkdir -p /tmp/test-cli-install
   cd /tmp/test-cli-install
   npm init -y
   # Create a basic package.json structure
   ```

3. **Run CLI (will use local templates):**
   ```bash
   cd /Users/alex/Documents/EzzyApp/ezzy-projects/ezzy-templates/cli
   npm run dev add ezzy-template
   ```

## What to Check

### ✅ Template Files
- [ ] `component.tsx` is installed correctly
- [ ] `styles.css` is installed (if included)
- [ ] File paths match what you specified

### ✅ Registry Configuration
- [ ] `registry.json` has correct paths for GitHub
- [ ] `content` field matches actual filenames in template directory
- [ ] Template metadata (name, description, version) is correct

### ✅ CLI Functionality
- [ ] CLI detects project type correctly
- [ ] Template downloads successfully (from GitHub or local)
- [ ] Installation prompts work
- [ ] Files are written to correct locations
- [ ] Environment variables are configured

### ✅ Component Usage
- [ ] Component can be imported
- [ ] Component renders without errors
- [ ] Dependencies are installed (TipTap, shadcn components)

## Troubleshooting

### "Template registry not found"
- Check that `ezzy-templates/templates/registry.json` exists
- Verify the registry JSON is valid

### "Template file not found"
- Check that template files exist in `ezzy-templates/templates/ezzy-template/`
- Verify filenames match the `content` field in `registry.json`

### "Failed to fetch from GitHub"
- This is expected if you haven't set up GitHub yet
- The CLI should fall back to local templates automatically
- Check the console for the fallback message

### Component import errors
- Make sure required dependencies are installed
- Check that shadcn UI components exist
- Verify TipTap packages are installed

## Next Steps After Testing

1. **If local testing works:**
   - Set up GitHub repository
   - Upload templates to GitHub
   - Update GitHub config in `download.ts`
   - Test with GitHub URLs

2. **If GitHub testing works:**
   - Build CLI: `npm run build`
   - Publish to npm: `npm publish`
   - Test with `npx internal-blog@latest add ezzy-template`
