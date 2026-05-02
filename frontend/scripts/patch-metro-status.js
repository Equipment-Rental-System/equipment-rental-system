const fs = require("fs");
const path = require("path");

const targetFile = path.join(
  __dirname,
  "..",
  "node_modules",
  "@react-native-community",
  "cli-server-api",
  "build",
  "statusPageMiddleware.js"
);

const originalSnippet = "  res.setHeader('X-React-Native-Project-Root', process.cwd());";
const patchedSnippet = "  // Non-ASCII Windows paths can break header encoding in Node.\n  // Expo Go only needs the body content for its packager health check.\n  if (process.env.EXPO_INCLUDE_PROJECT_ROOT_HEADER === '1') {\n    res.setHeader('X-React-Native-Project-Root', process.cwd().replace(/[^\\x20-\\x7E]/g, '?'));\n  }";

function main() {
  if (!fs.existsSync(targetFile)) {
    console.log(`[patch-metro-status] skipped: ${targetFile} not found`);
    process.exit(0);
  }

  const source = fs.readFileSync(targetFile, "utf8");

  if (source.includes(patchedSnippet)) {
    console.log("[patch-metro-status] already patched");
    process.exit(0);
  }

  if (!source.includes(originalSnippet)) {
    console.log("[patch-metro-status] skipped: expected snippet not found");
    process.exit(0);
  }

  const nextSource = source.replace(originalSnippet, patchedSnippet);
  fs.writeFileSync(targetFile, nextSource, "utf8");
  console.log("[patch-metro-status] patched statusPageMiddleware.js");
}

main();
