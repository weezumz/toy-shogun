// ProductDetail.js
// Shows full details for a single product.
// Customer selects quantity (respecting min_order_qty) and adds to cart.

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchProduct();
   // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', id)
      .eq('is_published', true)
      .single();
    if (data) setProduct(data);
    setLoading(false);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <PublicLayout>
      <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Loading...</div>
    </PublicLayout>
  );

  if (!product) return (
    <PublicLayout>
      <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Product not found.</div>
    </PublicLayout>
  );

  const outOfStock = product.stock_quantity === 0;

  return (
    <PublicLayout>
      {/* Back button */}
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: '#666',
        cursor: 'pointer', marginBottom: '24px', padding: 10,
        display: 'flex', alignItems: 'center', gap: '6px', marginLeft:'20'

      }}>
        Back
      </button>

      <div style={{ marginleft: '20',display: 'flex', gap: '48px', flexWrap: 'wrap' }}>

        {/* Product Image */}
        <div style={{
          flex: '0 0 400px', height: '400px', backgroundColor: '#f0f2f5',
          borderRadius: '16px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', overflow: 'hidden',
        }}>
         {product.image_url ? (
            <img src={product.image_url} alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '6rem' }}>🎴</span>
          )}
        </div>

        {/* Product Info */}
        <div style={{ flex: 1, minWidth: '280px' }}>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {product.is_preorder && (
              <span style={badgeStyle('#e94560')}>Pre-Order</span>
            )}
            {product.categories?.name && (
              <span style={badgeStyle('#1a1a2e')}>{product.categories.name}</span>
            )}
          </div>

          <h2 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>{product.name}</h2>

          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#e94560', marginBottom: '8px' }}>
            ₱{parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </div>

          {product.is_preorder && product.preorder_release_date && (
            <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>
              📅 Expected Release: {new Date(product.preorder_release_date).toLocaleDateString('en-PH', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          )}

          {/* Stock Status */}
          <div style={{ marginBottom: '24px' }}>
            {outOfStock ? (
              <span style={badgeStyle('#dc3545')}>Out of Stock</span>
            ) : (
              <span style={badgeStyle('#198754')}>
                In Stock ({product.stock_quantity} available)
              </span>
            )}
          </div>

          

          {/* Quantity Selector */}
          {!outOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <label style={{ fontWeight: 600, color: '#1a1a2e' }}>Quantity:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={qtyBtnStyle}
                >−</button>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', minWidth: '32px', textAlign: 'center' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  style={qtyBtnStyle}
                >+</button>
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            style={{
              backgroundColor: added ? '#198754' : '#e94560',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '14px 32px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              width: '100%',
              transition: 'background-color 0.3s',
            }}
          >
            {outOfStock ? 'Out of Stock' : added ? '✓ Added to Cart!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}

const badgeStyle = (bg) => ({
  backgroundColor: bg, color: '#fff',
  padding: '4px 10px', borderRadius: '6px',
  fontSize: '0.75rem', fontWeight: 600,
  display: 'inline-block',
});

const qtyBtnStyle = {
  width: '36px', height: '36px',
  border: '1px solid #ddd', borderRadius: '8px',
  backgroundColor: '#fff', cursor: 'pointer',
  fontWeight: 700, fontSize: '1.1rem',
};