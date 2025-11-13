# Node.js CLI Compilation Template

A template for compiling Node.js CLI applications into single executables using [ncc](https://github.com/vercel/ncc). The example included is a simple CLI tool to append content to a file.

## Installation

```bash
npm install
```

## Example Usage

The included example is a CLI tool to append content to a file. Run it with:

```bash
node index.js -f filename.txt -c "Content to append"
```

Or without content to be prompted:

```bash
node index.js -f filename.txt
```

## Using This Template

1. Replace `index.js` with your Node.js CLI script
2. Update `package.json` with your project details
3. Run `npm run compile` to build your executable

## Building

To compile into a single executable:

```bash
npm run compile
```

This creates `dist/cli-appender-1.0.0.js` and `dist/cli-appender-1.0.0.cmd`.

## License

MIT