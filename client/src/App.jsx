import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Reportes from './pages/admin/Reportes.jsx';
import AdminOfertas from './pages/admin/Ofertas.jsx';
import AdminEstudiantes from './pages/admin/Estudiantes.jsx';
import AdminEmpresas from './pages/admin/Empresas.jsx';
import AdminEtiquetas from './pages/admin/Etiquetas.jsx';
import AdminNotificaciones from './pages/admin/Notificaciones.jsx';
import Ofertas from './pages/estudiante/Ofertas.jsx';
import Preferencias from './pages/estudiante/Preferencias.jsx';
import Recomendadas from './pages/estudiante/Recomendadas.jsx';
import Notificaciones from './pages/estudiante/Notificaciones.jsx';

function RequireAuth({ rol }) {
  const { user, loading } = useAuth();
  if (loading)
    return <div className="container py-5 text-center">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (rol && user.rol !== rol) return <Navigate to="/" replace />;
  return <Outlet />;
}

function Home() {
  const { user } = useAuth();
  return <Navigate to={user?.rol === 'ADMIN' ? '/admin' : '/app'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="admin" element={<RequireAuth rol="ADMIN" />}>
                <Route index element={<Dashboard />} />
                <Route path="ofertas" element={<AdminOfertas />} />
                <Route path="estudiantes" element={<AdminEstudiantes />} />
                <Route path="empresas" element={<AdminEmpresas />} />
                <Route path="etiquetas" element={<AdminEtiquetas />} />
                <Route path="notificaciones" element={<AdminNotificaciones />} />
                <Route path="reportes" element={<Reportes />} />
              </Route>
              <Route path="app" element={<RequireAuth rol="ESTUDIANTE" />}>
                <Route index element={<Ofertas />} />
                <Route path="recomendadas" element={<Recomendadas />} />
                <Route path="preferencias" element={<Preferencias />} />
                <Route path="notificaciones" element={<Notificaciones />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
