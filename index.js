#!/usr/bin/env node

import fs from "fs";
import path from "path";
import chalk from "chalk";


// Get current project directory
const projectRoot = process.cwd();
const projectName = path.basename(projectRoot);

// Read package.json
const packageJsonPath = path.join(projectRoot, "package.json");

let dependencies = [];
let devDependencies = [];
let scripts = {};
let author = "Unknown";
let license = "UNLICENSED";

if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  dependencies = Object.keys(pkg.dependencies || {});
  devDependencies = Object.keys(pkg.devDependencies || {});
  scripts = pkg.scripts || {};
  author = pkg.author || author;
  license = pkg.license || license;
} else {
  console.warn(chalk.yellow("⚠ No package.json found! Skipping dependencies and scripts."));
}

// Generate folder structure
function getFolderTree(dir, depth = 0) {
  const indent = "  ".repeat(depth);
  const items = fs.readdirSync(dir);
  return items
    .filter((item) => !item.startsWith(".") && item !== "node_modules")
    .map((item) => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        return `${indent}- ${item}/\n${getFolderTree(fullPath, depth + 1)}`;
      } else {
        return `${indent}- ${item}`;
      }
    })
    .join("\n");
}

const folderStructure = getFolderTree(projectRoot);

// Template
const readme = `# ${projectName}

## 📦 Technologies Used
${[...dependencies, ...devDependencies].map((dep) => `- ${dep}`).join("\n") || "- No dependencies found"}

## 📁 Folder Structure
\`\`\`
${folderStructure}
\`\`\`

## 📜 Scripts
${Object.entries(scripts).map(([key, val]) => `- \`${key}\`: ${val}`).join("\n") || "- No scripts found"}

## 👤 Author
- ${author}

## 📝 License
- ${license}
`;

// Write to README.md
const readmePath = path.join(projectRoot, "README.md");
fs.writeFileSync(readmePath, readme, "utf-8");

console.log(chalk.green("✅ README.md generated successfully!"));
