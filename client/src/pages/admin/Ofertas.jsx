import { useState } from 'react';
import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox, Chips, fmtFecha } from '../../components/ui.jsx';

const VACIA = {
  id_empresa: '',
  titulo: '',
  descripcion: '',
  modalidad: 'PRESENCIAL',
  ubicacion: '',
  servicio_social: false,
  cupo: 1,
  fecha_comienzo: '',
  fecha_fin: '',
  etiqueta_ids: [],
};

const MODALIDADES = ['PRESENCIAL', 'HÍBRIDA', 'REMOTA'];

export default function AdminOfertas() {
  const [filtros, setFiltros] = useState({
    modalidad: '',
    servicio_social: '',
    empresa: '',
    etiqueta: '',
    q: '',
  });
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''))
  ).toString();
  const ofertas = useFetch(() => api(`/ofertas${qs ? `?${qs}` : ''}`), [qs]);
  const empresas = useFetch(() => api('/empresas'));
  const etiquetas = useFetch(() => api('/etiquetas?activa=true'));

  const [form, setForm] = useState(null); // null = formulario oculto
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        ...form,
        id_empresa: Number(form.id_empresa),
        cupo: Number(form.cupo),
        fecha_comienzo: form.fecha_comienzo || null,
        fecha_fin: form.fecha_fin || null,
      };
      if (editId) {
        await api(`/ofertas/${editId}`, { method: 'PUT', body });
        setAviso('Oferta actualizada');
      } else {
        await api('/ofertas', { method: 'POST', body });
        setAviso('Oferta creada');
      }
      setForm(null);
      setEditId(null);
      ofertas.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const editar = (o) => {
    setEditId(o.id_oferta);
    setForm({
      id_empresa: o.id_empresa,
      titulo: o.titulo,
      descripcion: o.descripcion,
      modalidad: o.modalidad || 'PRESENCIAL',
      ubicacion: o.ubicacion || '',
      servicio_social: o.servicio_social,
      cupo: o.cupo,
      fecha_comienzo: o.fecha_comienzo?.slice(0, 10) || '',
      fecha_fin: o.fecha_fin?.slice(0, 10) || '',
      etiqueta_ids: o.etiquetas.map((t) => t.id),
    });
    setAviso(null);
    setError(null);
  };

  const borrar = async (o) => {
    if (!confirm(`¿Eliminar la oferta "${o.titulo}"?`)) return;
    try {
      await api(`/ofertas/${o.id_oferta}`, { method: 'DELETE' });
      setAviso('Oferta eliminada');
      ofertas.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const toggleEtiqueta = (id) =>
    setForm({
      ...form,
      etiqueta_ids: form.etiqueta_ids.includes(id)
        ? form.etiqueta_ids.filter((x) => x !== id)
        : [...form.etiqueta_ids, id],
    });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Ofertas</h4>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(VACIA);
            setEditId(null);
            setError(null);
          }}
        >
          Nueva oferta
        </button>
      </div>
      <ErrorBox error={error || ofertas.error} />
      {aviso && <div className="alert alert-success py-2">{aviso}</div>}

      {form && (
        <div className="card mb-4">
          <div className="card-header">
            {editId ? `Editar oferta #${editId}` : 'Nueva oferta'}
          </div>
          <div className="card-body">
            <form onSubmit={guardar}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Título *</label>
                  <input
                    className="form-control"
                    required
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Empresa *</label>
                  <select
                    className="form-select"
                    required
                    value={form.id_empresa}
                    onChange={(e) =>
                      setForm({ ...form, id_empresa: e.target.value })
                    }
                  >
                    <option value="">Selecciona…</option>
                    {(empresas.data ?? []).map((em) => (
                      <option key={em.id_empresa} value={em.id_empresa}>
                        {em.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Descripción *</label>
                  <textarea
                    className="form-control"
                    required
                    value={form.descripcion}
                    onChange={(e) =>
                      setForm({ ...form, descripcion: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Modalidad</label>
                  <select
                    className="form-select"
                    value={form.modalidad}
                    onChange={(e) =>
                      setForm({ ...form, modalidad: e.target.value })
                    }
                  >
                    {MODALIDADES.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Ubicación</label>
                  <input
                    className="form-control"
                    value={form.ubicacion}
                    onChange={(e) =>
                      setForm({ ...form, ubicacion: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Cupo *</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    required
                    value={form.cupo}
                    onChange={(e) => setForm({ ...form, cupo: e.target.value })}
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Inicio</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.fecha_comienzo}
                    onChange={(e) =>
                      setForm({ ...form, fecha_comienzo: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-2">
                  <label className="form-label">Fin</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.fecha_fin}
                    onChange={(e) =>
                      setForm({ ...form, fecha_fin: e.target.value })
                    }
                  />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="ss"
                      checked={form.servicio_social}
                      onChange={(e) =>
                        setForm({ ...form, servicio_social: e.target.checked })
                      }
                    />
                    <label className="form-check-label" htmlFor="ss">
                      Es servicio social
                    </label>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label d-block">Etiquetas</label>
                  {(etiquetas.data ?? []).map((t) => (
                    <div
                      className="form-check form-check-inline"
                      key={t.id_etiqueta}
                    >
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`et-${t.id_etiqueta}`}
                        checked={form.etiqueta_ids.includes(t.id_etiqueta)}
                        onChange={() => toggleEtiqueta(t.id_etiqueta)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`et-${t.id_etiqueta}`}
                      >
                        {t.titulo}
                        <small className="text-muted"> ({t.tipo})</small>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-success me-2">Guardar</button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setForm(null);
                    setEditId(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card mb-3">
        <div className="card-body row g-2">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Buscar…"
              value={filtros.q}
              onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={filtros.modalidad}
              onChange={(e) =>
                setFiltros({ ...filtros, modalidad: e.target.value })
              }
            >
              <option value="">Modalidad</option>
              {MODALIDADES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={filtros.servicio_social}
              onChange={(e) =>
                setFiltros({ ...filtros, servicio_social: e.target.value })
              }
            >
              <option value="">Tipo</option>
              <option value="true">Servicio social</option>
              <option value="false">Prácticas</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filtros.empresa}
              onChange={(e) =>
                setFiltros({ ...filtros, empresa: e.target.value })
              }
            >
              <option value="">Empresa</option>
              {(empresas.data ?? []).map((em) => (
                <option key={em.id_empresa} value={em.id_empresa}>
                  {em.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={filtros.etiqueta}
              onChange={(e) =>
                setFiltros({ ...filtros, etiqueta: e.target.value })
              }
            >
              <option value="">Etiqueta</option>
              {(etiquetas.data ?? []).map((t) => (
                <option key={t.id_etiqueta} value={t.id_etiqueta}>
                  {t.titulo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {ofertas.loading ? (
        <Loading />
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover bg-white">
            <thead>
              <tr>
                <th>#</th>
                <th>Título</th>
                <th>Empresa</th>
                <th>Modalidad</th>
                <th>Ubicación</th>
                <th>Tipo</th>
                <th>Cupo</th>
                <th>Inicio</th>
                <th>Etiquetas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(ofertas.data ?? []).map((o) => (
                <tr key={o.id_oferta}>
                  <td>{o.id_oferta}</td>
                  <td>{o.titulo}</td>
                  <td>{o.empresa}</td>
                  <td>{o.modalidad || '—'}</td>
                  <td>{o.ubicacion || '—'}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        o.servicio_social ? 'success' : 'info'
                      }`}
                    >
                      {o.servicio_social ? 'Servicio social' : 'Prácticas'}
                    </span>
                  </td>
                  <td>{o.cupo}</td>
                  <td>{fmtFecha(o.fecha_comienzo)}</td>
                  <td>
                    <Chips items={o.etiquetas} />
                  </td>
                  <td className="text-nowrap">
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => editar(o)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => borrar(o)}
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
