import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links =
    user?.rol === 'ADMIN'
      ? [
          ['/admin', 'Dashboard'],
          ['/admin/ofertas', 'Ofertas'],
          ['/admin/estudiantes', 'Estudiantes'],
          ['/admin/empresas', 'Empresas'],
          ['/admin/etiquetas', 'Etiquetas'],
          ['/admin/notificaciones', 'Notificaciones'],
          ['/admin/reportes', 'Reportes'],
        ]
      : [
          ['/app', 'Ofertas'],
          ['/app/recomendadas', 'Recomendadas'],
          ['/app/preferencias', 'Mis preferencias'],
          ['/app/notificaciones', 'Notificaciones'],
        ];

  const salir = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand">Prácticas y Servicio Social</span>
          <button
            className="navbar-toggler"
            data-bs-toggle="collapse"
            data-bs-target="#nav"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="nav">
            <ul className="navbar-nav me-auto">
              {links.map(([to, label]) => (
                <li className="nav-item" key={to}>
                  <NavLink end to={to} className="nav-link">
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <span className="navbar-text text-light me-3">
              {user?.nombre}
              <span className="badge bg-secondary ms-2">{user?.rol}</span>
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={salir}>
              Salir
            </button>
          </div>
        </div>
      </nav>
      <main className="container py-4">
        <Outlet />
      </main>
    </>
  );
}
