import { useCallback, useEffect, useState } from 'react';

export const Loading = () => (
  <div className="text-center py-5">
    <div className="spinner-border" role="status" />
  </div>
);

export const ErrorBox = ({ error }) =>
  error ? (
    <div className="alert alert-danger">{String(error.message || error)}</div>
  ) : null;

export const Chips = ({ items = [] }) => (
  <>
    {items.map((e) => (
      <span
        key={e.id ?? e.id_etiqueta ?? e.titulo}
        className={`badge me-1 mb-1 ${
          e.tipo === 'HABILIDAD' ? 'bg-primary' : 'bg-success'
        }`}
        title={e.tipo}
      >
        {e.titulo}
      </span>
    ))}
  </>
);

export const fmtFecha = (f) => (f ? new Date(f).toLocaleDateString('es-MX') : '—');

export function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fn());
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, reload: load, setData };
}
