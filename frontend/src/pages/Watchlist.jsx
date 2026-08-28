import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import StockCard from '../components/StockCard';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Watchlist = () => {
  const [watchlistStocks, setWatchlistStocks] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const config = {
    headers: { Authorization: `Bearer ${user?.token}` }
  };

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('https://stock-tracker-project.onrender.com/api/stocks/watchlist', config);
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
      await axios.delete(`https://stock-tracker-project.onrender.com/api/stocks/watchlist/${symbol}`, config);
      // Update state locally to immediately remove the item
      setWatchlistStocks(watchlistStocks.filter(stock => stock.symbol !== symbol));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const analyzePortfolio = async () => {
    if (watchlistStocks.length === 0) return;
    setIsAnalyzing(true);
    setAnalysis('');
    try {
      const symbols = watchlistStocks.map(s => `${s.name} (${s.symbol})`).join(', ');
      const question = `Analyze this stock portfolio concisely in 2-3 short paragraphs, mentioning diversification, risks, and overall outlook. Do not use formatting like markdown bolding if possible. Portfolio: ${symbols}`;
      
      const response = await fetch('https://stock-tracker-project.onrender.com/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch AI analysis from server.');
      }
      
      setAnalysis(data.answer);
    } catch (error) {
      console.error("AI Error:", error);
      setAnalysis("Sorry, AI analysis failed. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="text-gradient">Your Watchlist</h1>
        {watchlistStocks.length > 0 && (
          <button className="btn" onClick={analyzePortfolio} disabled={isAnalyzing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} /> {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
          </button>
        )}
      </div>

      {analysis && (
        <div className="glass-panel animate-fade-in" style={{ padding: '20px', marginBottom: '30px', borderLeft: '4px solid var(--accent-color)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent-color)' }}>AI Portfolio Analysis</h3>
          <p style={{ margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{analysis}</p>
        </div>
      )}
      
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
