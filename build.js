const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const zlib = require("zlib");

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

// Read the compiled JS content as raw bytes
const compiledJsPath = path.join(distDir, "index.js");
const compiledJsContent = fs.readFileSync(compiledJsPath);

// Compress the JS using gzip
const compressed = zlib.gzipSync(compiledJsContent);

// We’ll emit the *compressed* bytes as hex
const byteArray = Array.from(compressed);

// --- Build the CMD file ---
// Self-extracting CMD:
//  - reads hex-compressed data after :__BIN__ from %~f0
//  - converts to bytes
//  - decompresses with GzipStream
//  - writes %temp%\embedded_index.js
//  - runs node on it

let cmdContent = [
  "@echo off",
  "setlocal",
  "",
  'set "JS=%temp%\\embedded_index.js"',
  "",
  'del "%JS%" 2>nul',
  "",
  'powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$out = \'%JS%\'; $bytes = New-Object System.Collections.Generic.List[byte]; $reading = $false; Get-Content -LiteralPath \'%~f0\' | ForEach-Object { if ($_ -eq \':__BIN__\') { $reading = $true; return } if (-not $reading) { return } if ($_ -eq \':__END__\') { $reading = $false; return } $line = $_.Trim(); if ($line.Length -eq 0) { return } for ($i = 0; $i -lt $line.Length; $i += 2) { $hex = $line.Substring($i, 2); [void]$bytes.Add([Convert]::ToByte($hex, 16)) } }; $data = $bytes.ToArray(); $msIn = New-Object System.IO.MemoryStream(,$data); $gzip = New-Object System.IO.Compression.GzipStream($msIn, [System.IO.Compression.CompressionMode]::Decompress); $fsOut = [System.IO.File]::Create($out); $gzip.CopyTo($fsOut); $gzip.Dispose(); $fsOut.Dispose();"',
  "if errorlevel 1 (",
  "  echo Failed to reconstruct JS.",
  "  exit /b 1",
  ")",
  "",
  'node "%JS%" %*',
  "exit /b",
  "",
  ":__BIN__"
].join("\r\n");

// Append the hex-compressed data after :__BIN__
// Each line is a continuous hex string (no separators).
const bytesPerLine = 2000; // 2000 bytes -> 4000 hex chars per line

for (let i = 0; i < byteArray.length; i += bytesPerLine) {
  const slice = byteArray.slice(i, i + bytesPerLine);
  const line = slice
    .map(b => b.toString(16).padStart(2, "0")) // 2-digit hex
    .join(""); // "1f8b0800..."
  cmdContent += "\r\n" + line;
}

// End marker
cmdContent += "\r\n:__END__\r\n";

// Write the final single-file CMD
fs.writeFileSync(path.join(distDir, outputCmd), cmdContent, "utf8");

// Clean up the intermediate JS file
fs.unlinkSync(compiledJsPath);

console.log(`Generated:`);
console.log(`  dist/${outputCmd}`);
