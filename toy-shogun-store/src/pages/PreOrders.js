// PreOrders.js
// Dedicated pre-order page — filters shop to only show is_preorder = true products.
// Reuses the same product card style as Shop.js.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { supabase } from '../supabaseClient';

export default function PreOrders() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPreOrders = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('is_published', true)
        .eq('is_preorder', true)
        .order('preorder_release_date', { ascending: true });
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchPreOrders();
  }, []);

  return (
    <PublicLayout>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontWeight: 700, color: '#1a1a2e' }}>Pre-Orders</h2>
        <p style={{ color: '#666' }}>
          Reserve your wholesale orders before they arrive. Pre-orders are processed via PayMongo.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Loading...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>
          No pre-orders available right now.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '24px',
        }}>
          {products.map(product => (
            <div
              key={product.id}
              onClick={() => navigate(`/shop/${product.id}`)}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {/* Image */}
              <div style={{
                height: '180px', backgroundColor: '#f0f2f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '3rem' }}>🎴</span>
                )}
                <span style={{
                  position: 'absolute', top: '8px', left: '8px',
                  backgroundColor: '#e94560', color: '#fff',
                  padding: '3px 8px', borderRadius: '4px',
                  fontSize: '0.7rem', fontWeight: 600,
                }}>Pre-Order</span>
              </div>

              {/* Info */}
              <div style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>
                  {product.categories?.name || 'Uncategorized'}
                </div>
                <div style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '8px' }}>
                  {product.name}
                </div>
                {product.preorder_release_date && (
                  <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '8px' }}>
                    📅 {new Date(product.preorder_release_date).toLocaleDateString('en-PH', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#e94560' }}>
                    ₱{parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#999' }}>
                    Min: {product.min_order_qty || 1} pcs
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PublicLayout>
  );
}