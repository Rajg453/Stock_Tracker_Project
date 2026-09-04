import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Newspaper, ExternalLink } from 'lucide-react';
import { API_URL } from '../config';

const NewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/stocks/news/market`);
        setNews(data.slice(0, 6)); // Fetch a bit more for the sidebar
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading news...</div>;
  if (news.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 10px 0', fontSize: '1.5rem' }}>
        <Newspaper size={24} /> Stocks in News
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {news.map((item, index) => {
          const dateStr = item.providerPublishTime 
            ? new Date(typeof item.providerPublishTime === 'number' ? item.providerPublishTime * 1000 : item.providerPublishTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
            : 'Recent';

          return (
            <a 
              key={index} 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="news-card"
            >
              <div className="news-meta">
                <span>{item.publisher} • {dateStr}</span>
                <ExternalLink size={14} />
              </div>
              
              <h4 className="news-title">{item.title}</h4>
              
              {/* AI Sentiment Badge */}
              {item.aiSentiment && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ 
                    backgroundColor: item.aiSentiment === 'POSITIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: item.aiSentiment === 'POSITIVE' ? 'var(--success-color)' : 'var(--danger-color)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'inline-block'
                  }}>
                    {item.aiSentiment === 'POSITIVE' ? '🟢 Bullish' : '🔴 Bearish'}
                  </span>
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default NewsFeed;
