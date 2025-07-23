#!/usr/bin/env node

import fs from "fs";
import path from "path";
import chalk from "chalk";
import os from "os";
import { execSync } from "child_process";

// === CLI flags ===
const forceOverwrite = process.argv.includes("--force");

// === Helpers ===
const projectRoot = process.cwd();
const projectName = path.basename(projectRoot);
const packageJsonPath = path.join(projectRoot, "package.json");
const readmePath = path.join(projectRoot, "README.md");

// === Check if README already exists ===
if (fs.existsSync(readmePath) && !forceOverwrite) {
  console.log(chalk.red("⚠ README.md already exists. Use --force to overwrite."));
  process.exit(1);
}

// === Read Package.json ===
let dependencies = [], devDependencies = [], scripts = {};
let author = "Unknown", license = "UNLICENSED", description = "";
let repoUrl = "", nodeVersion = "", lastUpdated = "";

if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  dependencies = Object.keys(pkg.dependencies || {});
  devDependencies = Object.keys(pkg.devDependencies || {});
  scripts = pkg.scripts || {};
  author = pkg.author || author;
  license = pkg.license || license;
  description = pkg.description || "";
  repoUrl = typeof pkg.repository === "string"
    ? pkg.repository
    : pkg.repository?.url || "";
}

// === Get Node Version ===
try {
  nodeVersion = process.version;
} catch (err) {
  nodeVersion = "Unknown";
}

// === Last updated ===
lastUpdated = new Date().toISOString().split("T")[0];

// === Folder Structure ===
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

// === Detect common config files ===
const configFiles = [".env", ".gitignore", ".eslintrc", ".prettierrc", "tsconfig.json"]
  .filter(file => fs.existsSync(path.join(projectRoot, file)));

// === Detect frameworks ===
function detectFrameworks() {
  const allDeps = [...dependencies, ...devDependencies].map(d => d.toLowerCase());
  const known = [
    { name: "React", keyword: "react" },
    { name: "Next.js", keyword: "next" },
    { name: "Express", keyword: "express" },
    { name: "Tailwind CSS", keyword: "tailwind" },
    { name: "TypeScript", keyword: "typescript" },
    { name: "Redux", keyword: "redux" },
    { name: "Mongoose", keyword: "mongoose" },
  ];
  return known.filter(({ keyword }) => allDeps.includes(keyword)).map(f => `- ${f.name}`);
}
const frameworks = detectFrameworks();

// === Scripts with explanations ===
const scriptDescriptions = {
  dev: "Start the app in development mode",
  build: "Build the app for production",
  start: "Start the production server",
  lint: "Lint the codebase",
  test: "Run tests",
};
const scriptLines = Object.entries(scripts).map(
  ([key, val]) => `- \`${key}\`: ${val} ${scriptDescriptions[key] ? `→ ${scriptDescriptions[key]}` : ""}`
);

// === Template ===
const readme = `# ${projectName}

![Node Version](https://img.shields.io/badge/node-${nodeVersion}-green)
![License](https://img.shields.io/badge/license-${license}-blue)
![Updated](https://img.shields.io/badge/last_updated-${lastUpdated}-orange)

${description ? `> ${description}` : ""}

${repoUrl ? `📦 Repo: ${repoUrl.replace(/^git\+/, "")}\n` : ""}

## 🔧 Frameworks / Tools Detected
${frameworks.length ? frameworks.join("\n") : "- None detected"}

## ⚙️ Config Files
${configFiles.length ? configFiles.map(f => `- ${f}`).join("\n") : "- None"}

## 📦 Dependencies
${dependencies.length ? dependencies.map(dep => `- ${dep}`).join("\n") : "- No dependencies"}

## 🧪 Dev Dependencies
${devDependencies.length ? devDependencies.map(dep => `- ${dep}`).join("\n") : "- No dev dependencies"}

## 📁 Folder Structure
\`\`\`
${folderStructure}
\`\`\`

## 📜 Scripts
${scriptLines.length ? scriptLines.join("\n") : "- No scripts"}

## 👤 Author
- ${author}

## 📝 License
- ${license}
`;

fs.writeFileSync(readmePath, readme, "utf-8");
console.log(chalk.green("✅ README.md generated successfully!"));
