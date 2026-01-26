import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";

/**
 * Check if shadcn is configured in the project
 */
export async function checkShadcnConfigured(projectRoot: string): Promise<boolean> {
  const componentsJsonPath = path.join(projectRoot, "components.json");
  return await fs.pathExists(componentsJsonPath);
}

/**
 * Check if a component exists in the components/ui folder
 */
export async function checkComponentExists(
  componentName: string,
  projectRoot: string
): Promise<boolean> {
  // Try common component file patterns
  const possiblePaths = [
    path.join(projectRoot, "components", "ui", `${componentName}.tsx`),
    path.join(projectRoot, "components", "ui", `${componentName}.ts`),
    path.join(projectRoot, "src", "components", "ui", `${componentName}.tsx`),
    path.join(projectRoot, "src", "components", "ui", `${componentName}.ts`),
  ];

  for (const componentPath of possiblePaths) {
    if (await fs.pathExists(componentPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a package is installed in package.json
 */
export async function checkPackageInstalled(
  packageName: string,
  projectRoot: string
): Promise<boolean> {
  const packageJsonPath = path.join(projectRoot, "package.json");
  
  if (!(await fs.pathExists(packageJsonPath))) {
    return false;
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath);
    return !!(
      packageJson.dependencies?.[packageName] ||
      packageJson.devDependencies?.[packageName]
    );
  } catch {
    return false;
  }
}

/**
 * Detect package manager from lock files
 */
export async function detectPackageManager(projectRoot: string): Promise<"npm" | "bun" | "yarn" | "pnpm"> {
  if (await fs.pathExists(path.join(projectRoot, "bun.lockb"))) {
    return "bun";
  }
  if (await fs.pathExists(path.join(projectRoot, "yarn.lock"))) {
    return "yarn";
  }
  if (await fs.pathExists(path.join(projectRoot, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  return "npm";
}

/**
 * Install a shadcn component via CLI
 */
export async function installShadcnComponent(
  componentName: string,
  projectRoot: string
): Promise<void> {
  const originalCwd = process.cwd();
  
  try {
    process.chdir(projectRoot);
    
    // Run shadcn add command
    execSync(`npx shadcn@latest add ${componentName} --yes`, {
      stdio: "inherit",
      cwd: projectRoot,
    });
  } finally {
    process.chdir(originalCwd);
  }
}

/**
 * Install npm packages
 */
export async function installPackage(
  packageName: string,
  projectRoot: string
): Promise<void> {
  const originalCwd = process.cwd();
  const packageManager: "npm" | "bun" | "yarn" | "pnpm" = await detectPackageManager(projectRoot);
  
  try {
    process.chdir(projectRoot);
    
    let command: string;
    switch (packageManager) {
      case "bun":
        command = `bun add ${packageName}`;
        break;
      case "yarn":
        command = `yarn add ${packageName}`;
        break;
      case "pnpm":
        command = `pnpm add ${packageName}`;
        break;
      default:
        command = `npm install ${packageName}`;
    }
    
    execSync(command, {
      stdio: "inherit",
      cwd: projectRoot,
    });
  } finally {
    process.chdir(originalCwd);
  }
}

/**
 * Install multiple packages at once
 */
export async function installPackages(
  packageNames: string[],
  projectRoot: string
): Promise<void> {
  if (packageNames.length === 0) {
    return;
  }

  const originalCwd = process.cwd();
  const packageManager: "npm" | "bun" | "yarn" | "pnpm" = await detectPackageManager(projectRoot);
  
  try {
    process.chdir(projectRoot);
    
    const packagesList = packageNames.join(" ");
    let command: string;
    
    switch (packageManager) {
      case "bun":
        command = `bun add ${packagesList}`;
        break;
      case "yarn":
        command = `yarn add ${packagesList}`;
        break;
      case "pnpm":
        command = `pnpm add ${packagesList}`;
        break;
      default:
        command = `npm install ${packagesList}`;
    }
    
    execSync(command, {
      stdio: "inherit",
      cwd: projectRoot,
    });
  } finally {
    process.chdir(originalCwd);
  }
}
