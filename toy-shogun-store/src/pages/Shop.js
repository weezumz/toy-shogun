// Shop.js
// Public wholesale product catalog.
// Displays all products where is_published = true and is_wholesale = true.
// Supports filtering by category and searching by name.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { supabase } from '../supabaseClient';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  // Apply search and category filter client-side
  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? p.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <PublicLayout>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' , marginLeft: '40px'}}>
        <h2 style={{ fontWeight: 700, color: '#1a1a2e' }}>Toy Shogun Shop</h2>
        <p style={{ color: '#666' }}>
          All products listed are for wholesale orders only. Minimum order quantities apply.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', marginLeft: '40px' ,flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={inputStyle}
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          style={inputStyle}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Loading products...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>No products found.</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '24px',
          marginLeft: '40px'
        }}>
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => navigate(`/shop/${product.id}`)}
            />
          ))}
        </div>
      )}
    </PublicLayout>
  );
}

function ProductCard({ product, onClick }) {
  const outOfStock = product.stock_quantity === 0;

  return (
    <div onClick={onClick} style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      opacity: outOfStock ? 0.6 : 1,
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      }}
    >
      {/* Product Image */}
      <div style={{
        height: '180px',
        backgroundColor: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '3rem' }}>🎴</span>
        )}

        {/* Badges */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {product.is_preorder && (
            <span style={badgeStyle('#e94560')}>Pre-Order</span>
          )}
          {outOfStock && (
            <span style={badgeStyle('#6c757d')}>Out of Stock</span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>
          {product.categories?.name || 'Uncategorized'}
        </div>
        <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '8px', lineHeight: '1.3' }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, color: '#e94560', fontSize: '1.1rem' }}>
            ₱{parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>
            Min: {product.min_order_qty || 1} pcs
          </span>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '0.95rem',
  outline: 'none',
  minWidth: '200px',
};

const badgeStyle = (bg) => ({
  backgroundColor: bg,
  color: '#fff',
  padding: '3px 8px',
  borderRadius: '4px',
  fontSize: '0.7rem',
  fontWeight: 600,
});