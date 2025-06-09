import React, { useEffect, useState } from "react";
import { projectService } from "../../services/api";
import ProjectCard from "../../components/projects/ProjectCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import { FaFolderOpen, FaUsers, FaPlus, FaSearch, FaChevronDown, FaChevronUp, FaFilter } from "react-icons/fa";
import { Link } from "react-router-dom";

const Projects = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [ownedProjects, setOwnedProjects] = useState([]);
  const [collabProjects, setCollabProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('both'); // 'both', 'owner', 'collab'

  // Obtener el usuario logueado
  const user = JSON.parse(localStorage.getItem("user"));

  // Cargar datos de proyectos desde la API
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        if (!user?.email) throw new Error("Usuario no autenticado");
        // Proyectos donde el usuario es propietario
        const owned = await projectService.getUserProjects();
        // Proyectos donde el usuario es colaborador
        const collabs = await projectService.getUserCollaborations();
        setOwnedProjects(Array.isArray(owned) ? owned : []);
        setCollabProjects(Array.isArray(collabs) ? collabs : []);
      } catch (error) {
        console.error("Error al cargar los proyectos:", error);
        setError(
          "No se pudieron cargar los proyectos. Por favor, inténtalo de nuevo más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user?.email]);

  // Función para normalizar texto (eliminar acentos y convertir a minúsculas)
  const normalizeText = (text) => {
    if (!text || typeof text !== "string") return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Filtrar proyectos según el término de búsqueda y el tipo de filtro
  const filterProject = (project, type) => {
    const term = normalizeText(searchTerm);
    if (!term) return true;
    switch (type) {
      case 'name':
        return normalizeText(project.title || project.projectname || '').includes(term);
      case 'client':
        // project.client puede ser objeto o string
        if (typeof project.client === 'object' && project.client !== null) {
          return normalizeText(project.client.name || '').includes(term);
        }
        return normalizeText(project.client || '').includes(term);
      default:
        // 'all'
        return (
          normalizeText(project.title || project.projectname || '').includes(term) ||
          (typeof project.client === 'object'
            ? normalizeText(project.client.name || '').includes(term)
            : normalizeText(project.client || '').includes(term)
          )
        );
    }
  };

  const filteredOwnedProjects = ownedProjects.filter((project) => filterProject(project, filterType));
  const filteredCollabProjects = collabProjects.filter((project) => filterProject(project, filterType));

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading)
    return <LoadingSpinner section="projects" text="Cargando proyectos..." />;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Cabecera con título y acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-800">
          Lista de Proyectos
        </h1>
        <div className="w-full sm:w-auto flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar proyecto..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center transition-colors"
                title="Mostrar filtros"
              >
                <FaFilter className={`text-base sm:text-lg ${showFilters ? 'text-purple-600' : 'text-gray-600'}`} />
              </button>
              <Link
                to="/main/projects/new"
                className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
              >
                <FaPlus className="text-sm sm:text-base" />
                <span>Nuevo Proyecto</span>
              </Link>
            </div>
          </div>
          {showFilters && (
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border border-purple-100">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">Filtrar por:</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Todo
                  </button>
                  <button
                    onClick={() => setFilterType('name')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'name' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Nombre
                  </button>
                  <button
                    onClick={() => setFilterType('client')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${filterType === 'client' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Cliente
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">Mostrar:</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSectionFilter('both')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${sectionFilter === 'both' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setSectionFilter('owner')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${sectionFilter === 'owner' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Propietario
                  </button>
                  <button
                    onClick={() => setSectionFilter('collab')}
                    className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-full transition-colors ${sectionFilter === 'collab' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Colaborador
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Sección de proyectos propios */}
      {sectionFilter === 'both' || sectionFilter === 'owner' ? (
        <section className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <FaFolderOpen className="text-purple-600 text-lg sm:text-xl" />
            <h2 className="text-lg sm:text-xl font-semibold text-purple-700">Mis proyectos</h2>
          </div>
          {ownedProjects.length === 0 ? (
            <div className="bg-gray-100 p-4 sm:p-6 rounded-lg text-center text-gray-500 text-sm sm:text-base">
              No tienes proyectos propios.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredOwnedProjects.length > 0 ? (
                filteredOwnedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    className="bg-white border-2 border-purple-200 hover:shadow-md transition-shadow"
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-6 sm:py-8">
                  <p className="text-gray-500 text-sm sm:text-base">
                    No se encontraron proyectos que coincidan con tu búsqueda.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}

      {/* Sección de colaboraciones */}
      {sectionFilter === 'both' || sectionFilter === 'collab' ? (
        <section>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <FaUsers className="text-blue-600 text-lg sm:text-xl" />
            <h2 className="text-lg sm:text-xl font-semibold text-blue-700">Colaboraciones</h2>
          </div>
          {collabProjects.length === 0 ? (
            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg text-center text-blue-500 text-sm sm:text-base">
              No colaboras en ningún proyecto.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredCollabProjects.length > 0 ? (
                filteredCollabProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    className="bg-blue-50 border-2 border-blue-200 hover:shadow-md transition-shadow"
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-6 sm:py-8">
                  <p className="text-gray-500 text-sm sm:text-base">
                    No se encontraron proyectos que coincidan con tu búsqueda.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default Projects;
