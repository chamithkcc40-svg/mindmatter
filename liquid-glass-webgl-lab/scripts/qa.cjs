/* Visual QA harness: serves dist/, loads the page headless, screenshots, captures console. */
const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");
const ONLY = process.argv[2] || "";

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(DIST, req.url === "/" ? "index.html" : req.url.split("?")[0]);
      fs.readFile(p, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("nf");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      });
    });
    server.listen(4517, () => resolve(server));
  });
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch({
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[error] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));

  await page.goto("http://localhost:4517/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);

  const shot = (name) => page.screenshot({ path: `shots/${name}.png` });

  if (!ONLY || ONLY === "hero") await shot("hero-dark");

  if (!ONLY || ONLY === "exp") {
    await page.getByText("Optical Experiments").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1400);
    await shot("experiments");
  }

  if (!ONLY || ONLY === "light") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    // environment: light
    await page.getByRole("button", { name: "LIGHT", exact: true }).click();
    await page.waitForTimeout(1200);
    await shot("hero-light");
  }

  if (!ONLY || ONLY === "off") {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole("button", { name: "OFF", exact: true }).click();
    await page.waitForTimeout(800);
    await shot("refraction-off");
    await page.getByRole("button", { name: "SPLIT", exact: true }).click();
    await page.waitForTimeout(800);
    await shot("refraction-split");
    await page.getByRole("button", { name: "ON", exact: true }).click();
  }

  if (!ONLY || ONLY === "presets") {
    for (const p of ["FROSTED GLASS", "SMOKED GLASS", "OPTICAL LENS"]) {
      await page.getByRole("button", { name: p, exact: true }).click();
      await page.waitForTimeout(900);
      await shot(`preset-${p.split(" ")[0].toLowerCase()}`);
    }
    await page.getByRole("button", { name: "LIQUID GLASS", exact: true }).click();
  }

  if (!ONLY || ONLY === "envs") {
    for (const [btn, name] of [["GRID", "geometric"], ["HUE", "abstract"]]) {
      await page.getByRole("button", { name: btn, exact: true }).first().click();
      await page.waitForTimeout(900);
      await shot(`env-${name}`);
    }
    await page.getByRole("button", { name: "DARK", exact: true }).first().click();
  }

  if (!ONLY || ONLY === "slider") {
    // prove controls drive the renderer: max out refraction strength + thickness
    const s = page.getByRole("slider", { name: "Refraction strength" }).first();
    await s.focus();
    await s.press("End");
    const t = page.getByRole("slider", { name: "Apparent thickness" }).first();
    await t.focus();
    await t.press("End");
    await page.waitForTimeout(900);
    await shot("slider-max");
  }

  if (!ONLY || ONLY === "mobile") {
    const mp = await browser.newPage({ viewport: { width: 390, height: 844 } });
    mp.on("pageerror", (err) => errors.push(`[mobile pageerror] ${err.message}`));
    await mp.goto("http://localhost:4517/", { waitUntil: "networkidle" });
    await mp.waitForTimeout(1800);
    await mp.screenshot({ path: "shots/mobile.png" });
    await mp.close();
  }

  console.log("--- console errors ---");
  console.log(errors.length ? errors.slice(0, 20).join("\n") : "(none)");

  await browser.close();
  server.close();
})().catch((e) => {
  console.error("QA failed:", e);
  process.exit(1);
});
