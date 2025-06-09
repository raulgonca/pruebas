import React, { useEffect, useState } from 'react';
import { userService, clientService, projectService } from '../services/api';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { FaUsers, FaBuilding, FaFolderOpen } from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const doughnutOptions = {
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false },
  }
};

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, clients: 0, projects: 0, projectsByFecha: {} });
  const [projectsThisMonth, setProjectsThisMonth] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const [users, clients, projects] = await Promise.all([
        userService.getAllUsers(),
        clientService.getAllClients(),
        projectService.getAllProjects()
      ]);
      // Clasificación por fecha fin
      const now = new Date();
      let finalizados = 0, enCurso = 0, sinFecha = 0;
      projects.forEach(p => {
        if (!p.fechaFin) {
          sinFecha++;
        } else {
          const fin = new Date(p.fechaFin);
          if (fin < now) finalizados++;
          else enCurso++;
        }
      });
      setStats({
        users: users.length,
        clients: clients.length,
        projects: projects.length,
        projectsByFecha: { Finalizados: finalizados, 'En curso': enCurso, 'Sin fecha fin': sinFecha }
      });

      // Proyectos que finalizan este mes
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const endingThisMonth = projects.filter(p => {
        if (!p.fechaFin) return false;
        const fin = new Date(p.fechaFin);
        return fin.getMonth() === currentMonth && fin.getFullYear() === currentYear;
      });
      setProjectsThisMonth(endingThisMonth);
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const roles = user?.roles || user?.authorities || [];
    setIsAdmin(Array.isArray(roles)
      ? roles.some(r => r === 'ROLE_ADMIN' || r.authority === 'ROLE_ADMIN')
      : false);
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        No tienes permisos para ver este panel.
      </div>
    );
  }

  // Datos para gráficos individuales (doughnut)
  const usersDoughnut = {
    labels: ['Usuarios'],
    datasets: [{
      data: [stats.users, 1], // 1 para que siempre haya un círculo completo
      backgroundColor: ['#a78bfa', '#ede9fe'],
      borderWidth: 0,
    }]
  };
  const clientsDoughnut = {
    labels: ['Clientes'],
    datasets: [{
      data: [stats.clients, 1],
      backgroundColor: ['#f472b6', '#fce7f3'],
      borderWidth: 0,
    }]
  };
  const projectsDoughnut = {
    labels: ['Proyectos'],
    datasets: [{
      data: [stats.projects, 1],
      backgroundColor: ['#fbbf24', '#fef3c7'],
      borderWidth: 0,
    }]
  };

  const barData = {
    labels: Object.keys(stats.projectsByFecha),
    datasets: [{
      label: 'Proyectos',
      data: Object.values(stats.projectsByFecha),
      backgroundColor: ['#a78bfa', '#fbbf24', '#c4b5fd']
    }]
  };

  // Tamaño medio para todos los gráficos
  const chartSize = 110;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-purple-800">Panel de Administración</h1>
      {/* Responsive: en móvil apilado, en desktop dos columnas */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 mb-6">
        {/* Izquierda: 3 gráficos doughnut en columna */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4 w-full lg:w-[320px]">
          <div className="bg-white rounded-xl shadow flex-1 flex flex-col items-center justify-center min-h-[120px] py-2 border-2 border-purple-200">
            <div className="w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] relative flex items-center justify-center">
              <Doughnut
                data={usersDoughnut}
                options={doughnutOptions}
                width={chartSize}
                height={chartSize}
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <FaUsers className="mb-1 text-purple-700 text-base sm:text-lg" />
                <span className="text-lg sm:text-xl font-bold text-purple-700">{stats.users}</span>
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold text-purple-700">Usuarios</div>
          </div>
          <div className="bg-white rounded-xl shadow flex-1 flex flex-col items-center justify-center min-h-[120px] py-2 border-2 border-purple-200">
            <div className="w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] relative flex items-center justify-center">
              <Doughnut
                data={clientsDoughnut}
                options={doughnutOptions}
                width={chartSize}
                height={chartSize}
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <FaBuilding className="mb-1 text-pink-600 text-base sm:text-lg" />
                <span className="text-lg sm:text-xl font-bold text-pink-600">{stats.clients}</span>
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold text-pink-600">Clientes</div>
          </div>
          <div className="bg-white rounded-xl shadow flex-1 flex flex-col items-center justify-center min-h-[120px] py-2 border-2 border-purple-200">
            <div className="w-[90px] h-[90px] sm:w-[110px] sm:h-[110px] relative flex items-center justify-center">
              <Doughnut
                data={projectsDoughnut}
                options={doughnutOptions}
                width={chartSize}
                height={chartSize}
              />
              <span className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <FaFolderOpen className="mb-1 text-yellow-600 text-base sm:text-lg" />
                <span className="text-lg sm:text-xl font-bold text-yellow-600">{stats.projects}</span>
              </span>
            </div>
            <div className="mt-2 text-sm font-semibold text-yellow-600">Proyectos</div>
          </div>
        </div>
        {/* Derecha: gráfico de barras ocupa el resto */}
        <div className="bg-white rounded-xl shadow flex-1 flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px] p-4 border-2 border-purple-200">
          <h2 className="text-base sm:text-lg font-semibold mb-2 text-purple-700 text-center">Proyectos por fecha de finalización</h2>
          <div className="w-full h-full flex items-center justify-center">
            <Bar
              data={barData}
              options={{
                plugins: { legend: { display: false } },
                maintainAspectRatio: false,
                responsive: true,
                layout: { padding: { top: 10, bottom: 10 } },
                scales: {
                  x: { 
                    ticks: { 
                      font: { size: window.innerWidth < 640 ? 10 : 12 },
                      maxRotation: 45,
                      minRotation: 45
                    } 
                  },
                  y: { 
                    beginAtZero: true, 
                    ticks: { font: { size: window.innerWidth < 640 ? 10 : 12 } },
                    grace: '10%'
                  }
                }
              }}
              height={220}
            />
          </div>
        </div>
      </div>
      {/* Proyectos que finalizan este mes */}
      <div className="bg-white rounded-xl shadow p-3 sm:p-6 border-2 border-purple-200">
        <h2 className="text-base sm:text-lg font-semibold mb-3 text-purple-700">Proyectos que finalizan este mes</h2>
        {projectsThisMonth.length === 0 ? (
          <p className="text-gray-500 text-sm sm:text-base">No hay proyectos que finalicen este mes.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {projectsThisMonth.map(p => (
              <div key={p.id} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 shadow hover:shadow-md transition flex flex-col gap-1">
                <div className="font-bold text-sm sm:text-base text-purple-800 truncate">{p.projectname || p.title}</div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold text-purple-600">Fecha fin:</span>
                  <span>{new Date(p.fechaFin).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold text-purple-600">Cliente:</span>
                  <span className="truncate">{p.client?.name || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;