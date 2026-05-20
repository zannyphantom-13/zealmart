import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminLayout from './pages/Admin/AdminLayout';
import ProductManager from './pages/Admin/ProductManager';
import ProductForm from './pages/Admin/ProductForm';
import useAuthStore from './store/useAuthStore';
import './index.css';

function App() {
  const { init, loading } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--primary)' }}>Loading JD Good Hair...</div>;
  }

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />} />
        <Route path="/products"      element={<Shop />} />
        <Route path="/products/:id"   element={<ProductDetail />} />
        <Route path="/shop"           element={<Shop />} />
        <Route path="/bundles"        element={<Shop />} />
        <Route path="/wigs"           element={<Shop />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/profile"        element={<Profile />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<ProductManager />} />
          <Route path="new" element={<ProductForm />} />
          <Route path="edit/:id" element={<ProductForm />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
