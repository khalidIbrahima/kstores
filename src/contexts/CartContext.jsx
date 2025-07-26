import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

const CART_STORAGE_KEY = 'kapital_store_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Failed to parse cart from localStorage:', error);
      return [];
    }
  });

  const itemCount = items.reduce((total, item) => total + (parseInt(item.quantity) || 0), 0);
  const total = items.reduce((sum, item) => sum + (item.price * (parseInt(item.quantity) || 0)), 0);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [items]);

  const addItem = (product, quantity = 1, selectedColor = null) => {
    if (!product) return;

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      toast.error('Invalid quantity');
      return;
    }

    setItems(currentItems => {
      const itemKey = selectedColor ? `${product.id}-${selectedColor.name}` : product.id;
      const existingItem = currentItems.find(item => {
        const existingKey = item.selectedColor ? `${item.id}-${item.selectedColor.name}` : item.id;
        return existingKey === itemKey;
      });
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + parsedQuantity;
        
        if (product.inventory && newQuantity > product.inventory) {
          toast.error(`Only ${product.inventory} items available in stock`);
          return currentItems;
        }

        const updatedItems = currentItems.map(item => {
          const existingKey = item.selectedColor ? `${item.id}-${item.selectedColor.name}` : item.id;
          return existingKey === itemKey
            ? { ...item, quantity: newQuantity }
            : item;
        });
        toast.success(`Updated ${product.name}${selectedColor ? ` (${selectedColor.name})` : ''} quantity in cart`);
        return updatedItems;
      } else {
        if (product.inventory && parsedQuantity > product.inventory) {
          toast.error(`Only ${product.inventory} items available in stock`);
          return currentItems;
        }

        toast.success(`Added ${product.name}${selectedColor ? ` (${selectedColor.name})` : ''} to cart`);
        return [...currentItems, { 
          id: product.id,
          name: product.name,
          price: product.price,
          image_url: product.image_url,
          inventory: product.inventory,
          quantity: parsedQuantity,
          selectedColor: selectedColor
        }];
      }
    });
  };

  const updateQuantity = (id, quantity) => {
    if (!id) return;
    
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity)) {
      toast.error('Invalid quantity');
      return;
    }

    setItems(currentItems => {
      const item = currentItems.find(item => item.id === id);
      
      if (!item) return currentItems;

      if (parsedQuantity < 1) {
        return currentItems.filter(item => item.id !== id);
      }

      if (item.inventory && parsedQuantity > item.inventory) {
        toast.error(`Only ${item.inventory} items available in stock`);
        return currentItems;
      }

      return currentItems.map(item =>
        item.id === id ? { ...item, quantity: parsedQuantity } : item
      );
    });
  };

  const removeItem = (id) => {
    if (!id) return;

    setItems(currentItems => {
      const item = currentItems.find(item => item.id === id);
      if (item) {
        toast.success(`Removed ${item.name} from cart`);
      }
      return currentItems.filter(item => item.id !== id);
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    toast.success('Cart cleared');
  };

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
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}