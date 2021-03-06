import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {
      const newCart = [...cart];
      const { data } = await api.get<Stock>(`/stock/${productId}`);
      const productExists = newCart.find(product => product.id === productId);
      const currentAmount = productExists ? productExists.amount : 0;

      if((currentAmount + 1) > data.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExists)
      {
        productExists.amount++;
      } else {
        
        const { data: newProduct } = await api.get<Product>(`/products/${productId}`);
        newProduct.amount = 1;
        newCart.push(newProduct)
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);

      if(!productExists)
      {
        toast.error('Erro na remoção do produto');
        return
      }
      
      const newCart = cart.filter(product => product.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = [...cart];
      const { data } = await api.get(`/stock/${productId}`);
      const productExists = newCart.find(product => product.id === productId);

      if(amount > data.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(amount <= 0){
        return;
      }

      if(productExists)
        productExists.amount = amount;

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
