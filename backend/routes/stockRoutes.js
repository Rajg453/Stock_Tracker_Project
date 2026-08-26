import express from 'express';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
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

// @route   GET /api/stocks/watchlist/risk
// @desc    Calculate portfolio concentration risk using AI embeddings
// @access  Private
router.get('/watchlist/risk', protect, async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ user: req.user._id }).populate('stocks');
    if (!watchlist || watchlist.stocks.length < 2) {
      return res.json({ riskLevel: 'Low', message: 'Add at least 2 stocks to analyze your portfolio risk.' });
    }

    const symbols = watchlist.stocks.map(s => s.symbol);
    const industries = [];
    
    // Fetch industry context for each stock
    for (let symbol of symbols) {
      try {
        const quote = await yahooFinance.quoteSummary(symbol, { modules: ['assetProfile'] });
        const industry = quote.assetProfile?.industry || "Unknown Business";
        industries.push(`${symbol} operates in ${industry}`);
      } catch (err) {
        industries.push(`${symbol} operates in Unknown Business`);
      }
    }

    // Call Hugging Face Feature Extraction API to get Vector Embeddings
    const HF_TOKEN = process.env.HF_TOKEN;
    const modelId = "sentence-transformers/all-MiniLM-L6-v2";
    const url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${modelId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: industries }),
    });

    if (!response.ok) {
       return res.json({ riskLevel: 'Unknown', message: 'AI model is warming up...' });
    }

    const embeddings = await response.json();

    // Helper function to calculate Cosine Similarity between two vectors
    const cosineSimilarity = (vecA, vecB) => {
      let dotProduct = 0, normA = 0, normB = 0;
      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    // Calculate average similarity across all pairs of stocks
    let totalSim = 0;
    let pairs = 0;
    for (let i = 0; i < embeddings.length; i++) {
      for (let j = i + 1; j < embeddings.length; j++) {
        totalSim += cosineSimilarity(embeddings[i], embeddings[j]);
        pairs++;
      }
    }
    
    const avgSim = pairs > 0 ? (totalSim / pairs) : 0;
    
    let riskLevel = "Low";
    let message = "Your portfolio is well diversified!";
    
    if (avgSim > 0.6) {
      riskLevel = "High";
      message = "High concentration risk! Your stocks are in very similar industries. Consider diversifying.";
    } else if (avgSim > 0.3) {
      riskLevel = "Medium";
      message = "Moderate concentration. You have some overlap in industries.";
    }

    res.json({ riskLevel, message, score: (avgSim * 100).toFixed(0) });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating risk', error: error.message });
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

// @route   GET /api/stocks/news/:symbol
// @desc    Get news for a specific stock and analyze sentiment
// @access  Public
router.get('/news/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    
    // 1. Fetch the latest news from Yahoo Finance as we did before.
    const result = await yahooFinance.search(symbol, { newsCount: 5 });
    let newsList = result.news || [];

    // 2. We prepare to use the Hugging Face AI Sentiment model.
    // This model is specifically trained to read text and return POSITIVE or NEGATIVE.
    const HF_TOKEN = process.env.HF_TOKEN;
    const modelId = "distilbert-base-uncased-finetuned-sst-2-english";
    const url = `https://api-inference.huggingface.co/models/${modelId}`;

    // 3. We loop through every news article we just got from Yahoo Finance.
    // We use Promise.all to analyze all 5 articles at the same time (faster!).
    const enrichedNews = await Promise.all(newsList.map(async (article) => {
      try {
        // 4. We send the title of the article to the AI model.
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: article.title }),
        });

        // 5. If the AI responds successfully, we extract its prediction.
        if (response.ok) {
          const aiResult = await response.json();
          // The AI returns an array of arrays, we want the first prediction's label.
          if (Array.isArray(aiResult) && aiResult.length > 0 && Array.isArray(aiResult[0])) {
            // Sort by highest confidence score to get the most likely sentiment
            const topPrediction = aiResult[0].sort((a, b) => b.score - a.score)[0];
            // 6. We add a new property "aiSentiment" to the article (e.g., "POSITIVE")
            article.aiSentiment = topPrediction.label;
          }
        }
      } catch (err) {
        // If the AI fails for one article, we just log it and continue without crashing.
        console.error("Error analyzing sentiment for article:", err);
      }
      return article; // Return the article (now with the aiSentiment attached if successful)
    }));

    // 7. Finally, send the enriched news list to the frontend!
    res.json(enrichedNews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching news', error: error.message });
  }
});

// @route   GET /api/stocks/:symbol/history
// @desc    Get historical data for chart
// @access  Public
router.get('/:symbol/history', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    // Fetch last 30 days of data
    const queryOptions = { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }; 
    const result = await yahooFinance.chart(symbol, queryOptions);
    res.json(result.quotes || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching history', error: error.message });
  }
});

// @route   GET /api/stocks/:symbol/earnings
// @desc    Get an earnings summary for a specific stock
// @access  Public
router.get('/:symbol/earnings', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    // Best Practice Note: In a real production environment, you would fetch official transcripts from a financial API (like FMP or AlphaVantage).
    // For this implementation, we simulate it by searching for recent earnings news and having the AI summarize those key points.
    const result = await yahooFinance.search(`${symbol} earnings report`, { newsCount: 3 });
    const newsList = result.news || [];
    
    if (newsList.length === 0) {
      return res.json({ summary: "No recent earnings information could be found for this stock." });
    }

    // Combine titles to create a comprehensive text block for the AI to summarize
    const textToSummarize = newsList.map(n => `${n.title}.`).join(" ");

    // Integration with Hugging Face's BART model for text summarization
    const HF_TOKEN = process.env.HF_TOKEN;
    const modelId = "facebook/bart-large-cnn";
    const url = `https://api-inference.huggingface.co/models/${modelId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        inputs: textToSummarize,
        // We can pass parameters to the model to control the output length
        parameters: { max_length: 130, min_length: 30 } 
      }),
    });

    if (response.ok) {
      const aiResult = await response.json();
      if (Array.isArray(aiResult) && aiResult.length > 0 && aiResult[0].summary_text) {
        return res.json({ summary: aiResult[0].summary_text });
      }
    } else {
       console.error("Hugging Face API Error:", await response.text());
    }

    // Fallback if AI API fails or is loading
    res.json({ summary: "Earnings data gathered, but AI summarization is currently warming up. Please try again in a minute." });
    
  } catch (error) {
    res.status(500).json({ message: 'Error fetching earnings summary', error: error.message });
  }
});

export default router;
