import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-panel" style={{ margin: '20px', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <TrendingUp color="var(--accent-color)" size={28} />
        <h2 className="text-gradient" style={{ margin: 0 }}>Stock Tracking</h2>
      </Link>
      
      {user ? (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
          <Link to="/watchlist" style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 500 }}>Watchlist</Link>
          
          <button className="btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--glass-border)' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/login" className="btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>Login</Link>
          <Link to="/register" className="btn">Sign Up</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
