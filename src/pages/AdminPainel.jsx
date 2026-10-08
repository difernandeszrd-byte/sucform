import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { getInscricoes, getInscricoesAtivas, setInscricoesAtivas } from '../services/firestore';
import { Users, Star, ToggleLeft, ToggleRight, Table2, Download, LogOut } from 'lucide-react';
import logo from '../assets/logo.png';

export default function AdminPainel() {
  const { isAdmin, logout } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, chefes: 0 });
  const [ativas, setAtivas] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!isAdmin) { navigate('/admin'); return; }
    loadData();
  }, [isAdmin]);

  async function loadData() {
    const [inscritos, status] = await Promise.all([
      getInscricoes(),
      getInscricoesAtivas(),
    ]);
    setStats({
      total: inscritos.length,
      chefes: inscritos.filter(i => i.chefe_de_equipe).length,
    });
    setAtivas(status);
  }

  async function handleToggle() {
    setToggling(true);
    await setInscricoesAtivas(!ativas);
    setAtivas(!ativas);
    setToggling(false);
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="form-header">
          <img src={logo} alt="Logo" className="form-logo" />
          <h1>Semana Universitária Cajuruense</h1>
          <h2>Painel Administrativo</h2>
        </div>

        {/* Status banner */}
        {ativas !== null && (
          <div className={`status-banner ${ativas ? 'status-open' : 'status-closed'}`}>
            <strong>Status das inscrições:</strong>{' '}
            {ativas ? (
              <span className="badge badge-open">ABERTAS</span>
            ) : (
              <span className="badge badge-closed">FECHADAS / PAUSADAS</span>
            )}
            {ativas
              ? ' — Os participantes podem se inscrever normalmente'
              : ' — O formulário de inscrição está bloqueado'}
          </div>
        )}

        {/* Stats cards */}
        <div className="stats-grid">
          <div className="stat-card stat-blue">
            <Users size={40} />
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total de Inscritos</div>
          </div>
          <div className="stat-card stat-green">
            <Star size={40} />
            <div className="stat-number">{stats.chefes}</div>
            <div className="stat-label">Interessados em Chefe de Equipe</div>
          </div>
        </div>

        {/* Action cards */}
        <div className="action-grid">
          <div className="action-card">
            <div className="action-card-header">
              {ativas ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              Controle de Inscrições
            </div>
            <div className="action-card-body">
              <button
                className={`btn-action ${ativas ? 'btn-danger' : 'btn-success'}`}
                onClick={handleToggle}
                disabled={toggling || ativas === null}
              >
                {toggling
                  ? 'Salvando...'
                  : ativas
                  ? '⏸ Fechar / Pausar Inscrições'
                  : '▶ Abrir Inscrições'}
              </button>
              <p className="action-hint">Altere se as inscrições estão abertas ou fechadas</p>
            </div>
          </div>

          <div className="action-card">
            <div className="action-card-header">
              <Table2 size={20} />
              Gerenciar Inscrições
            </div>
            <div className="action-card-body">
              <Link to="/admin/inscritos" className="btn-action btn-secondary">
                <Table2 size={16} /> Ver Lista de Inscritos
              </Link>
              <p className="action-hint">Visualize, busque e exclua inscrições</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="admin-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} /> Sair do Painel
          </button>
        </div>
      </div>
    </div>
  );
}
