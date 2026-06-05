import React, { createContext, useContext, useMemo, useRef } from 'react';


const PendingItemsContext = createContext(null);

export function PendingItemsProvider({ children }) {

  const pendingRef = useRef(null);

  const value = useMemo(() => ({
    setPendingItems: (orderId, items) => { pendingRef.current = { orderId, items }; },
    takePendingItems: (expectedOrderId) => {
      const v = pendingRef.current;
      if (!v) return null;
      if (String(v.orderId) !== String(expectedOrderId)) return null;
      pendingRef.current = null;
      return v;
    },
  }), []);

  return (
    <PendingItemsContext.Provider value={value}>
      {children}
    </PendingItemsContext.Provider>
  );
}

export function usePendingItems() {
  const ctx = useContext(PendingItemsContext);
  if (!ctx) throw new Error('usePendingItems must be used inside PendingItemsProvider');
  return ctx;
}
