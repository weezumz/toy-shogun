// App.js — toy-shogun-store
// Public e-commerce app for Toy Shogun.
// Shares the same Supabase database as the admin app.
// No authentication required — fully public facing.

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

import ProductDetail from './pages/ProductDetail';
import Shop from './pages/Shop';
import PreOrders from './pages/PreOrders';
import Events from './pages/Events';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Home from './pages/Home';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          {/* Default route → redirect to shop */}
          <Route path="/" element={<Home />} />

          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ProductDetail />} />
          <Route path="/preorders" element={<PreOrders />} />
          <Route path="/events" element={<Events />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<OrderSuccess />} />

          {/* Catch-all → redirect to shop */}
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}