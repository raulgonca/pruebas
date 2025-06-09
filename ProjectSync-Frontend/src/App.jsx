import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar'; // Asegúrate de crear este componente

function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet className="bg-white" />
      </main>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
}

export default App;
