# Internal Blog CLI

CLI tool to add internal blog components to your project, similar to shadcn/ui.

## Installation

The CLI is designed to be run via npx (no installation needed):

```bash
npx ezzy-templates@latest add blog
```

## Usage

### Add a template

```bash
npx ezzy-templates@latest add <template-name>
```

Example:

```bash
npx ezzy-templates@latest add blog
```

The CLI will:
1. Detect your project type (Next.js, React, Vite, etc.)
2. Download the template from GitHub
3. Prompt for installation options:
   - Installation path
   - API base URL
   - API key (optional)
4. Install the component to your project
5. Configure environment variables

## Available Templates

- `blog` - A React component to display blogs from internal

## Development

To develop the CLI locally:

```bash
cd cli
npm install
npm run dev add blog
```

To build:

```bash
npm run build
```

## Publishing

1. Update version in `package.json`
2. Build the project: `npm run build`
3. Publish to npm: `npm publish`

## Template Repository

Templates are stored in a separate GitHub repository. The CLI fetches templates from:

```
https://raw.githubusercontent.com/your-org/internal-blog-templates/main/registry.json
```

Update the `downloadTemplate` function in `src/utils/download.ts` to point to your repository.
