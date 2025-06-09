import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import Button from '../../components/Button';
import logoFull from '../../assets/LogoTFG.png';

// Importa aquí tu logo o usa un placeholder
// import Logo from '../../assets/logo.png';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validar que los campos no estén vacíos
    if (!credentials.email || !credentials.password) {
      setError('Por favor, completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      const response = await login(credentials.email, credentials.password);
      const roles = response.user?.roles || [];
      const isAdmin = roles.includes('ROLE_ADMIN');

      // Redirigir según el rol
      navigate(isAdmin ? '/main/dashboard' : '/main/user-dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Si ya está autenticado, redirigir
  if (currentUser) {
    const roles = currentUser.roles || [];
    const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
    navigate(isAdmin ? '/main/dashboard' : '/main/user-dashboard');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-md w-full max-w-4xl flex overflow-hidden border-2 border-purple-200">
        {/* Lado izquierdo - Logo y título */}
        <div className="bg-purple-700 text-white w-2/5 p-8 flex flex-col justify-center items-center">
          <img src={logoFull} alt="Logo ProjectSync" className="h-14 w-auto mb-2" />
          <p className="text-center text-purple-100">Tu plataforma para gestionar proyectos de forma eficiente y colaborativa</p>
        </div>
        {/* Lado derecho - Formulario */}
        <div className="w-3/5 p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold mb-6 text-purple-700 text-center">Iniciar sesión</h2>
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
                value={credentials.email}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="ejemplo@correo.com"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            <div className="mb-6">
              <Button
                type="submit"
                isLoading={loading}
                className="w-full"
              >
                Iniciar sesión
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="font-medium text-purple-600 hover:text-purple-500">
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;