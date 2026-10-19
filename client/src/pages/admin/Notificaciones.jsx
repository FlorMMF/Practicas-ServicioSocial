import { useState } from 'react';
import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox, fmtFecha } from '../../components/ui.jsx';

const VACIA = { expediente: '', id_oferta: '', titulo: '', mensaje: '' };

export default function AdminNotificaciones() {
  const [filtro, setFiltro] = useState('');
  const notifs = useFetch(
    () => api(`/notificaciones${filtro !== '' ? `?leida=${filtro}` : ''}`),
    [filtro]
  );
  const estudiantes = useFetch(() => api('/estudiantes'));
  const ofertas = useFetch(() => api('/ofertas'));
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api('/notificaciones', {
        method: 'POST',
        body: {
          ...form,
          expediente: Number(form.expediente),
          id_oferta: Number(form.id_oferta),
        },
      });
      setAviso('Notificación enviada');
      setForm(null);
      notifs.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const marcarLeida = async (n, leida) => {
    try {
      await api(`/notificaciones/${n.id_notificacion}/leida`, {
        method: 'PATCH',
        body: { leida },
      });
      notifs.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const borrar = async (n) => {
    if (!confirm(`¿Eliminar la notificación "${n.titulo}"?`)) return;
    try {
      await api(`/notificaciones/${n.id_notificacion}`, { method: 'DELETE' });
      notifs.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Notificaciones</h4>
        <button className="btn btn-primary" onClick={() => setForm(VACIA)}>
          Nueva notificación
        </button>
      </div>
      <ErrorBox error={error || notifs.error} />
      {aviso && <div className="alert alert-success py-2">{aviso}</div>}

      {form && (
        <div className="card mb-4">
          <div className="card-header">Nueva notificación</div>
          <div className="card-body">
            <form onSubmit={guardar} className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Estudiante *</label>
                <select
                  className="form-select"
                  required
                  value={form.expediente}
                  onChange={(e) =>
                    setForm({ ...form, expediente: e.target.value })
                  }
                >
                  <option value="">Selecciona…</option>
                  {(estudiantes.data ?? []).map((s) => (
                    <option key={s.expediente} value={s.expediente}>
                      {s.expediente} — {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Oferta *</label>
                <select
                  className="form-select"
                  required
                  value={form.id_oferta}
                  onChange={(e) =>
                    setForm({ ...form, id_oferta: e.target.value })
                  }
                >
                  <option value="">Selecciona…</option>
                  {(ofertas.data ?? []).map((o) => (
                    <option key={o.id_oferta} value={o.id_oferta}>
                      {o.titulo} ({o.empresa})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Título *</label>
                <input
                  className="form-control"
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Mensaje *</label>
                <textarea
                  className="form-control"
                  required
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                />
              </div>
              <div className="col-12">
                <button className="btn btn-success me-2">Enviar</button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setForm(null)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-3">
        <select
          className="form-select w-auto"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option value="">Todas</option>
          <option value="false">Pendientes</option>
          <option value="true">Leídas</option>
        </select>
      </div>

      {notifs.loading ? (
        <Loading />
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover bg-white">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Título</th>
                <th>Oferta</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(notifs.data ?? []).map((n) => (
                <tr key={n.id_notificacion}>
                  <td className="small">
                    {n.estudiante}
                    <div className="text-muted">{n.expediente}</div>
                  </td>
                  <td>{n.titulo}</td>
                  <td className="small">{n.oferta}</td>
                  <td>{fmtFecha(n.fecha_creacion)}</td>
                  <td>
                    <span
                      className={`badge bg-${n.leida ? 'secondary' : 'warning'}`}
                    >
                      {n.leida ? 'Leída' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="text-nowrap">
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => marcarLeida(n, !n.leida)}
                    >
                      {n.leida ? 'Marcar pendiente' : 'Marcar leída'}
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => borrar(n)}
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
