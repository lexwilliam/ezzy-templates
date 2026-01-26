import fs from "fs-extra";
import path from "path";
import { detectNextjsRouterType } from "./config.js";

interface Template {
  name: string;
  description: string;
  files: Array<{
    path: string;
    content: string;
    optional?: boolean;
  }>;
}

interface InstallOptions {
  apiBaseUrl?: string;
  apiKey?: string;
}

/**
 * Install template files to the project
 */
export async function installTemplate(
  template: Template,
  installPath: string,
  options: InstallOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const targetDir = path.join(cwd, installPath);

  // Ensure target directory exists
  await fs.ensureDir(targetDir);

  // Install each file
  for (const file of template.files) {
    const filePath = path.join(targetDir, path.basename(file.path));
    
    // Process file content (replace placeholders if needed)
    let content = file.content;
    
    // Replace API base URL placeholder if present
    if (options.apiBaseUrl) {
      content = content.replace(
        /process\.env\.EZZY_API_BASE_URL\s*\|\|\s*["']/g,
        `process.env.EZZY_API_BASE_URL || "${options.apiBaseUrl}"`
      );
    }

    // Write file
    await fs.writeFile(filePath, content, "utf-8");
  }

  // Create or update .env.local with API configuration
  if (options.apiBaseUrl || options.apiKey) {
    const envPath = path.join(cwd, ".env.local");
    let envContent = "";

    if (await fs.pathExists(envPath)) {
      envContent = await fs.readFile(envPath, "utf-8");
    }

    // Append or update environment variables
    const lines = envContent.split("\n");
    const newLines: string[] = [];

    let hasApiKey = false;
    let hasApiBaseUrl = false;

    for (const line of lines) {
      if (line.startsWith("EZZY_API_KEY=")) {
        if (options.apiKey) {
          newLines.push(`EZZY_API_KEY=${options.apiKey}`);
          hasApiKey = true;
        } else {
          newLines.push(line);
          hasApiKey = true;
        }
      } else if (line.startsWith("EZZY_API_BASE_URL=")) {
        if (options.apiBaseUrl) {
          newLines.push(`EZZY_API_BASE_URL=${options.apiBaseUrl}`);
          hasApiBaseUrl = true;
        } else {
          newLines.push(line);
          hasApiBaseUrl = true;
        }
      } else {
        newLines.push(line);
      }
    }

    if (options.apiKey && !hasApiKey) {
      newLines.push(`EZZY_API_KEY=${options.apiKey}`);
    }

    if (options.apiBaseUrl && !hasApiBaseUrl) {
      newLines.push(`EZZY_API_BASE_URL=${options.apiBaseUrl}`);
    }

    await fs.writeFile(envPath, newLines.join("\n") + "\n", "utf-8");
  }
}

/**
 * Create a blog detail page at /blog/[id]
 */
export async function createBlogDetailPage(
  componentPath: string,
  componentName: string = "blog",
  exportName: string = "EzzyBlogPage",
  options: InstallOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const routerType = await detectNextjsRouterType();
  
  if (!routerType) {
    throw new Error("Could not detect Next.js router type. Make sure you're in a Next.js project.");
  }
  
  // Determine the import path for the component
  const importPath = componentPath.startsWith('/') || componentPath.startsWith('./')
    ? `${componentPath}/${componentName}`
    : `@/${componentPath}/${componentName}`;
  
  // Get API configuration
  const apiBaseUrl = options.apiBaseUrl || "ezzy.lexwilliam.dev";
  const apiKey = options.apiKey || "";
  
  // Create the page content based on router type
  let pageContent: string;
  if (routerType === "app") {
    // App Router: uses params prop
    pageContent = `import { ${exportName} } from "${importPath}";

export default function BlogPage(
  { params }: { params: { id: string } }
) {
  return (
    <${exportName} 
      blogId={params.id} 
      apiBaseUrl="${apiBaseUrl}"${apiKey ? `\n      apiKey="${apiKey}"` : ""} 
    />
  );
}
`;
  } else {
    // Pages Router: uses useRouter hook
    pageContent = `"use client";

import { useRouter } from "next/router";
import { ${exportName} } from "${importPath}";

export default function BlogPage() {
  const router = useRouter();
  const { id } = router.query;
  
  if (!id || typeof id !== "string") {
    return <div>Loading...</div>;
  }
  
  return (
    <${exportName} 
      blogId={id} 
      apiBaseUrl="${apiBaseUrl}"${apiKey ? `\n      apiKey="${apiKey}"` : ""} 
    />
  );
}
`;
  }
  
  // Determine the target directory and file path based on router type
  let pageFilePath: string;
  if (routerType === "app") {
    // App Router: app/blog/[id]/page.tsx
    const targetDir = path.join(cwd, "app", "blog", "[id]");
    await fs.ensureDir(targetDir);
    pageFilePath = path.join(targetDir, "page.tsx");
  } else {
    // Pages Router: pages/blog/[id].tsx
    const targetDir = path.join(cwd, "pages", "blog");
    await fs.ensureDir(targetDir);
    pageFilePath = path.join(targetDir, "[id].tsx");
  }
  
  // Write the page file
  await fs.writeFile(pageFilePath, pageContent, "utf-8");
}
