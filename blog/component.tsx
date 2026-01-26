"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

interface Blog {
  _id: string;
  title: string;
  content: any; // TipTap JSON content
  status: "draft" | "published";
  thumbnail?: string;
  excerpt?: string;
  author?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
}

interface BlogPageProps {
  blogId: string;
  apiKey?: string;
  apiBaseUrl?: string;
}

interface BlogPageState {
  blog: Blog | null;
  loading: boolean;
  error: string | null;
}

/**
 * BlogPage Component
 *
 * A React component that fetches and displays a blog post from the internal API.
 *
 * @param blogId - The ID of the blog to display
 * @param apiKey - API key for authentication (can also be set via EZZY_API_KEY env var)
 * @param apiBaseUrl - Base URL for the API (can also be set via EZZY_API_BASE_URL env var)
 *
 * @example
 * ```tsx
 * <BlogPage
 *   blogId="your-blog-id"
 *   apiKey="sk_live_..."
 *   apiBaseUrl="https://your-app.com"
 * />
 * ```
 */
export function BlogPage({
  blogId,
  apiKey: propApiKey,
  apiBaseUrl: propApiBaseUrl,
}: BlogPageProps) {
  const [state, setState] = useState<BlogPageState>({
    blog: null,
    loading: true,
    error: null,
  });

  // Get API key and base URL from props or environment variables
  const apiKey =
    propApiKey ||
    (typeof window !== "undefined"
      ? undefined
      : process.env.EZZY_API_KEY);
  const apiBaseUrl =
    propApiBaseUrl ||
    (typeof window !== "undefined"
      ? undefined
      : process.env.EZZY_API_BASE_URL) ||
    "";

  // Initialize TipTap editor for rendering content
  const editor = useEditor({
    extensions: [StarterKit],
    content: state.blog?.content || null,
    editable: false,
    immediatelyRender: false,
  });

  // Update editor content when blog loads
  useEffect(() => {
    if (editor && state.blog?.content) {
      editor.commands.setContent(state.blog.content);
    }
  }, [editor, state.blog?.content]);

  useEffect(() => {
    if (!blogId) {
      setState({ blog: null, loading: false, error: "Blog ID is required" });
      return;
    }

    if (!apiKey) {
      setState({ blog: null, loading: false, error: "API key is required" });
      return;
    }

    if (!apiBaseUrl) {
      setState({
        blog: null,
        loading: false,
        error: "API base URL is required",
      });
      return;
    }

    const fetchBlog = async () => {
      setState({ blog: null, loading: true, error: null });

      try {
        const url = new URL(`${apiBaseUrl}/api/v1/blogs`);
        url.searchParams.set("blogId", blogId);

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch blog: ${response.statusText}`
          );
        }

        const blog = await response.json();
        setState({ blog, loading: false, error: null });
      } catch (error) {
        setState({
          blog: null,
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch blog",
        });
      }
    };

    fetchBlog();
  }, [blogId, apiKey, apiBaseUrl]);

  if (state.loading) {
    return (
      <Card className="ezzy-template-loading">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{state.error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => window.location.reload()}>
              Retry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (!state.blog) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blog Not Found</AlertDialogTitle>
            <AlertDialogDescription>
              The blog you're looking for doesn't exist or couldn't be loaded.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  const { blog } = state;

  return (
    <Card className="ezzy-template">
      {blog.thumbnail && (
        <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-t-lg">
          <img
            src={blog.thumbnail}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardHeader>
        <h1 className="ezzy-template-title text-3xl font-bold mb-4">
          {blog.title}
        </h1>

        {(blog.author || blog.publishedAt) && (
          <div className="ezzy-template-meta flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {blog.author && (
              <span className="ezzy-template-author">By {blog.author}</span>
            )}
            {blog.publishedAt && (
              <time className="ezzy-template-date">
                {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
          </div>
        )}

        {blog.excerpt && (
          <p className="ezzy-template-excerpt text-lg text-muted-foreground mb-4">
            {blog.excerpt}
          </p>
        )}

        {blog.tags && blog.tags.length > 0 && (
          <div className="ezzy-template-tags flex flex-wrap gap-2">
            {blog.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <Separator />

      <CardContent className="ezzy-template-content pt-6">
        {editor ? (
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
            <EditorContent editor={editor} />
          </div>
        ) : (
          <>
            <pre className="ezzy-template-content-raw bg-muted p-4 rounded-md overflow-auto">
              {JSON.stringify(blog.content, null, 2)}
            </pre>
            <p className="ezzy-template-content-note text-sm text-muted-foreground mt-4">
              Note: TipTap editor is initializing. Content will be displayed
              shortly.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
