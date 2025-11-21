import { promises as fs } from 'fs';
import path from 'path';

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

export interface Despliegue {
  id: string;
  fecha: string; // Stored as ISO string
  programaId: string;
  entorno: 'Preproducción' | 'Producción';
  plataforma: string;
  version: string;
  accion?: string;
  responsableId: string;
  comentario?: string;
  hasSwagger?: boolean;
  url?: string;
  port?: string;
}

export interface DbData {
    despliegues: Despliegue[];
    programas: Programa[];
    responsables: Responsable[];
    plataformas: Plataforma[];
}

const dbPath = path.join(process.cwd(), 'data', 'db.json');

export async function readDb(): Promise<DbData> {
    try {
        const fileContent = await fs.readFile(dbPath, 'utf-8');
        const data = JSON.parse(fileContent);
        if (!data.plataformas) {
            data.plataformas = [
                { id: '1', nombre: 'IIS' },
                { id: '2', nombre: 'Docker' }
            ];
        }
        return data;
    } catch (error) {
        // If the file doesn't exist, return an empty structure
        return { despliegues: [], programas: [], responsables: [], plataformas: [
            { id: '1', nombre: 'IIS' },
            { id: '2', nombre: 'Docker' }
        ] };
    }
}

export async function writeDb(data: DbData): Promise<void> {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getLastDeployment(programaNombre: string, entorno: string): Promise<Despliegue | null> {
    const data = await readDb();
    const programa = data.programas.find(p => p.nombre === programaNombre);
    if (!programa) {
        return null;
    }
    const deployments = data.despliegues
        .filter(d => d.programaId === programa.id && d.entorno === entorno)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return deployments.length > 0 ? deployments[0] : null;
}
