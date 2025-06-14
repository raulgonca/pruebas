import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import logoFull from '../../assets/LogoTFG.png';
import { toast } from 'react-toastify';
import { authService } from '../../services/api';


const Register = () => {
  const [userData, setUserData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Si ya está autenticado, redirigir
  if (currentUser) {
    const roles = currentUser.roles || [];
    const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
    navigate(isAdmin ? '/main/dashboard' : '/main/user-dashboard');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value
    });
  };

  const validateForm = () => {
    // Validar que las contraseñas coincidan
    if (userData.password !== userData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      setError('El formato del email no es válido');
      return false;
    }
    
    // Validar longitud de contraseña
    if (userData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // Validar longitud del nombre de usuario
    if (userData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const dataToSend = {
        username: userData.username,
        email: userData.email,
        password: userData.password
      };

      await authService.register(dataToSend);
      toast.success('Usuario registrado con éxito');
      navigate('/login');
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md md:max-w-4xl flex flex-col md:flex-row overflow-hidden border-2 border-purple-200">
        {/* Logo y texto - arriba en móvil, derecha en desktop */}
        <div className="bg-purple-700 text-white w-full md:w-2/5 flex flex-col items-center justify-center p-8 md:p-8 order-1 md:order-2 md:items-center md:justify-center">
          <img src={logoFull} alt="Logo ProjectSync" className="h-14 md:h-16 w-auto mb-2 md:mb-4" />
          <p className="text-center text-purple-100 text-base md:text-sm leading-snug">
            Tu plataforma para gestionar proyectos de forma eficiente y colaborativa
          </p>
        </div>
        {/* Formulario - debajo en móvil, izquierda en desktop */}
        <div className="w-full md:w-3/5 flex flex-col justify-center p-6 sm:p-8 order-2 md:order-1">
          <h2 className="text-2xl font-bold mb-6 text-purple-700 text-center">Registro</h2>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
                Nombre de usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={userData.username}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="usuario123"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={userData.password}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={userData.confirmPassword}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="mb-6">
              <Button
                type="submit"
                isLoading={loading}
                className="w-full"
              >
                Registrarse
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;