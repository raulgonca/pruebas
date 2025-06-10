import React, { useState } from 'react';
import { repoService, clientService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/LoadingSpinner'; // Nuevo loader
import Button from '../../components/Button';

const ProjectCreate = () => {
  const [form, setForm] = useState({
    projectname: '',
    description: '',
    fechaInicio: '',
    fechaFin: '',
    client: '',
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Cargar clientes para el select
  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await clientService.getAllClients();
        setClients(data);
      } catch {
        setClients([]);
      }
    };
    fetchClients();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    // Validación de fechas
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio) {
      setLoading(false);
      toast.error('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    try {
      const formData = new FormData();
      // Añadir los campos del formulario al FormData
      Object.keys(form).forEach(key => {
        formData.append(key, form[key]);
      });

      // Añadir el owner desde el usuario logueado
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        formData.append('owner', user.id);
      }

      await repoService.createRepo(formData);
      toast.success('Repositorio creado con éxito');
      navigate('/main/projects');
    } catch (error) {
      toast.error('Error al crear el repositorio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md w-full max-w-4xl flex overflow-hidden">
        <div className="w-full p-8">
          <button
            className="mb-6 flex items-center text-purple-600 hover:underline"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="mr-2" /> Volver
          </button>
          <h2 className="text-2xl font-bold mb-6 text-purple-700">Crear nuevo proyecto</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Nombre del proyecto <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="projectname"
                value={form.projectname}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Descripción</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                rows={3}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-700">
                  Fecha de inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={form.fechaInicio}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-semibold text-gray-700">Fecha de fin</label>
                <input
                  type="date"
                  name="fechaFin"
                  value={form.fechaFin}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Cliente</label>
              <select
                name="client"
                value={form.client}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
              >
                <option value="">Sin cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="submit"
              isLoading={loading}
              className="w-full"
            >
              <FaSave className="mr-2" />
              Crear proyecto
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;
