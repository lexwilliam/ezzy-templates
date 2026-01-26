import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import ora from "ora";
import { downloadTemplate } from "../utils/download.js";
import { installTemplate } from "../utils/install.js";
import { detectProjectType } from "../utils/config.js";
import {
  checkShadcnConfigured,
  checkComponentExists,
  checkPackageInstalled,
  installShadcnComponent,
  installPackages,
} from "../utils/components.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function addCommand(templateName: string) {
  const spinner = ora("Initializing...").start();

  try {
    // Detect project type
    spinner.text = "Detecting project type...";
    const projectType = await detectProjectType();
    
    if (!projectType) {
      spinner.fail("Could not detect project type. Make sure you're in a valid project directory.");
      process.exit(1);
    }

    spinner.succeed(`Detected project type: ${projectType}`);

    const cwd = process.cwd();

    // Check for shadcn configuration and components
    spinner.start("Checking for existing components...");
    const hasShadcn = await checkShadcnConfigured(cwd);
    
    // Components that the blog template can use
    const componentsToCheck = [
      "button",
      "card",
      "badge",
      "skeleton",
      "separator",
      "alert-dialog",
    ];

    const existingComponents: string[] = [];
    const missingComponents: string[] = [];

    for (const component of componentsToCheck) {
      const exists = await checkComponentExists(component, cwd);
      if (exists) {
        existingComponents.push(component);
      } else {
        missingComponents.push(component);
      }
    }

    spinner.succeed("Component check complete");

    // Automatically use existing components (no prompt needed)
    if (existingComponents.length > 0) {
      console.log("\n" + chalk.green("✓") + ` Found existing components: ${existingComponents.join(", ")}`);
      console.log(chalk.gray("  Using existing components from your project"));
    }

    // Prompt user to install missing shadcn components
    if (missingComponents.length > 0) {
      console.log("\n" + chalk.yellow("⚠") + ` Missing components: ${missingComponents.join(", ")}`);
      
      if (!hasShadcn) {
        spinner.warn("shadcn not configured. Cannot install components automatically.");
        console.log(chalk.yellow("  Tip: Run 'npx shadcn@latest init' to set up shadcn UI"));
        console.log(chalk.yellow("  Or install components manually:"));
        console.log(chalk.yellow(`  npx shadcn@latest add ${missingComponents.join(" ")}`));
      } else {
        const { installMissing } = await inquirer.prompt([
          {
            type: "confirm",
            name: "installMissing",
            message: `Would you like to install missing components from shadcn?`,
            default: true,
          },
        ]);

        if (installMissing) {
          spinner.start(`Installing components from shadcn: ${missingComponents.join(", ")}`);
          
          for (const component of missingComponents) {
            try {
              await installShadcnComponent(component, cwd);
            } catch (error) {
              spinner.warn(`Failed to install ${component}: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
          }
          
          spinner.succeed("Components installed from shadcn");
        } else {
          console.log(chalk.yellow("  Skipping component installation. You may need to install them manually."));
          console.log(chalk.yellow(`  Run: npx shadcn@latest add ${missingComponents.join(" ")}`));
        }
      }
    }

    // Check and install tiptap packages
    spinner.start("Checking TipTap packages...");
    const tiptapPackages = [
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/core",
    ];

    const missingTiptapPackages: string[] = [];
    for (const pkg of tiptapPackages) {
      const installed = await checkPackageInstalled(pkg, cwd);
      if (!installed) {
        missingTiptapPackages.push(pkg);
      }
    }

    if (missingTiptapPackages.length > 0) {
      spinner.warn(`Missing TipTap packages: ${missingTiptapPackages.join(", ")}`);
      spinner.start("Installing TipTap packages...");
      
      try {
        await installPackages(missingTiptapPackages, cwd);
        spinner.succeed("TipTap packages installed");
      } catch (error) {
        spinner.fail(`Failed to install TipTap packages: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.log(chalk.yellow("  You may need to install them manually:"));
        console.log(chalk.yellow(`  npm install ${missingTiptapPackages.join(" ")}`));
      }
    } else {
      spinner.succeed("TipTap packages already installed");
    }

    // Download template from GitHub
    spinner.start("Downloading template...");
    const template = await downloadTemplate(templateName);
    
    if (!template) {
      spinner.fail(`Template "${templateName}" not found`);
      process.exit(1);
    }

    spinner.succeed("Template downloaded");

    // Prompt for installation path only
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "installPath",
        message: "Where should the component be installed?",
        default: projectType === "nextjs" ? "components" : "src/components",
        validate: (input: string) => {
          if (!input.trim()) {
            return "Installation path is required";
          }
          return true;
        },
      },
    ]);

    // Install template with default base URL
    spinner.start("Installing template...");
    await installTemplate(template, answers.installPath, {
      apiBaseUrl: "ezzy.lexwilliam.dev",
    });

    spinner.succeed("Template installed successfully!");

    // Show next steps
    console.log("\n" + chalk.green("✓") + " Template installed!");
    console.log("\nNext steps:");
    console.log(`  1. Import and use the component in your project`);
    console.log(`  2. Pass the baseUrl and apiKey as props when using the component`);
    console.log(`\nExample usage:`);
    // Get the component filename from the template files
    const componentFile = template.files.find(f => f.path.endsWith('.tsx') || f.path.endsWith('.ts'));
    const componentName = componentFile 
      ? path.basename(componentFile.path, path.extname(componentFile.path))
      : "blog";
    const importPath = answers.installPath.startsWith('/') || answers.installPath.startsWith('./')
      ? answers.installPath
      : `@/${answers.installPath}`;
    console.log(`  import { BlogPage } from "${importPath}/${componentName}";`);
    console.log(`  <BlogPage blogId="your-blog-id" baseUrl="your-api-base-url" apiKey="your-api-key" />`);
  } catch (error) {
    spinner.fail("Failed to add template");
    console.error(chalk.red("\nError:"), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
