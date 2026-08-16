import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import StockCard from '../components/StockCard';
import { AuthContext } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // Configure axios with auth token
  const config = {
    headers: { Authorization: `Bearer ${user?.token}` }
  };

  const fetchStocksAndWatchlist = async () => {
    setLoading(true);
    try {
      const { data: allStocks } = await axios.get('http://localhost:5000/api/stocks');
      setStocks(allStocks);

      if (user) {
        const { data: watchlisted } = await axios.get('http://localhost:5000/api/stocks/watchlist', config);
        setWatchlistIds(watchlisted.map(stock => stock.symbol));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStocksAndWatchlist();
  }, [user]);

  const handleToggleWatchlist = async (symbol) => {
    try {
      if (watchlistIds.includes(symbol)) {
        await axios.delete(`http://localhost:5000/api/stocks/watchlist/${symbol}`, config);
        setWatchlistIds(watchlistIds.filter(id => id !== symbol));
      } else {
        await axios.post(`http://localhost:5000/api/stocks/watchlist/${symbol}`, {}, config);
        setWatchlistIds([...watchlistIds, symbol]);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  };

  const refreshPrices = async () => {
    try {
      await axios.post('http://localhost:5000/api/stocks/fetch');
      fetchStocksAndWatchlist();
    } catch (error) {
      console.error('Error refreshing prices:', error);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="text-gradient">Market Overview</h1>
        <button className="btn" onClick={refreshPrices} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Refresh Prices
        </button>
      </div>

      <div className="grid">
        {stocks.map(stock => (
          <StockCard 
            key={stock._id} 
            stock={stock} 
            isWatchlisted={watchlistIds.includes(stock.symbol)}
            onToggleWatchlist={handleToggleWatchlist}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
