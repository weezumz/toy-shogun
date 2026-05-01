// Layout.js
// This is the shared layout wrapper used by all protected pages.
// It renders the Sidebar on the left and the page content on the right.
// Any page that imports Layout automatically gets the sidebar for free.

import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    // Flexbox row: sidebar on the left, content fills the rest
    <div style={{ display: 'flex' }}>

      {/* Sidebar is fixed position — always visible on the left */}
      <Sidebar />

      {/* Main content area — offset by sidebar width (240px) */}
      <div style={{
        marginLeft: '240px',   // Must match the sidebar width exactly
        flex: 1,               // Takes up all remaining horizontal space
        minHeight: '100vh',    // Full page height
        backgroundColor: '#f0f2f5',
        padding: '32px',
      }}>
        {/* Render whatever page content is passed between <Layout> tags */}
        {children}
      </div>
    </div>
  );
}