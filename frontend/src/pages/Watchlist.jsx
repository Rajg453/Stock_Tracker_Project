import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import StockCard from '../components/StockCard';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Watchlist = () => {
  const [watchlistStocks, setWatchlistStocks] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  const config = {
    headers: { Authorization: `Bearer ${user?.token}` }
  };

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/stocks/watchlist', config);
      setWatchlistStocks(data);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      await axios.delete(`http://localhost:5000/api/stocks/watchlist/${symbol}`, config);
      // Update state locally to immediately remove the item
      setWatchlistStocks(watchlistStocks.filter(stock => stock.symbol !== symbol));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div>
      <h1 className="text-gradient" style={{ marginBottom: '30px' }}>Your Watchlist</h1>
      
      {watchlistStocks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: '#94a3b8' }}>Your watchlist is empty</h3>
          <p>Go to the dashboard to find stocks to add to your watchlist.</p>
          <Link to="/" className="btn" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none' }}>
            Explore Stocks
          </Link>
        </div>
      ) : (
        <div className="grid">
          {watchlistStocks.map(stock => (
            <StockCard 
              key={stock._id} 
              stock={stock} 
              isWatchlisted={true}
              onToggleWatchlist={handleRemoveFromWatchlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
