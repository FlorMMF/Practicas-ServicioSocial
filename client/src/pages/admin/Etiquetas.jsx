import { useState } from 'react';
import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox } from '../../components/ui.jsx';

const VACIA = { titulo: '', descripcion: '', tipo: 'HABILIDAD', activa: true };

export default function AdminEtiquetas() {
  const etiquetas = useFetch(() => api('/etiquetas'));
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editId) {
        await api(`/etiquetas/${editId}`, { method: 'PUT', body: form });
        setAviso('Etiqueta actualizada');
      } else {
        await api('/etiquetas', { method: 'POST', body: form });
        setAviso('Etiqueta creada');
      }
      setForm(null);
      setEditId(null);
      etiquetas.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const borrar = async (t) => {
    if (!confirm(`¿Eliminar la etiqueta "${t.titulo}"?`)) return;
    try {
      await api(`/etiquetas/${t.id_etiqueta}`, { method: 'DELETE' });
      setAviso('Etiqueta eliminada');
      etiquetas.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const toggleActiva = async (t) => {
    try {
      await api(`/etiquetas/${t.id_etiqueta}`, {
        method: 'PUT',
        body: {
          titulo: t.titulo,
          descripcion: t.descripcion,
          tipo: t.tipo,
          activa: !t.activa,
        },
      });
      etiquetas.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Etiquetas</h4>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(VACIA);
            setEditId(null);
          }}
        >
          Nueva etiqueta
        </button>
      </div>
      <ErrorBox error={error || etiquetas.error} />
      {aviso && <div className="alert alert-success py-2">{aviso}</div>}

      {form && (
        <div className="card mb-4">
          <div className="card-header">
            {editId ? 'Editar etiqueta' : 'Nueva etiqueta'}
          </div>
          <div className="card-body">
            <form onSubmit={guardar} className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Título *</label>
                <input
                  className="form-control"
                  required
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div className="col-md-5">
                <label className="form-label">Descripción *</label>
                <input
                  className="form-control"
                  required
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Tipo *</label>
                <select
                  className="form-select"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  {['HABILIDAD', 'AMBITO'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="activa"
                    checked={form.activa}
                    onChange={(e) =>
                      setForm({ ...form, activa: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor="activa">
                    Activa
                  </label>
                </div>
              </div>
              <div className="col-12">
                <button className="btn btn-success me-2">Guardar</button>
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

      {etiquetas.loading ? (
        <Loading />
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover bg-white">
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Activa</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(etiquetas.data ?? []).map((t) => (
                <tr key={t.id_etiqueta}>
                  <td>{t.id_etiqueta}</td>
                  <td>{t.titulo}</td>
                  <td className="small">{t.descripcion}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        t.tipo === 'HABILIDAD' ? 'primary' : 'success'
                      }`}
                    >
                      {t.tipo}
                    </span>
                  </td>
                  <td>
                    <div className="form-check form-switch">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={t.activa}
                        onChange={() => toggleActiva(t)}
                      />
                    </div>
                  </td>
                  <td className="text-nowrap">
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => {
                        setForm({
                          titulo: t.titulo,
                          descripcion: t.descripcion,
                          tipo: t.tipo,
                          activa: t.activa,
                        });
                        setEditId(t.id_etiqueta);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => borrar(t)}
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
