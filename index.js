#!/usr/bin/env node

const { chromium } = require('playwright-core');

async function main() {
  const city = process.argv[2] || "Biganos";

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true
  });

  const page = await browser.newPage();

  // wttr.in JSON output: no captcha, clean, fast
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
  await page.goto(url);

  // Read raw JSON directly from the page
  const raw = await page.evaluate(() => document.body.textContent);

  const data = JSON.parse(raw);

  const current = data.current_condition?.[0];
  const temp = current?.temp_C;
  const condition = current?.weatherDesc?.[0]?.value;

  console.log(`Weather in ${city}: ${temp}°C, ${condition}`);

  await browser.close();
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
