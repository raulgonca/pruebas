// Variables de entorno para la configuración de la API
const API_URL = import.meta.env.VITE_URL_API;
const BASE_API_URL = `${API_URL}/api`;

// Función principal para realizar peticiones a la API
const fetchFromAPI = async (endpoint, options = {}) => {
  try {
    const url = `${BASE_API_URL}${endpoint}`;
    
    const headers = {
      'Accept': 'application/json',
      ...options.headers
    };

    // Solo añadir Content-Type si no es FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Añadir token si es necesario
    if (options.requiresAuth !== false) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    }

    // Preparar el body si existe
    let body = options.body;
    if (body && !(body instanceof FormData)) {
      if (typeof body !== 'string') {
        body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body
    });

    // Obtener el texto de la respuesta
    const responseText = await response.text();
    
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      console.error('Error al parsear la respuesta JSON:', responseText);
      throw new Error('Error al procesar la respuesta del servidor');
    }

    // Si la respuesta no es exitosa, lanzar un error
    if (!response.ok) {
      // Si es 401, elimina el usuario del localStorage y redirige al login
      if (response.status === 401) {
        localStorage.removeItem('user');
        // Usar setTimeout para evitar problemas de navegación durante el manejo de errores
        setTimeout(() => {
          window.location.href = '/login';
        }, 0);
        throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }
      
      // Si es 404, lanzar un error específico
      if (response.status === 404) {
        throw new Error('El recurso solicitado no existe.');
      }

      // Para otros errores
      console.error('Respuesta con error:', response.status, data);
      throw new Error(data.message || `Error ${response.status}: Ha ocurrido un error en la petición`);
    }

    return data;
  } catch (error) {
    console.error('Error en la petición:', error);
    // Si es un error de red o el servidor no responde
    if (error.name === 'TypeError' || error.message.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión.');
    }
    throw error;
  }
};

// Servicios para autenticación
export const authService = {
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }
      
      const response = await fetchFromAPI('/login', {
        method: 'POST',
        body: {
          email: email,
          password: password
        },
        requiresAuth: false
      });

      if (!response || !response.token) {
        console.error('Respuesta inválida del servidor:', response);
        throw new Error('Respuesta inválida del servidor');
      }

      // Guardar en localStorage
      const userData = {
        token: response.token,
        id: response.user?.id,
        email: response.user?.email,
        username: response.user?.username,
        roles: Array.isArray(response.user?.roles) ? response.user.roles : ['ROLE_USER']
      };

      localStorage.setItem('user', JSON.stringify(userData));

      return response;
    } catch (error) {
      console.error('Error en el servicio de login:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await fetchFromAPI('/register', {
        method: 'POST',
        body: userData,
        requiresAuth: false
      });
      return response;
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  },

  logout: () => {
    try {
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error en logout:', error);
      window.location.href = '/login';
    }
  },

  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        return null;
      }
      
      const parsedUser = JSON.parse(userData);

      // Verificar que tenemos los datos mínimos necesarios
      if (!parsedUser || !parsedUser.token) {
        localStorage.removeItem('user');
        return null;
      }

      // Si no tenemos ID, intentar obtenerlo del token o del servidor
      if (!parsedUser.id) {
        try {
          const tokenParts = parsedUser.token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            if (payload.id) {
              parsedUser.id = payload.id;
              parsedUser.email = payload.email;
              parsedUser.roles = payload.roles || ['ROLE_USER'];
              localStorage.setItem('user', JSON.stringify(parsedUser));
            } else {
              // Si no hay ID en el token, obtener datos del servidor
              return fetchFromAPI('/user/me', {
                headers: {
                  'Authorization': `Bearer ${parsedUser.token}`
                }
              }).then(userResponse => {
                const updatedUser = {
                  ...parsedUser,
                  id: userResponse.id,
                  email: userResponse.email,
                  username: userResponse.username,
                  roles: userResponse.roles || ['ROLE_USER']
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                return updatedUser;
              }).catch(error => {
                console.error('Error al obtener datos del usuario:', error);
                return parsedUser;
              });
            }
          }
        } catch (error) {
          console.error('Error al decodificar el token:', error);
        }
      }

      // Asegurarse de que los roles estén en el formato correcto
      if (!parsedUser.roles || !Array.isArray(parsedUser.roles)) {
        parsedUser.roles = ['ROLE_USER'];
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
      
      return parsedUser;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated: () => {
    const user = authService.getCurrentUser();
    return !!user && !!user.token;
  },

  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user && Array.isArray(user.roles) && user.roles.includes(role);
  }
};

// Servicios para usuarios
export const userService = {
  // Obtener todos los usuarios
  getAllUsers: async () => {
    return await fetchFromAPI('/user/all');
  },
  // Obtener un usuario por ID
  getUserById: async (id) => {
    return await fetchFromAPI(`/users/${id}`);
  },
  // Actualizar usuario
  updateUser: async (id, userData) => {
    return await fetchFromAPI(`/user/update/${id}`, {
      method: 'PUT',
      body: userData
    });
  },
  // Cambiar email del usuario
  updateEmail: async (id, email) => {
    return await fetchFromAPI(`/user/update-email/${id}`, {
      method: 'PUT',
      body: { email }
    });
  },
  // Cambiar contraseña del usuario
  updatePassword: async (id, currentPassword, newPassword) => {
    return await fetchFromAPI(`/user/update-password/${id}`, {
      method: 'PUT',
      body: { currentPassword, newPassword }
    });
  },
  // Eliminar usuario
  deleteUser: async (id) => {
    return await fetchFromAPI(`/user/delete/${id}`, {
      method: 'DELETE'
    });
  },
  // Crear nuevo usuario
  createUser: async (userData) => {
    return await fetchFromAPI('/user/new', {
      method: 'POST',
      body: userData
    });
  }
};

// Servicios para proyectos (repositorios)
export const projectService = {
  // Obtener todos los proyectos
  getAllProjects: async () => {
    const response = await fetchFromAPI('/repos/all');
    return Array.isArray(response) ? response : [];
  },
  // Obtener proyectos donde el usuario es colaborador
  getCollaborationProjects: async () => {
    const response = await fetchFromAPI('/repos/colaboraciones');
    return Array.isArray(response) ? response : [];
  },
  // Obtener todos los proyectos (propietario + colaborador)
  getAllUserProjects: async () => {
    // Obtener proyectos donde el usuario es propietario
    const ownedProjects = await fetchFromAPI('/repos');
    const ownedProjectsArray = Array.isArray(ownedProjects) ? ownedProjects : [];
    // Obtener proyectos donde el usuario es colaborador
    const collaborationProjects = await fetchFromAPI('/repos/colaboraciones');
    const collaborationProjectsArray = Array.isArray(collaborationProjects) ? collaborationProjects : [];
    // Combinar ambos arrays y devolver el resultado
    return [...ownedProjectsArray, ...collaborationProjectsArray];
  },
  // Obtener un proyecto por ID
  getProjectById: async (id) => {
    return await fetchFromAPI(`/repos/find/${id}`);
  },
  // Crear nuevo proyecto
  createProject: async (projectData) => {
    return await fetchFromAPI('/newrepo', {
      method: 'POST',
      body: projectData
    });
  },
  // Actualizar proyecto
  updateProject: async (id, projectData) => {
    return await fetchFromAPI(`/updaterepo/${id}`, {
      method: 'PUT',
      body: projectData
    });
  },
  // Eliminar proyecto
  deleteProject: async (id) => {
    return await fetchFromAPI(`/deleterepo/${id}`, {
      method: 'DELETE'
    });
  },
  // Añadir colaborador a un proyecto
  addCollaborator: async (projectId, userId) => {
    return await fetchFromAPI(`/repos/${projectId}/colaboradores`, {
      method: 'POST',
      body: { userId }
    });
  },
  // Eliminar colaborador de un proyecto
  removeCollaborator: async (projectId, userId) => {
    return await fetchFromAPI(`/repos/${projectId}/colaboradores/${userId}`, {
      method: 'DELETE'
    });
  },
  // Obtener colaboradores de un proyecto
  getProjectCollaborators: async (projectId) => {
    return await fetchFromAPI(`/repos/${projectId}/colaboradores`);
  },
  // Obtener proyectos propios de un usuario
  getUserProjects: async () => {
    const user = authService.getCurrentUser();
    if (!user || !user.id) {
      throw new Error('Usuario no autenticado');
    }
    return await fetchFromAPI(`/user/${user.id}/projects`);
  },
  // Obtener colaboraciones de un usuario
  getUserCollaborations: async () => {
    const user = authService.getCurrentUser();
    if (!user || !user.id) {
      throw new Error('Usuario no autenticado');
    }
    return await fetchFromAPI(`/user/${user.id}/collaborations`);
  }
};

// Servicios para clientes
export const clientService = {
  // Obtener todos los clientes
  getAllClients: async () => {
    return await fetchFromAPI('/clients');
  },
  // Obtener un cliente por ID
  getClientById: async (id) => {
    return await fetchFromAPI(`/clients/${id}`);
  },
  // Actualizar cliente
  updateClient: async (id, clientData) => {
    return await fetchFromAPI(`/updateclient/${id}`, {
      method: 'PUT',
      body: clientData
    });
  },
  // Eliminar cliente
  deleteClient: async (id) => {
    return await fetchFromAPI(`/deleteclient/${id}`, {
      method: 'DELETE'
    });
  },
  // Crear nuevo cliente
  createClient: async (clientData) => {
    return await fetchFromAPI('/createclient', {
      method: 'POST',
      body: clientData
    });
  },
  // Importar clientes desde CSV
  importClientsFromCSV: async (file) => {
    try {
      if (!file) {
        throw new Error('No se ha seleccionado ningún archivo');
      }
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('El archivo debe ser un CSV');
      }
      if (file.size > 1024 * 1024) { // 1MB
        throw new Error('El archivo es demasiado grande. Máximo 1MB permitido.');
      }

      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetchFromAPI('/clients/import', {
        method: 'POST',
        body: formData
      });

      return response;
    } catch (error) {
      console.error('Error en importClientsFromCSV:', error);
      if (error.message.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
      }
      throw error;
    }
  }
};

// Servicios para repositorios (proyectos)
export const repoService = {
  // Obtener todos los repositorios
  getAllRepos: async () => {
    return await fetchFromAPI('/repos/all');
  },
  // Obtener un repositorio por ID
  getRepoById: async (id) => {
    return await fetchFromAPI(`/repos/find/${id}`);
  },
  // Crear nuevo repositorio
  createRepo: async (repoData) => {
    return await fetchFromAPI('/newrepo', { 
      method: 'POST',
      body: repoData
    });
  },
  // Actualizar repositorio
  updateRepo: async (id, repoData) => {
    return await fetchFromAPI(`/updaterepo/${id}`, {
      method: 'PATCH',
      body: repoData
    });
  },
  // Eliminar repositorio
  deleteRepo: async (id) => {
    return await fetchFromAPI(`/deleterepo/${id}`, {
      method: 'DELETE'
    });
  }
};

// Servicio para información general
export const mainService = {
  // Obtener información de bienvenida de la API
  getApiInfo: async () => {
    return await fetchFromAPI('/main');
  }
};

export const projectFileService = {
  // Subir un archivo a un proyecto
  uploadFile: async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return await fetchFromAPI(`/projects/${projectId}/files`, {
      method: 'POST',
      body: formData
    });
  },
  // Listar archivos de un proyecto
  listFiles: async (projectId) => {
    return await fetchFromAPI(`/projects/${projectId}/files`);
  },
  // Descargar un archivo de un proyecto
  downloadFile: async (projectId, fileId) => {
    const API_URL = import.meta.env.VITE_URL_API;
    const url = `${API_URL}/api/projects/${projectId}/files/${fileId}/download`;
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user?.token) {
      throw new Error('No hay token de autenticación');
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado. Inicia sesión de nuevo.');
        }
        throw new Error('Error al descargar el archivo');
      }

      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `archivo_${fileId}`; // Nombre por defecto

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename; // Usar el nombre del archivo obtenido
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error en downloadFile:', error);
      throw error;
    }
  },
  // Descargar todos los archivos en ZIP
  downloadAllFilesZip: async (projectId) => {
    const API_URL = import.meta.env.VITE_URL_API;
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.token) throw new Error('No hay token de autenticación');
    
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/files/download-zip`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No autorizado. Inicia sesión de nuevo.');
        }
        throw new Error('Error al descargar el archivo ZIP');
      }

      // Obtener el blob de la respuesta
      const blob = await response.blob();
      
      // Crear un enlace temporal para la descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `proyecto_${projectId}.zip`; // Nombre por defecto del archivo
      
      // Simular clic para iniciar la descarga
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error en downloadAllFilesZip:', error);
      throw error;
    }
  },
  // Eliminar un archivo de un proyecto
  deleteFile: async (projectId, fileId) => {
    return await fetchFromAPI(`/projects/${projectId}/files/${fileId}`, {
      method: 'DELETE'
    });
  },
  // Renombrar un archivo de un proyecto
  renameFile: async (projectId, fileId, newName) => {
    return await fetchFromAPI(`/projects/${projectId}/files/${fileId}/rename`, {
      method: 'PUT',
      body: { originalName: newName }
    });
  }
};