🚀 Guía de Despliegue - Deployment Tracker
Esta aplicación utiliza Next.js (Standalone) y MySQL, orquestados mediante Docker Swarm detrás de un proxy Nginx.

📋 Requisitos Previos
El servidor debe tener el archivo .env configurado en la raíz del proyecto (no incluido en el repositorio).

La red externa proxy_redarco_swarm debe existir.

El DNS y el Proxy Nginx deben estar configurados para despliegues.arcopreprod.com.

🔄 1. Despliegue Estándar (Actualizaciones)
Ejecuta estos pasos cuando actualices el código fuente (frontend/backend) o cambies la configuración.

Paso 1: Construir la imagen
Es crítico usar --no-cache para asegurar que los estilos CSS y los archivos estáticos de Next.js se copien correctamente en la nueva versión.

sudo docker compose build --no-cache app

Paso 2: Cargar variables de entorno
Carga las variables del archivo .env en la sesión actual para que Swarm pueda leerlas.

set -a && source .env && set +a

Paso 3: Desplegar el Stack
Actualiza el servicio en el clúster Swarm.

sudo -E docker stack deploy -c docker-compose.yml despliegues

Paso 4: Forzar actualización del servicio (Opcional)
Si el despliegue no refresca los cambios inmediatamente, fuerza la actualización de la imagen:

sudo docker service update --image deployment_tracker_app:latest --force despliegues_app

🛠 2. Mantenimiento y Logs
Ver logs de la aplicación
Para depurar errores de arranque o de conexión a base de datos:

sudo docker service logs despliegues_app --tail 100 -f

Ver logs de la base de datos

sudo docker service logs despliegues_db --tail 50

Verificar estado de los contenedores

sudo docker stack ps despliegues

⚠️ 3. Hard Reset (Borrado Total y Reinicio)
PRECAUCIÓN: Estos pasos borran toda la base de datos. Úsalo solo si necesitas regenerar la estructura de tablas desde cero o si el volumen está corrupto.

Eliminar el stack:

sudo docker stack rm despliegues

Eliminar el volumen de datos persistentes:

sudo docker volume rm despliegues_mysql-data

Volver a desplegar (creará la BD limpia):

set -a && source .env && set +a

sudo -E docker stack deploy -c docker-compose.yml despliegues

📂 Estructura de Archivos Clave
src/: Código fuente de Next.js.

data/bdmysql.sql: Script SQL de inicialización (se ejecuta solo al crear el volumen por primera vez).

Dockerfile: Configuración de construcción multi-etapa (incluye copia de estáticos y OpenSSL).

docker-compose.yml: Definición de servicios para Swarm.

⚠️Ejecución en LOCAL
npm install

Poner en la variable de entorno de .env 
ENVIRONMENT=local  

En caso de Producción con BD de Mysql poner production

npm run dev