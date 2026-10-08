import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext(null);

// Senha do admin (mesma lógica do Flask — aqui simplificamos com variável de ambiente)
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'cajuru@2026';

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('admin_session') === 'true';
  });

  const login = (password) => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_session', 'true');
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('admin_session');
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
