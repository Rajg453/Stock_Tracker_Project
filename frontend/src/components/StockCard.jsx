import React from 'react';
import { Star, TrendingUp, TrendingDown } from 'lucide-react';

const StockCard = ({ stock, isWatchlisted, onToggleWatchlist }) => {
  // Determine if the price has increased or decreased
  const isIncreasing = stock.currentPrice >= stock.previousPrice;
  const priceColor = isIncreasing ? 'var(--success-color)' : 'var(--danger-color)';

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
      <button 
        onClick={() => onToggleWatchlist(stock.symbol)}
        style={{ 
          position: 'absolute', top: '15px', right: '15px', 
          background: 'none', border: 'none', cursor: 'pointer',
          color: isWatchlisted ? '#fbbf24' : 'var(--glass-border)'
        }}
      >
        <Star fill={isWatchlisted ? '#fbbf24' : 'none'} size={24} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{stock.symbol}</h2>
      </div>
      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{stock.name}</p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
        <h3 style={{ margin: 0, fontSize: '2rem', color: priceColor }}>
          ${stock.currentPrice.toFixed(2)}
        </h3>
        {isIncreasing ? <TrendingUp color={priceColor} size={24} /> : <TrendingDown color={priceColor} size={24} />}
      </div>
    </div>
  );
};

export default StockCard;
