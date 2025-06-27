const fs = require("fs");
const axios = require("axios");

const DATA_FILE = "./lastData.json";
const PHONE = process.env.PHONE_NUMBER; // Replace with your WhatsApp number
const API_KEY = process.env.API_KEY; // From CallMeBot

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

    const requestBodyForOneCoin = {
      id: 0,
      jsonrpc: "2.0",
      method: "call",
      params: {
        product_template_id: 340,
        product_id: 1410,
        combination: [],
        add_qty: 1,
        parent_combination: [],
      },
    };

    const requestBodyForHalfCoin = {
      id: 0,
      jsonrpc: "2.0",
      method: "call",
      params: {
        product_template_id: 329,
        product_id: 1200,
        combination: [],
        add_qty: 1,
        parent_combination: [],
      },
    };

    const oneCoin = await axios.post(
      "https://shop.btcegyptgold.com/website_sale/get_combination_info",
      requestBodyForOneCoin,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const halfCoin = await axios.post(
      "https://shop.btcegyptgold.com/website_sale/get_combination_info",
      requestBodyForHalfCoin,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const OneCoindata = oneCoin.data.result;
    const currentData = {
      oneCoin: {
        product_id: OneCoindata.product_id,
        product_template_id: OneCoindata.product_template_id,
        display_name: OneCoindata.display_name,
        price: OneCoindata.price,
      },
    };
    const lastData = loadLastData();
    priceDff = Math.abs(currentData.oneCoin.price - lastData?.oneCoin?.price) || 0;

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

monitor();
