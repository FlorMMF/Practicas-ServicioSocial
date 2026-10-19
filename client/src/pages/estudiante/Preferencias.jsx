import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox } from '../../components/ui.jsx';

export default function Preferencias() {
  const etiquetas = useFetch(() => api('/etiquetas?activa=true'));
  const prefs = useFetch(() => api('/me/preferencias'));
  const [sel, setSel] = useState([]);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (prefs.data) setSel(prefs.data.map((p) => p.id_etiqueta));
  }, [prefs.data]);

  const toggle = (id) =>
    setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);

  const guardar = async () => {
    setError(null);
    setAviso(null);
    try {
      await api('/me/preferencias', {
        method: 'PUT',
        body: { etiqueta_ids: sel },
      });
      setAviso('Preferencias guardadas');
      prefs.reload();
    } catch (e) {
      setError(e.message);
    }
  };

  if (etiquetas.loading || prefs.loading) return <Loading />;

  const grupos = { HABILIDAD: [], AMBITO: [] };
  for (const t of etiquetas.data ?? []) (grupos[t.tipo] ??= []).push(t);

  return (
    <>
      <h4 className="mb-1">Mis preferencias</h4>
      <p className="text-muted">
        Se usan para recomendarte ofertas relacionadas con tus intereses.
      </p>
      <ErrorBox error={error || etiquetas.error || prefs.error} />
      {aviso && <div className="alert alert-success py-2">{aviso}</div>}
      {Object.entries(grupos).map(([tipo, items]) => (
        <div className="card mb-3" key={tipo}>
          <div className="card-header">{tipo}</div>
          <div className="card-body">
            {items.map((t) => (
              <div className="form-check" key={t.id_etiqueta}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={`p-${t.id_etiqueta}`}
                  checked={sel.includes(t.id_etiqueta)}
                  onChange={() => toggle(t.id_etiqueta)}
                />
                <label className="form-check-label" htmlFor={`p-${t.id_etiqueta}`}>
                  <strong>{t.titulo}</strong>
                  <span className="text-muted small"> — {t.descripcion}</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button className="btn btn-primary" onClick={guardar}>
        Guardar preferencias
      </button>
    </>
  );
}
