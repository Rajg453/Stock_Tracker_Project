import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

const StockChart = ({ symbol, isIncreasing }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/stocks/${symbol}/history`);
        // Format the data for recharts
        const formattedData = response.data.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: item.close
        }));
        setData(formattedData);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [symbol]);

  if (loading) {
    return <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading chart...</div>;
  }

  if (data.length === 0) {
    return <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No chart data</div>;
  }

  const strokeColor = isIncreasing ? 'var(--success-color)' : 'var(--danger-color)';

  return (
    <div style={{ height: '100px', width: '100%', marginTop: '10px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text-color)', borderRadius: '8px' }}
            itemStyle={{ color: strokeColor }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={strokeColor} 
            strokeWidth={2} 
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
