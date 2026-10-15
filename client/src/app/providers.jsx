import { createContext, useContext } from 'react';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider.jsx';
import { CartProvider } from '../features/cart/CartProvider.jsx';
import { useResource } from '../lib/useResource.js';
import { flattenCategories } from '../lib/format.js';

const CategoriesContext = createContext(null);
export const useCategories = () => useContext(CategoriesContext);
function CategoriesProvider({ children }) {
  const resource = useResource('/categories', { auth: false });
  return (
    <CategoriesContext.Provider
      value={{
        ...resource,
        categories: resource.data || [],
        flat: flattenCategories(resource.data || []),
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}
export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <AccountScope>{children}</AccountScope>
      </CategoriesProvider>
    </AuthProvider>
  );
}
function AccountScope({ children }) {
  const { user } = useAuth();
  // Drop all private page/cart state when switching accounts.
  return <CartProvider key={user?.id || 'guest'}>{children}</CartProvider>;
}
