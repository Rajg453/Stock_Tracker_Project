import React, { useState, useRef } from 'react';
import { Star, TrendingUp, TrendingDown, Eye, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import axios from 'axios';
import StockChart from './StockChart';

const StockCard = ({ stock, isWatchlisted, onToggleWatchlist }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loadingVision, setLoadingVision] = useState(false);
  const chartRef = useRef(null);

  // Determine if the price has increased or decreased
  const isIncreasing = stock.currentPrice >= stock.previousPrice;
  const priceColor = isIncreasing ? 'var(--success-color)' : 'var(--danger-color)';

  const handleVisualAnalysis = async () => {
    if (analysis) {
       setAnalysis(null);
       return;
    }
    
    if (!chartRef.current) return;
    
    setLoadingVision(true);
    try {
      // 1. Capture the chart as a base64 image
      const canvas = await html2canvas(chartRef.current, { backgroundColor: null });
      const base64Image = canvas.toDataURL("image/png");

      // 2. Send image to backend proxy
      const { data } = await axios.post('https://stock-tracker-project.onrender.com/api/ai/vision', { image: base64Image });
      setAnalysis(data.answer);
    } catch (error) {
      console.error("Error analyzing chart:", error);
      setAnalysis("Sorry, I could not analyze the chart at this moment.");
    } finally {
      setLoadingVision(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in stock-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
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
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 className={stock.flash ? `flash-${stock.flash}` : ''} style={{ margin: 0, fontSize: '2rem', color: priceColor, transition: 'color 0.3s' }}>
            ${stock.currentPrice.toFixed(2)}
          </h3>
          {isIncreasing ? <TrendingUp color={priceColor} size={24} /> : <TrendingDown color={priceColor} size={24} />}
        </div>
        
        <button 
          onClick={handleVisualAnalysis}
          style={{
            background: analysis ? 'var(--accent-color)' : 'rgba(59, 130, 246, 0.1)',
            color: analysis ? 'white' : 'var(--accent-color)',
            border: `1px solid ${analysis ? 'var(--accent-color)' : 'var(--glass-border)'}`,
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          title="AI Visual Chart Analysis"
        >
          {loadingVision ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
          {analysis ? 'Close Analysis' : 'Analyze Chart'}
        </button>
      </div>
      
      <div ref={chartRef}>
        <StockChart symbol={stock.symbol} isIncreasing={isIncreasing} />
      </div>

      {analysis && (
        <div className="animate-fade-in" style={{ 
          marginTop: '15px', 
          padding: '16px', 
          background: 'var(--input-bg)', 
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
          fontSize: '0.9rem',
          color: 'var(--text-color)',
          lineHeight: '1.6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--accent-color)' }}>
            <Eye size={18} />
            <strong style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>AI Visual Analysis</strong>
          </div>
          {analysis}
        </div>
      )}
    </div>
  );
};

export default StockCard;
