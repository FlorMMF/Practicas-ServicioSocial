import { useState } from 'react';
import { api } from '../../api.js';
import { useFetch, Loading, ErrorBox, Chips } from '../../components/ui.jsx';

const VACIO = {
  expediente: '',
  nombre: '',
  correo: '',
  password: '',
  carrera: '',
  semestre: 1,
  estado: 'ACTIVO',
  v_servicio: false,
  fecha_v_servicio: '',
};

export default function AdminEstudiantes() {
  const estudiantes = useFetch(() => api('/estudiantes'));
  const [form, setForm] = useState(null);
  const [editExp, setEditExp] = useState(null);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        ...form,
        expediente: Number(form.expediente),
        semestre: Number(form.semestre),
        fecha_v_servicio: form.fecha_v_servicio || null,
      };
      if (editExp) {
        if (!body.password) delete body.password;
        await api(`/estudiantes/${editExp}`, { method: 'PUT', body });
        setAviso('Estudiante actualizado');
      } else {
        await api('/estudiantes', { method: 'POST', body });
        setAviso('Estudiante creado');
      }
      setForm(null);
      setEditExp(null);
      estudiantes.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const editar = (s) => {
    setEditExp(s.expediente);
    setForm({
      expediente: s.expediente,
      nombre: s.nombre,
      correo: s.correo,
      password: '',
      carrera: s.carrera,
      semestre: s.semestre,
      estado: s.estado,
      v_servicio: s.v_servicio,
      fecha_v_servicio: s.fecha_v_servicio?.slice(0, 10) || '',
    });
    setError(null);
  };

  const borrar = async (s) => {
    if (!confirm(`¿Eliminar a ${s.nombre} (${s.expediente})?`)) return;
    try {
      await api(`/estudiantes/${s.expediente}`, { method: 'DELETE' });
      setAviso('Estudiante eliminado');
      estudiantes.reload();
    } catch (e2) {
      setError(e2.message);
    }
  };

  const F = (k, label, type = 'text', extra = {}) => (
    <div className="col-md-4" key={k}>
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-control"
        value={form[k]}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        {...extra}
      />
    </div>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Estudiantes</h4>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(VACIO);
            setEditExp(null);
            setError(null);
          }}
        >
          Nuevo estudiante
        </button>
      </div>
      <ErrorBox error={error || estudiantes.error} />
      {aviso && <div className="alert alert-success py-2">{aviso}</div>}

      {form && (
        <div className="card mb-4">
          <div className="card-header">
            {editExp ? `Editar ${editExp}` : 'Nuevo estudiante'}
          </div>
          <div className="card-body">
            <form onSubmit={guardar}>
              <div className="row g-3">
                {F('expediente', 'Expediente *', 'number', {
                  required: true,
                  disabled: !!editExp,
                })}
                {F('nombre', 'Nombre *', 'text', { required: true })}
                {F('correo', 'Correo *', 'email', { required: true })}
                {F('password', editExp ? 'Contraseña (vacío = sin cambio)' : 'Contraseña *', 'password', {
                  required: !editExp,
                })}
                {F('carrera', 'Carrera *', 'text', { required: true })}
                {F('semestre', 'Semestre *', 'number', { required: true, min: 1 })}
                <div className="col-md-4">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    {['ACTIVO', 'EGRESADO', 'BAJA'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="vs"
                      checked={form.v_servicio}
                      onChange={(e) =>
                        setForm({ ...form, v_servicio: e.target.checked })
                      }
                    />
                    <label className="form-check-label" htmlFor="vs">
                      Servicio social validado
                    </label>
                  </div>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Fecha validación</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.fecha_v_servicio}
                    onChange={(e) =>
                      setForm({ ...form, fecha_v_servicio: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-success me-2">Guardar</button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setForm(null);
                    setEditExp(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {estudiantes.loading ? (
        <Loading />
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover bg-white">
            <thead>
              <tr>
                <th>Expediente</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Carrera</th>
                <th>Sem.</th>
                <th>Estado</th>
                <th>Servicio</th>
                <th>Preferencias</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(estudiantes.data ?? []).map((s) => (
                <tr key={s.expediente}>
                  <td>{s.expediente}</td>
                  <td>{s.nombre}</td>
                  <td className="small">{s.correo}</td>
                  <td className="small">{s.carrera}</td>
                  <td>{s.semestre}</td>
                  <td>
                    <span
                      className={`badge bg-${
                        s.estado === 'ACTIVO' ? 'success' : 'secondary'
                      }`}
                    >
                      {s.estado}
                    </span>
                  </td>
                  <td>{s.v_servicio ? 'Validado' : '—'}</td>
                  <td>
                    <Chips items={s.preferencias} />
                  </td>
                  <td className="text-nowrap">
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => editar(s)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => borrar(s)}
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
