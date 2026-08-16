import express from 'express';
import yahooFinance from 'yahoo-finance2';
import Stock from '../models/Stock.js';
import Watchlist from '../models/Watchlist.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/stocks
// @desc    Get all stocks in DB
// @access  Public
router.get('/', async (req, res) => {
  try {
    const stocks = await Stock.find({});
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/stocks
// @desc    Manually add a stock to DB
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { symbol, name, currentPrice } = req.body;
    let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
    if (stock) {
      return res.status(400).json({ message: 'Stock already exists' });
    }
    
    stock = await Stock.create({
      symbol: symbol.toUpperCase(),
      name,
      currentPrice,
      previousPrice: currentPrice // Initial previous price
    });
    res.status(201).json(stock);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/stocks/fetch
// @desc    Fetch and update stock data from Yahoo Finance
// @access  Public (could be protected)
router.post('/fetch', async (req, res) => {
  try {
    const stocks = await Stock.find({});
    const updatedStocks = [];
    
    for (let stock of stocks) {
      try {
        const quote = await yahooFinance.quote(stock.symbol);
        if (quote && quote.regularMarketPrice) {
          stock.previousPrice = stock.currentPrice;
          stock.currentPrice = quote.regularMarketPrice;
          if (quote.shortName || quote.longName) {
             stock.name = quote.shortName || quote.longName;
          }
          await stock.save();
          updatedStocks.push(stock);
        }
      } catch (err) {
        console.error(`Error fetching ${stock.symbol}:`, err.message);
      }
    }
    res.json({ message: 'Stocks updated successfully', updatedStocks });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stocks/watchlist
// @desc    Get user's watchlist
// @access  Private
router.get('/watchlist', protect, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ user: req.user._id }).populate('stocks');
    if (watchlist) {
      res.json(watchlist.stocks);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/stocks/watchlist/:symbol
// @desc    Add stock to watchlist
// @access  Private
router.post('/watchlist/:symbol', protect, async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found in DB. Add it first.' });
    }

    let watchlist = await Watchlist.findOne({ user: req.user._id });
    if (!watchlist) {
      watchlist = await Watchlist.create({ user: req.user._id, stocks: [stock._id] });
    } else {
      if (!watchlist.stocks.includes(stock._id)) {
        watchlist.stocks.push(stock._id);
        await watchlist.save();
      }
    }
    res.status(200).json(watchlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/stocks/watchlist/:symbol
// @desc    Remove stock from watchlist
// @access  Private
router.delete('/watchlist/:symbol', protect, async (req, res) => {
  try {
    const stock = await Stock.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    const watchlist = await Watchlist.findOne({ user: req.user._id });
    if (watchlist) {
      watchlist.stocks = watchlist.stocks.filter(
        (id) => id.toString() !== stock._id.toString()
      );
      await watchlist.save();
      res.json(watchlist);
    } else {
      res.status(404).json({ message: 'Watchlist not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
