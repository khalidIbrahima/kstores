import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const CART_STORAGE_KEY = 'shopify_clone_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const { user } = useAuth();

  // Calculate derived values
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Clear cart when user logs out
  useEffect(() => {
    if (!user) {
      clearCart();
    }
  }, [user]);

  function addItem(product) {
    setItems(currentItems => {
      // Check if item already exists in cart
      const existingItemIndex = currentItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Increment quantity if item exists
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += 1;
        toast.success(`Added another ${product.name} to your cart`);
        return updatedItems;
      } else {
        // Add new item with quantity 1
        toast.success(`Added ${product.name} to your cart`);
        return [...currentItems, { ...product, quantity: 1 }];
      }
    });
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) {
      return removeItem(id);
    }
    
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  }

  function removeItem(id) {
    setItems(currentItems => {
      const item = currentItems.find(item => item.id === id);
      if (item) {
        toast.success(`Removed ${item.name} from your cart`);
      }
      return currentItems.filter(item => item.id !== id);
    });
  }

  function clearCart() {
    setItems([]);
  }

  const value = {
    items,
    itemCount,
    total,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}