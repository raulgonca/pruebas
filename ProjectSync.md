# ProjectSync

ProjectSync es una aplicación web tipo red social orientada a la gestión colaborativa de proyectos, permitiendo a los usuarios crear, administrar y compartir proyectos, clientes y usuarios, con un panel de administración y funcionalidades avanzadas.

## Descripción

Una plataforma moderna para la gestión eficiente de proyectos, donde los usuarios pueden colaborar, asignar clientes, gestionar archivos y roles, y mucho más. El frontend está construido con React + Vite + Tailwind CSS, y el backend con Symfony y Doctrine ORM.

## Características principales

- Registro y autenticación de usuarios (JWT)
- Gestión de proyectos: creación, edición, asignación de clientes y colaboradores
- Gestión de clientes: CRUD, importación/exportación CSV
- Gestión de usuarios: roles, edición, exportación CSV
- Valoración y reseñas de proyectos (opcional)
- Seguimiento y colaboración entre usuarios
- Panel de administración para usuarios con rol admin
- Subida, descarga y gestión de archivos por proyecto
- Interfaz moderna y responsiva (React + Tailwind CSS)
- Backend robusto con Symfony y Doctrine ORM
- Integración con Docker y Nginx para despliegue

## Estructura del proyecto

```
ProjectSync/
│
├── ProjectSync-Frontend/   # Frontend React (Vite)
│   ├── src/
│   ├── public/
│   └── ...
│
├── TFG_Backend/            # Backend Symfony (PHP)
│   ├── src/
│   ├── public/
│   └── ...
│
├── nginx/                  # Configuración de Nginx para producción
├── docker-compose.yml      # Orquestación de servicios
└── init.sql                # Script de inicialización de la base de datos
```

## Credenciales y Puertos

### Puertos utilizados

- Frontend: 5173 (desarrollo) / 80 (producción)
- Backend API: 9000 (interno) / 8081 (exterior)
- Base de datos MySQL: 3306
- PHPMyAdmin: 8080

### Credenciales por defecto

- **Base de datos:**
  - Usuario: root
  - Contraseña: (vacía)
  - Base de datos: projectsync

- **PHPMyAdmin:**
  - URL: http://localhost:8080
  - Usuario: root
  - Contraseña: (vacía)

## Instrucciones de uso

### Requisitos previos

- Docker y Docker Compose
- Node.js 18 o superior
- PHP 8.2 o superior
- Composer

### Instalación y ejecución local

1. Clona el repositorio:
   ```sh
   git clone <TU_REPO_URL>
   cd ProjectSync
   ```

2. Genera las claves JWT para el backend:
   ```sh
   cd TFG_Backend && mkdir -p config/jwt && openssl genrsa -out config/jwt/private.pem -aes256 -passout pass:projectsync 4096 && openssl rsa -pubout -in config/jwt/private.pem -out config/jwt/public.pem -passin pass:projectsync
   ```

3. Instala dependencias del frontend:
   ```sh
   cd ../ProjectSync-Frontend
   npm install
   ```

4. Instala/actualiza dependencias del backend:
   ```sh
   cd ../TFG_Backend
   composer install
   ```

5. Inicia los servicios con Docker:
   ```sh
   docker-compose build
   docker-compose up -d
   ```

### Acceso a la aplicación

- Acceso Web Local: http://localhost:8081
- PHPMyAdmin: http://localhost:8080

## Variables de entorno

Configura las variables de entorno en los archivos `.env` de frontend y backend:

**Frontend (`ProjectSync-Frontend/.env`):**
```
VITE_API_URL=http://localhost:8081
```

**Backend (`TFG_Backend/.env`):**
```
CORS_ALLOW_ORIGIN=http://localhost:5173
DATABASE_URL=mysql://root:@db:3306/projectsync
JWT_PASSPHRASE=projectsync
```

## Despliegue en producción

Puedes desplegar el proyecto en cualquier VPS o servicio cloud compatible con Docker y Nginx. Ajusta las variables de entorno y contraseñas para producción.

## Datos de prueba

### Usuarios de prueba

- Email: projectsync@gmail.com  
  Contraseña: projectsync  
  Usuario normal

- Email: admin@admin.com  
  Contraseña: admin  
  Usuario administrador

## Notas importantes

- La aplicación utiliza JWT para la autenticación.
- Las imágenes de perfil se almacenan en `/var/www/public/uploads/profile_pictures` (ajusta según tu backend).
- El token JWT expira después de 24 horas.
- La API está configurada para aceptar peticiones CORS desde `http://localhost:5173` (ajusta en producción).
- Para producción, cambia las claves y contraseñas por valores seguros.

---

¿Quieres añadir instrucciones específicas para importar/exportar usuarios/clientes o detalles sobre endpoints de la API? Si necesitas más ejemplos de uso, dímelo.