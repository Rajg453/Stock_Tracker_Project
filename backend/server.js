import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
import Stock from './models/Stock.js';
import authRoutes from './routes/authRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
// 1. Import our newly created AI routes so the server knows about them.
import aiRoutes from './routes/aiRoutes.js';
// 2. Import the cron jobs initialization function
import { initCronJobs } from './jobs/cronJobs.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
// 2. Tell Express to route any requests starting with '/api/ai' to our aiRoutes file.
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start the background cron jobs
  initCronJobs();
  
  // Start WebSocket background worker for real-time prices
  setInterval(async () => {
    try {
      const stocks = await Stock.find({});
      const updatedStocks = [];
      for (let stock of stocks) {
        const quote = await yahooFinance.quote(stock.symbol);
        // Only broadcast if the price actually changed (or simulate small changes for demo)
        if (quote && quote.regularMarketPrice) {
          // For demo purposes if market is closed, we could simulate ticks, but we'll stick to real data
          if (quote.regularMarketPrice !== stock.currentPrice) {
            stock.previousPrice = stock.currentPrice;
            stock.currentPrice = quote.regularMarketPrice;
            await stock.save();
            updatedStocks.push(stock);
          }
        }
      }
      if (updatedStocks.length > 0) {
        io.emit('priceUpdate', updatedStocks);
      }
    } catch (err) {
      // Ignore background errors
    }
  }, 15000); // Check every 15 seconds
});
