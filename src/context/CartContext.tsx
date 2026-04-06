"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from "next-auth/react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  slug: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Record<string, unknown>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  syncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status: sessionStatus } = useSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check auth status and load cart
  useEffect(() => {
    const init = async () => {
      // Load localStorage cart first (instant)
      const savedCart = localStorage.getItem('koda_cart');
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch {
          // ignore parse error
        }
      }

      if (sessionStatus === "authenticated") {
        setIsAuthenticated(true);
        await syncFromServer();
      } else if (sessionStatus === "unauthenticated") {
        setIsAuthenticated(false);
      }
      
      setInitialized(true);
    };
    init();
  }, [sessionStatus]);

  // Save to localStorage whenever cart changes (after init)
  useEffect(() => {
    if (initialized) {
      localStorage.setItem('koda_cart', JSON.stringify(cart));
    }
  }, [cart, initialized]);

  const syncFromServer = useCallback(async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setCart(data.items);
        }
      }
    } catch {
      // Fall back to localStorage
    } finally {
      setSyncing(false);
    }
  }, []);

  const addToCart = (product: Record<string, unknown>, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === (product.id as string));
      if (existing) {
        return prev.map(item => 
          item.id === (product.id as string) ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      const images = Array.isArray(product.images) 
        ? product.images 
        : (() => { try { return JSON.parse((product.images as string) || "[]"); } catch { return []; } })();
      return [...prev, { 
        id: product.id as string, 
        name: product.name as string, 
        price: (product.salePrice || product.price) as number, 
        quantity, 
        image: (images[0] as string) || "/placeholder.png", 
        slug: product.slug as string, 
      }];
    });

    // Sync to server if authenticated
    if (isAuthenticated) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      }).catch(() => {});
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));

    if (isAuthenticated) {
      fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      }).catch(() => {});
    }
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('koda_cart');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount, syncing }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
