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
  const [auth, setAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [admin, setAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) return;

        const parsedUser = JSON.parse(userData);
        if (!parsedUser || !parsedUser.token) {
          localStorage.removeItem('user');
          return;
        }

        // Normalizar roles si es necesario
        if (!Array.isArray(parsedUser.roles)) {
          parsedUser.roles = ['ROLE_USER'];
          localStorage.setItem('user', JSON.stringify(parsedUser));
        }

        setCurrentUser(parsedUser);
        setRoles(parsedUser.roles);
        setAdmin(parsedUser.roles.includes('ROLE_ADMIN'));
        setAuth(true);
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        localStorage.removeItem('user');
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (!response || !response.token) {
        throw new Error('Respuesta inválida del servidor');
      }

      const roles = Array.isArray(response.user?.roles) ? response.user.roles : ['ROLE_USER'];
      const isAdmin = roles.includes('ROLE_ADMIN');

      const userData = {
        token: response.token,
        id: response.user?.id,
        email: response.user?.email,
        username: response.user?.username,
        roles: roles
      };

      localStorage.setItem('user', JSON.stringify(userData));
      
      setCurrentUser(userData);
      setRoles(roles);
      setAdmin(isAdmin);
      setAuth(true);

      navigate(isAdmin ? '/main/dashboard' : '/main/user-dashboard');
      return response;
    } catch (error) {
      console.error('Error en el proceso de login:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('user');
      setCurrentUser(null);
      setRoles([]);
      setAdmin(false);
      setAuth(false);
      navigate('/login');
    } catch (error) {
      console.error('Error en el proceso de logout:', error);
      // Forzar logout incluso si hay error
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const value = {
    auth,
    currentUser,
    roles,
    admin,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;