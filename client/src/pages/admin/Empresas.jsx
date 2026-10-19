import { useState } from 'react';
import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox } from '../../components/ui.jsx';

const VACIA = { nombre: '', rfc: '', giro: '', estado: 'ACTIVA' };
const CONTACTO_VACIO = { nombre: '', correo: '', telefono: '', puesto: '' };

export default function AdminEmpresas() {
  const empresas = useFetch(() => api('/empresas'));
  const [form, setForm] = useState(null);
  const [editId, setEditId] = useState(null);
  const [sel, setSel] = useState(null); // empresa seleccionada para contactos
  const [contacto, setContacto] = useState(null); // formulario contacto
  const [editContacto, setEditContacto] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editId) {
        await api(`/empresas/${editId}`, { method: 'PUT', body: form });
        setAviso('Empresa actualizada');
      } else {
        await api('/empresas', { method: 'POST', body: form });
        setAviso('Empresa creada');
      }
      setForm(null);
      setEditId(null);
      empresas.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const borrar = async (em) => {
    if (
      !confirm(
        `¿Eliminar "${em.nombre}"? Se borrarán también sus ${em.num_ofertas} oferta(s) y contactos.`
      )
    )
      return;
    try {
      await api(`/empresas/${em.id_empresa}`, { method: 'DELETE' });
      setAviso('Empresa eliminada');
      if (sel?.id_empresa === em.id_empresa) setSel(null);
      empresas.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const guardarContacto = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editContacto) {
        await api(`/contactos/${editContacto}`, {
          method: 'PUT',
          body: contacto,
        });
      } else {
        await api(`/empresas/${sel.id_empresa}/contactos`, {
          method: 'POST',
          body: contacto,
        });
      }
      setContacto(null);
      setEditContacto(null);
      setAviso('Contacto guardado');
      const fresh = await api('/empresas');
      setSel(fresh.find((x) => x.id_empresa === sel.id_empresa));
      empresas.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const borrarContacto = async (c) => {
    if (!confirm(`¿Eliminar al contacto ${c.nombre}?`)) return;
    try {
      await api(`/contactos/${c.id}`, { method: 'DELETE' });
      const data = await api('/empresas');
      setSel(data.find((x) => x.id_empresa === sel.id_empresa));
      empresas.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Empresas</h4>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(VACIA);
            setEditId(null);
          }}
        >
          Nueva empresa
        </button>
      </div>
      <ErrorBox error={error || empresas.error} />
      {aviso && <div className="alert alert-success py-2">{aviso}</div>}

      {form && (
        <div className="card mb-4">
          <div className="card-header">
            {editId ? 'Editar empresa' : 'Nueva empresa'}
          </div>
          <div className="card-body">
            <form onSubmit={guardar} className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Nombre *</label>
                <input
                  className="form-control"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">RFC *</label>
                <input
                  className="form-control"
                  required
                  value={form.rfc}
                  onChange={(e) => setForm({ ...form, rfc: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Giro</label>
                <input
                  className="form-control"
                  value={form.giro}
                  onChange={(e) => setForm({ ...form, giro: e.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Estado</label>
                <select
                  className="form-select"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                >
                  {['ACTIVA', 'INACTIVA'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
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

      {empresas.loading ? (
        <Loading />
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover bg-white">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RFC</th>
                <th>Giro</th>
                <th>Estado</th>
                <th>Contactos</th>
                <th>Ofertas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(empresas.data ?? []).map((em) => (
                <tr key={em.id_empresa}>
                  <td>{em.nombre}</td>
                  <td className="small">{em.rfc}</td>
                  <td>{em.giro || '—'}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        em.estado === 'ACTIVA' ? 'success' : 'secondary'
                      }`}
                    >
                      {em.estado}
                    </span>
                  </td>
                  <td>{em.contactos.length}</td>
                  <td>{em.num_ofertas}</td>
                  <td className="text-nowrap">
                    <button
                      className="btn btn-sm btn-outline-info me-1"
                      onClick={() => {
                        setSel(sel?.id_empresa === em.id_empresa ? null : em);
                        setContacto(null);
                      }}
                    >
                      Contactos
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => {
                        setForm({
                          nombre: em.nombre,
                          rfc: em.rfc,
                          giro: em.giro || '',
                          estado: em.estado,
                        });
                        setEditId(em.id_empresa);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => borrar(em)}
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

      {sel && (
        <div className="card mt-3">
          <div className="card-header d-flex justify-content-between">
            <span>Contactos de {sel.nombre}</span>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                setContacto(CONTACTO_VACIO);
                setEditContacto(null);
              }}
            >
              Agregar contacto
            </button>
          </div>
          <div className="card-body">
            {contacto && (
              <form onSubmit={guardarContacto} className="row g-2 mb-3">
                {['nombre', 'correo', 'telefono', 'puesto'].map((k) => (
                  <div className="col-md-3" key={k}>
                    <input
                      className="form-control"
                      placeholder={k[0].toUpperCase() + k.slice(1)}
                      required={k === 'nombre'}
                      value={contacto[k]}
                      onChange={(e) =>
                        setContacto({ ...contacto, [k]: e.target.value })
                      }
                    />
                  </div>
                ))}
                <div className="col-12">
                  <button className="btn btn-sm btn-success me-2">
                    Guardar contacto
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setContacto(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
            {!sel.contactos.length && (
              <p className="text-muted mb-0">Sin contactos registrados.</p>
            )}
            {!!sel.contactos.length && (
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Puesto</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sel.contactos.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nombre}</td>
                      <td>{c.correo || '—'}</td>
                      <td>{c.telefono || '—'}</td>
                      <td>{c.puesto || '—'}</td>
                      <td className="text-nowrap">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => {
                            setContacto({
                              nombre: c.nombre,
                              correo: c.correo || '',
                              telefono: c.telefono || '',
                              puesto: c.puesto || '',
                            });
                            setEditContacto(c.id);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => borrarContacto(c)}
                        >
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  );
}
