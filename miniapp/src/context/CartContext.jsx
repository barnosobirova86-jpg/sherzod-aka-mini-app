import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'kisva_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode */
    }
  }, [items]);

  const lineKey = (productId, size) => `${productId}__${size || ''}`;

  function addItem(product, size = null, qty = 1) {
    setItems((prev) => {
      const key = lineKey(product.id, size);
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency || 'UZS',
          oldPrice: product.oldPrice,
          imageUrl: product.imageUrl,
          size,
          qty,
        },
      ];
    });
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function changeQty(key, delta) {
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  function clearCart() {
    setItems([]);
  }

  // Har bir valyuta bo‘yicha alohida jami (savatchada UZS va USD mahsulotlar
  // aralash bo‘lishi mumkin, shuning uchun ular birlashtirilmaydi)
  const totalsByCurrency = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const currency = item.currency || 'UZS';
      map.set(currency, (map.get(currency) || 0) + item.price * item.qty);
    }
    return [...map.entries()].map(([currency, amount]) => ({ currency, amount }));
  }, [items]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  const value = { items, addItem, removeItem, changeQty, clearCart, totalsByCurrency, count };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
