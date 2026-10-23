import { createContext, useContext, useState } from 'react';

const AdminContext = createContext(null);

const getAdminPassword = () => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_ADMIN_PASSWORD) {
    return window.__ENV__.VITE_ADMIN_PASSWORD;
  }
  return import.meta.env.VITE_ADMIN_PASSWORD || 'cajuru@2026';
};

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem('admin_session') === 'true';
  });

  const login = (password) => {
    const expectedPassword = getAdminPassword();
    if (password === expectedPassword) {
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
