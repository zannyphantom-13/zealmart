import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, User, LogOut, Shield } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    closeMobile();
  }, [location]);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
    navigate('/');
    closeMobile();
  };

  const totalItems = getTotalItems();

  const navLinkClass = ({ isActive }) =>
    isActive ? 'mobile-nav-link active' : 'mobile-nav-link';

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-inner">
        {/* Left Logo */}
        <NavLink to="/" className="header-logo" onClick={closeMobile}>
          <img src="/logo.png" alt="JD Good Hair Logo" />
        </NavLink>

        {/* Center Desktop Nav */}
        <nav className="header-nav desktop-only">
          <NavLink to="/" end className="nav-item">Home</NavLink>
          <NavLink to="/products" className="nav-item">Shop</NavLink>
          <NavLink to="/products?category=Bundles" className="nav-item">Bundles</NavLink>
          <NavLink to="/products?category=Wigs" className="nav-item">Wigs</NavLink>
        </nav>

        {/* Center Mobile Search Bar */}
        <div className="mobile-search-wrapper mobile-only">
          <NavLink to="/products" className="mobile-search-bar">
            <Search size={16} strokeWidth={2} />
            <span>Search...</span>
          </NavLink>
        </div>

        {/* Right Actions */}
        <div className="header-actions">
          <NavLink to="/products" aria-label="Search" className="action-icon desktop-only">
            <Search size={20} strokeWidth={1.5} />
          </NavLink>

          {user ? (
            <div className="user-actions desktop-only">
              {isAdmin && (
                <NavLink to="/admin" className="action-icon" title="Admin Portal">
                  <Shield size={20} strokeWidth={1.5} />
                </NavLink>
              )}
              <NavLink to="/profile" className="action-icon" title="Profile">
                <User size={20} strokeWidth={1.5} />
              </NavLink>
              <button onClick={handleLogout} className="action-icon" title="Logout">
                <LogOut size={20} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <div className="auth-actions desktop-only">
              <NavLink to="/login" className="auth-link">Login</NavLink>
              <NavLink to="/register" className="auth-btn">Register</NavLink>
            </div>
          )}

          <NavLink to="/cart" className="action-icon cart-action" aria-label="Cart">
            <ShoppingBag size={20} strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </NavLink>

          {/* Mobile menu button */}
          <button
            className="mobile-menu-btn"
            aria-label={mobileOpen ? 'Close menu' : 'Menu'}
            onClick={() => setMobileOpen(v => !v)}
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <div className={`mobile-drawer-overlay ${mobileOpen ? 'open' : ''}`} onClick={closeMobile}></div>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <img src="/logo.png" alt="JD Good Hair Logo" className="drawer-logo" />
          <button className="drawer-close" onClick={closeMobile}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-content">
          <nav className="mobile-nav-list">
            <NavLink to="/" end className={navLinkClass}>Home</NavLink>
            <NavLink to="/products" className={navLinkClass}>Shop All</NavLink>
            <NavLink to="/products?category=Bundles" className={navLinkClass}>Bundles</NavLink>
            <NavLink to="/products?category=Wigs" className={navLinkClass}>Wigs</NavLink>
            <NavLink to="/products?category=Closures" className={navLinkClass}>Closures</NavLink>
            <NavLink to="/products?category=Frontals" className={navLinkClass}>Frontals</NavLink>
          </nav>
          
          <div className="drawer-footer">
            {user ? (
              <div className="mobile-user-menu">
                {isAdmin && (
                  <NavLink to="/admin" className="drawer-btn outline">⚙️ Admin Portal</NavLink>
                )}
                <NavLink to="/profile" className="drawer-btn outline">👤 Profile</NavLink>
                <button onClick={handleLogout} className="drawer-btn danger">🚪 Logout</button>
              </div>
            ) : (
              <div className="mobile-auth-menu">
                <NavLink to="/login" className="drawer-btn outline">Login</NavLink>
                <NavLink to="/register" className="drawer-btn primary">Register</NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
