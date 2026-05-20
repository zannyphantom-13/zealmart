import { Navigate, Outlet, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Package, PlusCircle, LogOut, User, ClipboardList } from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

export default function AdminLayout() {
  const { user, isAdmin } = useAuthStore();

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', background: 'var(--muted)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'var(--card)', borderRight: '1px solid var(--border)', padding: '2rem 1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: '2rem', color: 'var(--primary)' }}>Admin Dashboard</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'var(--foreground)', background: 'var(--muted)' }}>
            <Package size={18} /> Manage Products
          </Link>
          <Link to="/admin/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'var(--foreground)' }}>
            <ClipboardList size={18} /> Customer Orders
          </Link>
          <Link to="/admin/new" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'var(--foreground)' }}>
            <PlusCircle size={18} /> Add Product
          </Link>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'var(--foreground)' }}>
            <User size={18} /> Admin Profile
          </Link>
          <button 
            onClick={() => signOut(auth)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius)', color: 'hsl(340 72% 50%)', marginTop: 'auto', border: '1px solid hsl(340 72% 80%)', cursor: 'pointer' }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
