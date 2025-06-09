FROM php:8.2-cli

# Actualiza paquetes y corrige vulnerabilidades
RUN apt-get update && apt-get install -y \
    git unzip libzip-dev && docker-php-ext-install pdo pdo_mysql
# Instala Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

# Genera el autoloader optimizado y ejecuta los scripts post-install
RUN composer install --no-scripts --no-interaction --no-dev --optimize-autoloader

RUN composer update
# Crear directorios necesarios para Symfony
RUN mkdir -p public/FileRepos && \
    chmod -R 775 public/FileRepos && \
    chown -R www-data:www-data public/FileRepos
# Expone el puerto
EXPOSE 8000

# Entrypoint
# ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]
