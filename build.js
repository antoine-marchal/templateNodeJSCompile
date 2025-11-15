const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const pkg = require("./package.json");

// Values auto-extracted
const name = pkg.name;
const version = pkg.version;
const entry = pkg.main;

const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

// Output filenames
const outputCmd = `${name}-${version}.cmd`;

// --- RUN NCC ---
console.log(`Building ${outputCmd}...`);
execSync(`npx ncc build ${entry} -o ${distDir} -m`, { stdio: "inherit" });

// Read the compiled JS content
const compiledJsPath = path.join(distDir, "index.js");
const compiledJsContent = fs.readFileSync(compiledJsPath);

// Base64 encode using Node (no PowerShell needed)
const base64Content = compiledJsContent.toString("base64");

// Chunk the Base64 to avoid CMD line length limits (~8k chars)
// We'll be conservative and use 7000 chars per line.
const chunkSize = 7000;
const chunks = [];
for (let i = 0; i < base64Content.length; i += chunkSize) {
  chunks.push(base64Content.slice(i, i + chunkSize));
}

// --- Build the CMD file ---
// NOTE: use \r\n line endings so CMD is happy on Windows.
let cmdContent = [
  "@echo off",
  "setlocal EnableDelayedExpansion",
  "",
  'set "JS=%temp%\\embedded_index.js"',
  'set "B64=%temp%\\embedded_index.b64"',
  "",
  'del "%JS%" 2>nul',
  'del "%B64%" 2>nul',
  ""
].join("\r\n");

// Append commands that reconstruct the .b64 file
chunks.forEach(chunk => {
  // No characters in Base64 need escaping for ECHO
  cmdContent += `>>"%B64%" echo ${chunk}\r\n`;
});

cmdContent += [
  "",
  "rem Decode Base64 -> JS",
  "powershell -NoLogo -NoProfile -Command ^",
  '  "$b=[IO.File]::ReadAllText(\'%B64%\'); $o=[Convert]::FromBase64String($b); [IO.File]::WriteAllBytes(\'%JS%\', $o)"',
  "",
  'del "%B64%" 2>nul',
  "",
  'node "%JS%" %*',
  "exit /b",
  ""
].join("\r\n");

// Write the final single-file CMD
fs.writeFileSync(path.join(distDir, outputCmd), cmdContent, "utf8");

// Clean up the intermediate JS file
fs.unlinkSync(compiledJsPath);

console.log(`Generated:`);
console.log(`  dist/${outputCmd}`);
