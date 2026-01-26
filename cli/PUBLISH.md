# Publishing to npm

This guide explains how to publish the `ezzy-templates` CLI package to npm.

## Prerequisites

1. **npm account**: Create an account at [npmjs.com](https://www.npmjs.com/signup) if you don't have one
2. **Login to npm**: Run `npm login` in your terminal
3. **Check package name availability**: Verify `ezzy-templates` is available on npm

## Pre-Publishing Checklist

Before publishing, make sure:

- [ ] Package name is available on npm (check: `npm view ezzy-templates`)
- [ ] All code is committed to git
- [ ] GitHub repository is set up (if using GitHub for templates)
- [ ] GitHub configuration in `src/utils/download.ts` is correct
- [ ] Version number in `package.json` is correct
- [ ] `author` field in `package.json` is filled (optional but recommended)
- [ ] README.md is up to date
- [ ] All tests pass (if you have tests)

## Step-by-Step Publishing Process

### 1. Check Package Name Availability

```bash
npm view ezzy-templates
```

If you get a 404, the name is available. If it returns package info, the name is taken and you'll need to change it in `package.json`.

### 2. Login to npm

```bash
npm login
```

Enter your:
- Username
- Password
- Email address
- One-time password (if 2FA is enabled)

### 3. Update Package Information (if needed)

Edit `package.json` to ensure:
- `version` is correct (start with `1.0.0` for first release)
- `author` field is filled (e.g., `"Your Name <your.email@example.com>"`)
- `description` is clear and helpful
- `repository` field is added (optional but recommended):

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/ezzy-templates.git"
  }
}
```

### 4. Build the Project

The `prepublishOnly` script will automatically build before publishing, but you can test the build manually:

```bash
cd cli
npm run build
```

Verify that the `dist/` directory contains the compiled JavaScript files.

### 5. Test the Build Locally (Optional)

Test that the built CLI works:

```bash
# From the cli directory
node dist/index.js add blog
```

### 6. Dry Run (Recommended)

Do a dry run to see what would be published without actually publishing:

```bash
npm publish --dry-run
```

This will show you:
- What files will be included
- The package size
- Any warnings

### 7. Publish to npm

**For first-time publishing:**

```bash
npm publish
```

**For subsequent releases:**

```bash
# Update version first
npm version patch  # for bug fixes (1.0.0 -> 1.0.1)
npm version minor  # for new features (1.0.0 -> 1.1.0)
npm version major  # for breaking changes (1.0.0 -> 2.0.0)

# Then publish
npm publish
```

Or manually update version in `package.json` and run `npm publish`.

### 8. Verify Publication

Check that your package is published:

```bash
npm view ezzy-templates
```

Or visit: `https://www.npmjs.com/package/ezzy-templates`

### 9. Test Installation

Test from a different directory/project:

```bash
# Test with npx
npx ezzy-templates@latest add blog

# Or install globally
npm install -g ezzy-templates
ezzy-templates add blog
```

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes (backward compatible)

Update version using:
```bash
npm version patch|minor|major
```

This automatically:
- Updates `package.json` version
- Creates a git tag
- Commits the change

## Publishing Scoped Packages (Optional)

If you want to publish under a scope (e.g., `@your-org/ezzy-templates`):

1. Update `package.json`:
   ```json
   {
     "name": "@your-org/ezzy-templates"
   }
   ```

2. Publish with public access (scoped packages are private by default):
   ```bash
   npm publish --access public
   ```

## Troubleshooting

### "Package name already exists"
- Choose a different name in `package.json`
- Or use a scoped package name: `@your-org/ezzy-templates`

### "You must verify your email"
- Check your email and verify your npm account
- Run `npm login` again after verification

### "403 Forbidden"
- Make sure you're logged in: `npm whoami`
- Check you have publish access to the package name
- If it's a scoped package, ensure you're the owner

### "Package size too large"
- Check what files are being included with `npm publish --dry-run`
- Add an `.npmignore` file to exclude unnecessary files
- The `.gitignore` already excludes `src/`, `node_modules/`, etc.

### Build fails
- Make sure TypeScript is installed: `npm install`
- Check for TypeScript errors: `npm run build`
- Fix any compilation errors before publishing

## Post-Publishing

After successful publication:

1. **Update documentation** with the published package name
2. **Test installation** from a clean environment
3. **Announce** the package (if desired)
4. **Monitor** for issues and user feedback

## Quick Reference

```bash
# Full publishing workflow
cd cli
npm login                    # First time only
npm run build               # Test build
npm publish --dry-run       # Preview what will be published
npm publish                 # Publish to npm

# For updates
npm version patch           # Bump version
npm publish                 # Publish new version
```

## Important Notes

- The `prepublishOnly` script automatically builds before publishing
- Only files not in `.gitignore` or `.npmignore` will be published
- The `dist/` folder must exist and contain compiled files
- Make sure your GitHub repository is set up before publishing (if templates are hosted there)
