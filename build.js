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
const outputJs = `${name}-${version}.js`;    
const outputCmd = `${name}-${version}.cmd`; 

// --- RUN NCC ---
console.log(`Building ${outputJs}...`);
execSync(`ncc build ${entry} -o ${distDir} -m`, { stdio: "inherit" });

// Rename index.js → name-version.js
fs.renameSync(
  path.join(distDir, "index.js"),
  path.join(distDir, outputJs)
);

// --- Windows CMD ---
const cmdContent =
`@echo off
node "%~dp0${outputJs}" %*
`;

fs.writeFileSync(path.join(distDir, outputCmd), cmdContent);

console.log(`Generated:`);
console.log(`  dist/${outputJs}`);
console.log(`  dist/${outputCmd}`);
