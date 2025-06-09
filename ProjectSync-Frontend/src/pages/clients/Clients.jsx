import { useState, useEffect } from 'react';
import { clientService } from '../../services/api';
import ClientCard from '../../components/ClientCard/ClientCard';
import ClientModal from '../../components/ClientModal/ClientModal';
import { FaPlus, FaSearch, FaFilter, FaFileExport, FaFileImport } from 'react-icons/fa';
import LoadingSpinner from '../../components/LoadingSpinner'; 
import { toast } from 'react-toastify';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const roles = user?.roles || user?.authorities || [];
  const isAdmin = Array.isArray(roles)
    ? roles.some(r => r === 'ROLE_ADMIN' || r.authority === 'ROLE_ADMIN')
    : false;

  // Estado para editar cliente
  const [editClient, setEditClient] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await clientService.getAllClients();
        setClients(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar los clientes:', err);
        setError('No se pudieron cargar los clientes. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Filtrar clientes según el término de búsqueda y el tipo de filtro
  const filteredClients = clients.filter(client => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    
    switch (filterType) {
      case 'name':
        return client.name.toLowerCase().includes(term);
      case 'cif':
        return client.cif.toLowerCase().includes(term);
      case 'email':
        return client.email && client.email.toLowerCase().includes(term);
      case 'all':
      default:
        return (
          client.name.toLowerCase().includes(term) ||
          client.cif.toLowerCase().includes(term) ||
          (client.email && client.email.toLowerCase().includes(term))
        );
    }
  });

  const handleSaveClient = async (clientData) => {
    try {
      let response;
      if (clientData.id) {
        response = await clientService.updateClient(clientData.id, {
          name: clientData.name,
          cif: clientData.cif,
          email: clientData.email,
          phone: clientData.phone,
          web: clientData.web
        });
      } else {
        response = await clientService.createClient({
          name: clientData.name,
          cif: clientData.cif,
          email: clientData.email,
          phone: clientData.phone,
          web: clientData.web
        });
      }
      // Recargar la lista completa de clientes para asegurar datos actualizados
      const updatedClients = await clientService.getAllClients();
      setClients(updatedClients);
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Función para editar cliente (solo para admin)
  const handleEditClient = (client) => {
    if (isAdmin) {
      setEditClient(client);
      setIsModalOpen(true);
    }
  };

  // Función para crear cliente (nuevo)
  const handleCreateClient = () => {
    if (!isAdmin) {
      toast.warning('No tienes permisos para crear clientes.');
      return;
    }
    setEditClient(null); // Asegura que no hay cliente a editar
    setIsModalOpen(true); // Abre el modal en modo "nuevo"
  };

  // Exportar clientes a CSV
  // El formato del CSV debe ser:
  // - Encabezados: Nombre, CIF, Teléfono, Email, Web
  // - Cada fila debe contener los datos de un cliente
  // - Los campos opcionales pueden estar vacíos
  const exportToCSV = () => {
    try {
      const headers = ['Nombre', 'CIF', 'Teléfono', 'Email', 'Web'];
      const clientRows = clients.map(client => [
        client.name || '',
        client.cif || '',
        client.phone || '',
        client.email || '',
        client.web || ''
      ]);
      const csvContent = [
        headers.join(','),
        ...clientRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'clientes.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Clientes exportados correctamente');
    } catch (error) {
      toast.error('Error al exportar clientes');
    }
  };

  // Importar clientes desde CSV
  // El formato esperado del CSV debe ser:
  // - Encabezados: Nombre, CIF, Teléfono, Email, Web
  // - Cada fila debe contener los datos de un cliente
  // - Los campos opcionales pueden estar vacíos
  // - El ID no es necesario ya que lo asigna la base de datos
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar la extensión del archivo
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('El archivo debe ser un CSV');
      e.target.value = '';
      return;
    }

    // Verificar el tamaño del archivo (máximo 1MB)
    if (file.size > 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 1MB permitido.');
      e.target.value = '';
      return;
    }

    setImporting(true);
    try {
      // Mostrar mensaje de ayuda sobre el formato esperado
      toast.info(
        <div>
          <p className="font-bold mb-2">Formato esperado del CSV:</p>
          <p>Primera línea: Nombre,CIF,Teléfono,Email,Web</p>
          <p>Ejemplo:</p>
          <p className="text-sm">"Empresa A","B12345678","912345678","empresa@a.com","www.empresaa.com"</p>
        </div>,
        { autoClose: 10000 }
      );

      // Llama al servicio que usa FormData
      await clientService.importClientsFromCSV(file);
      toast.success('Clientes importados correctamente');
      // Recarga la lista
      const updatedClients = await clientService.getAllClients();
      setClients(updatedClients);
    } catch (err) {
      console.error('Error al importar clientes:', err);
      // Mensajes de error más específicos
      if (err.message.includes('formato')) {
        toast.error('El formato del CSV no es válido. Verifica que los encabezados sean correctos.');
      } else if (err.message.includes('obligatorio')) {
        toast.error('Faltan campos obligatorios (Nombre o CIF) en algunas filas.');
      } else if (err.message.includes('duplicado')) {
        toast.error('Hay CIFs duplicados en el archivo.');
      } else {
        toast.error('Error al importar clientes: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return <LoadingSpinner section="clients" text="Cargando clientes..." />;
  }

  if (error) {
    return <div className="bg-red-100 text-red-800 p-4 rounded-md my-5">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Cabecera con título y acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Clientes</h1>
        
        <div className="w-full md:w-auto flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-grow min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              />
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg flex items-center transition-colors text-sm sm:text-base"
                title="Mostrar filtros"
              >
                <FaFilter className={`${showFilters ? 'text-purple-600' : 'text-gray-600'} mr-1`} />
                Filtros
              </button>
              
              <button 
                onClick={handleCreateClient}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <FaPlus className="mr-1 sm:mr-2" />
                Nuevo Cliente
              </button>
              
              <button
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center transition-colors text-sm sm:text-base whitespace-nowrap"
                title="Exportar clientes"
              >
                <FaFileExport className="mr-1 sm:mr-2" /> 
                Exportar
              </button>
              
              <label 
                className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center transition-colors cursor-pointer text-sm sm:text-base whitespace-nowrap ${importing ? 'opacity-50 cursor-not-allowed' : ''}`} 
                title="Importar clientes desde CSV"
                onClick={() => {
                  if (!isAdmin) {
                    toast.warning('No tienes permisos para importar clientes.');
                  }
                }}
              >
                <FaFileImport className="mr-1 sm:mr-2" /> 
                {importing ? 'Importando...' : 'Importar'}
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => {
                    if (!isAdmin) {
                      e.preventDefault();
                      return;
                    }
                    handleImportCSV(e);
                  }}
                  className="hidden"
                  disabled={importing}
                />
              </label>
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border border-gray-200 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 mr-2 self-center">Filtrar por:</span>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setFilterType('all')} 
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFilterType('name')} 
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'name' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Nombre
                </button>
                <button 
                  onClick={() => setFilterType('cif')} 
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'cif' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  CIF
                </button>
                <button 
                  onClick={() => setFilterType('email')} 
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'email' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {filteredClients.length === 0 ? (
        <div className="bg-gray-100 p-6 sm:p-8 rounded-lg text-center">
          {searchTerm ? (
            <p className="text-sm sm:text-base text-gray-600">
              No se encontraron clientes que coincidan con tu búsqueda 
              {filterType !== 'all' && ` en el campo "${
                filterType === 'name' ? 'nombre' : 
                filterType === 'cif' ? 'CIF' : 'email'
              }"`}.
            </p>
          ) : (
            <div className="bg-green-100 text-green-800 p-4 rounded-md text-center">
              <p className="text-sm sm:text-base">No hay clientes disponibles. ¡Añade tu primer cliente!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1 w-full">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="w-full"
            >
              <ClientCard
                client={client}
                onEdit={isAdmin ? handleEditClient : undefined}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de edición solo para admin */}
      {isAdmin && (
        <ClientModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditClient(null);
          }}
          onSave={handleSaveClient}
          existingClients={clients}
          clientToEdit={editClient}
        />
      )}
    </div>
  );
};

export default Clients;