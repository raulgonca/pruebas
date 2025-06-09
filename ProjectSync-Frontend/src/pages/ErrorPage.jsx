import React from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { FaExclamationTriangle, FaArrowLeft, FaHome } from 'react-icons/fa';

const ErrorPage = () => {
  const error = useRouteError();
  
  // Determinar el tipo de error y el mensaje apropiado
  const getErrorDetails = () => {
    if (error?.status === 404 || error?.message?.includes('no existe')) {
      return {
        title: 'Página no encontrada',
        message: 'Lo sentimos, la página que buscas no existe o ha sido movida.',
        icon: '🔍'
      };
    }
    
    if (error?.message?.includes('sesión ha expirado')) {
      return {
        title: 'Sesión expirada',
        message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        icon: '⏰'
      };
    }
    
    if (error?.message?.includes('conectar con el servidor')) {
      return {
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.',
        icon: '🌐'
      };
    }
    
    return {
      title: '¡Vaya! Algo salió mal',
      message: error?.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
      icon: '⚠️'
    };
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-purple-300 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-md w-full border border-purple-200">
        <div className="text-6xl mb-4">{errorDetails.icon}</div>
        <h1 className="text-3xl font-bold text-purple-800 mb-2">{errorDetails.title}</h1>
        <p className="text-gray-600 mb-6 text-center">
          {errorDetails.message}
        </p>
        <div className="flex gap-4">
          <Link
            to="/main"
            className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow transition"
          >
            <FaHome /> Ir al inicio
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold shadow transition"
          >
            <FaArrowLeft /> Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
