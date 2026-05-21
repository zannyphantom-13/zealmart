import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { ArrowLeft } from 'lucide-react';
import { uploadImage } from '../../utils/uploadImage';
import toast from 'react-hot-toast';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    category: 'Bundles',
    length: '18"',
    price: '',
    pss: '',
    featured: false,
    img: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          const docRef = doc(db, "products", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data());
          } else {
            setError("Product not found");
          }
        } catch (err) {
          setError("Failed to load product");
        }
      };
      fetchProduct();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let imageUrl = formData.img;

      // 1. Upload image if a new one was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        throw new Error("Product image is required");
      }

      // 2. Prepare payload
      const payload = {
        ...formData,
        price: Number(formData.price),
        pss: Number(formData.pss),
        img: imageUrl,
        updatedAt: new Date()
      };

      // 3. Save to Firestore
      if (isEditing) {
        await updateDoc(doc(db, "products", id), payload);
        toast.success('Product updated successfully!');
      } else {
        const newRef = doc(collection(db, "products"));
        payload.createdAt = new Date();
        await setDoc(newRef, payload);
        toast.success('Product created successfully!');
      }

      navigate('/admin');
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('offline')) {
        setError('Please check your internet connection and try again.');
      } else {
        setError('Failed to save product. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', maxWidth: '600px', margin: '0 auto' }}>
      <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-fg)', marginBottom: '1.5rem', textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Back to Products
      </Link>
      
      <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', marginBottom: '1.5rem' }}>
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h1>

      {error && <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '4px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label>Product Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <option>Bundles</option>
              <option>Wigs</option>
              <option>Closures</option>
              <option>Frontals</option>
            </select>
          </div>
          <div className="form-group">
            <label>Length (e.g. 18")</label>
            <input type="text" name="length" value={formData.length} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label>Full Price (₦)</label>
          <input type="number" name="price" value={formData.price} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Product Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ padding: '0.5rem 0' }} />
          {formData.img && !imageFile && (
            <img src={formData.img} alt="Current" loading="lazy" decoding="async" style={{ width: '100px', marginTop: '0.5rem', borderRadius: '4px' }} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" name="featured" id="featured" checked={formData.featured} onChange={handleChange} />
          <label htmlFor="featured" style={{ cursor: 'pointer' }}>Feature on homepage?</label>
        </div>

        <button type="submit" className="buy-once-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Saving...' : 'Save Product'}
        </button>
      </form>
    </div>
  );
}
