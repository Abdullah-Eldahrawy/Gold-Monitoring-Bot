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

    // Replace with your actual API
    const oneCoin = await axios.post(
      "https://shop.btcegyptgold.com/website_sale/get_combination_info",
      requestBodyForOneCoin,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = oneCoin.data.result;
    const currentData = {
      product_id: data.product_id,
      product_template_id: data.product_template_id,
      display_name: data.display_name,
      price: data.price,
    };
    const lastData = loadLastData();
    priceDff = Math.abs(currentData.price - lastData?.price) || 0;

    // Define change logic: here, we detect change in `completed`
    if (!lastData || priceDff > 100) {
      console.log("Significant change detected")  
      const isIncreased = currentData.price > (lastData?.price || 0);
      await sendWhatsApp(
        `1 Gold Coin BTC Price changed from ${Math.trunc(lastData?.price || 0)} to ${
          Math.trunc(currentData.price)
        } ${isIncreased ? "📈⬆️" : "📉⬇️"}.`
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
