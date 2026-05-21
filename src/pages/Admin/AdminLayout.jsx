import { Navigate, Outlet, NavLink } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Package, PlusCircle, LogOut, User, ClipboardList } from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

const sidebarLinkStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  color: isActive ? 'var(--primary)' : 'var(--foreground)',
  background: isActive ? 'hsl(340 72% 62% / .1)' : 'transparent',
  fontWeight: isActive ? '600' : '400',
  fontSize: '0.9rem',
  textDecoration: 'none',
  transition: 'background 0.2s, color 0.2s',
  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
});

export default function AdminLayout() {
  const { user, isAdmin } = useAuthStore();

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', background: 'var(--muted)' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
            Admin Panel
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted-fg)' }}>{user.email}</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <NavLink
            to="/admin"
            end
            style={({ isActive }) => sidebarLinkStyle(isActive)}
          >
            <Package size={18} /> Manage Products
          </NavLink>
          <NavLink
            to="/admin/orders"
            style={({ isActive }) => sidebarLinkStyle(isActive)}
          >
            <ClipboardList size={18} /> Customer Orders
          </NavLink>
          <NavLink
            to="/admin/new"
            style={({ isActive }) => sidebarLinkStyle(isActive)}
          >
            <PlusCircle size={18} /> Add Product
          </NavLink>
          <NavLink
            to="/profile"
            style={({ isActive }) => sidebarLinkStyle(isActive)}
          >
            <User size={18} /> My Profile
          </NavLink>
        </nav>

        <button
          onClick={async () => {
            await signOut(auth);
            toast.success('Signed out successfully');
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.75rem 1rem', borderRadius: '0.5rem',
            color: 'hsl(340 72% 50%)', marginTop: '1rem',
            border: '1px solid hsl(340 72% 80%)', cursor: 'pointer',
            background: 'hsl(340 72% 62% / .05)',
            fontSize: '0.9rem', fontWeight: '500',
            width: '100%', transition: 'background 0.2s',
          }}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowX: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
