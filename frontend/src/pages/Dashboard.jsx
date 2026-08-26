import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import StockCard from '../components/StockCard';
import CompactStockCard from '../components/CompactStockCard';
import NewsFeed from '../components/NewsFeed';
import RiskProfile from '../components/RiskProfile';
import { AuthContext } from '../context/AuthContext';
import { RefreshCw, Sun, Moon } from 'lucide-react';

const Dashboard = () => {
  const [stocks, setStocks] = useState([]);
  const [watchlistIds, setWatchlistIds] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [isLightMode, setIsLightMode] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'light';
  });

  const toggleTheme = () => {
    if (isLightMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      setIsLightMode(false);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      setIsLightMode(true);
    }
  };

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
    
    // Set up WebSocket connection
    const socket = io('http://localhost:5000');
    
    socket.on('priceUpdate', (updatedStocks) => {
      setStocks(prevStocks => {
        const newStocks = [...prevStocks];
        updatedStocks.forEach(updated => {
          const index = newStocks.findIndex(s => s._id === updated._id);
          if (index !== -1) {
            // Give it a brief flash animation class depending on direction
            const direction = updated.currentPrice >= updated.previousPrice ? 'up' : 'down';
            newStocks[index] = { ...updated, flash: direction };
            
            // Remove flash class after 1 second
            setTimeout(() => {
              setStocks(current => {
                const arr = [...current];
                const i = arr.findIndex(s => s._id === updated._id);
                if (i !== -1 && arr[i].flash) {
                  arr[i] = { ...arr[i], flash: null };
                }
                return arr;
              });
            }, 1000);
          }
        });
        return newStocks;
      });
    });
    
    return () => socket.disconnect();
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

  // Filter the stocks based on active tab
  const displayedStocks = stocks.filter(stock => {
    if (activeFilter === 'Watchlist') return watchlistIds.includes(stock.symbol);
    if (activeFilter === 'Top Gainers') {
      const isIncreasing = stock.currentPrice >= stock.previousPrice;
      const diff = stock.currentPrice - stock.previousPrice;
      const percentChange = stock.previousPrice > 0 ? (diff / stock.previousPrice) * 100 : 0;
      return isIncreasing && percentChange > 1; // Arbitrary >1% threshold for 'gainer' demo
    }
    return true; // 'All'
  });

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem' }}>Market Overview</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', padding: '0' }} title="Toggle Theme">
            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className="btn" onClick={refreshPrices} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Refresh Prices
          </button>
        </div>
      </div>

      <div className="dashboard-layout">
        <main className="dashboard-main">
          {/* AI Risk Profile Widget */}
          {activeFilter === 'Watchlist' && (
             <RiskProfile watchlistIds={watchlistIds} />
          )}

          {/* Filter Pills */}
          <div className="filter-pills-container">
            {['All', 'Watchlist', 'Top Gainers'].map(filter => (
              <button 
                key={filter}
                className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid">
            {displayedStocks.map(stock => (
              <CompactStockCard 
                key={stock._id} 
                stock={stock} 
                isWatchlisted={watchlistIds.includes(stock.symbol)}
                onToggleWatchlist={handleToggleWatchlist}
              />
            ))}
          </div>
        </main>
        
        <aside className="dashboard-sidebar">
          <NewsFeed />
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
