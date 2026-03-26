const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const puppeteer = require("puppeteer");

const admin = require("firebase-admin");
admin.initializeApp();
const databaseInst = admin.firestore();

const target = "div.mt-4.grid.grid-cols-2.gap-4 span.text-xl.font-bold.text-green-600, div.mt-4.grid.grid-cols-2.gap-4 span.text-xl.font-bold.text-red-600";

const runtimeOptions = {
  memory: "2GiB",
  timeoutSeconds: 300,
  region: "asia-southeast1",
};

exports.gold_value_task = onSchedule({
  schedule: "0 */1 * * *",
  timeZone: "Asia/Bangkok",
  ...runtimeOptions
}, async (event) => {
  let browser;
  try {
    logger.info("Starting Gold Price Scraping on Firebase...");

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.goto("https://goldtraders.or.th", { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector(target, { timeout: 30000 });

    const prices = await page.evaluate((selector) => {
      const elements = Array.from(document.querySelectorAll(selector));
      return elements.map(element => element.innerText.trim());
    }, target);

    if (prices.length !== 4) {
      logger.error(`Elements: ${prices.length}`);
      return;
    }

    const priceCurrent = prices.join("|");
    const lastEntry = await databaseInst.collection("gold_value").orderBy("createdAt", "desc").limit(1).get();
    let lastPrice = null;

    if (!lastEntry.empty) { lastPrice = lastEntry.docs[0].data().priceData; }

    if (lastPrice !== priceCurrent) {
      await databaseInst.collection("gold_value").add({
        priceData: priceCurrent,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`${priceCurrent} / Saved!`);
    } else {
      logger.info(`${priceCurrent} / Accepted!`);
    }
  } catch (error) {
    logger.error("Failed: ", error.message);
  } finally {
    if (browser) {
      await browser.close();
      logger.info("Finished!");
    }
  }
});

const broadcast = (priceCurrent) => {
  const prices = priceCurrent.split("|");
  return axios({
    method: "post",
    url: "https://api.line.me/v2/bot/message/broadcast",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer xxxxx",
    },
    data: JSON.stringify({
      messages: [{
        "type": "flex",
        "altText": "Flex Message",
        "contents": {
          "type": "bubble",
          "size": "giga",
          "body": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "8%",
            "backgroundColor": "#FFF9E2",
            "contents": [
              {
                "type": "text",
                "text": "ราคาทองคำ",
                "weight": "bold",
                "size": "xl",
                "align": "center",
              },
              {
                "type": "box",
                "layout": "vertical",
                "margin": "xxl",
                "spacing": "sm",
                "contents": [
                  {
                    "type": "box",
                    "layout": "baseline",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "ราคารับซื้อ",
                        "wrap": true,
                        "color": "#E2C05B",
                        "flex": 5,
                        "align": "end",
                      },
                      {
                        "type": "text",
                        "text": "ราคาขาย",
                        "flex": 2,
                        "color": "#E2C05B",
                        "align": "end",
                      },
                    ],
                  },
                  {
                    "type": "box",
                    "layout": "baseline",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "ทองคำแท่ง",
                        "flex": 3,
                      },
                      {
                        "type": "text",
                        "text": prices[0],
                        "wrap": true,
                        "size": "sm",
                        "flex": 2,
                        "align": "end",
                      },
                      {
                        "type": "text",
                        "text": prices[1],
                        "flex": 2,
                        "size": "sm",
                        "align": "end",
                      },
                    ],
                  },
                  {
                    "type": "separator",
                  },
                  {
                    "type": "box",
                    "layout": "baseline",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "ทองรูปพรรณ",
                        "flex": 3,
                      },
                      {
                        "type": "text",
                        "text": prices[2],
                        "wrap": true,
                        "size": "sm",
                        "flex": 2,
                        "align": "end",
                      },
                      {
                        "type": "text",
                        "text": prices[3],
                        "flex": 2,
                        "size": "sm",
                        "align": "end",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      }],
    }),
  });
};