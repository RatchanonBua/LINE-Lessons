require("dotenv").config();

const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const cron = require("node-cron");

const MONGO_URI = process.env.MONGODB_URI;
const TIMEZONE = process.env.TIMEZONE || "Asia/Bangkok";

const target = "div.mt-4.grid.grid-cols-2.gap-4 span.text-xl.font-bold.text-green-600, div.mt-4.grid.grid-cols-2.gap-4 span.text-xl.font-bold.text-red-600";

const goldValueSchema = new mongoose.Schema({
  priceData: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const GoldValue = mongoose.model("GoldValue", goldValueSchema, "gold_value");

async function scrapeGoldPrice() {
  let browser;
  try {
    if (mongoose.connection.readyState !== 1) {
      console.error("[Error] Database!");
      return;
    }

    console.log(`[${new Date().toLocaleString()}] Starting Puppeteer Scraping...`);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto("https://goldtraders.or.th", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(target, { timeout: 30000 });

    const prices = await page.evaluate((selector) => {
      const elements = Array.from(document.querySelectorAll(selector));
      return elements.map(element => element.innerText.trim());
    }, target);

    if (prices.length !== 4) {
      console.log(`Elements: ${prices.length}`);
      return;
    }

    const priceCurrent = prices.join("|");
    const lastEntry = await GoldValue.findOne().sort({ createdAt: -1 });
    let lastPrice = null;

    if (!!lastEntry) { lastPrice = lastEntry.priceData; }

    if (lastPrice !== priceCurrent) {
      const newGoldValue = new GoldValue({ priceData: priceCurrent });
      await newGoldValue.save();
      console.log(`${priceCurrent} / Saved!`);
    } else {
      console.log(`${priceCurrent} / Accepted!`)
    }
  } catch (error) {
    console.error("Failed: ", error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log("Finished!");
    }
  }
}

mongoose.connect(MONGO_URI).then(() => {
  console.log(`Connected to MongoDB at ${MONGO_URI}`);
  scrapeGoldPrice();

  cron.schedule("0 */1 * * *", () => {
    scrapeGoldPrice();
  }, { timezone: TIMEZONE });
}).catch(error => {
  console.error("Error Connecting to MongoDB: ", error);
  process.exit(1);
});