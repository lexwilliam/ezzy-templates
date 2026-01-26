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

    // Prompt user about existing components
    if (existingComponents.length > 0) {
      console.log("\n" + chalk.green("✓") + ` Found existing components: ${existingComponents.join(", ")}`);
      
      const componentAnswers = await inquirer.prompt(
        existingComponents.map((component) => ({
          type: "confirm",
          name: `use_${component}`,
          message: `Use existing ${component} component?`,
          default: true,
        }))
      );

      // Add components user declined to missing list
      for (const component of existingComponents) {
        const key = `use_${component}` as keyof typeof componentAnswers;
        if (!componentAnswers[key]) {
          missingComponents.push(component);
        }
      }
    }

    // Install missing shadcn components
    if (missingComponents.length > 0) {
      if (!hasShadcn) {
        spinner.warn("shadcn not configured. Skipping component installation.");
        console.log(chalk.yellow("  Tip: Run 'npx shadcn@latest init' to set up shadcn UI"));
      } else {
        spinner.start(`Installing missing components: ${missingComponents.join(", ")}`);
        
        for (const component of missingComponents) {
          try {
            await installShadcnComponent(component, cwd);
          } catch (error) {
            spinner.warn(`Failed to install ${component}: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
        
        spinner.succeed("Components installed");
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

    // Prompt for installation options
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
      {
        type: "input",
        name: "apiBaseUrl",
        message: "What is your internal API base URL?",
        default: process.env.EZZY_API_BASE_URL || "",
        validate: (input: string) => {
          if (!input.trim()) {
            return "API base URL is required";
          }
          try {
            new URL(input);
            return true;
          } catch {
            return "Please enter a valid URL";
          }
        },
      },
      {
        type: "input",
        name: "apiKey",
        message: "What is your API key? (optional, can be set via env var)",
        default: process.env.EZZY_API_KEY || "",
      },
    ]);

    // Install template
    spinner.start("Installing template...");
    await installTemplate(template, answers.installPath, {
      apiBaseUrl: answers.apiBaseUrl,
      apiKey: answers.apiKey,
    });

    spinner.succeed("Template installed successfully!");

    // Show next steps
    console.log("\n" + chalk.green("✓") + " Template installed!");
    console.log("\nNext steps:");
    console.log(`  1. Import and use the component in your project`);
    console.log(`  2. Set environment variables if needed:`);
    if (answers.apiKey) {
      console.log(`     EZZY_API_KEY=${answers.apiKey}`);
    }
    console.log(`     EZZY_API_BASE_URL=${answers.apiBaseUrl}`);
    console.log(`\nExample usage:`);
    console.log(`  import { BlogPage } from "@/components/ezzy-template";`);
    console.log(`  <BlogPage blogId="your-blog-id" />`);
  } catch (error) {
    spinner.fail("Failed to add template");
    console.error(chalk.red("\nError:"), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
