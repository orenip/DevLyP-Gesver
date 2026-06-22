import 'server-only';
import mysql, { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { unstable_noStore as noStore } from 'next/cache';
import type { IRepository, DeploymentWithRelations, SummaryItem, CreateDeploymentPayload, UpdateDeploymentPayload, Programa, Responsable, Plataforma, Despliegue, Servicio, ServicioWithStats, CreateServicioPayload, UpdateServicioPayload, ProgramaConServicio, ProgramaConResumen, StatsPayload } from '.';

// --- CONFIGURACIÓN DE CONEXIÓN ---
const connectionConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
};

// Usamos un Pool para mejor rendimiento y manejo de conexiones
const pool = mysql.createPool(connectionConfig);

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1500;

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obtiene una conexión del pool validándola con ping.
 * Reintenta hasta MAX_RETRIES veces con backoff incremental.
 * Resuelve conexiones muertas (MySQL reiniciado, timeout de idle).
 */
async function getDbConnection(): Promise<PoolConnection> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        let conn: PoolConnection | undefined;
        try {
            conn = await pool.getConnection();
            await conn.ping(); // Verifica que la conexión esté viva
            return conn;
        } catch (err) {
            if (conn) conn.release();
            if (attempt === MAX_RETRIES) {
                console.error(`DB: falló tras ${MAX_RETRIES} intentos.`, err);
                throw err;
            }
            const delay = RETRY_BASE_DELAY_MS * attempt;
            console.warn(`DB: intento ${attempt} fallido. Reintentando en ${delay}ms...`);
            await sleep(delay);
        }
    }
    throw new Error('No se pudo obtener conexión a la base de datos.');
}

// --- FUNCIONES DE SOPORTE ---

/**
 * Formatea una cadena de fecha ISO a 'YYYY-MM-DD HH:MM:SS' para compatibilidad con MySQL DATETIME.
 */
function getFormattedDate(dateString: string): string {
    return new Date(dateString).toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Busca un registro por nombre usando la conexión proporcionada. Si no existe, lo crea y devuelve el ID.
 */
async function getOrCreateRelationId(db: PoolConnection, table: string, name: string): Promise<string> {
    try {
        // 1. Buscar
        const [rows] = await db.query<RowDataPacket[]>(`SELECT id FROM ${table} WHERE nombre = ?`, [name]);
        if (rows.length > 0) {
            return rows[0].id.toString();
        }

        // 2. Crear
        const [result] = await db.query<ResultSetHeader>(`INSERT INTO ${table} (nombre) VALUES (?)`, [name]);
        return result.insertId.toString();

    } catch (error) {
        console.error(`Database Error in getOrCreateRelationId (${table}):`, error);
        throw new Error(`Failed to get or create ${table} entry.`);
    }
}

/**
 * Mapea una fila de resultados SQL a la estructura DeploymentWithRelations.
 */
const mapRowToDeployment = (row: any): DeploymentWithRelations => ({
    id: row.id.toString(),
    fecha: new Date(row.fecha).toISOString(),
    entorno: row.entorno,
    plataforma: row.plataforma,
    version: row.version,
    accion: row.accion,
    comentario: row.comentario,
    hasSwagger: Boolean(row.hasSwagger),
    url: row.url,
    port: row.port,
    programa: { id: row.programaId.toString(), nombre: row.programaNombre },
    responsable: { id: row.responsableId.toString(), nombre: row.responsableNombre },
});

const BASE_SELECT = `
    SELECT
        d.id, d.fecha, d.entorno, d.plataforma, d.version, d.accion, d.comentario, d.hasSwagger, d.url, d.port,
        p.id AS programaId, p.nombre AS programaNombre,
        r.id AS responsableId, r.nombre AS responsableNombre
    FROM despliegues d
    JOIN programas p ON d.programaId = p.id
    JOIN responsables r ON d.responsableId = r.id
`;

// --- IMPLEMENTACIÓN DEL REPOSITORIO ---
export const mysqlRepository: IRepository = {
    // ----------------------------------------------------
    //  LECTURA DE RELACIONES
    // ----------------------------------------------------
    async getPrograms(): Promise<Programa[]> {
        noStore();
        const db = await getDbConnection();
        try {
            const [rows] = await db.query<RowDataPacket[]>(`SELECT id, nombre FROM programas ORDER BY nombre ASC`);
            return rows.map(row => ({ id: row.id.toString(), nombre: row.nombre }));
        } catch (e) {
            console.error('Database Error (getPrograms):', e);
            throw new Error('Failed to fetch programs.');
        } finally {
            db.release();
        }
    },
    async getResponsibles(): Promise<Responsable[]> {
        noStore();
        const db = await getDbConnection();
        try {
            const [rows] = await db.query<RowDataPacket[]>(`SELECT id, nombre FROM responsables ORDER BY nombre ASC`);
            return rows.map(row => ({ id: row.id.toString(), nombre: row.nombre }));
        } catch (e) {
            console.error('Database Error (getResponsibles):', e);
            throw new Error('Failed to fetch responsibles.');
        } finally {
            db.release();
        }
    },
    async getPlatforms(): Promise<Plataforma[]> {
        noStore();
        const db = await getDbConnection();
        try {
            const [rows] = await db.query<RowDataPacket[]>(`SELECT id, nombre FROM plataformas ORDER BY nombre ASC`);
            return rows.map(row => ({ id: row.id.toString(), nombre: row.nombre }));
        } catch (e) {
            console.error('Database Error (getPlatforms):', e);
            throw new Error('Failed to fetch platforms.');
        } finally {
            db.release();
        }
    },

    // ----------------------------------------------------
    //  CREACIÓN DE DESPLIEGUE (TRANSACCIONAL)
    // ----------------------------------------------------
    async createDeployment(payload: CreateDeploymentPayload): Promise<void> {
        noStore();
        const db = await getDbConnection();
        try {
            await db.beginTransaction(); // Iniciar transacción

            // 1. Obtener/Crear IDs de relaciones (dentro de la transacción)
            const programaId = await getOrCreateRelationId(db, 'programas', payload.programa);
            const responsableId = await getOrCreateRelationId(db, 'responsables', payload.responsable);
            await getOrCreateRelationId(db, 'plataformas', payload.plataforma);

            // 2. Preparar datos y formatear fecha
            const formattedDate = getFormattedDate(payload.fecha);
            
            const sql = `
                INSERT INTO despliegues (
                    fecha, programaId, responsableId, entorno, plataforma, version, accion, comentario, hasSwagger, url, port
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                formattedDate, // Fecha formateada
                programaId,
                responsableId,
                payload.entorno,
                payload.plataforma,
                payload.version,
                payload.accion || null,
                payload.comentario || null,
                payload.hasSwagger ? 1 : 0,
                payload.url || null,
                payload.port || null,
            ];

            // 3. Insertar Despliegue
            await db.execute(sql, values);

            await db.commit(); // Confirmar la transacción

        } catch (error) {
            await db.rollback(); // Deshacer si algo falla
            console.error('Database Error (createDeployment):', error);
            throw new Error('Failed to create deployment.');
        } finally {
            db.release();
        }
    },

    // ----------------------------------------------------
    //  ACTUALIZACIÓN DE DESPLIEGUE (TRANSACCIONAL)
    // ----------------------------------------------------
    async updateDeployment(id: string, payload: UpdateDeploymentPayload): Promise<void> {
        noStore();
        const db = await getDbConnection();
        try {
            await db.beginTransaction(); // Iniciar transacción

            // 1. Obtener/Crear IDs de relaciones (dentro de la transacción)
            const programaId = await getOrCreateRelationId(db, 'programas', payload.programa);
            const responsableId = await getOrCreateRelationId(db, 'responsables', payload.responsable);
            await getOrCreateRelationId(db, 'plataformas', payload.plataforma);

            // 2. Preparar datos y formatear fecha
            const formattedDate = getFormattedDate(payload.fecha);

            const sql = `
                UPDATE despliegues SET
                    fecha = ?, programaId = ?, responsableId = ?, entorno = ?, plataforma = ?,
                    version = ?, accion = ?, comentario = ?, hasSwagger = ?, url = ?, port = ?
                WHERE id = ?
            `;
            const values = [
                formattedDate, // Fecha formateada
                programaId,
                responsableId,
                payload.entorno,
                payload.plataforma,
                payload.version,
                payload.accion || null,
                payload.comentario || null,
                payload.hasSwagger ? 1 : 0,
                payload.url || null,
                payload.port || null,
                id,
            ];

            const [result] = await db.execute<ResultSetHeader>(sql, values);
            if (result.affectedRows === 0) {
                 throw new Error('Deployment not found for update, rolling back.');
            }

            await db.commit(); // Confirmar la transacción

        } catch (error) {
            await db.rollback(); // Deshacer si algo falla
            console.error(`Database Error (updateDeployment ${id}):`, error);
            throw new Error('Failed to update deployment.');
        } finally {
            db.release();
        }
    },

    // ----------------------------------------------------
    //  ELIMINACIÓN DE DESPLIEGUE CON LIMPIEZA DE HUÉRFANOS
    // ----------------------------------------------------
    async deleteDeployment(id: string): Promise<void> {
        noStore();
        const db = await getDbConnection();
        try {
            await db.beginTransaction(); // Iniciamos transacción para seguridad

            // 1. Obtener el ID del programa ANTES de borrar el despliegue
            const [rows] = await db.query<RowDataPacket[]>(
                'SELECT programaId FROM despliegues WHERE id = ?', 
                [id]
            );

            if (rows.length === 0) {
                 await db.rollback();
                 throw new Error('Deployment not found for deletion.');
            }
            const { programaId } = rows[0];

            // 2. Borrar el despliegue
            await db.execute('DELETE FROM despliegues WHERE id = ?', [id]);

            // 3. Verificar si quedan otros despliegues para este programa
            const [countResult] = await db.query<RowDataPacket[]>(
                'SELECT COUNT(*) as total FROM despliegues WHERE programaId = ?', 
                [programaId]
            );

            // 4. Si el contador es 0, el programa es huérfano -> Lo borramos
            if (countResult[0].total === 0) {
                await db.execute('DELETE FROM programas WHERE id = ?', [programaId]);
            }

            await db.commit(); // Confirmamos cambios
        } catch (error) {
            await db.rollback(); // Si falla, deshacemos todo
            console.error(`Database Error (deleteDeployment ${id}):`, error);
            throw new Error('Failed to delete deployment.');
        } finally {
            db.release();
        }
    },

    // ----------------------------------------------------
    //  OBTENER DESPLIEGUES FILTRADOS
    // ----------------------------------------------------
    async getFilteredDeployments(queryStr: string, entorno: string, programaId?: string, responsableId?: string): Promise<DeploymentWithRelations[]> {
        noStore();
        const db = await getDbConnection();
        try {
            const conditions: string[] = [];
            const values: (string | number)[] = [];

            if (entorno) {
                conditions.push(`d.entorno = ?`);
                values.push(entorno);
            }
            if (programaId) {
                conditions.push(`d.programaId = ?`);
                values.push(programaId);
            }
            if (responsableId) {
                conditions.push(`d.responsableId = ?`);
                values.push(responsableId);
            }
            if (queryStr) {
                const searchPattern = `%${queryStr}%`;
                conditions.push(`
                    (p.nombre LIKE ? OR d.version LIKE ? OR r.nombre LIKE ? OR d.port LIKE ?)
                `);
                values.push(searchPattern, searchPattern, searchPattern, searchPattern);
            }

            const WHERE_CLAUSE = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const ORDER_CLAUSE = `ORDER BY d.fecha DESC`;

            const sql = `${BASE_SELECT} ${WHERE_CLAUSE} ${ORDER_CLAUSE}`;

            const [rows] = await db.query<RowDataPacket[]>(sql, values);
            return rows.map(mapRowToDeployment);

        } catch (e) {
            console.error('Database Error (getFilteredDeployments):', e);
            throw new Error('Failed to fetch filtered deployments.');
        } finally {
            db.release();
        }
    },
    
    // ----------------------------------------------------
    //  OBTENER DESPLIEGUE POR ID
    // ----------------------------------------------------
    async getDeploymentById(id: string): Promise<DeploymentWithRelations | null> {
        noStore();
        const db = await getDbConnection();
        try {
            const sql = `${BASE_SELECT} WHERE d.id = ?`;
            const [rows] = await db.query<RowDataPacket[]>(sql, [id]);

            if (rows.length === 0) {
                return null;
            }
            return mapRowToDeployment(rows[0]);
        } catch (error) {
            console.error('Database Error (getDeploymentById):', error);
            throw new Error('Failed to fetch deployment.');
        } finally {
            db.release();
        }
    },
    async getLastDeployment(programaNombre: string, entorno: string): Promise<Despliegue | null> {
        noStore();
        const db = await getDbConnection();
        try {
            const sql = `
                SELECT d.*, p.nombre as programaNombre, r.nombre as responsableNombre
                FROM despliegues d
                JOIN programas p ON d.programaId = p.id
                JOIN responsables r ON d.responsableId = r.id
                WHERE p.nombre = ? AND d.entorno = ?
                ORDER BY d.fecha DESC
                LIMIT 1
            `;
            const [rows] = await db.query<RowDataPacket[]>(sql, [programaNombre, entorno]);

            if (rows.length === 0) {
                return null;
            }

            const row = rows[0];
            // Map RowDataPacket to Despliegue
            return {
                id: row.id.toString(),
                fecha: new Date(row.fecha).toISOString(),
                programaId: row.programaId.toString(),
                entorno: row.entorno,
                plataforma: row.plataforma,
                version: row.version,
                accion: row.accion,
                responsableId: row.responsableId.toString(),
                comentario: row.comentario,
                hasSwagger: !!row.hasSwagger,
                url: row.url,
                port: row.port,
            };
        } catch (error) {
            console.error('Database Error (getLastDeployment):', error);
            throw new Error('Failed to fetch last deployment.');
        } finally {
            db.release();
        }
    },

    // ----------------------------------------------------
    //  OBTENER RESUMEN (Último despliegue por Programa y Entorno)
    // ----------------------------------------------------
    async getSummary(): Promise<SummaryItem[]> {
        noStore();
        const db = await getDbConnection();
        try {
            // Paso 1: Obtener todos los programas
            const programs = await this.getPrograms();
            
            // Paso 2: Usar función de ventana para obtener el último despliegue por grupo (programa/entorno)
            const latestDeploymentsSql = `
                WITH RankedDeployments AS (
                    SELECT 
                        d.id, d.fecha, d.entorno, d.programaId, 
                        ROW_NUMBER() OVER(PARTITION BY d.programaId, d.entorno ORDER BY d.fecha DESC) as rn
                    FROM despliegues d
                )
                SELECT rd.id FROM RankedDeployments rd WHERE rd.rn = 1
            `;

            // Paso 3: Obtener los datos completos de esos últimos despliegues con relaciones
            const sql = `${BASE_SELECT} WHERE d.id IN (${latestDeploymentsSql}) ORDER BY p.nombre ASC`;
            
            const [rows] = await db.query<RowDataPacket[]>(sql);
            const deployments = rows.map(mapRowToDeployment);

            // Paso 4: Construir el objeto SummaryItem
            const summaryMap = new Map<string, SummaryItem>(
                programs.map(p => [p.id, { 
                    programaId: p.id, 
                    programaNombre: p.nombre, 
                    Preproducción: null, 
                    Producción: null 
                }])
            );

            for (const d of deployments) {
                const summaryItem = summaryMap.get(d.programa.id);
                if (summaryItem) {
                    // use a type assertion to bypass the incompatible index signature
                    (summaryItem as any)[d.entorno] = d;
                }
            }

            return Array.from(summaryMap.values()).sort((a, b) => a.programaNombre.localeCompare(b.programaNombre));

        } catch (e) {
            console.error('Database Error (getSummary):', e);
            throw new Error('Failed to fetch summary.');
        } finally {
            db.release();
        }
    },

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
            await db.execute('DELETE FROM servicios WHERE id = ?', [id]);
        } catch (e) {
            console.error('Database Error (deleteServicio):', e);
            throw new Error('Failed to delete servicio.');
        } finally {
            db.release();
        }
    },

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
                SELECT r.nombre, COUNT(*) AS total,
                    SUM(CASE WHEN d.entorno = 'Producción'    THEN 1 ELSE 0 END) AS prod,
                    SUM(CASE WHEN d.entorno = 'Preproducción' THEN 1 ELSE 0 END) AS preprod
                FROM despliegues d JOIN responsables r ON d.responsableId = r.id
                GROUP BY r.id, r.nombre ORDER BY total DESC
            `);

            const [byPlataforma] = await db.query<RowDataPacket[]>(`
                SELECT plataforma, COUNT(*) AS total FROM despliegues
                GROUP BY plataforma ORDER BY total DESC
            `);

            const [byMonth] = await db.query<RowDataPacket[]>(`
                SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes,
                    SUM(CASE WHEN entorno = 'Producción'    THEN 1 ELSE 0 END) AS prod,
                    SUM(CASE WHEN entorno = 'Preproducción' THEN 1 ELSE 0 END) AS preprod
                FROM despliegues WHERE fecha >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY mes ORDER BY mes ASC
            `);

            const [topProgramas] = await db.query<RowDataPacket[]>(`
                SELECT p.nombre, COUNT(*) AS total FROM despliegues d
                JOIN programas p ON d.programaId = p.id
                GROUP BY p.id, p.nombre ORDER BY total DESC LIMIT 10
            `);

            const [[serviciosCount]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM servicios');
            const [[sinServicioCount]] = await db.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM programas WHERE servicioId IS NULL');

            const [byServicio] = await db.query<RowDataPacket[]>(`
                SELECT s.nombre AS servicio,
                    COUNT(DISTINCT p.id) AS numProgramas,
                    SUM(CASE WHEN d.entorno = 'Producción'    THEN 1 ELSE 0 END) AS prod,
                    SUM(CASE WHEN d.entorno = 'Preproducción' THEN 1 ELSE 0 END) AS preprod,
                    MAX(d.fecha) AS ultimoDespliegue,
                    (SELECT r2.nombre FROM responsables r2
                     JOIN despliegues d2 ON d2.responsableId = r2.id
                     JOIN programas p2   ON d2.programaId = p2.id
                     WHERE p2.servicioId = s.id
                     GROUP BY r2.id ORDER BY COUNT(*) DESC LIMIT 1) AS topResponsable
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
                porResponsable: byResponsable.map(r => ({ nombre: r.nombre, total: Number(r.total), prod: Number(r.prod), preprod: Number(r.preprod) })),
                porPlataforma: byPlataforma.map(p => ({ plataforma: p.plataforma, total: Number(p.total) })),
                porMes: byMonth.map(m => ({ mes: m.mes, prod: Number(m.prod), preprod: Number(m.preprod) })),
                topProgramas: topProgramas.map(p => ({ nombre: p.nombre, total: Number(p.total) })),
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
};