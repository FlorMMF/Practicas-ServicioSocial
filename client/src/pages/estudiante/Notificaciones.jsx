import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox, fmtFecha } from '../../components/ui.jsx';

export default function Notificaciones() {
  const { data, loading, error, reload, setData } = useFetch(() =>
    api('/me/notificaciones')
  );
  const pendientes = data?.filter((n) => !n.leida).length ?? 0;

  const marcar = async (n) => {
    try {
      await api(`/me/notificaciones/${n.id_notificacion}/leida`, {
        method: 'PATCH',
      });
      setData(
        data.map((x) =>
          x.id_notificacion === n.id_notificacion ? { ...x, leida: true } : x
        )
      );
    } catch {
      reload();
    }
  };

  return (
    <>
      <h4 className="mb-1">Mis notificaciones</h4>
      <p className="text-muted">{pendientes} pendiente(s) por leer.</p>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : !data?.length ? (
        <p className="text-muted">No tienes notificaciones.</p>
      ) : (
        <div className="list-group">
          {data.map((n) => (
            <div
              key={n.id_notificacion}
              className={`list-group-item ${n.leida ? '' : 'notif-no-leida'}`}
            >
              <div className="d-flex justify-content-between">
                <h6 className="mb-1">
                  {n.titulo}
                  {!n.leida && (
                    <span className="badge bg-primary ms-2">Nueva</span>
                  )}
                </h6>
                <small className="text-muted">
                  {fmtFecha(n.fecha_creacion)}
                </small>
              </div>
              <p className="mb-1 small">{n.mensaje}</p>
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">Oferta: {n.oferta}</small>
                {!n.leida && (
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => marcar(n)}
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
