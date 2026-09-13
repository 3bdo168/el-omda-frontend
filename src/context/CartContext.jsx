import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isTrader } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('el_omda_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('el_omda_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [items]);

  // Helper to determine unit price based on user type and quantity
  const getProductUnitPrice = (product, quantity) => {
    if (!product) return 0;
    if (isTrader && product.pricingTiers && product.pricingTiers.length > 0) {
      const matchingTier = product.pricingTiers.find((tier) => {
        const aboveMin = quantity >= tier.minQuantity;
        const belowMax = tier.maxQuantity === null || quantity <= tier.maxQuantity;
        return aboveMin && belowMax;
      });
      if (matchingTier) return parseFloat(matchingTier.price);
    }
    return parseFloat(product.retailPrice);
  };

  const addToCart = (product, qty = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      const minQty = isTrader ? product.minOrderQtyWholesale || 1 : product.minOrderQtyRetail || 1;
      const initialQty = Math.max(qty, minQty);

      if (existingIndex > -1) {
        const newItems = [...prev];
        const newQty = newItems[existingIndex].quantity + qty;
        newItems[existingIndex] = {
          product,
          quantity: newQty,
        };
        return newItems;
      } else {
        return [...prev, { product, quantity: initialQty }];
      }
    });
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponCode('');
  };

  // Calculations
  const calculatedItems = items.map((item) => {
    const unitPrice = getProductUnitPrice(item.product, item.quantity);
    const totalPrice = unitPrice * item.quantity;
    const minQty = isTrader
      ? item.product.minOrderQtyWholesale || 1
      : item.product.minOrderQtyRetail || 1;
    const isValidMinQty = item.quantity >= minQty;

    return {
      ...item,
      unitPrice,
      totalPrice,
      minQty,
      isValidMinQty,
    };
  });

  const subtotal = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * parseFloat(appliedCoupon.discountValue)) / 100;
    } else {
      discountAmount = Math.min(subtotal, parseFloat(appliedCoupon.discountValue));
    }
  }

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: calculatedItems,
        rawItems: items,
        totalCount,
        subtotal,
        discountAmount,
        totalAmount,
        couponCode,
        setCouponCode,
        appliedCoupon,
        setAppliedCoupon,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getProductUnitPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
