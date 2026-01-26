import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Template {
  name: string;
  description: string;
  files: Array<{
    path: string;
    content: string;
    optional?: boolean;
  }>;
}

// GitHub repository configuration
const GITHUB_OWNER = "your-org"; // Update this to your GitHub username/org
const GITHUB_REPO = "internal-blog-templates"; // Update this to your templates repo name
const GITHUB_BRANCH = "main"; // Update this to your default branch
const GITHUB_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

/**
 * Download template from GitHub repository
 * Falls back to local templates directory for development
 */
export async function downloadTemplate(templateName: string): Promise<Template | null> {
  // Try to fetch from GitHub first (when running via npx)
  try {
    const registryUrl = `${GITHUB_BASE_URL}/registry.json`;
    const registryResponse = await fetch(registryUrl);
    
    if (registryResponse.ok) {
      const registry = await registryResponse.json();
      const template = registry.templates[templateName];

      if (!template) {
        return null;
      }

      // Fetch all template files from GitHub
      const files = await Promise.all(
        template.files.map(async (file: any) => {
          try {
            const fileUrl = `${GITHUB_BASE_URL}/${templateName}/${file.content}`;
            const fileResponse = await fetch(fileUrl);
            
            if (fileResponse.ok) {
              const content = await fileResponse.text();
              return {
                path: file.path,
                content: content,
                optional: file.optional || false,
              };
            } else if (file.optional) {
              return {
                path: file.path,
                content: "",
                optional: true,
              };
            } else {
              throw new Error(`Template file not found: ${file.content}`);
            }
          } catch (error) {
            if (file.optional) {
              return {
                path: file.path,
                content: "",
                optional: true,
              };
            }
            throw error;
          }
        })
      );

      return {
        name: template.name,
        description: template.description,
        files: files,
      };
    }
  } catch (error) {
    // Fall back to local templates for development
    console.warn("Failed to fetch from GitHub, using local templates:", error instanceof Error ? error.message : error);
  }

  // Fallback: read from local templates directory (for development)
  const cliRoot = path.resolve(__dirname, "../..");
  const templatesDir = path.join(cliRoot, "..", "templates");
  const registryPath = path.join(templatesDir, "registry.json");

  if (!(await fs.pathExists(registryPath))) {
    throw new Error("Template registry not found. Make sure templates are available on GitHub or locally.");
  }

  const registry = await fs.readJson(registryPath);
  const template = registry.templates[templateName];

  if (!template) {
    return null;
  }

  // Read template files
  const templateDir = path.join(templatesDir, templateName);
  const files = await Promise.all(
    template.files.map(async (file: any) => {
      const filePath = path.join(templateDir, file.content);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, "utf-8");
        return {
          path: file.path,
          content: content,
          optional: file.optional || false,
        };
      } else if (file.optional) {
        return {
          path: file.path,
          content: "",
          optional: true,
        };
      } else {
        throw new Error(`Template file not found: ${file.content}`);
      }
    })
  );

  return {
    name: template.name,
    description: template.description,
    files: files,
  };
}
