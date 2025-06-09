import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/api';
import UserCard from '../../components/UserCard/UserCard';
import UserModal from '../../components/UserModal/UserModal';
import LoadingSpinner from '../../components/LoadingSpinner'; // Nuevo loader
import { FaPlus, FaSearch, FaFilter, FaExclamationTriangle, FaFileExport, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify'; // Asegúrate de tener esta dependencia instalada

const Users = () => {
  // Estados principales
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para modal y gestión de usuarios
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(12);
  
  // Estado para confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Función memoizada para cargar usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      // Ahora data es un array plano
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error al cargar los usuarios:', err);
      setError('No se pudieron cargar los usuarios. Por favor, inténtalo de nuevo más tarde.');
      setUsers([]);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtrar usuarios según el término de búsqueda y el tipo de filtro
  const filteredUsers = Array.isArray(users) ? users.filter(user => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    
    switch (filterType) {
      case 'username':
        return user.username && user.username.toLowerCase().includes(term);
      case 'email':
        return user.email && user.email.toLowerCase().includes(term);
      case 'role':
        return Array.isArray(user.roles) && user.roles.join(',').toLowerCase().includes(term);
      case 'all':
      default:
        return (
          (user.username && user.username.toLowerCase().includes(term)) ||
          (user.name && user.name.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term)) ||
          (Array.isArray(user.roles) && user.roles.join(',').toLowerCase().includes(term))
        );
    }
  }) : [];

  // Obtener usuarios para la página actual
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Guardar usuario (crear o actualizar)
  const handleSaveUser = async (userData) => {
    try {
      setLoading(true);
      let updatedUser;
      
      if (editUser) {
        // Actualizar usuario existente
        updatedUser = await userService.updateUser(editUser.id, userData);
        setUsers(users.map(user => user.id === editUser.id ? updatedUser : user));
        toast.success('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        updatedUser = await userService.createUser(userData);
        // Recargar la lista completa para asegurar datos actualizados
        await fetchUsers();
        toast.success('Usuario creado correctamente');
      }
      
      setIsModalOpen(false);
      setEditUser(null);
      return updatedUser;
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
      toast.error('Error al guardar el usuario');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Obtener rol del usuario actual
  const user = JSON.parse(localStorage.getItem('user'));
  const roles = user?.roles || user?.authorities || [];
  const isAdmin = Array.isArray(roles)
    ? roles.some(r => r === 'ROLE_ADMIN' || r.authority === 'ROLE_ADMIN')
    : false;

  // Función para editar usuario (solo para admin)
  const handleEditUser = (user) => {
    setEditUser(user);
    setIsModalOpen(true);
  };

  // Función para crear usuario
  const handleCreateUser = () => {
    setEditUser(null);
    setIsModalOpen(true);
  };

  // Eliminar usuario
  const handleDeleteUser = async (id) => {
    if (confirmDelete === id) {
      try {
        setLoading(true);
        await userService.deleteUser(id);
        setUsers(users.filter(user => user.id !== id));
        setConfirmDelete(null);
        toast.success('Usuario eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        setError('No se pudo eliminar el usuario. Por favor, inténtalo de nuevo más tarde.');
        toast.error('Error al eliminar el usuario');
      } finally {
        setLoading(false);
      }
    } else {
      setConfirmDelete(id);
      // Resetear la confirmación después de 3 segundos
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  // Exportar usuarios a CSV
  const exportToCSV = () => {
    try {
      // Crear cabeceras CSV
      const headers = ['ID', 'Usuario', 'Email', 'Rol'];
      
      // Convertir datos de usuarios a filas CSV
      const userRows = filteredUsers.map(user => [
        user.id,
        user.username || '',
        user.email || '',
        Array.isArray(user.roles) ? user.roles.join(', ') : ''
      ]);
      
      // Combinar cabeceras y filas
      const csvContent = [
        headers.join(','),
        ...userRows.map(row => row.join(','))
      ].join('\n');
      
      // Crear blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'usuarios.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Usuarios exportados correctamente');
    } catch (error) {
      console.error('Error al exportar usuarios:', error);
      toast.error('Error al exportar usuarios');
    }
  };

  // Renderizar componente de carga
  if (loading) {
    return <LoadingSpinner section="users" text="Cargando usuarios..." />;
  }

  if (error) {
    return <div className="bg-red-100 text-red-800 p-4 rounded-md my-5">{error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Cabecera con título y acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
        
        <div className="w-full md:w-auto flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-grow min-w-[200px]">
              <input
                type="text"
                placeholder="Buscar usuario..."
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
                onClick={fetchUsers}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg flex items-center transition-colors text-sm sm:text-base"
                title="Recargar usuarios"
                disabled={loading}
              >
                <FaSync className={`${loading ? 'animate-spin text-purple-600' : 'text-gray-600'} mr-1 sm:mr-2`} />
                Recargar
              </button>
              
              <button 
                onClick={exportToCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center transition-colors text-sm sm:text-base whitespace-nowrap"
                title="Exportar usuarios"
              >
                <FaFileExport className="mr-1 sm:mr-2" />
                Exportar
              </button>
              
              <button 
                onClick={handleCreateUser}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <FaPlus className="mr-1 sm:mr-2" />
                Nuevo Usuario
              </button>
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
                  onClick={() => setFilterType('username')} 
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'username' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Usuario
                </button>
                <button 
                  onClick={() => setFilterType('name')} 
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'name' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Nombre
                </button>
                <button 
                  onClick={() => setFilterType('email')} 
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'email' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Email
                </button>
                <button 
                  onClick={() => setFilterType('role')} 
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'role' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Rol
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6 flex items-center">
          <FaExclamationTriangle className="mr-2 flex-shrink-0" />
          <span className="text-sm sm:text-base">{error}</span>
        </div>
      )}
      
      {/* Lista de usuarios */}
      {currentUsers.length === 0 ? (
        <div className="bg-gray-100 p-6 sm:p-8 rounded-lg text-center">
          {searchTerm ? (
            <p className="text-sm sm:text-base text-gray-600">
              No se encontraron usuarios que coincidan con "<strong>{searchTerm}</strong>"
            </p>
          ) : (
            <p className="text-sm sm:text-base text-gray-600">
              No hay usuarios disponibles. ¡Crea el primero haciendo clic en "Nuevo Usuario"!
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={() => handleEditUser(user)}
                onDelete={handleDeleteUser}
                confirmDelete={confirmDelete}
              />
            ))}
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-l-md border transition-colors ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  Anterior
                </button>
                
                {[...Array(totalPages)].map((_, index) => {
                  // Mostrar solo 5 páginas a la vez
                  if (
                    index + 1 === 1 ||
                    index + 1 === totalPages ||
                    (index + 1 >= currentPage - 1 && index + 1 <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={index}
                        onClick={() => paginate(index + 1)}
                        className={`px-2 sm:px-3 py-1 text-xs sm:text-sm border-t border-b transition-colors ${
                          currentPage === index + 1
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  } else if (
                    (index + 1 === currentPage - 2 && currentPage > 3) ||
                    (index + 1 === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span key={index} className="px-2 sm:px-3 py-1 text-xs sm:text-sm border-t border-b bg-white text-gray-600">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-r-md border transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  Siguiente
                </button>
              </nav>
            </div>
          )}
        </>
      )}
      
      {/* Modal para crear/editar usuario */}
      {isAdmin && (
        <UserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditUser(null);
          }}
          onSave={handleSaveUser}
          existingUsers={users}
          userToEdit={editUser}
        />
      )}
    </div>
  );
};

export default Users;