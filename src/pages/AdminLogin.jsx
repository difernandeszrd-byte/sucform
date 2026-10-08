import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { Lock } from 'lucide-react';
import logo from '../assets/logo.png';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAdmin, login } = useAdmin();
  const navigate = useNavigate();

  if (isAdmin) {
    navigate('/admin/painel');
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = login(password);
    if (ok) {
      navigate('/admin/painel');
    } else {
      setError('Senha incorreta. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div className="page-center">
      <div className="login-card">
        <div className="form-header">
          <img src={logo} alt="Logo" className="form-logo" />
          <h1>Semana Universitária Cajuruense</h1>
          <h2>
            <Lock size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Acesso Administrativo
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className={`form-input ${error ? 'is-invalid' : ''}`}
              placeholder="Digite a senha de administrador"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <span className="error-msg">{error}</span>}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
