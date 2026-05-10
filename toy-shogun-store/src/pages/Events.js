// Events.js
// Public events listing page.
// Displays all published events — tournaments, launches, etc.
// Display only — no registration.

import React, { useEffect, useState } from 'react';
import PublicLayout from '../components/PublicLayout';
import { supabase } from '../supabaseClient';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('event_date', { ascending: true });
    if (data) setEvents(data);
    setLoading(false);
  };

  const upcoming = events.filter(e => new Date(e.event_date) >= new Date());
  const past = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <PublicLayout>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontWeight: 700, color: '#1a1a2e' }}>Events</h2>
        <p style={{ color: '#666' }}>
          Join us for tournaments, launches, and more at Toy Shogun!
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>
          No upcoming events at the moment. Check back soon!
        </div>
      ) : (
        <>
          {/* Upcoming Events */}
          {upcoming.length > 0 && (
            <>
              <h5 style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: '20px' }}>
                Upcoming Events
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '48px' }}>
                {upcoming.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Past Events */}
          {past.length > 0 && (
            <>
              <h5 style={{ color: '#999', fontWeight: 600, marginBottom: '20px' }}>
                Past Events
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', opacity: 0.6 }}>
                {past.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isPast
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

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
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {selectedEvent.image_url ? (
              <img
                src={selectedEvent.image_url}
                alt={selectedEvent.title}
                onClick={() => setFullscreenImage(selectedEvent.image_url)}
                style={{
                  width: '100%', height: 'auto',
                  display: 'block', cursor: 'pointer',
                }}
              />
            ) : (
              <div style={{
                height: '160px',
                backgroundColor: '#cc0000',
              }} />
            )}

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
                  marginTop: '24px', width: '100%',
                  backgroundColor: '#cc0000', color: '#fff',
                  border: 'none', borderRadius: '8px',
                  padding: '12px', fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.95rem',
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
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
          >
            <img
              src={fullscreenImage}
              alt="Event fullscreen"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
            />
            <button
              onClick={() => setFullscreenImage(null)}
              style={{
                position: 'absolute', top: '12px', right: '12px',
                backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff',
                border: 'none', borderRadius: '50%',
                width: '40px', height: '40px',
                fontSize: '1.2rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}

function EventCard({ event, isPast, onClick }) {
  const gameColor = '#cc0000';
  const eventDate = new Date(event.event_date);

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        overflow: 'hidden',
        display: 'flex',
        borderLeft: `5px solid ${gameColor}`,
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
      }}
    >
      {/* Date Column */}
      <div style={{
        backgroundColor: gameColor,
        color: '#fff',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '90px',
      }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>
          {eventDate.getDate()}
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
          {eventDate.toLocaleString('en-PH', { month: 'short' })}
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
          {eventDate.getFullYear()}
        </div>
      </div>

      {/* Event Info */}
      <div style={{ padding: '20px 24px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: gameColor, color: '#fff',
            padding: '3px 10px', borderRadius: '4px',
            fontSize: '0.72rem', fontWeight: 600,
          }}>
            {event.game_type}
          </span>
          {isPast && (
            <span style={{
              backgroundColor: '#f0f0f0', color: '#999',
              padding: '3px 10px', borderRadius: '4px',
              fontSize: '0.72rem', fontWeight: 600,
            }}>
              Ended
            </span>
          )}
        </div>

        <h5 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>{event.title}</h5>

        {event.description && (
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px', lineHeight: '1.5' }}>
            {event.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#555' }}>
          {event.venue && <span>📍 {event.venue}</span>}
          {event.entry_fee > 0 && (
            <span>🎟️ Entry: ₱{parseFloat(event.entry_fee).toLocaleString('en-PH')}</span>
          )}
          {event.prize_pool && <span>🏆 Prize: {event.prize_pool}</span>}
          <span>🕐 {eventDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}