import fs from "fs-extra";
import path from "path";

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
