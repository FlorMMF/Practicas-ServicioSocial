import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox, fmtFecha } from '../../components/ui.jsx';

export default function Recomendadas() {
  const { data, loading, error } = useFetch(() =>
    api('/me/ofertas-recomendadas')
  );

  return (
    <>
      <h4 className="mb-1">Ofertas recomendadas</h4>
      <p className="text-muted">
        Coinciden con las etiquetas de tus preferencias.
      </p>
      <ErrorBox error={error} />
      {loading ? (
        <Loading />
      ) : !data?.length ? (
        <p className="text-muted">
          No hay coincidencias. Revisa tus preferencias.
        </p>
      ) : (
        <div className="row g-3">
          {data.map((o) => (
            <div className="col-md-6" key={o.id_oferta}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <h6 className="card-title mb-1">{o.titulo}</h6>
                    <span className="badge bg-warning text-dark align-self-start">
                      {o.coincidencias} coincidencia
                      {o.coincidencias === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="text-muted small mb-2">
                    {o.empresa} · {o.ubicacion || '—'} · {o.modalidad || '—'}
                  </div>
                  <p className="card-text small">{o.descripcion}</p>
                  <div className="mb-2">
                    {o.etiquetas_coincidentes.map((t) => (
                      <span key={t} className="badge bg-success me-1">
                        {t}
                      </span>
                    ))}
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
