#!/bin/bash

# Colores para mejor legibilidad
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Estableciendo NODE_ENV=production y reiniciando la aplicación...${NC}"

# Verificar si estamos dentro de un contenedor Docker
if [ -f /.dockerenv ]; then
  echo -e "${GREEN}Detectado entorno Docker${NC}"
  
  # En Docker, modificamos el comando de inicio para incluir NODE_ENV
  echo 'export NODE_ENV=production' > /tmp/env_settings
  echo -e "${GREEN}Variables de entorno configuradas para Docker${NC}"
  
  # Mostrar la configuración actual
  echo -e "${YELLOW}Configuración actual:${NC}"
  echo "NODE_ENV=production"
  
  echo -e "${GREEN}Para aplicar los cambios, reinicia el contenedor con:${NC}"
  echo "docker-compose restart api"
else
  # Fuera de Docker, modificamos el archivo .env en el directorio actual
  if [ -f .env ]; then
    # Comprobar si NODE_ENV ya está definido en .env
    if grep -q "NODE_ENV=" .env; then
      # Reemplazar NODE_ENV existente
      sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
      echo -e "${GREEN}NODE_ENV actualizado a 'production' en archivo .env${NC}"
    else
      # Agregar NODE_ENV al final
      echo "NODE_ENV=production" >> .env
      echo -e "${GREEN}NODE_ENV=production añadido al archivo .env${NC}"
    fi
  else
    # Crear nuevo archivo .env
    echo "NODE_ENV=production" > .env
    echo -e "${GREEN}Archivo .env creado con NODE_ENV=production${NC}"
  fi
  
  # Verificar si estamos usando PM2
  if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}PM2 detectado, reiniciando la aplicación...${NC}"
    pm2 restart all
    echo -e "${GREEN}Aplicación reiniciada correctamente${NC}"
  else
    echo -e "${YELLOW}PM2 no detectado. Para aplicar los cambios:${NC}"
    echo "1. Detén la aplicación actual"
    echo "2. Reiníciala con: NODE_ENV=production npm start"
  fi
fi

echo -e "${GREEN}Configuración completada.${NC}"
echo -e "${YELLOW}Para verificar, ejecuta: echo \$NODE_ENV${NC}" 