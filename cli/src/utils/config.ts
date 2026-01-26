import fs from "fs-extra";
import path from "path";

type ProjectType = "nextjs" | "react" | "vite" | "unknown";
type NextjsRouterType = "app" | "pages" | null;

/**
 * Detect project type by checking for configuration files
 */
export async function detectProjectType(): Promise<ProjectType | null> {
  const cwd = process.cwd();

  // Check for Next.js
  if (
    (await fs.pathExists(path.join(cwd, "next.config.js"))) ||
    (await fs.pathExists(path.join(cwd, "next.config.ts"))) ||
    (await fs.pathExists(path.join(cwd, "next.config.mjs")))
  ) {
    return "nextjs";
  }

  // Check for Vite
  if (await fs.pathExists(path.join(cwd, "vite.config.js")) || 
      await fs.pathExists(path.join(cwd, "vite.config.ts"))) {
    return "vite";
  }

  // Check for React (package.json with react dependency)
  const packageJsonPath = path.join(cwd, "package.json");
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
      return "react";
    }
  }

  return null;
}

/**
 * Detect Next.js router type (app router vs pages router)
 */
export async function detectNextjsRouterType(): Promise<NextjsRouterType> {
  const cwd = process.cwd();
  
  // Check for app directory (App Router)
  if (await fs.pathExists(path.join(cwd, "app"))) {
    return "app";
  }
  
  // Check for pages directory (Pages Router)
  if (await fs.pathExists(path.join(cwd, "pages"))) {
    return "pages";
  }
  
  return null;
}
