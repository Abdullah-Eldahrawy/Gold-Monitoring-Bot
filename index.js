const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const DATA_FILE = "./lastData.json";
const PHONE = process.env.PHONE_NUMBER;
const API_KEY = process.env.API_KEY;

const ONE_GOLD_COIN_WIEGHT = 8;
const HALF_GOLD_COIN_WIEGHT = 4;
const QUARTER_GOLD_COIN_WIEGHT = 2;

// Step 1: Load old data
function loadLastData() {
  if (!fs.existsSync(DATA_FILE)) return null;
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

// Step 2: Save new data
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Step 3: Send WhatsApp alert using CallMeBot
async function sendWhatsApp(message) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${encodeURIComponent(
    message
  )}&apikey=${API_KEY}`;
  try {
    const response = await axios.get(url);
    console.log("WhatsApp sent:", response.data);
  } catch (err) {
    console.error("WhatsApp error:", err.message);
  }
}

// Step 4: Monitor function
async function monitor() {
  try {
    console.log("Checking data...");

    const goldPricePerGram = await scrapeFromElsagha();
    console.log("Gold price per gram:", goldPricePerGram);

    const currentData = {
      oneCoin: {
        display_name: "8g Coin",
        price: goldPricePerGram * ONE_GOLD_COIN_WIEGHT,
      },
      halfCoin: {
        display_name: "4g Coin",
        price: goldPricePerGram * HALF_GOLD_COIN_WIEGHT,
      },
      quarterCoin: {
        display_name: "2g Coin",
        price: goldPricePerGram * QUARTER_GOLD_COIN_WIEGHT,
      },
    };
    const lastData = loadLastData();
    priceDff = Math.abs(currentData.oneCoin.price - lastData?.oneCoin?.price) || 0;
    console.log("Price difference:", priceDff);

    // Define change logic: here, we detect change in `completed`
    if (!lastData || priceDff > 100) {
      console.log("Significant change detected");
      const isIncreased = currentData.oneCoin.price > (lastData?.oneCoin?.price || 0);
      await sendWhatsApp(
        `1 Gold Coin BTC Price changed from ${Math.trunc(
          lastData?.oneCoin?.price || 0
        )} to ${Math.trunc(currentData.oneCoin.price)} ${
          isIncreased ? "📈⬆️" : "📉⬇️"
        }.`
      );
      saveData(currentData);
    } else {
      console.log("No significant change detected.");
    }
  } catch (error) {
    console.error("Error fetching or processing data:", error.message);
  }
}

async function scrapeFromElsagha() {
  try {
    const res = await axios.get("https://market.isagha.com/prices");

    const $ = cheerio.load(res.data);

    // Only select tbody > tr inside the table with class `md-prices leading-normal`
    const rows = $("table.md-prices.leading-normal tbody tr");
    const price = Number(
      rows.find(".header-price-item").eq(0).text().trim().split(" ")[0] || 0
    );
    return price;
  } catch (err) {
    console.error("Error fetching or parsing data:", err.message);
  }
}

monitor();
