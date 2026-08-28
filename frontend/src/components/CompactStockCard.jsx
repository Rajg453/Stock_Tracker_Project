import React, { useState } from 'react';
import { Star, TrendingUp, TrendingDown, LayoutDashboard, BrainCircuit, Loader2 } from 'lucide-react';
import axios from 'axios';

const CompactStockCard = ({ stock, isWatchlisted, onToggleWatchlist }) => {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  const isIncreasing = stock.currentPrice >= stock.previousPrice;
  const priceColor = isIncreasing ? 'var(--success-color)' : 'var(--danger-color)';
  
  // Calculate percentage change
  const diff = stock.currentPrice - stock.previousPrice;
  const percentChange = ((diff / stock.previousPrice) * 100).toFixed(2);
  const isPositive = diff >= 0;

  const fetchEarningsSummary = async () => {
    // Toggle off if already open
    if (summary) {
      setSummary(null);
      return;
    }
    
    setLoadingSummary(true);
    try {
      const { data } = await axios.get(`https://stock-tracker-project.onrender.com/api/stocks/${stock.symbol}/earnings`);
      setSummary(data.summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setSummary("Failed to fetch earnings summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="glass-panel stock-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
      <button 
        onClick={(e) => { e.preventDefault(); onToggleWatchlist(stock.symbol); }}
        style={{ 
          position: 'absolute', top: '12px', right: '12px', 
          background: 'none', border: 'none', cursor: 'pointer',
          color: isWatchlisted ? '#fbbf24' : 'var(--glass-border)'
        }}
        title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
      >
        <Star fill={isWatchlisted ? '#fbbf24' : 'none'} size={18} />
      </button>

      {/* Top row: Logo/Icon and Ticker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          width: '32px', height: '32px', 
          borderRadius: '8px', 
          background: 'var(--input-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--glass-border)'
        }}>
          <LayoutDashboard size={16} color="var(--accent-color)" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-color)' }}>{stock.symbol}</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{stock.name}</p>
        </div>
      </div>
      
      {/* Bottom row: Price, Change, and AI Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className={stock.flash ? `flash-${stock.flash}` : ''} style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
            ${stock.currentPrice.toFixed(2)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: priceColor, fontSize: '0.85rem', fontWeight: 500 }}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>
              {isPositive ? '+' : ''}{diff.toFixed(2)} ({isPositive ? '+' : ''}{percentChange}%)
            </span>
          </div>
        </div>
        
        <button 
          onClick={fetchEarningsSummary}
          style={{
            background: summary ? 'var(--accent-color)' : 'rgba(59, 130, 246, 0.1)',
            color: summary ? 'white' : 'var(--accent-color)',
            border: `1px solid ${summary ? 'var(--accent-color)' : 'var(--glass-border)'}`,
            padding: '6px 10px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          title="Generate AI Earnings Summary"
        >
          {loadingSummary ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
          {summary ? 'Close AI' : 'AI Summary'}
        </button>
      </div>

      {/* Expanded AI Summary Section */}
      {summary && (
        <div className="animate-fade-in" style={{ 
          marginTop: '8px', 
          padding: '12px', 
          background: 'var(--input-bg)', 
          borderRadius: '8px',
          border: '1px solid var(--glass-border)',
          fontSize: '0.85rem',
          color: 'var(--text-color)',
          lineHeight: '1.5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--accent-color)' }}>
            <BrainCircuit size={14} />
            <strong style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>AI Earnings Insight</strong>
          </div>
          {summary}
        </div>
      )}
    </div>
  );
};

export default CompactStockCard;
