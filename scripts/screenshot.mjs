import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const OUT = "d:/01- Projetos/looksy-mvp/scripts/screenshots";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

async function shot(url, name, wait = null) {
  console.log(`→ ${name}: ${url}`);
  await page.goto(url, { waitUntil: "networkidle" });
  if (wait) await page.waitForSelector(wait, { timeout: 15000 }).catch(() => {});
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false });
  console.log(`  ✓ salvo`);
}

// Home page
await shot("http://localhost:3000", "01-home", "text=Looksy");

// Login page
await shot("http://localhost:3000/auth/login", "02-login", "text=Entrar");

// Wardrobe (will redirect to login — that's fine for now)
await shot("http://localhost:3000/wardrobe", "03-wardrobe", null);

// Store page
await shot("http://localhost:3000/store", "04-store", null);

// Profile
await shot("http://localhost:3000/profile", "05-profile", null);

await browser.close();
console.log("\nScreenshots saved to:", OUT);
