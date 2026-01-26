#!/usr/bin/env node

import { Command } from "commander";
import { addCommand } from "./commands/add.js";

const program = new Command();

program
  .name("ezzy-templates")
  .description("CLI tool to add internal blog components to your project")
  .version("1.0.0");

program
  .command("add")
  .description("Add a template component to your project")
  .argument("<template>", "Template name to add (e.g., blog)")
  .action(async (template: string) => {
    await addCommand(template);
  });

program.parse();
