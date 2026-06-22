# Servicios, Estadísticas y Mejora Visual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir gestión de servicios (agrupación de programas), dashboard de estadísticas y mejora visual/UX global sin perder ningún dato histórico.

**Architecture:** Nueva tabla `servicios` con FK nullable `ON DELETE SET NULL` en `programas`. Home reemplazado por grid de servicios. Vista de detalle de servicio con `ProgramCard` colapsable que abre modal de detalle existente. Stats page con recharts vía shadcn chart.tsx. Todo el CRUD de despliegues sigue en `/deployments`.

**Tech Stack:** Next.js 14 App Router, MySQL 8, mysql2/promise, shadcn/ui, Tailwind CSS, Recharts (chart.tsx existente), Lucide React, Zod

**Sin suite de tests:** usar `npx tsc --noEmit` como type-check y `npm run build` como verificación final por fase.

---

## Mapa de ficheros

### Crear
- `data/migrations/001_add_servicios.sql`
- `src/lib/constants.ts` — paleta de colores
- `src/lib/actions-servicios.ts` — server actions servicios
- `src/components/servicios/service-form.tsx`
- `src/components/servicios/service-card.tsx`
- `src/components/servicios/program-card.tsx`
- `src/components/servicios/asociaciones-modal.tsx`
- `src/components/servicios/delete-service-dialog.tsx`
- `src/app/(main)/servicios/page.tsx`
- `src/app/(main)/servicios/nuevo/page.tsx`
- `src/app/(main)/servicios/[id]/page.tsx`
- `src/app/(main)/servicios/[id]/editar/page.tsx`
- `src/app/(main)/estadisticas/page.tsx`

### Modificar
- `src/lib/repository/index.ts` — nuevos tipos + métodos IRepository
- `src/lib/repository/mysql-repository.ts` — implementar nuevos métodos
- `src/lib/repository/json-repository.ts` — stubs para dev local
- `src/app/(main)/layout.tsx` — sidebar con nuevos nav items
- `src/app/(main)/page.tsx` — nuevo home (grid servicios)
- `src/components/ports-table.tsx` — tabla mejorada con búsqueda y rangos

---

## FASE 1 — Base de datos, tipos y repositorio

---

### Task 1: SQL Migration

**Files:**
- Create: `data/migrations/001_add_servicios.sql`

- [ ] **Step 1: Crear el fichero de migración**

```sql
-- data/migrations/001_add_servicios.sql
-- Migración idempotente: segura de ejecutar múltiples veces

CREATE TABLE IF NOT EXISTS servicios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  color       VARCHAR(7)  NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE programas
  ADD COLUMN IF NOT EXISTS servicioId INT NULL;

-- Solo añadir FK si no existe
SET @fk_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'programas'
    AND CONSTRAINT_NAME = 'fk_programa_servicio'
);

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE programas ADD CONSTRAINT fk_programa_servicio FOREIGN KEY (servicioId) REFERENCES servicios(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
```

- [ ] **Step 2: Aplicar migración en el servidor**

Copiar el fichero al servidor y ejecutar:
```bash
docker exec -i DEPLOYMENT_DB_db.1.<replica_id> mysql \
  -uarco -p'gYlrmd75M%7Px7' deployment_tracker \
  < data/migrations/001_add_servicios.sql
```

O desde el servidor:
```bash
docker exec -i $(docker ps --filter name=DEPLOYMENT_DB_db -q) \
  mysql -uarco -p'gYlrmd75M%7Px7' deployment_tracker \
  < /path/to/001_add_servicios.sql
```

Verificar:
```bash
docker exec -i $(docker ps --filter name=DEPLOYMENT_DB_db -q) \
  mysql -uarco -p'gYlrmd75M%7Px7' deployment_tracker \
  -e "DESCRIBE servicios; SHOW COLUMNS FROM programas LIKE 'servicioId';"
```

Esperado: tabla `servicios` con 5 columnas, columna `servicioId` en `programas`.

- [ ] **Step 3: Commit**

```bash
git add data/migrations/001_add_servicios.sql
git commit -m "feat(db): add servicios table and nullable FK on programas"
```

---

### Task 2: Nuevos tipos e IRepository

**Files:**
- Modify: `src/lib/repository/index.ts`

- [ ] **Step 1: Añadir nuevos tipos e IRepository extendido**

Reemplazar el contenido de `src/lib/repository/index.ts` con:

```typescript
import { jsonRepository } from "./json-repository";
import { mysqlRepository } from "./mysql-repository";

export interface Programa {
    id: string;
    nombre: string;
}

export interface Responsable {
    id: string;
    nombre: string;
}

export interface Plataforma {
    id: string;
    nombre: string;
}

export interface Servicio {
    id: string;
    nombre: string;
    descripcion: string | null;
    color: string | null;
}

export interface ServicioWithStats extends Servicio {
    numProgramas: number;
    numDespliegues: number;
    ultimoDespliegue: string | null;
    tienePreproduccion: boolean;
    tieneProduccion: boolean;
}

export interface ProgramaConServicio extends Programa {
    servicioId: string | null;
}

export interface ProgramaConResumen extends ProgramaConServicio {
    ultimoPreprod: DeploymentWithRelations | null;
    ultimoProd: DeploymentWithRelations | null;
}

export interface StatsTotales {
    total: number;
    prod: number;
    preprod: number;
    primerDespliegue: string | null;
    ultimoDespliegue: string | null;
    promedioMensual: number;
    serviciosActivos: number;
    programasSinServicio: number;
}

export interface StatsResponsable {
    nombre: string;
    total: number;
    prod: number;
    preprod: number;
}

export interface StatsMes {
    mes: string; // 'YYYY-MM'
    prod: number;
    preprod: number;
}

export interface StatsPlataforma {
    plataforma: string;
    total: number;
}

export interface StatsPrograma {
    nombre: string;
    total: number;
}

export interface StatsServicio {
    servicio: string;
    numProgramas: number;
    prod: number;
    preprod: number;
    ultimoDespliegue: string | null;
    topResponsable: string | null;
}

export interface StatsPayload {
    totales: StatsTotales;
    porResponsable: StatsResponsable[];
    porPlataforma: StatsPlataforma[];
    porMes: StatsMes[];
    topProgramas: StatsPrograma[];
    porServicio: StatsServicio[];
}

export interface DespliegueBase {
    entorno: 'Preproducción' | 'Producción';
    version: string;
    accion?: string;
    comentario?: string;
    hasSwagger?: boolean;
    url?: string;
    port?: string;
    fecha: string;
}

export interface Despliegue extends DespliegueBase {
    id: string;
    programaId: string;
    responsableId: string;
    plataforma: string;
}

export type DeploymentWithRelations = Omit<Despliegue, 'programaId' | 'responsableId'> & {
    programa: Programa;
    responsable: Responsable;
};

export type CreateDeploymentPayload = DespliegueBase & {
    programa: string;
    responsable: string;
    plataforma: string;
};

export type UpdateDeploymentPayload = CreateDeploymentPayload;

export type SummaryItem = {
    programaId: string;
    programaNombre: string;
    Preproducción: DeploymentWithRelations | null;
    Producción: DeploymentWithRelations | null;
}

export type CreateServicioPayload = {
    nombre: string;
    descripcion?: string;
    color?: string;
};

export type UpdateServicioPayload = CreateServicioPayload;

export interface IRepository {
    // Despliegues
    getFilteredDeployments(query: string, entorno: string, programaId?: string, responsableId?: string): Promise<DeploymentWithRelations[]>;
    getDeploymentById(id: string): Promise<DeploymentWithRelations | null>;
    createDeployment(payload: CreateDeploymentPayload): Promise<void>;
    updateDeployment(id: string, payload: UpdateDeploymentPayload): Promise<void>;
    deleteDeployment(id: string): Promise<void>;
    getLastDeployment(programaNombre: string, entorno: string): Promise<Despliegue | null>;

    // Relaciones
    getPrograms(): Promise<Programa[]>;
    getResponsibles(): Promise<Responsable[]>;
    getPlatforms(): Promise<Plataforma[]>;
    getSummary(): Promise<SummaryItem[]>;

    // Servicios CRUD
    getServicios(): Promise<ServicioWithStats[]>;
    getServicioById(id: string): Promise<Servicio | null>;
    createServicio(payload: CreateServicioPayload): Promise<void>;
    updateServicio(id: string, payload: UpdateServicioPayload): Promise<void>;
    deleteServicio(id: string): Promise<void>;

    // Asociaciones programa-servicio
    getProgramasConServicio(): Promise<ProgramaConServicio[]>;
    getProgramasByServicio(servicioId: string): Promise<ProgramaConResumen[]>;
    getProgramasSinServicio(): Promise<ProgramaConServicio[]>;
    updateProgramaServicio(programaId: string, servicioId: string | null): Promise<void>;

    // Estadísticas
    getStats(): Promise<StatsPayload>;
}

const environment = process.env.ENVIRONMENT || 'local';

let repository: IRepository;

if (environment === 'production') {
  repository = mysqlRepository;
} else {
  repository = jsonRepository;
}

export { repository };
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Esperado: errores en mysql-repository y json-repository (métodos no implementados aún). Normal en este paso.

- [ ] **Step 3: Commit**

```bash
git add src/lib/repository/index.ts
git commit -m "feat(types): add Servicio, StatsPayload types and extend IRepository"
```

---

### Task 3: MySQL Repository — Servicios CRUD

**Files:**
- Modify: `src/lib/repository/mysql-repository.ts`

- [ ] **Step 1: Añadir métodos de servicios al mysqlRepository**

Al final del objeto `mysqlRepository` (antes del cierre `}`), añadir:

```typescript
    // ----------------------------------------------------
    //  SERVICIOS CRUD
    // ----------------------------------------------------
    async getServicios(): Promise<ServicioWithStats[]> {
        noStore();
        const db = await getDbConnection();
        try {
            const sql = `
                SELECT
                    s.id, s.nombre, s.descripcion, s.color,
                    COUNT(DISTINCT p.id)  AS numProgramas,
                    COUNT(DISTINCT d.id)  AS numDespliegues,
                    MAX(d.fecha)          AS ultimoDespliegue,
                    MAX(CASE WHEN d.entorno = 'Preproducción' THEN 1 ELSE 0 END) AS tienePreproduccion,
                    MAX(CASE WHEN d.entorno = 'Producción'    THEN 1 ELSE 0 END) AS tieneProduccion
                FROM servicios s
                LEFT JOIN programas   p ON p.servicioId = s.id
                LEFT JOIN despliegues d ON d.programaId = p.id
                GROUP BY s.id
                ORDER BY s.nombre ASC
            `;
            const [rows] = await db.query<RowDataPacket[]>(sql);
            return rows.map(row => ({
                id: row.id.toString(),
                nombre: row.nombre,
                descripcion: row.descripcion,
                color: row.color,
                numProgramas: Number(row.numProgramas),
                numDespliegues: Number(row.numDespliegues),
                ultimoDespliegue: row.ultimoDespliegue ? new Date(row.ultimoDespliegue).toISOString() : null,
                tienePreproduccion: Boolean(Number(row.tienePreproduccion)),
                tieneProduccion: Boolean(Number(row.tieneProduccion)),
            }));
        } catch (e) {
            console.error('Database Error (getServicios):', e);
            throw new Error('Failed to fetch servicios.');
        } finally {
            db.release();
        }
    },

    async getServicioById(id: string): Promise<Servicio | null> {
        noStore();
        const db = await getDbConnection();
        try {
            const [rows] = await db.query<RowDataPacket[]>(
                'SELECT id, nombre, descripcion, color FROM servicios WHERE id = ?', [id]
            );
            if (rows.length === 0) return null;
            const row = rows[0];
            return { id: row.id.toString(), nombre: row.nombre, descripcion: row.descripcion, color: row.color };
        } catch (e) {
            console.error('Database Error (getServicioById):', e);
            throw new Error('Failed to fetch servicio.');
        } finally {
            db.release();
        }
    },

    async createServicio(payload: CreateServicioPayload): Promise<void> {
        noStore();
        const db = await getDbConnection();
        try {
            await db.execute(
                'INSERT INTO servicios (nombre, descripcion, color) VALUES (?, ?, ?)',
                [payload.nombre, payload.descripcion || null, payload.color || null]
            );
        } catch (e) {
            console.error('Database Error (createServicio):', e);
            throw new Error('Failed to create servicio.');
        } finally {
            db.release();
        }
    },

    async updateServicio(id: string, payload: UpdateServicioPayload): Promise<void> {
        noStore();
        const db = await getDbConnection();
        try {
            await db.execute(
                'UPDATE servicios SET nombre = ?, descripcion = ?, color = ? WHERE id = ?',
                [payload.nombre, payload.descripcion || null, payload.color || null, id]
            );
        } catch (e) {
            console.error('Database Error (updateServicio):', e);
            throw new Error('Failed to update servicio.');
        } finally {
            db.release();
        }
    },

    async deleteServicio(id: string): Promise<void> {
        noStore();
        const db = await getDbConnection();
        try {
            // FK ON DELETE SET NULL se encarga de desasociar programas automáticamente
            await db.execute('DELETE FROM servicios WHERE id = ?', [id]);
        } catch (e) {
            console.error('Database Error (deleteServicio):', e);
            throw new Error('Failed to delete servicio.');
        } finally {
            db.release();
        }
    },
```

También añadir el import de los nuevos tipos al inicio del archivo (actualizar la línea de import de index):

```typescript
import type { IRepository, DeploymentWithRelations, SummaryItem, CreateDeploymentPayload, UpdateDeploymentPayload, Programa, Responsable, Plataforma, Despliegue, Servicio, ServicioWithStats, CreateServicioPayload, UpdateServicioPayload, ProgramaConServicio, ProgramaConResumen, StatsPayload } from '.';
```

- [ ] **Step 2: Commit parcial**

```bash
git add src/lib/repository/mysql-repository.ts
git commit -m "feat(repo): add servicio CRUD methods to mysql repository"
```

---

### Task 4: MySQL Repository — Asociaciones y Estadísticas

**Files:**
- Modify: `src/lib/repository/mysql-repository.ts`

- [ ] **Step 1: Añadir métodos de asociación**

Continuar añadiendo al objeto `mysqlRepository`:

```typescript
    // ----------------------------------------------------
    //  ASOCIACIONES PROGRAMA-SERVICIO
    // ----------------------------------------------------
    async getProgramasConServicio(): Promise<ProgramaConServicio[]> {
        noStore();
        const db = await getDbConnection();
        try {
            const [rows] = await db.query<RowDataPacket[]>(
                'SELECT id, nombre, servicioId FROM programas ORDER BY nombre ASC'
            );
            return rows.map(row => ({
                id: row.id.toString(),
                nombre: row.nombre,
                servicioId: row.servicioId?.toString() || null,
            }));
        } catch (e) {
            console.error('Database Error (getProgramasConServicio):', e);
            throw new Error('Failed to fetch programas.');
        } finally {
            db.release();
        }
    },

    async getProgramasByServicio(servicioId: string): Promise<ProgramaConResumen[]> {
        noStore();
        const db = await getDbConnection();
        try {
            const sql = `
                WITH LatestPreprod AS (
                    SELECT d.*, ROW_NUMBER() OVER (PARTITION BY d.programaId ORDER BY d.fecha DESC) AS rn
                    FROM despliegues d WHERE d.entorno = 'Preproducción'
                ),
                LatestProd AS (
                    SELECT d.*, ROW_NUMBER() OVER (PARTITION BY d.programaId ORDER BY d.fecha DESC) AS rn
                    FROM despliegues d WHERE d.entorno = 'Producción'
                )
                SELECT
                    p.id, p.nombre, p.servicioId,
                    lpr.id AS preprodId, lpr.version AS preprodVersion, lpr.fecha AS preprodFecha,
                    lpr.plataforma AS preprodPlataforma, lpr.accion AS preprodAccion,
                    lpr.comentario AS preprodComentario, lpr.url AS preprodUrl,
                    lpr.port AS preprodPort, lpr.hasSwagger AS preprodHasSwagger,
                    rp.id AS preprodResponsableId, rp.nombre AS preprodResponsableNombre,
                    lprd.id AS prodId, lprd.version AS prodVersion, lprd.fecha AS prodFecha,
                    lprd.plataforma AS prodPlataforma, lprd.accion AS prodAccion,
                    lprd.comentario AS prodComentario, lprd.url AS prodUrl,
                    lprd.port AS prodPort, lprd.hasSwagger AS prodHasSwagger,
                    rprd.id AS prodResponsableId, rprd.nombre AS prodResponsableNombre
                FROM programas p
                LEFT JOIN LatestPreprod lpr  ON lpr.programaId  = p.id AND lpr.rn  = 1
                LEFT JOIN responsables  rp   ON lpr.responsableId = rp.id
                LEFT JOIN LatestProd    lprd ON lprd.programaId = p.id AND lprd.rn = 1
                LEFT JOIN responsables  rprd ON lprd.responsableId = rprd.id
                WHERE p.servicioId = ?
                ORDER BY p.nombre ASC
            `;
            const [rows] = await db.query<RowDataPacket[]>(sql, [servicioId]);
            return rows.map(row => ({
                id: row.id.toString(),
                nombre: row.nombre,
                servicioId: row.servicioId?.toString() || null,
                ultimoPreprod: row.preprodId ? {
                    id: row.preprodId.toString(),
                    fecha: new Date(row.preprodFecha).toISOString(),
                    entorno: 'Preproducción' as const,
                    version: row.preprodVersion,
                    plataforma: row.preprodPlataforma,
                    accion: row.preprodAccion,
                    comentario: row.preprodComentario,
                    hasSwagger: Boolean(row.preprodHasSwagger),
                    url: row.preprodUrl,
                    port: row.preprodPort,
                    programa: { id: row.id.toString(), nombre: row.nombre },
                    responsable: { id: row.preprodResponsableId.toString(), nombre: row.preprodResponsableNombre },
                } : null,
                ultimoProd: row.prodId ? {
                    id: row.prodId.toString(),
                    fecha: new Date(row.prodFecha).toISOString(),
                    entorno: 'Producción' as const,
                    version: row.prodVersion,
                    plataforma: row.prodPlataforma,
                    accion: row.prodAccion,
                    comentario: row.prodComentario,
                    hasSwagger: Boolean(row.prodHasSwagger),
                    url: row.prodUrl,
                    port: row.prodPort,
                    programa: { id: row.id.toString(), nombre: row.nombre },
                    responsable: { id: row.prodResponsableId.toString(), nombre: row.prodResponsableNombre },
                } : null,
            }));
        } catch (e) {
            console.error('Database Error (getProgramasByServicio):', e);
            throw new Error('Failed to fetch programas by servicio.');
        } finally {
            db.release();
        }
    },

    async getProgramasSinServicio(): Promise<ProgramaConServicio[]> {
        noStore();
        const db = await getDbConnection();
        try {
            const [rows] = await db.query<RowDataPacket[]>(
                'SELECT id, nombre FROM programas WHERE servicioId IS NULL ORDER BY nombre ASC'
            );
            return rows.map(row => ({ id: row.id.toString(), nombre: row.nombre, servicioId: null }));
        } catch (e) {
            console.error('Database Error (getProgramasSinServicio):', e);
            throw new Error('Failed to fetch orphan programas.');
        } finally {
            db.release();
        }
    },

    async updateProgramaServicio(programaId: string, servicioId: string | null): Promise<void> {
        noStore();
        const db = await getDbConnection();
        try {
            await db.execute(
                'UPDATE programas SET servicioId = ? WHERE id = ?',
                [servicioId, programaId]
            );
        } catch (e) {
            console.error('Database Error (updateProgramaServicio):', e);
            throw new Error('Failed to update programa servicio.');
        } finally {
            db.release();
        }
    },
```

- [ ] **Step 2: Añadir getStats()**

```typescript
    // ----------------------------------------------------
    //  ESTADÍSTICAS
    // ----------------------------------------------------
    async getStats(): Promise<StatsPayload> {
        noStore();
        const db = await getDbConnection();
        try {
            const [[totalsRow]] = await db.query<RowDataPacket[]>(`
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN entorno = 'Producción'    THEN 1 ELSE 0 END) AS totalProd,
                    SUM(CASE WHEN entorno = 'Preproducción' THEN 1 ELSE 0 END) AS totalPreprod,
                    MIN(fecha) AS primerDespliegue,
                    MAX(fecha) AS ultimoDespliegue
                FROM despliegues
            `);

            const [byResponsable] = await db.query<RowDataPacket[]>(`
                SELECT
                    r.nombre,
                    COUNT(*) AS total,
                    SUM(CASE WHEN d.entorno = 'Producción'    THEN 1 ELSE 0 END) AS prod,
                    SUM(CASE WHEN d.entorno = 'Preproducción' THEN 1 ELSE 0 END) AS preprod
                FROM despliegues d
                JOIN responsables r ON d.responsableId = r.id
                GROUP BY r.id, r.nombre
                ORDER BY total DESC
            `);

            const [byPlataforma] = await db.query<RowDataPacket[]>(`
                SELECT plataforma, COUNT(*) AS total
                FROM despliegues
                GROUP BY plataforma
                ORDER BY total DESC
            `);

            const [byMonth] = await db.query<RowDataPacket[]>(`
                SELECT
                    DATE_FORMAT(fecha, '%Y-%m') AS mes,
                    SUM(CASE WHEN entorno = 'Producción'    THEN 1 ELSE 0 END) AS prod,
                    SUM(CASE WHEN entorno = 'Preproducción' THEN 1 ELSE 0 END) AS preprod
                FROM despliegues
                WHERE fecha >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY mes
                ORDER BY mes ASC
            `);

            const [topProgramas] = await db.query<RowDataPacket[]>(`
                SELECT p.nombre, COUNT(*) AS total
                FROM despliegues d
                JOIN programas p ON d.programaId = p.id
                GROUP BY p.id, p.nombre
                ORDER BY total DESC
                LIMIT 10
            `);

            const [[serviciosCount]] = await db.query<RowDataPacket[]>(
                'SELECT COUNT(*) AS total FROM servicios'
            );
            const [[sinServicioCount]] = await db.query<RowDataPacket[]>(
                'SELECT COUNT(*) AS total FROM programas WHERE servicioId IS NULL'
            );

            const [byServicio] = await db.query<RowDataPacket[]>(`
                SELECT
                    s.nombre AS servicio,
                    COUNT(DISTINCT p.id) AS numProgramas,
                    SUM(CASE WHEN d.entorno = 'Producción'    THEN 1 ELSE 0 END) AS prod,
                    SUM(CASE WHEN d.entorno = 'Preproducción' THEN 1 ELSE 0 END) AS preprod,
                    MAX(d.fecha) AS ultimoDespliegue,
                    (
                        SELECT r2.nombre
                        FROM responsables r2
                        JOIN despliegues d2 ON d2.responsableId = r2.id
                        JOIN programas p2   ON d2.programaId = p2.id
                        WHERE p2.servicioId = s.id
                        GROUP BY r2.id
                        ORDER BY COUNT(*) DESC
                        LIMIT 1
                    ) AS topResponsable
                FROM servicios s
                LEFT JOIN programas   p ON p.servicioId = s.id
                LEFT JOIN despliegues d ON d.programaId = p.id
                GROUP BY s.id, s.nombre
                ORDER BY (SUM(CASE WHEN d.entorno = 'Producción' THEN 1 ELSE 0 END) +
                          SUM(CASE WHEN d.entorno = 'Preproducción' THEN 1 ELSE 0 END)) DESC
            `);

            const primerFecha = totalsRow.primerDespliegue ? new Date(totalsRow.primerDespliegue) : new Date();
            const ahora = new Date();
            const mesesTranscurridos = Math.max(1,
                (ahora.getFullYear() - primerFecha.getFullYear()) * 12 +
                (ahora.getMonth() - primerFecha.getMonth())
            );

            return {
                totales: {
                    total: Number(totalsRow.total),
                    prod: Number(totalsRow.totalProd),
                    preprod: Number(totalsRow.totalPreprod),
                    primerDespliegue: totalsRow.primerDespliegue ? new Date(totalsRow.primerDespliegue).toISOString() : null,
                    ultimoDespliegue: totalsRow.ultimoDespliegue ? new Date(totalsRow.ultimoDespliegue).toISOString() : null,
                    promedioMensual: Number((Number(totalsRow.total) / mesesTranscurridos).toFixed(1)),
                    serviciosActivos: Number(serviciosCount.total),
                    programasSinServicio: Number(sinServicioCount.total),
                },
                porResponsable: byResponsable.map(r => ({
                    nombre: r.nombre,
                    total: Number(r.total),
                    prod: Number(r.prod),
                    preprod: Number(r.preprod),
                })),
                porPlataforma: byPlataforma.map(p => ({
                    plataforma: p.plataforma,
                    total: Number(p.total),
                })),
                porMes: byMonth.map(m => ({
                    mes: m.mes,
                    prod: Number(m.prod),
                    preprod: Number(m.preprod),
                })),
                topProgramas: topProgramas.map(p => ({
                    nombre: p.nombre,
                    total: Number(p.total),
                })),
                porServicio: byServicio.map(s => ({
                    servicio: s.servicio,
                    numProgramas: Number(s.numProgramas),
                    prod: Number(s.prod || 0),
                    preprod: Number(s.preprod || 0),
                    ultimoDespliegue: s.ultimoDespliegue ? new Date(s.ultimoDespliegue).toISOString() : null,
                    topResponsable: s.topResponsable || null,
                })),
            };
        } catch (e) {
            console.error('Database Error (getStats):', e);
            throw new Error('Failed to fetch stats.');
        } finally {
            db.release();
        }
    },
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Esperado: solo errores en json-repository (stubs pendientes).

- [ ] **Step 4: Commit**

```bash
git add src/lib/repository/mysql-repository.ts
git commit -m "feat(repo): add asociaciones and getStats to mysql repository"
```

---

### Task 5: JSON Repository — Stubs

**Files:**
- Modify: `src/lib/repository/json-repository.ts`

- [ ] **Step 1: Actualizar import de tipos**

Reemplazar la línea de import de index:
```typescript
import type { IRepository, DeploymentWithRelations, SummaryItem, CreateDeploymentPayload, UpdateDeploymentPayload, Servicio, ServicioWithStats, CreateServicioPayload, UpdateServicioPayload, ProgramaConServicio, ProgramaConResumen, StatsPayload } from '.';
```

- [ ] **Step 2: Añadir stubs al final del objeto jsonRepository**

Antes del cierre `};` de `export const jsonRepository`:

```typescript
    // Stubs — solo para dev local (environment !== 'production')
    async getServicios(): Promise<ServicioWithStats[]> {
        return [];
    },
    async getServicioById(_id: string): Promise<Servicio | null> {
        return null;
    },
    async createServicio(_payload: CreateServicioPayload): Promise<void> {
        console.warn('createServicio: not implemented in JSON repository');
    },
    async updateServicio(_id: string, _payload: UpdateServicioPayload): Promise<void> {
        console.warn('updateServicio: not implemented in JSON repository');
    },
    async deleteServicio(_id: string): Promise<void> {
        console.warn('deleteServicio: not implemented in JSON repository');
    },
    async getProgramasConServicio(): Promise<ProgramaConServicio[]> {
        const db = await readDb();
        return db.programas.map(p => ({ id: p.id, nombre: p.nombre, servicioId: null }));
    },
    async getProgramasByServicio(_servicioId: string): Promise<ProgramaConResumen[]> {
        return [];
    },
    async getProgramasSinServicio(): Promise<ProgramaConServicio[]> {
        const db = await readDb();
        return db.programas.map(p => ({ id: p.id, nombre: p.nombre, servicioId: null }));
    },
    async updateProgramaServicio(_programaId: string, _servicioId: string | null): Promise<void> {
        console.warn('updateProgramaServicio: not implemented in JSON repository');
    },
    async getStats(): Promise<StatsPayload> {
        return {
            totales: { total: 0, prod: 0, preprod: 0, primerDespliegue: null, ultimoDespliegue: null, promedioMensual: 0, serviciosActivos: 0, programasSinServicio: 0 },
            porResponsable: [],
            porPlataforma: [],
            porMes: [],
            topProgramas: [],
            porServicio: [],
        };
    },
```

- [ ] **Step 3: Type-check limpio**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 4: Commit**

```bash
git add src/lib/repository/json-repository.ts
git commit -m "feat(repo): add JSON repository stubs for servicios and stats"
```

---

### Task 6: Server Actions — Servicios

**Files:**
- Create: `src/lib/actions-servicios.ts`

- [ ] **Step 1: Crear fichero de actions**

```typescript
// src/lib/actions-servicios.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { repository } from './repository';

const ServicioSchema = z.object({
    nombre: z.string().min(1, 'Nombre requerido').max(100),
    descripcion: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
});

export async function createServicio(formData: FormData) {
    const raw = Object.fromEntries(formData.entries());
    const validated = ServicioSchema.safeParse(raw);
    if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors, message: 'Error de validación.' };
    }
    try {
        await repository.createServicio(validated.data);
    } catch {
        return { message: 'Error al crear el servicio.' };
    }
    revalidatePath('/servicios');
    revalidatePath('/');
    return { message: 'Servicio creado.' };
}

export async function updateServicio(id: string, formData: FormData) {
    const raw = Object.fromEntries(formData.entries());
    const validated = ServicioSchema.safeParse(raw);
    if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors, message: 'Error de validación.' };
    }
    try {
        await repository.updateServicio(id, validated.data);
    } catch {
        return { message: 'Error al actualizar el servicio.' };
    }
    revalidatePath('/servicios');
    revalidatePath('/');
    return { message: 'Servicio actualizado.' };
}

export async function deleteServicio(id: string) {
    try {
        await repository.deleteServicio(id);
    } catch {
        return { message: 'Error al eliminar el servicio.' };
    }
    revalidatePath('/servicios');
    revalidatePath('/');
    return { message: 'Servicio eliminado. Los programas asociados quedan sin servicio.' };
}

export async function updateAsociaciones(
    servicioId: string,
    programaIds: string[],  // IDs que DEBEN quedar asociados a este servicio
    todosLosProgramas: Array<{ id: string; servicioId: string | null }>
) {
    try {
        for (const programa of todosLosProgramas) {
            const debeEstarAsociado = programaIds.includes(programa.id);
            const estaAsociado = programa.servicioId === servicioId;

            if (debeEstarAsociado && !estaAsociado) {
                await repository.updateProgramaServicio(programa.id, servicioId);
            } else if (!debeEstarAsociado && estaAsociado) {
                await repository.updateProgramaServicio(programa.id, null);
            }
        }
    } catch {
        return { message: 'Error al actualizar asociaciones.' };
    }
    revalidatePath(`/servicios/${servicioId}`);
    revalidatePath('/servicios');
    revalidatePath('/');
    return { message: 'Asociaciones actualizadas.' };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions-servicios.ts
git commit -m "feat(actions): add servicio CRUD and asociaciones server actions"
```

---

## FASE 2 — UI de Servicios

---

### Task 7: Constantes de color + ServiceForm

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/components/servicios/service-form.tsx`

- [ ] **Step 1: Crear constantes**

```typescript
// src/lib/constants.ts
export const SERVICE_COLORS = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#6366F1', // indigo
    '#84CC16', // lime
    '#06B6D4', // cyan
    '#A855F7', // purple
] as const;

export const ENTORNO_STYLES = {
    'Producción': {
        badge: 'bg-green-100 text-green-800 border-green-200',
        dot: 'bg-green-500',
    },
    'Preproducción': {
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
    },
} as const;
```

- [ ] **Step 2: Crear ServiceForm**

```tsx
// src/components/servicios/service-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SERVICE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ServiceFormProps {
    action: (formData: FormData) => Promise<{ message: string; errors?: Record<string, string[]> }>;
    defaultValues?: {
        nombre?: string;
        descripcion?: string;
        color?: string;
    };
    submitLabel: string;
}

export function ServiceForm({ action, defaultValues, submitLabel }: ServiceFormProps) {
    const router = useRouter();
    const [selectedColor, setSelectedColor] = useState<string>(defaultValues?.color || SERVICE_COLORS[0]);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsPending(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        formData.set('color', selectedColor);
        const result = await action(formData);
        setIsPending(false);
        if (result.message.startsWith('Error')) {
            setError(result.message);
        } else {
            router.push('/servicios');
            router.refresh();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                    id="nombre"
                    name="nombre"
                    required
                    defaultValue={defaultValues?.nombre}
                    placeholder="Ej: ArcoNet"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                    id="descripcion"
                    name="descripcion"
                    defaultValue={defaultValues?.descripcion ?? ''}
                    placeholder="Descripción opcional del servicio"
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                    {SERVICE_COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={cn(
                                'h-8 w-8 rounded-full border-2 transition-all',
                                selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
                <p className="text-xs text-muted-foreground">Color seleccionado: {selectedColor}</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Guardando...' : submitLabel}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts src/components/servicios/service-form.tsx
git commit -m "feat(ui): add color constants and ServiceForm component"
```

---

### Task 8: DeleteServiceDialog + Página /servicios (lista)

**Files:**
- Create: `src/components/servicios/delete-service-dialog.tsx`
- Create: `src/app/(main)/servicios/page.tsx`

- [ ] **Step 1: Crear DeleteServiceDialog**

```tsx
// src/components/servicios/delete-service-dialog.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteServicio } from '@/lib/actions-servicios';

interface DeleteServiceDialogProps {
    id: string;
    nombre: string;
    numProgramas: number;
}

export function DeleteServiceDialog({ id, nombre, numProgramas }: DeleteServiceDialogProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);

    async function handleDelete() {
        setIsPending(true);
        await deleteServicio(id);
        router.refresh();
        setIsPending(false);
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Eliminar servicio &quot;{nombre}&quot;</AlertDialogTitle>
                    <AlertDialogDescription>
                        {numProgramas > 0
                            ? `Los ${numProgramas} programa(s) asociados quedarán sin servicio pero sus despliegues no se borrarán.`
                            : 'Este servicio no tiene programas asociados.'
                        }
                        {' '}Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isPending ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
```

- [ ] **Step 2: Crear página /servicios**

```tsx
// src/app/(main)/servicios/page.tsx
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil } from 'lucide-react';
import { DeleteServiceDialog } from '@/components/servicios/delete-service-dialog';

export default async function ServiciosPage() {
    const servicios = await repository.getServicios();

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
                    <p className="text-muted-foreground">Gestiona los servicios y sus programas asociados.</p>
                </div>
                <Button asChild>
                    <Link href="/servicios/nuevo">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo servicio
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{servicios.length} servicios</CardTitle>
                </CardHeader>
                <CardContent>
                    {servicios.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No hay servicios creados.{' '}
                            <Link href="/servicios/nuevo" className="underline">Crear el primero.</Link>
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servicio</TableHead>
                                    <TableHead className="text-center">Programas</TableHead>
                                    <TableHead className="text-center">Despliegues</TableHead>
                                    <TableHead>Entornos</TableHead>
                                    <TableHead>Último despliegue</TableHead>
                                    <TableHead className="w-24">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {servicios.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <Link href={`/servicios/${s.id}`} className="flex items-center gap-2 hover:underline font-medium">
                                                <span
                                                    className="h-3 w-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: s.color ?? '#6B7280' }}
                                                />
                                                {s.nombre}
                                            </Link>
                                            {s.descripcion && (
                                                <p className="text-xs text-muted-foreground mt-0.5 ml-5">{s.descripcion}</p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">{s.numProgramas}</TableCell>
                                        <TableCell className="text-center">{s.numDespliegues}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {s.tieneProduccion && (
                                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Prod</Badge>
                                                )}
                                                {s.tienePreproduccion && (
                                                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs">Preprod</Badge>
                                                )}
                                                {!s.tieneProduccion && !s.tienePreproduccion && (
                                                    <Badge variant="outline" className="text-xs">Sin despliegues</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {s.ultimoDespliegue
                                                ? new Date(s.ultimoDespliegue).toLocaleDateString('es-ES')
                                                : '—'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={`/servicios/${s.id}/editar`}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <DeleteServiceDialog
                                                    id={s.id}
                                                    nombre={s.nombre}
                                                    numProgramas={s.numProgramas}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/servicios/delete-service-dialog.tsx src/app/(main)/servicios/page.tsx
git commit -m "feat(ui): add servicios list page and delete dialog"
```

---

### Task 9: Páginas Crear y Editar Servicio

**Files:**
- Create: `src/app/(main)/servicios/nuevo/page.tsx`
- Create: `src/app/(main)/servicios/[id]/editar/page.tsx`

- [ ] **Step 1: Página /servicios/nuevo**

```tsx
// src/app/(main)/servicios/nuevo/page.tsx
import { ServiceForm } from '@/components/servicios/service-form';
import { createServicio } from '@/lib/actions-servicios';

export default function NuevoServicioPage() {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Nuevo servicio</h1>
                <p className="text-muted-foreground">Crea un nuevo servicio para agrupar programas.</p>
            </div>
            <ServiceForm action={createServicio} submitLabel="Crear servicio" />
        </div>
    );
}
```

- [ ] **Step 2: Página /servicios/[id]/editar**

```tsx
// src/app/(main)/servicios/[id]/editar/page.tsx
import { notFound } from 'next/navigation';
import { repository } from '@/lib/repository';
import { ServiceForm } from '@/components/servicios/service-form';
import { updateServicio } from '@/lib/actions-servicios';

export default async function EditarServicioPage({ params }: { params: { id: string } }) {
    const servicio = await repository.getServicioById(params.id);
    if (!servicio) notFound();

    const boundAction = updateServicio.bind(null, params.id);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Editar servicio</h1>
                <p className="text-muted-foreground">Modifica los datos del servicio &quot;{servicio.nombre}&quot;.</p>
            </div>
            <ServiceForm
                action={boundAction}
                defaultValues={{
                    nombre: servicio.nombre,
                    descripcion: servicio.descripcion ?? '',
                    color: servicio.color ?? undefined,
                }}
                submitLabel="Guardar cambios"
            />
        </div>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/servicios/nuevo/page.tsx src/app/(main)/servicios/[id]/editar/page.tsx
git commit -m "feat(ui): add create and edit servicio pages"
```

---

### Task 10: ProgramCard (colapsable, solo lectura)

**Files:**
- Create: `src/components/servicios/program-card.tsx`

Primero, leer el componente de modal de detalle existente para conocer su API:

- [ ] **Step 1: Leer DeploymentDetailsDialog**

```bash
cat src/components/deployments/deployment-details-dialog.tsx
```

Tomar nota de las props que acepta (espera un objeto `DeploymentWithRelations`).

- [ ] **Step 2: Crear ProgramCard**

```tsx
// src/components/servicios/program-card.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeploymentDetailsDialog } from '@/components/deployments/deployment-details-dialog';
import type { ProgramaConResumen, DeploymentWithRelations } from '@/lib/repository';
import { ENTORNO_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ProgramCardProps {
    programa: ProgramaConResumen;
}

export function ProgramCard({ programa }: ProgramCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [selectedDeployment, setSelectedDeployment] = useState<DeploymentWithRelations | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    function openDetail(deployment: DeploymentWithRelations) {
        setSelectedDeployment(deployment);
        setDialogOpen(true);
    }

    return (
        <>
            <div className="border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                {/* Header siempre visible */}
                <div
                    className="flex items-center gap-3 p-4 cursor-pointer select-none"
                    onClick={() => setExpanded(v => !v)}
                >
                    <span className="font-medium flex-1">{programa.nombre}</span>

                    <VersionBadge
                        entorno="Preproducción"
                        deployment={programa.ultimoPreprod}
                        onClick={openDetail}
                    />
                    <VersionBadge
                        entorno="Producción"
                        deployment={programa.ultimoProd}
                        onClick={openDetail}
                    />

                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" tabIndex={-1}>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Detalle expandido */}
                {expanded && (
                    <div className="border-t grid grid-cols-2 divide-x">
                        <EntornoDetail
                            label="Preproducción"
                            deployment={programa.ultimoPreprod}
                            onOpen={openDetail}
                        />
                        <EntornoDetail
                            label="Producción"
                            deployment={programa.ultimoProd}
                            onOpen={openDetail}
                        />
                    </div>
                )}
            </div>

            {selectedDeployment && (
                <DeploymentDetailsDialog
                    deployment={selectedDeployment}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                />
            )}
        </>
    );
}

function VersionBadge({
    entorno,
    deployment,
    onClick,
}: {
    entorno: 'Preproducción' | 'Producción';
    deployment: DeploymentWithRelations | null;
    onClick: (d: DeploymentWithRelations) => void;
}) {
    const styles = ENTORNO_STYLES[entorno];
    if (!deployment) {
        return (
            <Badge variant="outline" className="text-xs text-muted-foreground">
                Sin {entorno === 'Producción' ? 'prod' : 'preprod'}
            </Badge>
        );
    }
    return (
        <Badge
            variant="outline"
            className={cn('text-xs cursor-pointer hover:opacity-80 transition-opacity', styles.badge)}
            onClick={(e) => { e.stopPropagation(); onClick(deployment); }}
        >
            {deployment.version}
        </Badge>
    );
}

function EntornoDetail({
    label,
    deployment,
    onOpen,
}: {
    label: string;
    deployment: DeploymentWithRelations | null;
    onOpen: (d: DeploymentWithRelations) => void;
}) {
    const styles = ENTORNO_STYLES[label as 'Preproducción' | 'Producción'];
    return (
        <div className="p-4 space-y-2">
            <p className={cn('text-xs font-semibold uppercase tracking-wide', styles.badge.split(' ')[1])}>
                {label}
            </p>
            {deployment ? (
                <>
                    <p className="font-mono text-sm font-medium">{deployment.version}</p>
                    <p className="text-xs text-muted-foreground">
                        📅 {new Date(deployment.fecha).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-xs text-muted-foreground">👤 {deployment.responsable.nombre}</p>
                    <p className="text-xs text-muted-foreground">🏷️ {deployment.plataforma}</p>
                    {deployment.comentario && (
                        <p className="text-xs text-muted-foreground line-clamp-2">💬 {deployment.comentario}</p>
                    )}
                    <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => onOpen(deployment)}
                    >
                        Ver detalles completos →
                    </Button>
                </>
            ) : (
                <p className="text-xs text-muted-foreground">Sin despliegues registrados</p>
            )}
        </div>
    );
}
```

**Nota:** Si `DeploymentDetailsDialog` no acepta prop `open`/`onOpenChange` externamente (gestiona su propio estado), habrá que adaptar el componente para aceptar control externo. Leer el componente en el Step 1 para confirmarlo y adaptar si es necesario.

- [ ] **Step 3: Commit**

```bash
git add src/components/servicios/program-card.tsx
git commit -m "feat(ui): add collapsible ProgramCard with deployment detail modal"
```

---

### Task 11: Modal de Asociaciones

**Files:**
- Create: `src/components/servicios/asociaciones-modal.tsx`

- [ ] **Step 1: Crear AsociacionesModal**

```tsx
// src/components/servicios/asociaciones-modal.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { updateAsociaciones } from '@/lib/actions-servicios';
import type { ProgramaConServicio } from '@/lib/repository';
import { Input } from '@/components/ui/input';

interface AsociacionesModalProps {
    servicioId: string;
    todosLosProgramas: ProgramaConServicio[];
    programasAsociados: string[]; // IDs actualmente asociados a este servicio
}

export function AsociacionesModal({ servicioId, todosLosProgramas, programasAsociados }: AsociacionesModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set(programasAsociados));
    const [search, setSearch] = useState('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const filtered = todosLosProgramas.filter(p =>
        p.nombre.toLowerCase().includes(search.toLowerCase())
    );

    function toggle(id: string) {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function handleSave() {
        startTransition(async () => {
            const result = await updateAsociaciones(servicioId, Array.from(selected), todosLosProgramas);
            if (result.message.startsWith('Error')) {
                setError(result.message);
            } else {
                setOpen(false);
                router.refresh();
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings2 className="mr-2 h-4 w-4" />
                    Gestionar programas
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Gestionar programas asociados</DialogTitle>
                </DialogHeader>

                <Input
                    placeholder="Buscar programa..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="mt-2"
                />

                <div className="flex-1 overflow-y-auto space-y-2 my-2 pr-1">
                    {filtered.map(programa => (
                        <div key={programa.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                            <Checkbox
                                id={`prog-${programa.id}`}
                                checked={selected.has(programa.id)}
                                onCheckedChange={() => toggle(programa.id)}
                            />
                            <Label htmlFor={`prog-${programa.id}`} className="cursor-pointer flex-1">
                                {programa.nombre}
                                {programa.servicioId && programa.servicioId !== servicioId && (
                                    <span className="ml-2 text-xs text-muted-foreground">(en otro servicio)</span>
                                )}
                            </Label>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-4">Sin resultados</p>
                    )}
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending ? 'Guardando...' : `Guardar (${selected.size} seleccionados)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/servicios/asociaciones-modal.tsx
git commit -m "feat(ui): add AsociacionesModal for program-service assignment"
```

---

### Task 12: Página de Detalle de Servicio

**Files:**
- Create: `src/app/(main)/servicios/[id]/page.tsx`

- [ ] **Step 1: Crear página de detalle**

```tsx
// src/app/(main)/servicios/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { ProgramCard } from '@/components/servicios/program-card';
import { AsociacionesModal } from '@/components/servicios/asociaciones-modal';

export default async function ServicioDetailPage({ params }: { params: { id: string } }) {
    const [servicio, programas, todosLosProgramas] = await Promise.all([
        repository.getServicioById(params.id),
        repository.getProgramasByServicio(params.id),
        repository.getProgramasConServicio(),
    ]);

    if (!servicio) notFound();

    const programasAsociadosIds = programas.map(p => p.id);
    const totalDespliegues = programas.reduce((acc, p) => {
        return acc + (p.ultimoPreprod ? 1 : 0) + (p.ultimoProd ? 1 : 0);
    }, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <span
                        className="h-5 w-5 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: servicio.color ?? '#6B7280' }}
                    />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{servicio.nombre}</h1>
                        {servicio.descripcion && (
                            <p className="text-muted-foreground mt-0.5">{servicio.descripcion}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AsociacionesModal
                        servicioId={params.id}
                        todosLosProgramas={todosLosProgramas}
                        programasAsociados={programasAsociadosIds}
                    />
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/servicios/${params.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats rápidas */}
            <div className="flex gap-4 flex-wrap">
                <Badge variant="outline" className="text-sm px-3 py-1">
                    {programas.length} programa{programas.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-sm px-3 py-1">
                    {programas.filter(p => p.ultimoProd).length} en producción
                </Badge>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-sm px-3 py-1">
                    {programas.filter(p => p.ultimoPreprod).length} en preproducción
                </Badge>
            </div>

            {/* Lista de programas */}
            {programas.length === 0 ? (
                <div className="border rounded-xl p-12 text-center text-muted-foreground">
                    <p>No hay programas asociados a este servicio.</p>
                    <p className="text-sm mt-1">Usa &quot;Gestionar programas&quot; para asociar programas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {programas.map(programa => (
                        <ProgramCard key={programa.id} programa={programa} />
                    ))}
                </div>
            )}

            <div className="pt-2">
                <Link href="/servicios" className="text-sm text-muted-foreground hover:underline">
                    ← Volver a servicios
                </Link>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/servicios/[id]/page.tsx
git commit -m "feat(ui): add service detail page with program cards and associations"
```

---

## FASE 3 — Nuevo Home

---

### Task 13: ServiceCard + Nuevo Home

**Files:**
- Create: `src/components/servicios/service-card.tsx`
- Modify: `src/app/(main)/page.tsx`

- [ ] **Step 1: Crear ServiceCard para el grid del home**

```tsx
// src/components/servicios/service-card.tsx
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { ServicioWithStats } from '@/lib/repository';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
    servicio: ServicioWithStats;
}

export function ServiceCard({ servicio }: ServiceCardProps) {
    const color = servicio.color ?? '#6B7280';

    return (
        <Link href={`/servicios/${servicio.id}`}>
            <div className={cn(
                'border rounded-xl bg-background shadow-sm hover:shadow-md transition-all duration-200',
                'hover:-translate-y-0.5 cursor-pointer overflow-hidden'
            )}>
                {/* Franja de color */}
                <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

                <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{servicio.nombre}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {servicio.numProgramas} prog.
                        </span>
                    </div>

                    {servicio.descripcion && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{servicio.descripcion}</p>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {servicio.tieneProduccion && (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0">
                                    Prod
                                </Badge>
                            )}
                            {servicio.tienePreproduccion && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs px-2 py-0">
                                    Preprod
                                </Badge>
                            )}
                            {!servicio.tieneProduccion && !servicio.tienePreproduccion && (
                                <Badge variant="outline" className="text-xs px-2 py-0">Sin deploys</Badge>
                            )}
                        </div>
                        {servicio.ultimoDespliegue && (
                            <span className="text-xs text-muted-foreground">
                                {new Date(servicio.ultimoDespliegue).toLocaleDateString('es-ES')}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
```

- [ ] **Step 2: Reemplazar home page**

```tsx
// src/app/(main)/page.tsx
import { repository } from '@/lib/repository';
import { ServiceCard } from '@/components/servicios/service-card';
import { ProgramCard } from '@/components/servicios/program-card';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function Home() {
    return (
        <div className="space-y-8">
            <Suspense fallback={<LoadingSpinner />}>
                <HomeContent />
            </Suspense>
        </div>
    );
}

async function HomeContent() {
    const [servicios, programasSinServicio] = await Promise.all([
        repository.getServicios(),
        repository.getProgramasSinServicio(),
    ]);

    // Para programas sin servicio necesitamos sus últimos despliegues
    // Reutilizamos getSummary para obtener el resumen
    const summary = programasSinServicio.length > 0 ? await repository.getSummary() : [];
    const summaryMap = new Map(summary.map(s => [s.programaId, s]));

    const programasHuerfanosConResumen = programasSinServicio.map(p => {
        const s = summaryMap.get(p.id);
        return {
            ...p,
            ultimoPreprod: s?.Preproducción ?? null,
            ultimoProd: s?.Producción ?? null,
        };
    });

    return (
        <>
            {/* Servicios */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/servicios/nuevo">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo servicio
                        </Link>
                    </Button>
                </div>

                {servicios.length === 0 ? (
                    <div className="border rounded-xl p-12 text-center text-muted-foreground">
                        <p>No hay servicios creados.</p>
                        <Button asChild className="mt-4" size="sm">
                            <Link href="/servicios/nuevo">Crear primer servicio</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {servicios.map(servicio => (
                            <ServiceCard key={servicio.id} servicio={servicio} />
                        ))}
                    </div>
                )}
            </section>

            {/* Programas sin servicio */}
            {programasHuerfanosConResumen.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-muted-foreground">
                            Sin servicio asignado ({programasHuerfanosConResumen.length})
                        </h2>
                        <Link href="/servicios" className="text-sm underline text-muted-foreground hover:text-foreground">
                            Gestionar →
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {programasHuerfanosConResumen.map(p => (
                            <ProgramCard key={p.id} programa={p} />
                        ))}
                    </div>
                </section>
            )}
        </>
    );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/servicios/service-card.tsx src/app/(main)/page.tsx
git commit -m "feat(ui): replace home with services grid and orphan programs section"
```

---

## FASE 4 — Estadísticas

---

### Task 14: Página de Estadísticas

**Files:**
- Create: `src/app/(main)/estadisticas/page.tsx`

- [ ] **Step 1: Crear página de estadísticas completa**

```tsx
// src/app/(main)/estadisticas/page.tsx
import { repository } from '@/lib/repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';

export default async function EstadisticasPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
                <p className="text-muted-foreground">Resumen de actividad de despliegues.</p>
            </div>
            <Suspense fallback={<LoadingSpinner />}>
                <StatsContent />
            </Suspense>
        </div>
    );
}

async function StatsContent() {
    const stats = await repository.getStats();
    const { totales, porResponsable, porPlataforma, porMes, topProgramas, porServicio } = stats;

    const primerFecha = totales.primerDespliegue
        ? new Date(totales.primerDespliegue).toLocaleDateString('es-ES')
        : '—';
    const ultimaFecha = totales.ultimoDespliegue
        ? new Date(totales.ultimoDespliegue).toLocaleDateString('es-ES')
        : '—';

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Total despliegues" value={totales.total} />
                <KPICard title="En producción" value={totales.prod} className="border-green-200 bg-green-50" />
                <KPICard title="En preproducción" value={totales.preprod} className="border-amber-200 bg-amber-50" />
                <KPICard title="Servicios activos" value={totales.serviciosActivos} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Promedio / mes" value={totales.promedioMensual} subtitle="desde el inicio" />
                <KPICard title="Primer despliegue" value={primerFecha} isText />
                <KPICard title="Último despliegue" value={ultimaFecha} isText />
                <KPICard title="Sin servicio asignado" value={totales.programasSinServicio} subtitle="programas" />
            </div>

            {/* Gráfico por mes + por plataforma */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Despliegues por mes (últimos 12 meses)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={porMes} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="prod" name="Producción" fill="#22c55e" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="preprod" name="Preproducción" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Despliegues por plataforma</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart
                                data={porPlataforma}
                                layout="vertical"
                                margin={{ top: 4, right: 16, left: 20, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis dataKey="plataforma" type="category" tick={{ fontSize: 11 }} width={70} />
                                <Tooltip />
                                <Bar dataKey="total" name="Total" fill="#6366f1" radius={[0, 3, 3, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Top programas */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Top 10 programas más desplegados</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={topProgramas}
                            layout="vertical"
                            margin={{ top: 4, right: 16, left: 120, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                            <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} width={115} />
                            <Tooltip />
                            <Bar dataKey="total" name="Despliegues" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Tabla por responsable */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Actividad por responsable</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Responsable</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="text-right">
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs font-normal">Producción</Badge>
                                </TableHead>
                                <TableHead className="text-right">
                                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-normal">Preproducción</Badge>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {porResponsable.map((r, i) => (
                                <TableRow key={r.nombre}>
                                    <TableCell className="font-medium">
                                        {i === 0 && <span className="mr-2">🏆</span>}
                                        {r.nombre}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">{r.total}</TableCell>
                                    <TableCell className="text-right text-green-700">{r.prod}</TableCell>
                                    <TableCell className="text-right text-amber-700">{r.preprod}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Tabla por servicio */}
            {porServicio.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Resumen por servicio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Servicio</TableHead>
                                    <TableHead className="text-center">Programas</TableHead>
                                    <TableHead className="text-center">Prod</TableHead>
                                    <TableHead className="text-center">Preprod</TableHead>
                                    <TableHead>Último deploy</TableHead>
                                    <TableHead>+ Activo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {porServicio.map(s => (
                                    <TableRow key={s.servicio}>
                                        <TableCell className="font-medium">{s.servicio}</TableCell>
                                        <TableCell className="text-center">{s.numProgramas}</TableCell>
                                        <TableCell className="text-center text-green-700">{s.prod}</TableCell>
                                        <TableCell className="text-center text-amber-700">{s.preprod}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {s.ultimoDespliegue ? new Date(s.ultimoDespliegue).toLocaleDateString('es-ES') : '—'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {s.topResponsable ?? '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function KPICard({
    title,
    value,
    subtitle,
    className,
    isText = false,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    className?: string;
    isText?: boolean;
}) {
    return (
        <Card className={className}>
            <CardContent className="p-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
                <p className={isText ? 'text-lg font-semibold mt-1' : 'text-3xl font-bold mt-1'}>{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            </CardContent>
        </Card>
    );
}
```

- [ ] **Step 2: Verificar que recharts está instalado**

```bash
cat package.json | grep recharts
```

Si no está: `npm install recharts`. Generalmente ya viene con shadcn/ui.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/estadisticas/page.tsx
git commit -m "feat(ui): add estadisticas page with KPIs, charts and tables"
```

---

## FASE 5 — Visual / UX

---

### Task 15: Sidebar — Nuevos nav items

**Files:**
- Modify: `src/app/(main)/layout.tsx`

- [ ] **Step 1: Actualizar navLinks y imports**

Reemplazar las líneas de imports de iconos y `navLinks`:

```tsx
import { Home, Package, PanelLeft, Wifi, LayoutGrid, BarChart3 } from 'lucide-react';
```

```tsx
const navLinks = [
  { href: '/',              icon: Home,        label: 'Inicio' },
  { href: '/servicios',     icon: LayoutGrid,  label: 'Servicios' },
  { href: '/deployments',   icon: Package,     label: 'Despliegues' },
  { href: '/estadisticas',  icon: BarChart3,   label: 'Estadísticas' },
  { href: '/ports',         icon: Wifi,        label: 'Puertos' },
];
```

También actualizar la lógica de active para que `/servicios/[id]` resalte "Servicios":

```tsx
// Reemplazar el className del Link en el aside:
className={`flex h-9 w-9 items-center justify-center rounded-lg ${
  pathname === href || (href !== '/' && pathname.startsWith(href))
    ? 'bg-accent text-accent-foreground'
    : 'text-muted-foreground'
} transition-colors hover:text-foreground md:h-8 md:w-8`}
```

Y el mismo cambio en el Sheet móvil:
```tsx
className={cn(
  'flex items-center gap-4 px-2.5',
  (pathname === href || (href !== '/' && pathname.startsWith(href)))
    ? 'text-foreground'
    : 'text-muted-foreground hover:text-foreground'
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/layout.tsx
git commit -m "feat(ui): update sidebar with servicios and estadisticas nav items"
```

---

### Task 16: Mejora Página de Puertos

**Files:**
- Modify: `src/components/ports-table.tsx`

- [ ] **Step 1: Reescribir PortsTable con búsqueda y rangos**

```tsx
// src/components/ports-table.tsx
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { PortData } from '@/app/(main)/ports/page';
import { ENTORNO_STYLES } from '@/lib/constants';

interface PortsTableProps {
    deployments: PortData[];
}

interface PortRow {
    applicationName: string;
    port: string;
    entorno: 'Producción' | 'Preproducción';
}

function parsePort(portStr: string): number {
    const n = parseInt(portStr, 10);
    return isNaN(n) ? 0 : n;
}

function getRangeLabel(port: number): string {
    if (port === 0) return 'Sin puerto';
    const base = Math.floor(port / 100) * 100;
    return `${base} – ${base + 99}`;
}

export default function PortsTable({ deployments }: PortsTableProps) {
    const [search, setSearch] = useState('');

    // Aplanar: una fila por (programa, entorno) con puerto
    const allRows = useMemo<PortRow[]>(() => {
        const rows: PortRow[] = [];
        for (const d of deployments) {
            if (d.preproduccionPort && d.preproduccionPort !== 'N/A') {
                rows.push({ applicationName: d.applicationName, port: d.preproduccionPort, entorno: 'Preproducción' });
            }
            if (d.produccionPort && d.produccionPort !== 'N/A') {
                rows.push({ applicationName: d.applicationName, port: d.produccionPort, entorno: 'Producción' });
            }
        }
        // Ordenar por puerto numérico
        return rows.sort((a, b) => parsePort(a.port) - parsePort(b.port));
    }, [deployments]);

    const filtered = useMemo(() => {
        if (!search.trim()) return allRows;
        const q = search.toLowerCase();
        return allRows.filter(r =>
            r.applicationName.toLowerCase().includes(q) ||
            r.port.includes(q)
        );
    }, [allRows, search]);

    // Agrupar por rango de 100
    const grouped = useMemo(() => {
        const map = new Map<string, PortRow[]>();
        for (const row of filtered) {
            const label = getRangeLabel(parsePort(row.port));
            if (!map.has(label)) map.set(label, []);
            map.get(label)!.push(row);
        }
        return Array.from(map.entries());
    }, [filtered]);

    const usedPorts = useMemo(() => new Set(allRows.map(r => parsePort(r.port)).filter(p => p > 0)), [allRows]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Puertos</h1>
                    <p className="text-muted-foreground">
                        {usedPorts.size} puertos en uso. Solo lectura — edita desde Despliegues.
                    </p>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por programa o puerto..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {filtered.length} asignaciones{search ? ` para "${search}"` : ''}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-32 pl-6">Puerto</TableHead>
                                <TableHead>Programa</TableHead>
                                <TableHead>Entorno</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grouped.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                        Sin resultados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                grouped.map(([rangeLabel, rows]) => (
                                    <>
                                        {/* Separador de rango */}
                                        <TableRow key={`range-${rangeLabel}`} className="bg-muted/30 hover:bg-muted/30">
                                            <TableCell colSpan={3} className="py-1.5 pl-6">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Rango {rangeLabel}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                        {rows.map((row, i) => {
                                            const styles = ENTORNO_STYLES[row.entorno];
                                            return (
                                                <TableRow key={`${row.applicationName}-${row.port}-${i}`}>
                                                    <TableCell className="pl-6">
                                                        <span className="font-mono font-semibold text-sm">{row.port}</span>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{row.applicationName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`text-xs ${styles.badge}`}>
                                                            {row.entorno}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
```

- [ ] **Step 2: Actualizar ports/page.tsx para quitar el H1 duplicado** (ahora está en PortsTable)

```tsx
// src/app/(main)/ports/page.tsx — mantener igual, PortsTable ya tiene el header
```

No necesita cambio si el header anterior estaba en el Card. Verificar que no haya H1 duplicado al renderizar.

- [ ] **Step 3: Commit**

```bash
git add src/components/ports-table.tsx
git commit -m "feat(ui): improve ports table with search, port ordering and range grouping"
```

---

### Task 17: Build final y verificación

- [ ] **Step 1: Build completo**

```bash
npm run build
```

Revisar errores. Los más frecuentes:
- `DeploymentDetailsDialog` no acepta props `open`/`onOpenChange` → adaptar `ProgramCard` para gestionar apertura con trigger interno
- Recharts no instalado → `npm install recharts`
- Props de componentes shadcn mal tipadas

- [ ] **Step 2: Resolver errores de build**

Si `DeploymentDetailsDialog` no acepta `open`/`onOpenChange` externos, simplificar `ProgramCard`:

```tsx
// Alternativa: usar el componente con su propio trigger
// En ProgramCard, en lugar de Dialog controlado, usar DialogTrigger directo:
<DeploymentDetailsDialog deployment={deployment} />
// (Si el componente ya incluye su propio trigger/button)
```

Leer el componente y adaptar según su API real.

- [ ] **Step 3: Type-check final**

```bash
npx tsc --noEmit
```

Esperado: 0 errores.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "fix: resolve build errors and type issues"
```

---

## Deploy

- [ ] **Build imagen Docker**

```bash
docker build -t despliegues:v1.1.0 .
docker save despliegues:v1.1.0 | gzip > despliegues-v1.1.0.tar.gz
```

- [ ] **Aplicar migración SQL primero** (ver Task 1 Step 2)

- [ ] **Actualizar servicio en Swarm**

```bash
docker load < despliegues-v1.1.0.tar.gz
docker service update --image despliegues:v1.1.0 DEPLOYMENT_TRACKER_FRONT
```

- [ ] **Verificar en producción**

```bash
# Comprobar que el servicio arrancó
docker service ps DEPLOYMENT_TRACKER_FRONT
# Ver logs
docker service logs DEPLOYMENT_TRACKER_FRONT --tail 50
```

---

## Self-Review

**Cobertura del spec:**
- ✅ DB: tabla `servicios` + FK nullable en `programas`
- ✅ Navegación: sidebar con 5 items incluyendo Servicios y Estadísticas
- ✅ Home: grid de servicios + huérfanos
- ✅ /servicios: CRUD completo con delete dialog
- ✅ /servicios/[id]: detalle con ProgramCard colapsable + modal existente + AsociacionesModal
- ✅ Estadísticas: KPIs, gráficos por mes/plataforma, top programas, tabla responsables, tabla servicios
- ✅ Puertos: tabla mejorada con búsqueda y rangos
- ✅ Paleta entornos: verde/ámbar consistente vía `ENTORNO_STYLES`

**Tipos consistentes:**
- `ServicioWithStats` definido en Task 2, usado en Tasks 3, 13, 14
- `ProgramaConResumen` definido en Task 2, usado en Tasks 4, 10, 12
- `StatsPayload` definido en Task 2, usado en Tasks 4, 5, 14
- `ENTORNO_STYLES` definido en Task 7, usado en Tasks 10, 16

**Riesgo principal:**
- `DeploymentDetailsDialog` puede no aceptar control externo de open/close → Task 10 incluye nota de adaptación y alternativa
