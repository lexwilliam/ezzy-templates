# Blog Page Template

A React component template for displaying blogs from internal.

## Installation

This template is installed via the `ezzy-templates` CLI tool:

```bash
npx ezzy-templates@latest add blog
```

## Usage

```tsx
import { BlogPage } from "@/components/ezzy-template";

export default function Page() {
  return (
    <BlogPage 
      blogId="your-blog-id"
      apiKey="sk_live_..."
      apiBaseUrl="https://your-app.com"
    />
  );
}
```

## Props

- `blogId` (string, required): The ID of the blog to display
- `apiKey` (string, optional): API key for authentication. Can also be set via environment variable
- `apiBaseUrl` (string, optional): Base URL for the API. Can also be set via environment variable

## Environment Variables

You can set these environment variables instead of passing props. Props always take priority over environment variables.

### For Client-Side (Next.js)

Use the `NEXT_PUBLIC_` prefix for variables that need to be available in the browser:

- `NEXT_PUBLIC_EZZY_API_KEY`: Your API key
- `NEXT_PUBLIC_EZZY_API_BASE_URL`: Base URL of your Ezzy instance (e.g., `https://your-app.com`)

### For Server-Side Only

If your component is rendered server-side, you can use:

- `EZZY_API_KEY`: Your API key (not exposed to browser)
- `EZZY_API_BASE_URL`: Base URL of your Ezzy instance

### Priority Order

1. Props (highest priority)
2. `NEXT_PUBLIC_*` environment variables
3. Non-prefixed environment variables (lowest priority)

## Features

- ✅ Fetches blog data from `/api/v1/blogs` endpoint
- ✅ Loading state with skeleton UI
- ✅ Error handling with retry option
- ✅ Responsive design
- ✅ Displays blog metadata (title, author, date, tags, excerpt)
- ⚠️ TipTap content rendering requires additional setup

## TipTap Content Rendering

The component currently displays the TipTap JSON content as raw JSON. To properly render rich text content, you'll need to:

1. Install a TipTap renderer or use `@tiptap/react` with the appropriate extensions
2. Replace the content rendering section in the component

Example with TipTap:

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// In your component
const editor = useEditor({
  extensions: [StarterKit],
  content: blog.content,
  editable: false,
});

return <EditorContent editor={editor} />;
```

## Styling

The component includes basic styles. You can customize them by:

1. Modifying the CSS classes in `styles.css`
2. Using Tailwind CSS classes (if your project uses Tailwind)
3. Overriding styles with your own CSS

## API Endpoint

- **EzzyBlogPage** (single post): `GET {apiBaseUrl}/api/v1/blogs?blogId={blogId}` with `X-API-Key` header.
- **EzzyBlogList** (all posts): `GET {apiBaseUrl}/api/v1/blogs` (no `blogId`) with `X-API-Key` header; returns an array of blogs.

## Error Handling

The component handles the following error cases:

- Missing blogId: Shows error message
- Missing API key: Shows error message
- Invalid API key: Returns 401 error
- Blog not found: Returns 404 error
- Network errors: Shows error with retry button
