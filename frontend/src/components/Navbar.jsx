import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, LogOut, Menu, X, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 1. Theme State Management
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // 2. Apply theme to HTML tag whenever it changes
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  return (
    <nav className="glass-panel" style={{ margin: '20px', padding: '15px 30px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp color="var(--accent-color)" size={28} />
          <h2 className="text-gradient" style={{ margin: 0 }}>Stock Tracking</h2>
        </Link>

        {/* Theme Toggle & Mobile Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* 3. Theme Toggle Button */}
          <button 
            onClick={toggleTheme}
            style={{ 
              background: 'none', border: 'none', color: 'var(--text-color)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '5px' 
            }}
            title="Toggle Light/Dark Mode"
          >
            {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
          </button>

          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer' }}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Desktop & Mobile Navigation Links */}
        <div className={`nav-links ${isMenuOpen ? 'mobile-open' : ''}`}>
          {user ? (
            <>
              <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
              <Link to="/watchlist" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 500 }}>Watchlist</Link>
              <Link to="/ai-advisor" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-color)', textDecoration: 'none', fontWeight: 500 }}>AI Advisor</Link>
              
              <button className="btn" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-color)' }}>Login</Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
