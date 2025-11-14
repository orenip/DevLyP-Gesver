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
    plataformas?: Plataforma[];
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
