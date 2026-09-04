import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, Shield, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const RiskProfile = ({ watchlistIds }) => {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchRisk = async () => {
      if (!user || watchlistIds.length < 2) {
        setLoading(false);
        setRiskData({ riskLevel: 'Low', message: 'Add at least 2 stocks to your watchlist to unlock AI Risk Analysis.' });
        return;
      }
      
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        
        const { data } = await axios.get(`${API_URL}/stocks/watchlist/risk`, config);
        setRiskData(data);
      } catch (error) {
        console.error("Error fetching risk profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRisk();
  }, [watchlistIds, user]);

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Loader2 className="animate-spin" size={20} color="var(--accent-color)" />
        <span style={{ color: 'var(--text-muted)' }}>AI analyzing portfolio diversity...</span>
      </div>
    );
  }

  if (!riskData) return null;

  let icon = <Shield size={24} color="var(--accent-color)" />;
  let bgColor = 'rgba(59, 130, 246, 0.1)';
  let borderColor = 'var(--accent-color)';

  if (riskData.riskLevel === 'High') {
    icon = <ShieldAlert size={24} color="var(--danger-color)" />;
    bgColor = 'rgba(239, 68, 68, 0.1)';
    borderColor = 'var(--danger-color)';
  } else if (riskData.riskLevel === 'Medium') {
    icon = <ShieldAlert size={24} color="#fbbf24" />;
    bgColor = 'rgba(251, 191, 36, 0.1)';
    borderColor = '#fbbf24';
  } else if (riskData.riskLevel === 'Low' && watchlistIds.length >= 2) {
    icon = <ShieldCheck size={24} color="var(--success-color)" />;
    bgColor = 'rgba(16, 185, 129, 0.1)';
    borderColor = 'var(--success-color)';
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ 
      padding: '20px', 
      marginBottom: '24px',
      background: bgColor,
      border: `1px solid ${borderColor}`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px'
    }}>
      <div style={{ marginTop: '2px' }}>
        {icon}
      </div>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          AI Risk Analysis
          {riskData.score && (
            <span style={{ fontSize: '0.75rem', background: 'var(--input-bg)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-color)' }}>
              Similarity Score: {riskData.score}
            </span>
          )}
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          {riskData.message}
        </p>
      </div>
    </div>
  );
};

export default RiskProfile;
