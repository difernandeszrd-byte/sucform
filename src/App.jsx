import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AdminProvider } from './context/AdminContext';
import Navbar from './components/Navbar';
import InscricaoForm from './pages/InscricaoForm';
import AdminLogin from './pages/AdminLogin';
import AdminPainel from './pages/AdminPainel';
import AdminInscritos from './pages/AdminInscritos';

export default function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<InscricaoForm />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/painel" element={<AdminPainel />} />
            <Route path="/admin/inscritos" element={<AdminInscritos />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AdminProvider>
  );
}
