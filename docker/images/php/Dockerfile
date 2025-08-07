# PHP Base Image for Debug Host
FROM php:8.2-cli-alpine

# Set environment variables
ENV PHP_INI_DIR=/usr/local/etc/php

# Install system dependencies including inotify-tools
RUN apk add --no-cache \
        unzip \
        inotify-tools \
        libzip-dev \
        autoconf \
        gcc \
        g++ \
        make

# Install minimal PHP extensions for web development
RUN docker-php-ext-install \
        zip && \
    apk del autoconf gcc g++ make

# Install Composer
COPY --from=composer:2.6 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy the PHP watcher script
COPY scripts/php-watcher.sh /usr/local/bin/php-watcher.sh
RUN chmod +x /usr/local/bin/php-watcher.sh

# Create non-root user
RUN addgroup -g 1001 phpuser && \
    adduser -D -u 1001 -G phpuser phpuser && \
    chown -R phpuser:phpuser /app

# Configure PHP for development
RUN echo 'display_errors = On' >> /usr/local/etc/php/php.ini && \
    echo 'display_startup_errors = On' >> /usr/local/etc/php/php.ini && \
    echo 'error_reporting = E_ALL' >> /usr/local/etc/php/php.ini && \
    echo 'log_errors = On' >> /usr/local/etc/php/php.ini && \
    echo 'memory_limit = 512M' >> /usr/local/etc/php/php.ini

USER phpuser

# Default command uses php-watcher for auto-restart
CMD ["/usr/local/bin/php-watcher.sh", "php", "-S", "0.0.0.0:8000", "-t", "/app"]