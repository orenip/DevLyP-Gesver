# Guía de Despliegue — Panel de Despliegues

Servidor destino: `arco@arcodockerprepro`
Directorio en servidor: `/home/arco/Despliegues_v2.0.0/`
Servicio Swarm: `DEPLOYMENT_TRACKER_FRONT`
Base de datos: contenedor `DEPLOYMENT_DB_db`

---

## Requisitos previos

- Docker instalado localmente
- Acceso SSH al servidor (`arco@arcodockerprepro`)
- El servidor tiene el proyecto en `/home/arco/Despliegues_v2.0.0/`

---

## Proceso completo de despliegue

### 1. Construir la imagen Docker (local)

```bash
cd C:/ProyectosBackup/DevLyP-Gesver
docker build -t despliegues:v1.1.0 .
```

### 2. Exportar la imagen (local)

```bash
docker save despliegues:v1.1.0 | gzip > despliegues-v1.1.0.tar.gz
```

### 3. Subir la imagen al servidor

```bash
scp despliegues-v1.1.0.tar.gz arco@arcodockerprepro:~
```

### 4. Cargar la imagen en el servidor

```bash
ssh arco@arcodockerprepro
sudo docker load < ~/despliegues-v1.1.0.tar.gz
```

### 5. Aplicar migraciones de base de datos (si las hay)

Verificar si hay migraciones nuevas en `data/migrations/` que no se hayan aplicado antes.

```bash
# Ejemplo con la migración 001 (solo primera vez)
sudo docker exec -i $(sudo docker ps --filter name=DEPLOYMENT_DB_db -q) \
  mysql -uarco -p'gYlrmd75M%7Px7' deployment_tracker \
  < /home/arco/Despliegues_v2.0.0/data/migrations/001_add_servicios.sql
```

> Las migraciones son **idempotentes** — se pueden ejecutar varias veces sin romper nada.

Verificar que la migración se aplicó correctamente:

```bash
sudo docker exec -i $(sudo docker ps --filter name=DEPLOYMENT_DB_db -q) \
  mysql -uarco -p'gYlrmd75M%7Px7' deployment_tracker \
  -e "SHOW TABLES; SHOW COLUMNS FROM programas LIKE 'servicioId';"
```

### 6. Actualizar el servicio en Docker Swarm

```bash
sudo docker service update --image despliegues:v1.1.0 DEPLOYMENT_TRACKER_FRONT
```

### 7. Verificar que arrancó correctamente

```bash
# Estado del servicio
sudo docker service ps DEPLOYMENT_TRACKER_FRONT

# Logs recientes
sudo docker service logs DEPLOYMENT_TRACKER_FRONT --tail 50
```

---

## Comandos útiles en el servidor

```bash
# Ver todos los contenedores activos
sudo docker ps

# Ver logs del frontend en tiempo real
sudo docker service logs DEPLOYMENT_TRACKER_FRONT -f

# Ver logs de la base de datos
sudo docker service logs DEPLOYMENT_DB_db --tail 30

# Entrar al contenedor de MySQL para consultas manuales
sudo docker exec -it $(sudo docker ps --filter name=DEPLOYMENT_DB_db -q) \
  mysql -uarco -p'gYlrmd75M%7Px7' deployment_tracker

# Ver servicios del stack
sudo docker stack services DEPLOYMENT_TRACKER
```

---

## Historial de versiones

| Versión | Fecha | Cambios | Migración |
|---------|-------|---------|-----------|
| v1.0.6 | — | Versión inicial | — |
| v1.0.7 | 2026-06-22 | Fix conexión BD: retry + keepalive + ping validation | No |
| v1.1.0 | 2026-06-23 | Servicios, Estadísticas, mejora visual/UX, puertos | `001_add_servicios.sql` |

---

## Notas importantes

- **Aplicar migraciones ANTES de actualizar el servicio** para evitar errores en arranque.
- Las migraciones usan `IF NOT EXISTS` y `IF NOT EXISTS` — son seguras de re-ejecutar.
- El servicio tiene `restart_policy: condition: any` — se reinicia automáticamente si falla.
- La BD usa volumen externo `despliegues_mysql-data` — los datos persisten aunque se reinicie el contenedor.
