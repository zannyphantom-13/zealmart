import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, User, LogOut, Shield } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';
import toast from 'react-hot-toast';
import './Navbar.css';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuthStore();
  const { getTotalItems } = useCartStore();

  const closeMobile = () => setMobileOpen(false);

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
    <header className="site-header">
      <div className="container header-inner">
        {/* Mobile menu button */}
        <button
          className="mobile-menu-btn"
          aria-label={mobileOpen ? 'Close menu' : 'Menu'}
          onClick={() => setMobileOpen(v => !v)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Logo */}
        <NavLink to="/" className="header-logo" onClick={closeMobile}>
          <img src="/logo.png" alt="JD Good Hair Logo" />
        </NavLink>

        {/* Desktop nav */}
        <nav className="header-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/products">Shop</NavLink>
          <NavLink to="/products?category=Bundles">Bundles</NavLink>
          <NavLink to="/products?category=Wigs">Wigs</NavLink>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          <NavLink to="/products" aria-label="Search" className="icon-action-btn">
            <Search size={20} />
          </NavLink>

          {user ? (
            <>
              {isAdmin && (
                <NavLink to="/admin" className="icon-action-btn" title="Admin Portal">
                  <Shield size={20} />
                  <span>Admin</span>
                </NavLink>
              )}
              <NavLink to="/profile" className="icon-action-btn" title="Profile">
                <User size={20} />
                <span>Profile</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="icon-action-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}
                title="Logout"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="icon-action-btn">
                <span>Login</span>
              </NavLink>
              <NavLink to="/register" className="icon-action-btn">
                <span>Register</span>
              </NavLink>
            </>
          )}

          <NavLink to="/cart" className="cart-btn" aria-label="Cart" style={{ position: 'relative' }}>
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
            )}
          </NavLink>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav className="mobile-nav">
          <NavLink to="/" end className={navLinkClass} onClick={closeMobile}>Home</NavLink>
          <NavLink to="/products" className={navLinkClass} onClick={closeMobile}>Shop</NavLink>
          <NavLink to="/products?category=Bundles" className={navLinkClass} onClick={closeMobile}>Bundles</NavLink>
          <NavLink to="/products?category=Wigs" className={navLinkClass} onClick={closeMobile}>Wigs</NavLink>
          <NavLink to="/products?category=Closures" className={navLinkClass} onClick={closeMobile}>Closures</NavLink>
          <NavLink to="/products?category=Frontals" className={navLinkClass} onClick={closeMobile}>Frontals</NavLink>
          <hr />
          <NavLink to="/cart" className={navLinkClass} onClick={closeMobile}>
            🛍️ Cart {totalItems > 0 && `(${totalItems})`}
          </NavLink>
          {user ? (
            <>
              {isAdmin && (
                <NavLink to="/admin" className={navLinkClass} onClick={closeMobile}>⚙️ Admin Portal</NavLink>
              )}
              <NavLink to="/profile" className={navLinkClass} onClick={closeMobile}>👤 Profile</NavLink>
              <button
                onClick={handleLogout}
                className="mobile-nav-link mobile-logout-btn"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClass} onClick={closeMobile}>Login</NavLink>
              <NavLink to="/register" className={navLinkClass} onClick={closeMobile}>Register</NavLink>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
