#!/bin/sh
set -e

# Esperar a que MySQL esté listo
echo "Waiting for MySQL to be ready..."
while ! nc -z mysql 3306; do
    sleep 1
done
echo "MySQL is ready!"

# Verificar y reinstalar dependencias si es necesario
if [ ! -d "/var/www/vendor" ] || [ ! -f "/var/www/vendor/autoload.php" ]; then
    echo "Installing dependencies..."
    composer install --no-interaction --optimize-autoloader
fi

# Crear directorio para las claves JWT si no existe
mkdir -p /var/www/config/jwt

# Generar claves JWT si no existen
if [ ! -f /var/www/config/jwt/private.pem ]; then
    echo "Generating JWT keys..."
    openssl genrsa -out /var/www/config/jwt/private.pem -aes256 -passout pass:projectsync 2048
    openssl rsa -pubout -in /var/www/config/jwt/private.pem -out /var/www/config/jwt/public.pem -passin pass:projectsync
    chown -R www-data:www-data /var/www/config/jwt
    chmod -R 755 /var/www/config/jwt
fi

# Limpiar la caché de Symfony
echo "Clearing Symfony cache..."
php bin/console cache:clear
php bin/console cache:warmup

# Ejecutar migraciones
echo "Running database migrations..."
php bin/console doctrine:migrations:migrate --no-interaction

# Configurar permisos
chown -R www-data:www-data /var/www/var
chmod -R 777 /var/www/var

# Ejecutar el comando que se pasa como argumento
exec "$@" 