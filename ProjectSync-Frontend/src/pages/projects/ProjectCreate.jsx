import React, { useState } from 'react';
import { repoService, clientService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/LoadingSpinner'; // Nuevo loader

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
    try {
      const formData = new FormData();
      formData.append('projectname', form.projectname);
      formData.append('description', form.description);
      formData.append('fechaInicio', form.fechaInicio);
      formData.append('fechaFin', form.fechaFin);
      formData.append('client', form.client);
      // Añadir el owner desde el usuario logueado
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        formData.append('owner', user.id);
      }

      // Añadir logs detallados
      console.log('Valores del formulario:', {
        projectname: form.projectname,
        description: form.description,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        client: form.client,
        owner: user?.id
      });

      // Log del contenido del FormData
      console.log('Contenido del FormData:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      await repoService.createRepo(formData);
      toast.success('Repositorio creado con éxito');
      navigate('/main/projects');
    } catch (err) {
      toast.error('Error al crear el repositorio' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    const API_URL = import.meta.env.VITE_URL_API;
    const url = `${API_URL}/api/projects/${id}/files/download-zip`;
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('No se pudo descargar el ZIP');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'archivos_proyecto.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      toast.error('Error al descargar el ZIP');
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center font-semibold text-lg transition"
            >
              {loading ? (
                <>
                  <LoadingSpinner section="projects" text="Guardando..." />
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Crear proyecto
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;
