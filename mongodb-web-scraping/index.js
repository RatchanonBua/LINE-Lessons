require("dotenv").config();

const puppeteer = require("puppeteer");
const cron = require("node-cron");
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI;
mongoose.connect(MONGO_URI).then(() => {
  console.log("Connected to MongoDB");
}).catch(error => {
  console.error("Error Connecting to MongoDB", error);
});

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

const target = "div.mt-4.grid.grid-cols-2.gap-4 span.text-xl.font-bold.text-green-600";

async function scrapeGoldPrice() {
  let browser;
  try {
    console.log(`[${new Date().toLocaleString()}] Starting Puppeteer Scraping...`);

    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto("https://goldtraders.or.th", { waitUntil: "networkidle2" });
    await page.waitForSelector(target);

    const prices = await page.evaluate((selector) => {
      const elements = Array.from(document.querySelectorAll(selector));
      return elements.map(element => element.innerText.trim());
    }, target);

    const priceCurrent = prices.join("|");
    console.log("Current prices: ", priceCurrent);

    if (prices.length !== 4) {
      console.log(`Expected 4 price elements but found ${prices.length}`);
      return;
    }

    const lastEntry = await GoldValue.findOne().sort({ createdAt: -1 });
    if (!lastEntry || lastEntry.priceData !== priceCurrent) {
      const newGoldValue = new GoldValue({ priceData: priceCurrent });
      await newGoldValue.save();
      console.log("Saved to collection!");
    }
  } catch (error) {
    console.error("Scraping task failed: ", error.message);
  } finally {
    if (browser) { await browser.close(); }
  }
}

cron.schedule("0 */1 * * *", () => { scrapeGoldPrice(); }, { timezone: process.env.TIMEZONE || "Asia/Bangkok" });

scrapeGoldPrice();