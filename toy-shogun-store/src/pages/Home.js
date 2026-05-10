// Home.js
// Landing page for the public store.
// Shows upcoming events first, then featured products below.
// Red and black theme.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLayout from '../components/PublicLayout';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

export default function Home() {
  const [events, setEvents] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchEvents();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(6);
    if (data) setEvents(data);
    setLoadingEvents(false);
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(8);
    if (data) setProducts(data);
    setLoadingProducts(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  };

  const filtered = products.filter(p =>
    selectedCategory ? p.category_id === selectedCategory : true
  );


  return (
    <PublicLayout noPadding>

      {/* ── Hero Banner ── */}
      <div style={{
        backgroundColor: '#cc0000',
        backgroundImage: 'linear-gradient(135deg, #cc0000 0%, #800000ea 100%)',
        padding: '20px 20px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <h1 style={{ fontWeight: 900, fontSize: '3rem', marginBottom: '16px', letterSpacing: '1px' }}>
          Toy Shogun Hobby Shop
        </h1>
        <p style={{ fontSize: '1.15rem', opacity: 0.9, marginBottom: '32px', maxWidth: '520px', margin: '0 auto 32px' }}>
          Booster boxes, display cases, and collectibles
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/shop')}
            style={{
              backgroundColor: '#fff',
              color: '#cc0000',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 32px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Browse Shop 
          </button>
          <button
            onClick={() => navigate('/events')}
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              border: '2px solid #fff',
              borderRadius: '8px',
              padding: '14px 32px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            View Events
          </button>
        </div>
      </div>

      {/* ── Upcoming Events ── */}
      <div style={{ backgroundColor: '#111', padding: '60px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h2 style={{ color: '#fff', fontWeight: 800, marginBottom: '4px' }}>Upcoming Events</h2>
              <div style={{ width: '48px', height: '3px', backgroundColor: '#cc0000', borderRadius: '2px' }} />
            </div>
            <button
              onClick={() => navigate('/events')}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #cc0000',
                color: '#cc0000',
                borderRadius: '6px',
                padding: '8px 20px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
            >
              See All Events 
            </button>
          </div>

          {loadingEvents ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px' }}>Loading events...</div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px' }}>
              No upcoming events. Check back soon!
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {events.map(event => {
                const gameColor =  '#cc000088';
                const eventDate = new Date(event.event_date);
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid #222',
                      transition: 'transform 0.2s, border-color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.borderColor = '#cc0000';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#222';
                    }}
                  >
                    {/* Event Image or Color Banner */}
                    <div style={{
                      height: '140px',
                      backgroundColor: gameColor,
                      backgroundImage: event.image_url ? `url(${event.image_url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: '12px',
                    }}>
                      <span style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}>
                        {event.game_type}
                      </span>
                    </div>

                    {/* Event Info */}
                    <div style={{ padding: '16px' }}>
                      <div style={{ color: '#cc0000', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                        📅 {eventDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                        {' · '}
                        {eventDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: '8px', lineHeight: '1.3' }}>
                        {event.title}
                      </div>
                      {event.venue && (
                        <div style={{ color: '#888', fontSize: '0.82rem' }}>📍 {event.venue}</div>
                      )}
                      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.8rem', color: '#aaa' }}>
                        {event.entry_fee > 0
                          ? <span>🎟️ ₱{parseFloat(event.entry_fee).toLocaleString('en-PH')}</span>
                          : <span>🎟️ Free Entry</span>
                        }
                        {event.prize_pool && <span>🏆 {event.prize_pool}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Products Section ── */}
      <div style={{ backgroundColor: '#cc0000', padding: '60px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ color: '#fff', fontWeight: 800, marginBottom: '4px' }}>Available Products</h2>
              <div style={{ width: '48px', height: '3px', backgroundColor: '#fff', borderRadius: '2px' }} />
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#fff',
                  color: '#1a1a1a',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                onClick={() => navigate('/shop')}
                style={{
                  backgroundColor: '#fff',
                  color: '#cc0000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}
              >
                View All 
              </button>
            </div>
          </div>

          {loadingProducts ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '40px' }}>Loading products...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#fff', padding: '40px' }}>No products found.</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px',
            }}>
              {filtered.map(product => (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: '#1a1a1a',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  onClick={() => navigate(`/shop/${product.id}`)}
                >
                  {/* Image */}
                  <div style={{
                    height: '160px',
                    backgroundColor: '#222',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>🎴</span>
                    )}
                    {product.is_preorder && (
                      <span style={{
                        position: 'absolute', top: '8px', left: '8px',
                        backgroundColor: '#cc0000', color: '#fff',
                        padding: '3px 8px', borderRadius: '4px',
                        fontSize: '0.7rem', fontWeight: 700,
                      }}>Pre-Order</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#888', marginBottom: '4px' }}>
                      {product.categories?.name || 'Uncategorized'}
                    </div>
                    <div style={{ fontWeight: 600, color: '#fff', marginBottom: '8px', fontSize: '0.92rem', lineHeight: '1.3' }}>
                      {product.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#cc0000', fontSize: '1rem' }}>
                        ₱{parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#666' }}>
                        Min: {product.min_order_qty || 1} pcs
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(product, product.min_order_qty || 1); }}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        backgroundColor: '#cc0000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      + Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              overflow: 'hidden',
              border: '1px solid #333',
            }}
          >
            {/* Event Image */}
            {selectedEvent.image_url ? (
              <img
                src={selectedEvent.image_url}
                alt={selectedEvent.title}
                onClick={() => setFullscreenImage(selectedEvent.image_url)}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  backgroundColor: '#111',
                  cursor: 'pointer',
                }}
              />
            ) : (
              <div style={{
                height: '200px',
                width: '100%',
                backgroundColor: '#111',
              }} />
            )}

            {/* Event Details */}
            <div style={{ padding: '28px' }}>
              <div style={{ color: '#cc0000', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>
                {selectedEvent.game_type}
              </div>
              <h3 style={{ color: '#fff', fontWeight: 800, marginBottom: '16px' }}>
                {selectedEvent.title}
              </h3>

              {selectedEvent.description && (
                <p style={{ color: '#aaa', lineHeight: '1.7', marginBottom: '20px', fontSize: '0.92rem' }}>
                  {selectedEvent.description}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: '#ccc' }}>
                <div>📅 {new Date(selectedEvent.event_date).toLocaleDateString('en-PH', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })} · {new Date(selectedEvent.event_date).toLocaleTimeString('en-PH', {
                  hour: '2-digit', minute: '2-digit'
                })}</div>
                {selectedEvent.venue && <div>📍 {selectedEvent.venue}</div>}
                {selectedEvent.entry_fee > 0
                  ? <div>🎟️ Entry Fee: ₱{parseFloat(selectedEvent.entry_fee).toLocaleString('en-PH')}</div>
                  : <div>🎟️ Free Entry</div>
                }
                {selectedEvent.prize_pool && <div>🏆 Prize Pool: {selectedEvent.prize_pool}</div>}
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  marginTop: '24px',
                  width: '100%',
                  backgroundColor: '#cc0000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Image Viewer ── */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <img
              src={fullscreenImage}
              alt="Event fullscreen"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
            <button
              onClick={() => setFullscreenImage(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}

