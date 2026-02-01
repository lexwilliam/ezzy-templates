import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import ora from "ora";
import { downloadTemplate } from "../utils/download.js";
import { installTemplate, createBlogDetailPage, createBlogListPage } from "../utils/install.js";
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

    // Check and install required packages
    spinner.start("Checking required packages...");
    const requiredPackages = [
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/core",
      "date-fns",
    ];

    const missingPackages: string[] = [];
    for (const pkg of requiredPackages) {
      const installed = await checkPackageInstalled(pkg, cwd);
      if (!installed) {
        missingPackages.push(pkg);
      }
    }

    if (missingPackages.length > 0) {
      spinner.warn(`Missing packages: ${missingPackages.join(", ")}`);
      spinner.start("Installing packages...");
      
      try {
        await installPackages(missingPackages, cwd);
        spinner.succeed("Packages installed");
      } catch (error) {
        spinner.fail(`Failed to install packages: ${error instanceof Error ? error.message : "Unknown error"}`);
        console.log(chalk.yellow("  You may need to install them manually:"));
        console.log(chalk.yellow(`  npm install ${missingPackages.join(" ")}`));
      }
    } else {
      spinner.succeed("Required packages already installed");
    }

    // Download template from GitHub
    spinner.start("Downloading template...");
    const template = await downloadTemplate(templateName);
    
    if (!template) {
      spinner.fail(`Template "${templateName}" not found`);
      process.exit(1);
    }

    spinner.succeed("Template downloaded");

    // Prompt for installation path and blog pages creation
    const questions: any[] = [
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
    ];

    if (projectType === "nextjs") {
      questions.push({
        type: "confirm",
        name: "createBlogPages",
        message: "Would you like to create blog pages (/blog and /blog/[id])?",
        default: true,
      });
    }

    const answers = await inquirer.prompt(questions);

    // Install template with default base URL
    spinner.start("Installing template...");
    await installTemplate(template, answers.installPath, {
      apiBaseUrl: "ezzy.lexwilliam.dev",
    });

    spinner.succeed("Template installed successfully!");

    // Create blog pages if requested
    if (projectType === "nextjs" && answers.createBlogPages) {
      // Get the component filename from the template files
      const componentFile = template.files.find(f => f.path.endsWith('.tsx') || f.path.endsWith('.ts'));
      const componentFileName = componentFile 
        ? path.basename(componentFile.path, path.extname(componentFile.path))
        : "blog";
      
      // Create blog list page
      spinner.start("Creating blog list page...");
      try {
        await createBlogListPage(
          answers.installPath,
          componentFileName,
          "EzzyBlogList",
          {
            apiBaseUrl: "ezzy.lexwilliam.dev",
          }
        );
        spinner.succeed("Blog list page created at /blog");
      } catch (error) {
        spinner.warn(
          `Failed to create blog list page: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        console.log(
          chalk.yellow(
            "  You can create it manually by adding a page at app/blog/page.tsx or pages/blog/index.tsx"
          )
        );
      }

      // Create blog detail page
      spinner.start("Creating blog detail page...");
      try {
        await createBlogDetailPage(
          answers.installPath,
          componentFileName,
          "EzzyBlogPage",
          {
            apiBaseUrl: "ezzy.lexwilliam.dev",
          }
        );
        spinner.succeed("Blog detail page created at /blog/[id]");
      } catch (error) {
        spinner.warn(
          `Failed to create blog detail page: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        console.log(
          chalk.yellow(
            "  You can create it manually by adding a page at app/blog/[id]/page.tsx or pages/blog/[id]/index.tsx"
          )
        );
      }
    }

    // Show next steps
    console.log("\n" + chalk.green("✓") + " Template installed!");
    console.log("\nNext steps:");
    
    if (projectType === "nextjs" && answers.createBlogPages) {
      console.log(`  1. The blog list page has been created at /blog`);
      console.log(`  2. The blog detail page has been created at /blog/[id]`);
      console.log(`  3. You can now navigate to /blog to see all blogs and /blog/your-blog-id to view a specific post`);
      console.log(`  4. Make sure to set EZZY_API_KEY in your .env.local file if you haven't already`);
      console.log(`  5. Note: The /api/v1/blogs endpoint should support listing all blogs (without blogId parameter)`);
    } else {
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
      console.log(`  import { EzzyBlogList, EzzyBlogPage } from "${importPath}/${componentName}";`);
      console.log(`  <EzzyBlogList apiBaseUrl="your-api-base-url" apiKey="your-api-key" />`);
      console.log(`  <EzzyBlogPage blogId="your-blog-id" apiBaseUrl="your-api-base-url" apiKey="your-api-key" />`);
    }
  } catch (error) {
    spinner.fail("Failed to add template");
    console.error(chalk.red("\nError:"), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
