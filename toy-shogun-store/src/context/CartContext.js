// CartContext.js
// Global cart state for the public e-commerce site.
// Wraps the public-facing pages so any component can access or modify the cart.

import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // addToCart: adds a product or increases quantity if already in cart
  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  // updateQuantity: sets a specific quantity for a cart item
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCartItems(prev =>
      prev.map(item => item.id === productId ? { ...item, quantity } : item)
    );
  };

  // removeFromCart: removes a product entirely from the cart
  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  // clearCart: empties the cart (called after successful order)
  const clearCart = () => setCartItems([]);

  // cartTotal: sum of all item subtotals
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity, 0
  );

  // cartCount: total number of items in cart
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, updateQuantity, removeFromCart, clearCart,
      cartTotal, cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}