import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <h3>JD Good Hair</h3>
            <p className="footer-tagline">Luxury for Less</p>
            <p>Premium 100% virgin human hair for every queen. Shop bundles, wigs, closures, and frontals at unbeatable prices.</p>
          </div>

          {/* Shop */}
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link to="/shop">All Products</Link></li>
              <li><Link to="/shop?cat=bundles">Bundles</Link></li>
              <li><Link to="/shop?cat=wigs">Wigs</Link></li>
              <li><Link to="/shop?cat=closures">Closures</Link></li>
              <li><Link to="/shop?cat=frontals">Frontals</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          © 2026 JD Good Hair. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
