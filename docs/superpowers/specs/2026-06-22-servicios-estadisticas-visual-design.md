# Diseño: Servicios, Estadísticas y Mejora Visual/UX
**Fecha:** 2026-06-22
**Estado:** Aprobado
**App:** Gesver — Panel de Control de Despliegues (Next.js + MySQL)

---

## 1. Contexto y restricciones

- ~31 servicios lógicos, ~44 programas, histórico de despliegues intacto
- **Invariante crítica:** cero pérdida de datos ni histórico en ningún paso
- Stack: Next.js 14 (App Router), MySQL 8, mysql2/promise, shadcn/ui, Tailwind
- Repositorio: patrón `IRepository` con implementaciones MySQL y JSON
- Docker Swarm en producción; imagen nueva = `despliegues:v1.0.7`

---

## 2. Base de datos

### 2.1 Nueva tabla `servicios`
```sql
CREATE TABLE servicios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  color       VARCHAR(7) NULL,        -- hex: '#3B82F6'
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 Modificación `programas`
```sql
ALTER TABLE programas
  ADD COLUMN servicioId INT NULL,
  ADD CONSTRAINT fk_programa_servicio
      FOREIGN KEY (servicioId) REFERENCES servicios(id)
      ON DELETE SET NULL;
```

- `ON DELETE SET NULL`: borrar un servicio desasocia sus programas, no los borra
- Los 44 programas actuales quedan con `servicioId = NULL` hasta asignación manual
- Migración idempotente: si ya existe la columna, no falla

### 2.3 Sin cambios en `despliegues`
Todo el histórico permanece intacto. Las queries de estadísticas solo leen datos existentes.

---

## 3. Navegación y estructura de páginas

### 3.1 Sidebar (nueva estructura)
```
📊  Inicio          /
🗂️  Servicios       /servicios
📋  Despliegues     /deployments
📈  Estadísticas    /estadisticas
🔌  Puertos         /ports
```

### 3.2 Rutas nuevas

| Ruta | Función |
|------|---------|
| `/servicios` | Lista CRUD de servicios |
| `/servicios/nuevo` | Formulario crear servicio |
| `/servicios/[id]` | Detalle: programas del servicio (solo consulta) |
| `/servicios/[id]/editar` | Editar nombre/descripción/color |
| `/estadisticas` | Dashboard de métricas |

### 3.3 Rutas existentes sin cambio de ruta
- `/deployments` — tabla plana completa (editar/borrar sigue aquí)
- `/ports` — tabla de puertos (mejorada visualmente)

---

## 4. Feature: Servicios

### 4.1 Home `/` — nuevo

Reemplaza la vista resumen actual.

**Layout:**
- Grid responsivo de cards de servicios (1 col mobile, 2 col tablet, 3 col desktop)
- Sección inferior: "Programas sin servicio" — mismas cards en tono neutro

**Card de servicio (colapsada):**
```
┌─────────────────────────────────────────────────┐
│ ▌ ArcoNet                          3 programas  │
│   Plataforma de gestión            ↳ 12 deploys │
│   PREPROD ✓    PROD ✓    Último: 20/06/2026      │
└─────────────────────────────────────────────────┘
```
- Franja de color del servicio en borde izquierdo
- Badge entorno: verde (Prod activo), naranja (Preprod activo), gris (sin despliegue)
- Click → `/servicios/[id]`

### 4.2 Vista detalle `/servicios/[id]` — solo consulta

**Header:** nombre, descripción, color, stats: nº programas, nº despliegues totales.

**Lista de programas — cards colapsadas:**
```
┌─────────────────────────────────────────────────┐
│  ArcoNet Front                                  │
│  PREPROD  v1.0.5-rc.2    PROD  v2.0.1        ▼  │
└─────────────────────────────────────────────────┘
```
- Click en versión o en card → abre modal "Detalles del Despliegue" existente
- Sin versión → badge gris "Sin despliegue" (no clickable)
- **Sin botones editar/borrar** — esas acciones van a `/deployments`

**Modal de detalle (reutiliza el existente):**
Fecha, responsable, entorno, plataforma, acción, comentario, URL, puerto.

### 4.3 Gestión `/servicios` — CRUD

**Lista de servicios:**
- Tabla: indicador color | nombre | nº programas | nº despliegues | acciones
- Acciones: editar (→ `/servicios/[id]/editar`), borrar (dialog de confirmación)
- Botón "Nuevo servicio" en header de página

**Dialog de confirmación al borrar:**
> "Se elimina el servicio '[nombre]'. Los [N] programas asociados quedan sin servicio pero sus despliegues no se borran."

**Formulario crear/editar:**
- Campos: nombre (requerido), descripción (opcional), color (paleta 12 colores predefinidos)
- Tras crear → redirige a `/servicios`

### 4.4 Gestión de asociaciones

En `/servicios/[id]` → botón "Gestionar programas":
- Modal con multi-select de todos los programas
- Marca cuáles ya están asociados al servicio
- Guardar → UPDATE `programas SET servicioId = ?` en batch
- Quitar programa del servicio → SET `servicioId = NULL` (no borra despliegues)

---

## 5. Feature: Estadísticas `/estadisticas`

### 5.1 KPI cards (fila superior)
- Total despliegues históricos
- Despliegues en Producción
- Despliegues en Preproducción
- Servicios activos
- Programas sin servicio asignado

### 5.2 Tabla "Actividad por responsable"
Columnas: Responsable | Total | Producción | Preproducción
Ordenada por total desc. Muestra ranking de deployments por persona.

### 5.3 Gráfico: Despliegues por mes
Barras apiladas (Prod vs Preprod) — últimos 12 meses.
Incluye línea de promedio mensual desde el primer despliegue registrado.

### 5.4 Gráfico: Despliegues por plataforma
Barras horizontales: Docker, IIS, otros — con conteo total.

### 5.5 Top programas
Barras horizontales: top 10 programas con más despliegues históricos.

### 5.6 Tabla "Resumen por servicio"
Columnas: Servicio | Programas | Deploys Prod | Deploys Preprod | Último despliegue | Responsable más activo

### 5.7 Datos extra
- Fecha del primer y último despliegue registrado
- Promedio de despliegues por mes (total / meses desde primer registro)

**Implementación:** todas las queries sobre tabla `despliegues` existente. Sin cambios de schema.
**Librería gráficos:** Recharts (ya disponible en shadcn/ui como `chart.tsx`).

---

## 6. Visual / UX global

### 6.1 Paleta de entornos (consistente en toda la app)
- Producción: verde (`bg-green-100 text-green-800 border-green-200`)
- Preproducción: naranja/ámbar (`bg-amber-100 text-amber-800 border-amber-200`)
- Sin despliegue: gris neutro

### 6.2 Cards y layout
- Bordes redondeados (`rounded-xl`), sombra sutil (`shadow-sm hover:shadow-md`)
- Hover states en todas las cards interactivas
- Transiciones suaves (`transition-all duration-200`)

### 6.3 Sidebar
- Iconos Lucide + texto, ítem activo resaltado con color de acento
- Breadcrumbs en páginas de detalle (`Servicios / ArcoNet`)

### 6.4 Puertos `/ports` — tabla mejorada (no cards)
- Tabla ordenada por número de puerto ascendente
- Columnas: Puerto | Programa | Entorno | Tipo (Preprod/Prod badge)
- Filas agrupadas por rangos de 100 (separador visual entre 8000-8099, 8100-8199…)
- Buscador por número de puerto o nombre de programa
- Highlight de huecos: rangos sin puertos asignados visibles entre grupos
- Read-only — editar/borrar sigue en `/deployments`

---

## 7. Cambios al repositorio (`IRepository`)

### 7.1 Nuevos tipos
```typescript
interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;
}

interface ServicioWithStats extends Servicio {
  numProgramas: number;
  numDespliegues: number;
  ultimoDespliegue: string | null;  // ISO date
  tienePreproduccion: boolean;
  tieneProduccion: boolean;
}

interface ProgramaWithServicio extends Programa {
  servicioId: string | null;
}
```

### 7.2 Nuevos métodos `IRepository`
```typescript
// Servicios CRUD
getServicios(): Promise<ServicioWithStats[]>
getServicioById(id: string): Promise<Servicio | null>
createServicio(payload: { nombre: string; descripcion?: string; color?: string }): Promise<void>
updateServicio(id: string, payload: { nombre: string; descripcion?: string; color?: string }): Promise<void>
deleteServicio(id: string): Promise<void>  // ON DELETE SET NULL via FK

// Asociaciones
getProgramasByServicio(servicioId: string): Promise<ProgramaWithServicio[]>
getProgramasSinServicio(): Promise<Programa[]>
updateProgramaServicio(programaId: string, servicioId: string | null): Promise<void>

// Estadísticas
getStats(): Promise<StatsPayload>  // todos los datos para /estadisticas
```

### 7.3 Migración SQL (aplicar en startup o manualmente)
Archivo: `data/migrations/001_add_servicios.sql`
- Idempotente: usa `CREATE TABLE IF NOT EXISTS` y `IF NOT EXISTS` para la columna
- Se ejecuta al arrancar la app si `APPLY_MIGRATIONS=true` en env (opcional)

---

## 8. Orden de implementación

1. **Migración BD** — `servicios` table + `servicioId` en `programas`
2. **Tipos + IRepository** — nuevas interfaces y métodos
3. **MySQL repository** — implementar nuevos métodos
4. **JSON repository** — stubs para dev local
5. **Server Actions** — crear/editar/borrar servicio, actualizar asociaciones
6. **Páginas de servicios** — `/servicios`, `/servicios/nuevo`, `/servicios/[id]`, `/servicios/[id]/editar`
7. **Home nuevo** — grid de servicios reemplaza vista resumen
8. **Estadísticas** — `/estadisticas` con queries + componentes de gráfico
9. **Mejoras visual/UX** — sidebar, paleta entornos, puertos
10. **Build Docker** — nueva imagen `despliegues:v1.0.7`

---

## 9. Consideraciones de seguridad y datos

- FK `ON DELETE SET NULL`: único mecanismo de disociación. Nunca cascade delete en `despliegues`
- Queries de estadísticas: solo SELECT, sin modificar datos
- Validación server-side con Zod en todas las acciones nuevas
- No exponer credenciales de BD en client components
