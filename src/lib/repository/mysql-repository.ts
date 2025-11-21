import 'server-only';
import mysql, { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import { unstable_noStore as noStore } from 'next/cache';
import type { IRepository, DeploymentWithRelations, SummaryItem, CreateDeploymentPayload, UpdateDeploymentPayload, Programa, Responsable, Plataforma, Despliegue } from '.';

// --- CONFIGURACIÓN DE CONEXIÓN ---
const connectionConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// Usamos un Pool para mejor rendimiento y manejo de conexiones
const pool = mysql.createPool(connectionConfig);

async function getDbConnection() {
    return pool.getConnection();
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
                    (p.nombre LIKE ? OR d.version LIKE ? OR r.nombre LIKE ? OR d.comentario LIKE ? OR d.accion LIKE ?)
                `);
                values.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
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
    }
};