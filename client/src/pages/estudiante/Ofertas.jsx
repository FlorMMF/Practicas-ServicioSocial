import { useState } from 'react';
import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox, Chips, fmtFecha } from '../../components/ui.jsx';

export default function Ofertas() {
  const [filtros, setFiltros] = useState({
    modalidad: '',
    servicio_social: '',
    q: '',
  });
  const qs = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== '')
  ).toString();
  const { data, loading, error } = useFetch(
    () => api(`/ofertas?disponibles=1${qs ? `&${qs}` : ''}`),
    [qs]
  );

  return (
    <>
      <h4 className="mb-3">Ofertas disponibles</h4>
      <ErrorBox error={error} />
      <div className="card mb-3">
        <div className="card-body row g-2">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Buscar…"
              value={filtros.q}
              onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filtros.modalidad}
              onChange={(e) =>
                setFiltros({ ...filtros, modalidad: e.target.value })
              }
            >
              <option value="">Modalidad</option>
              {['PRESENCIAL', 'HÍBRIDA', 'REMOTA'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filtros.servicio_social}
              onChange={(e) =>
                setFiltros({ ...filtros, servicio_social: e.target.value })
              }
            >
              <option value="">Tipo</option>
              <option value="true">Servicio social</option>
              <option value="false">Prácticas profesionales</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : !data?.length ? (
        <p className="text-muted">No hay ofertas que coincidan.</p>
      ) : (
        <div className="row g-3">
          {data.map((o) => (
            <div className="col-md-6" key={o.id_oferta}>
              <div className="card h-100 oferta-card">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <h6 className="card-title mb-1">{o.titulo}</h6>
                    <span
                      className={`badge bg-${
                        o.servicio_social ? 'success' : 'info'
                      } align-self-start`}
                    >
                      {o.servicio_social ? 'Servicio social' : 'Prácticas'}
                    </span>
                  </div>
                  <div className="text-muted small mb-2">
                    {o.empresa} · {o.ubicacion || '—'} · {o.modalidad || '—'}
                  </div>
                  <p className="card-text small">{o.descripcion}</p>
                  <div className="mb-2">
                    <Chips items={o.etiquetas} />
                  </div>
                  <div className="small text-muted">
                    Cupo: {o.cupo} · {fmtFecha(o.fecha_comienzo)} →{' '}
                    {fmtFecha(o.fecha_fin)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
