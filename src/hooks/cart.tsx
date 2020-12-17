import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );
      if (cartProducts) {
        setProducts([...JSON.parse(cartProducts)]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productInTheCart = products.find(p => p.id === product.id);

      if (productInTheCart) {
        const updatedCart = products.map(p => {
          if (p.id === product.id) {
            return { ...product, quantity: p.quantity + 1 };
          }
          return p;
        });
        setProducts(updatedCart);
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedCart = products.map(p => {
        if (p.id === id) {
          return { ...p, quantity: p.quantity + 1 };
        }
        return p;
      });
      setProducts(updatedCart);
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedCart),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedCart = products.map(p => {
        if (p.id === id && p.quantity > 0) {
          return { ...p, quantity: p.quantity - 1 };
        }
        return p;
      });

      const negativeQuantityIndex = updatedCart.findIndex(p => {
        return p.quantity === 0;
      });

      if (negativeQuantityIndex !== -1) {
        updatedCart.splice(negativeQuantityIndex, 1);
      }
      setProducts(updatedCart);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(updatedCart),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
