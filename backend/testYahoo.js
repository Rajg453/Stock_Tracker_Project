import YahooFinance from 'yahoo-finance2';

async function test() {
  try {
      const yf = new YahooFinance();
      const symbol = 'AAPL';
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const queryOptions = { period1: thirtyDaysAgo };
      
      console.log("Fetching chart...");
      const result = await yf.chart(symbol, queryOptions);
      console.log("Success! Items in quotes:", result.quotes.length);
      console.log("First item:", result.quotes[0]);
  } catch(e) {
      console.error("Error:", e);
  }
}

test();
