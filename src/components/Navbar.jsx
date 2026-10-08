import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import logo from '../assets/logo.png';

export default function Navbar() {
  const { isAdmin, logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="Logo Semana Universitária Cajuruense" className="navbar-logo" />
          <span className="navbar-title">SUC</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-link">Inscrição</Link>
          {isAdmin ? (
            <>
              <Link to="/admin/painel" className="nav-link">Painel</Link>
              <Link to="/admin/inscritos" className="nav-link">Inscritos</Link>
              <button onClick={handleLogout} className="btn-nav-logout">Sair</button>
            </>
          ) : (
            <Link to="/admin" className="nav-link nav-link-admin">Admin</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
