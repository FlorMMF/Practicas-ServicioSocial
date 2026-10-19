import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox, fmtFecha } from '../../components/ui.jsx';

export default function Dashboard() {
  const conteo = useFetch(() => api('/reportes/conteo-tipo'));
  const ofertas = useFetch(() => api('/ofertas'));
  const estudiantes = useFetch(() => api('/estudiantes'));
  const empresas = useFetch(() => api('/empresas'));
  const pendientes = useFetch(() => api('/reportes/notificaciones-pendientes'));

  if (ofertas.loading) return <Loading />;
  const err =
    conteo.error ||
    ofertas.error ||
    estudiantes.error ||
    empresas.error ||
    pendientes.error;

  const cards = [
    ['Ofertas publicadas', ofertas.data?.length, 'primary'],
    ['Estudiantes', estudiantes.data?.length, 'success'],
    ['Empresas', empresas.data?.length, 'info'],
    ['Notificaciones pendientes', pendientes.data?.length, 'warning'],
  ];

  return (
    <>
      <h4 className="mb-4">Dashboard</h4>
      <ErrorBox error={err} />
      <div className="row g-3 mb-4">
        {cards.map(([titulo, valor, color]) => (
          <div className="col-md-3" key={titulo}>
            <div className={`card border-${color}`}>
              <div className="card-body">
                <div className="text-muted small">{titulo}</div>
                <div className="fs-2 fw-bold">{valor ?? '—'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="row g-3">
        <div className="col-md-5">
          <div className="card">
            <div className="card-header">Tipo de oferta</div>
            <table className="table mb-0">
              <tbody>
                {(conteo.data ?? []).map((r) => (
                  <tr key={r.tipo_oferta}>
                    <td>{r.tipo_oferta}</td>
                    <td className="text-end fw-bold">{r.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card">
            <div className="card-header">Próximas ofertas</div>
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Oferta</th>
                  <th>Empresa</th>
                  <th>Inicio</th>
                </tr>
              </thead>
              <tbody>
                {(ofertas.data ?? []).slice(0, 5).map((o) => (
                  <tr key={o.id_oferta}>
                    <td>{o.titulo}</td>
                    <td>{o.empresa}</td>
                    <td>{fmtFecha(o.fecha_comienzo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
