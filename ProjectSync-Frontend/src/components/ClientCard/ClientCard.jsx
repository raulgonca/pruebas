import React from 'react';
import { FaUser, FaIdCard, FaPhone, FaEnvelope, FaGlobe, FaPen } from 'react-icons/fa';

const ClientCard = ({ client, onEdit }) => {
  // Función para truncar texto largo
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const user = JSON.parse(localStorage.getItem('user'));
  // Soporta roles como array de strings o array de objetos con "authority"
  const roles = user?.roles || user?.authorities || [];
  const isAdmin = Array.isArray(roles)
    ? roles.some(r => r === 'ROLE_ADMIN' || r.authority === 'ROLE_ADMIN')
    : false;

  return (
    <div className="w-full bg-white border-2 border-purple-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col md:flex-row items-stretch">
      {/* Cabecera con nombre y botón editar */}
      <div className="flex flex-row items-center md:w-1/3 min-w-[220px] bg-gradient-to-r from-purple-600 via-purple-300/70 to-transparent p-3 pl-5">
        <FaUser className="text-2xl mr-3 bg-white text-purple-500 p-1.5 rounded-full shadow-sm" />
        <h3 className="text-lg font-bold truncate text-white drop-shadow" title={client.name}>
          {truncateText(client.name, 30)}
        </h3>
        {isAdmin && onEdit && (
          <button
            className="ml-auto bg-white text-purple-500 hover:bg-purple-100 rounded-full p-2 shadow transition"
            onClick={() => onEdit(client)}
            title="Editar cliente"
            style={{ marginLeft: 'auto' }}
          >
            <FaPen />
          </button>
        )}
      </div>
      {/* Información del cliente */}
      <div className="flex-1 p-3 md:p-4 flex flex-col justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
          <div className="flex items-center">
            <FaIdCard className="text-gray-600 mr-2 flex-shrink-0" />
            <span className="font-semibold mr-1">CIF:</span>
            <span className="truncate">{client.cif}</span>
          </div>
          <div className="flex items-center">
            <FaPhone className="text-gray-600 mr-2 flex-shrink-0" />
            <span className="font-semibold mr-1">Teléfono:</span>
            <span className="truncate">{client.phone}</span>
          </div>
          <div className="flex items-center">
            <FaEnvelope className="text-gray-600 mr-2 flex-shrink-0" />
            <span className="font-semibold mr-1">Email:</span>
            <span className="truncate">{client.email}</span>
          </div>
          <div className="flex items-center">
            <FaGlobe className="text-gray-600 mr-2 flex-shrink-0" />
            <span className="font-semibold mr-1">Web:</span>
            {client.web ? (
              <a
                href={client.web}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 underline transition-colors truncate"
              >
                {truncateText(client.web, 25)}
              </a>
            ) : (
              <span className="text-gray-400 italic">No disponible</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCard;