import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Stock from './models/Stock.js';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

dotenv.config();

const seedStocks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    const initialSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    
    for (const symbol of initialSymbols) {
      const exists = await Stock.findOne({ symbol });
      if (!exists) {
        // Fetch current price to seed with realistic data
        const quote = await yahooFinance.quote(symbol);
        const price = quote.regularMarketPrice || 100;
        const name = quote.shortName || quote.longName || symbol;
        
        await Stock.create({
          symbol,
          name,
          currentPrice: price,
          previousPrice: price * 0.99 // Fake previous price to simulate a 1% gain
        });
        console.log(`Added ${symbol}`);
      } else {
        console.log(`${symbol} already exists.`);
      }
    }
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedStocks();
