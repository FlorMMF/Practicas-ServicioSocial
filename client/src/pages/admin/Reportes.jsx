import { useState } from 'react';
import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox, fmtFecha } from '../../components/ui.jsx';

const REPORTES = [
  ['ofertas-disponibles', '1. Ofertas disponibles'],
  ['estudiantes', '2. Estudiantes'],
  ['empresas-contactos', '3. Empresas y contactos'],
  ['preferencias', '4. Preferencias'],
  ['ofertas-etiquetas', '5. Etiquetas por oferta'],
  ['conteo-tipo', '7. SS vs Prácticas'],
  ['notificaciones-pendientes', '8. Notif. pendientes'],
];

function celda(v) {
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return fmtFecha(v);
  return v ?? '—';
}

function DataTable({ rows }) {
  if (!rows?.length) return <p className="text-muted">Sin datos.</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {cols.map((c) => (
                <td key={c}>{celda(r[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reportes() {
  const [activo, setActivo] = useState(REPORTES[0][0]);
  const { data, loading, error } = useFetch(
    () => api(`/reportes/${activo}`),
    [activo]
  );

  return (
    <>
      <h4 className="mb-3">Reportes (consultas del documento)</h4>
      <ul className="nav nav-tabs mb-3">
        {REPORTES.map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button
              className={`nav-link ${activo === key ? 'active' : ''}`}
              onClick={() => setActivo(key)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
      <ErrorBox error={error} />
      {loading ? <Loading /> : <DataTable rows={data} />}
    </>
  );
}
