"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "next/link";
import { format } from "date-fns";

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

interface BlogListProps {
  apiKey?: string;
  apiBaseUrl?: string;
}

interface BlogPageState {
  blog: Blog | null;
  loading: boolean;
  error: string | null;
}

interface BlogListState {
  blogs: Blog[];
  loading: boolean;
  error: string | null;
}

// Helper Components
function Container({ children }: { children: React.ReactNode }) {
  return <div className="container mx-auto px-5">{children}</div>;
}

function CoverImage({
  title,
  src,
  slug,
}: {
  title: string;
  src: string;
  slug?: string;
}) {
  const image = (
    <img
      src={src}
      alt={`Cover Image for ${title}`}
      className={`shadow-sm w-full ${
        slug ? "hover:shadow-lg transition-shadow duration-200" : ""
      }`}
    />
  );

  return (
    <div className="sm:mx-0">
      {slug ? (
        <Link href={`/blog/${slug}`} aria-label={title}>
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  );
}

function DateFormatter({ dateString }: { dateString: number }) {
  const date = new Date(dateString);
  return (
    <time dateTime={date.toISOString()}>
      {format(date, "LLLL d, yyyy")}
    </time>
  );
}

function Avatar({ name, picture }: { name: string; picture?: string }) {
  return (
    <div className="flex items-center">
      {picture && (
        <img
          src={picture}
          className="w-12 h-12 rounded-full mr-4"
          alt={name}
        />
      )}
      <div className="text-xl font-bold">{name}</div>
    </div>
  );
}

function PostTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight md:leading-none mb-12 text-center md:text-left">
      {children}
    </h1>
  );
}

// BlogList Component
export function BlogList({
  apiKey: propApiKey,
  apiBaseUrl: propApiBaseUrl,
}: BlogListProps) {
  const [state, setState] = useState<BlogListState>({
    blogs: [],
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

  useEffect(() => {
    if (!apiKey) {
      setState({
        blogs: [],
        loading: false,
        error: "API key is required",
      });
      return;
    }

    if (!apiBaseUrl) {
      setState({
        blogs: [],
        loading: false,
        error: "API base URL is required",
      });
      return;
    }

    const fetchBlogs = async () => {
      setState({ blogs: [], loading: true, error: null });

      try {
        // Ensure apiBaseUrl has a protocol
        let baseUrl = apiBaseUrl;
        if (baseUrl && !baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
          baseUrl = `https://${baseUrl}`;
        }

        const url = new URL(`${baseUrl}/api/v1/blogs`);
        // No blogId parameter means we want all blogs

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
            errorData.error || `Failed to fetch blogs: ${response.statusText}`
          );
        }

        const blogs = await response.json();
        // Handle both array response and single object response
        const blogsArray = Array.isArray(blogs) ? blogs : [blogs];
        setState({ blogs: blogsArray, loading: false, error: null });
      } catch (error) {
        setState({
          blogs: [],
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch blogs",
        });
      }
    };

    fetchBlogs();
  }, [apiKey, apiBaseUrl]);

  if (state.loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading blogs...</div>
        </div>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container>
        <div className="py-12">
          <div className="text-red-600 mb-4">Error: {state.error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </Container>
    );
  }

  if (state.blogs.length === 0) {
    return (
      <Container>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No blogs found.</p>
        </div>
      </Container>
    );
  }

  const heroPost = state.blogs[0];
  const morePosts = state.blogs.slice(1);

  return (
    <main>
      <Container>
        {/* Hero Post */}
        {heroPost && (
          <section>
            <div className="mb-8 md:mb-16">
              {heroPost.thumbnail && (
                <CoverImage
                  title={heroPost.title}
                  src={heroPost.thumbnail}
                  slug={heroPost._id}
                />
              )}
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-x-16 lg:gap-x-8 mb-20 md:mb-28">
              <div>
                <h3 className="mb-4 text-4xl lg:text-5xl leading-tight">
                  <Link
                    href={`/blog/${heroPost._id}`}
                    className="hover:underline"
                  >
                    {heroPost.title}
                  </Link>
                </h3>
                <div className="mb-4 md:mb-0 text-lg">
                  {heroPost.publishedAt && (
                    <DateFormatter dateString={heroPost.publishedAt} />
                  )}
                </div>
              </div>
              <div>
                {heroPost.excerpt && (
                  <p className="text-lg leading-relaxed mb-4">
                    {heroPost.excerpt}
                  </p>
                )}
                {heroPost.author && (
                  <Avatar name={heroPost.author} picture={undefined} />
                )}
              </div>
            </div>
          </section>
        )}

        {/* More Stories */}
        {morePosts.length > 0 && (
          <section>
            <h2 className="mb-8 text-5xl md:text-7xl font-bold tracking-tighter leading-tight">
              More Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16 lg:gap-x-32 gap-y-20 md:gap-y-32 mb-32">
              {morePosts.map((post) => (
                <div key={post._id}>
                  <div className="mb-5">
                    {post.thumbnail && (
                      <CoverImage
                        slug={post._id}
                        title={post.title}
                        src={post.thumbnail}
                      />
                    )}
                  </div>
                  <h3 className="text-3xl mb-3 leading-snug">
                    <Link
                      href={`/blog/${post._id}`}
                      className="hover:underline"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <div className="text-lg mb-4">
                    {post.publishedAt && (
                      <DateFormatter dateString={post.publishedAt} />
                    )}
                  </div>
                  {post.excerpt && (
                    <p className="text-lg leading-relaxed mb-4">{post.excerpt}</p>
                  )}
                  {post.author && (
                    <Avatar name={post.author} picture={undefined} />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}

// BlogPage Component (Redesigned)
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
    content: null,
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
        // Ensure apiBaseUrl has a protocol
        let baseUrl = apiBaseUrl;
        if (baseUrl && !baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
          baseUrl = `https://${baseUrl}`;
        }

        const url = new URL(`${baseUrl}/api/v1/blogs`);
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
      <Container>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading blog...</div>
        </div>
      </Container>
    );
  }

  if (state.error) {
    return (
      <Container>
        <div className="py-12">
          <div className="text-red-600 mb-4">Error: {state.error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </Container>
    );
  }

  if (!state.blog) {
    return (
      <Container>
        <div className="py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Not Found</h1>
          <p className="text-muted-foreground">
            The blog you're looking for doesn't exist or couldn't be loaded.
          </p>
        </div>
      </Container>
    );
  }

  const { blog } = state;

  return (
    <main>
      <Container>
        <article className="mb-32">
          {/* Post Header */}
          <PostTitle>{blog.title}</PostTitle>
          
          {blog.thumbnail && (
            <div className="mb-8 md:mb-16 sm:mx-0">
              <CoverImage title={blog.title} src={blog.thumbnail} />
            </div>
          )}

          <div className="max-w-2xl mx-auto">
            {blog.author && (
              <div className="block md:hidden mb-6">
                <Avatar name={blog.author} picture={undefined} />
              </div>
            )}
            {blog.publishedAt && (
              <div className="mb-6 text-lg">
                <DateFormatter dateString={blog.publishedAt} />
              </div>
            )}
            {blog.author && (
              <div className="hidden md:block md:mb-12">
                <Avatar name={blog.author} picture={undefined} />
              </div>
            )}
          </div>

          {/* Post Body */}
          <div className="max-w-2xl mx-auto">
            {editor ? (
              <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <div className="text-muted-foreground">
                Loading content...
              </div>
            )}
          </div>
        </article>
      </Container>
    </main>
  );
}

// Export with alias for backward compatibility
export const EzzyBlogPage = BlogPage;
export const EzzyBlogList = BlogList;
