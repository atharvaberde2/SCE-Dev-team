const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.FINNHUB_API_KEY;

// In-memory storage
const stockHistory = {};
const intervals = {};

/**
 * Helper function to fetch stock data from Finnhub
 */
async function fetchStockData(symbol) {
  const response = await axios.get(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
  );

  const data = response.data;

  return {
    openPrice: data.o,
    highPrice: data.h,
    lowPrice: data.l,
    currentPrice: data.c,
    previousClosePrice: data.pc,
    time: new Date().toISOString(),
  };
}

/**
 * Start Monitoring Endpoint
 */
app.post("/start-monitoring", async (req, res) => {
  const { symbol, minutes, seconds } = req.body;

  if (
    !symbol ||
    typeof symbol !== "string" ||
    minutes < 0 ||
    seconds < 0
  ) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const intervalTime = (minutes * 60 + seconds) * 1000;

  if (intervalTime <= 0) {
    return res.status(400).json({ error: "Interval must be > 0" });
  }

  if (!stockHistory[symbol]) {
    stockHistory[symbol] = [];
  }

  // Clear previous interval if exists
  if (intervals[symbol]) {
    clearInterval(intervals[symbol]);
  }

  // Start interval job
  intervals[symbol] = setInterval(async () => {
    try {
      const stockData = await fetchStockData(symbol);
      stockHistory[symbol].push(stockData);
      console.log(`Fetched data for ${symbol}`);
    } catch (err) {
      console.error("Error fetching stock:", err.message);
    }
  }, intervalTime);

  res.json({ message: `Monitoring started for ${symbol}` });
});

/**
 * Get Stock History
 */
app.get("/history", (req, res) => {
  const { symbol } = req.query;

  if (!symbol || !stockHistory[symbol]) {
    return res.status(404).json({ error: "No history found" });
  }

  res.json(stockHistory[symbol]);
});

/**
 * Immediate Refresh (Bonus)
 */
app.post("/refresh", async (req, res) => {
  const { symbol } = req.body;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol required" });
  }

  try {
    const stockData = await fetchStockData(symbol);

    if (!stockHistory[symbol]) {
      stockHistory[symbol] = [];
    }

    stockHistory[symbol].push(stockData);

    res.json(stockData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock data" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
