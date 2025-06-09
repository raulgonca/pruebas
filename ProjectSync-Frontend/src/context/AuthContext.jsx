import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  return useContext(AuthContext);
};

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Función para normalizar los roles del usuario
  const normalizeRoles = (roles) => {
    if (!roles) return ['ROLE_USER'];
    if (Array.isArray(roles)) {
      return roles.map(role => typeof role === 'object' ? role.authority : role);
    }
    return ['ROLE_USER'];
  };

  // Cargar usuario desde localStorage al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = localStorage.getItem('user');
        console.log('Datos de usuario en localStorage al iniciar:', userData);
        
        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log('Usuario parseado:', parsedUser);
          
          if (parsedUser && parsedUser.token) {
            // Normalizar los roles del usuario
            parsedUser.roles = normalizeRoles(parsedUser.roles);
            console.log('Roles normalizados:', parsedUser.roles);
            
            // Guardar el usuario con roles normalizados
            localStorage.setItem('user', JSON.stringify(parsedUser));
            console.log('Estableciendo usuario en el estado:', parsedUser);
            setCurrentUser(parsedUser);
          } else {
            console.log('Datos de usuario inválidos en localStorage:', parsedUser);
            localStorage.removeItem('user');
            navigate('/login');
          }
        }
      } catch (err) {
        console.error('Error al cargar datos de usuario:', err);
        setError('Error al cargar datos de usuario');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Iniciando proceso de login...');
      
      const response = await authService.login(email, password);
      console.log('Respuesta del login recibida:', response);
      
      if (!response || !response.token || !response.user) {
        console.error('Respuesta inválida:', response);
        throw new Error('Respuesta inválida del servidor');
      }

      // Normalizar los roles del usuario
      const roles = normalizeRoles(response.user.roles);
      console.log('Roles normalizados del login:', roles);

      // La respuesta ya viene normalizada del servicio
      const userData = {
        token: response.token,
        id: response.user.id,
        email: response.user.email,
        username: response.user.username,
        roles: roles
      };

      console.log('Datos del usuario procesados:', userData);

      // Guardar en localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('Datos guardados en localStorage');

      // Actualizar el estado
      setCurrentUser(userData);
      console.log('Estado actualizado con los datos del usuario');

      // Redirigir según el rol
      const isAdmin = roles.includes('ROLE_ADMIN');
      console.log('¿Es admin?:', isAdmin);
      console.log('Redirigiendo a:', isAdmin ? '/main/dashboard' : '/main/user-dashboard');
      navigate(isAdmin ? '/main/dashboard' : '/main/user-dashboard');

      return response;
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para registrar usuario
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);
      
      if (!response) {
        throw new Error('Respuesta inválida del servidor');
      }

      return response;
    } catch (err) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error al registrar usuario');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    try {
      console.log('Cerrando sesión...');
      setCurrentUser(null);
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      navigate('/login');
    }
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    const auth = !!(currentUser && currentUser.token);
    console.log('Verificación de autenticación en contexto:', { auth, currentUser });
    return auth;
  };

  // Verificar si el usuario es administrador
  const isAdmin = () => {
    const roles = normalizeRoles(currentUser?.roles);
    const admin = roles.includes('ROLE_ADMIN');
    console.log('Verificación de rol admin en contexto:', { admin, roles });
    return admin;
  };

  // Valores que se proporcionarán a través del contexto
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;