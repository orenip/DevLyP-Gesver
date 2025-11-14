import { promises as fs } from 'fs';
import path from 'path';
import { unstable_noStore as noStore } from 'next/cache';

export interface Programa {
  id: string;
  nombre: string;
}

export interface Responsable {
  id: string;
  nombre: string;
}

export interface Despliegue {
  id: string;
  fecha: string; // Stored as ISO string
  programaId: string;
  entorno: 'Preproducción' | 'Producción';
  plataforma: 'IIS' | 'Docker';
  version: string;
  accion?: string;
  responsableId: string;
  comentario?: string;
}

export type DeploymentWithRelations = Omit<Despliegue, 'programaId' | 'responsableId'> & {
  programa: Programa;
  responsable: Responsable;
};

interface DbData {
    despliegues: Despliegue[];
    programas: Programa[];
    responsables: Responsable[];
}

const dbPath = path.join(process.cwd(), 'data', 'db.json');

export async function readDb(): Promise<DbData> {
    try {
        const fileContent = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        // If the file doesn't exist, return an empty structure
        return { despliegues: [], programas: [], responsables: [] };
    }
}

export async function writeDb(data: DbData): Promise<void> {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}


const fetchWithRelations = (despliegues: Despliegue[], programas: Programa[], responsables: Responsable[]): DeploymentWithRelations[] => {
    const programasMap = new Map(programas.map(p => [p.id, p]));
    const responsablesMap = new Map(responsables.map(r => [r.id, r]));

    return despliegues.map(d => ({
        ...d,
        fecha: d.fecha,
        programa: programasMap.get(d.programaId) || { id: '', nombre: 'Desconocido' },
        responsable: responsablesMap.get(d.responsableId) || { id: '', nombre: 'Desconocido' },
    })).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
};

export async function fetchFilteredDeployments(
  queryStr: string,
  entorno: string,
  programaId: string,
  responsableId: string
): Promise<DeploymentWithRelations[]> {
  noStore();
  try {
    const db = await readDb();
    let despliegues = db.despliegues;

    if (entorno) {
      despliegues = despliegues.filter(d => d.entorno === entorno);
    }
    if (programaId) {
        despliegues = despliegues.filter(d => d.programaId === programaId);
    }
    if (responsableId) {
        despliegues = despliegues.filter(d => d.responsableId === responsableId);
    }
    
    const deploymentsWithRelations = fetchWithRelations(despliegues, db.programas, db.responsables);
    
    if (queryStr) {
        return deploymentsWithRelations.filter(d => 
            d.programa.nombre.toLowerCase().includes(queryStr.toLowerCase()) ||
            d.version.toLowerCase().includes(queryStr.toLowerCase()) ||
            d.responsable.nombre.toLowerCase().includes(queryStr.toLowerCase()) ||
            d.comentario?.toLowerCase().includes(queryStr.toLowerCase()) ||
            d.accion?.toLowerCase().includes(queryStr.toLowerCase())
        );
    }

    return deploymentsWithRelations;

  } catch (e) {
    console.error('Database Error:', e);
    throw new Error('Failed to fetch deployments.');
  }
}

export async function fetchPrograms(): Promise<Programa[]> {
  noStore();
  try {
    const db = await readDb();
    return db.programas;
  } catch (e) {
    console.error('Database Error:', e);
    throw new Error('Failed to fetch programs.');
  }
}

export async function fetchResponsibles(): Promise<Responsable[]> {
    noStore();
    try {
      const db = await readDb();
      return db.responsables;
    } catch (e) {
      console.error('Database Error:', e);
      throw new Error('Failed to fetch responsibles.');
    }
}

export async function fetchSummary() {
    noStore();
    try {
        const db = await readDb();
        const { programas, despliegues } = db;
        const summary: { programaNombre: string; Preproducción: string | null, Producción: string | null }[] = [];

        for(const program of programas) {
            const programDeployments = despliegues.filter(d => d.programaId === program.id);
            
            const preprodDeployments = programDeployments
                .filter(d => d.entorno === 'Preproducción')
                .sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

            const prodDeployments = programDeployments
                .filter(d => d.entorno === 'Producción')
                .sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

            summary.push({
                programaNombre: program.nombre,
                Preproducción: preprodDeployments.length > 0 ? preprodDeployments[0].version : null,
                Producción: prodDeployments.length > 0 ? prodDeployments[0].version : null,
            });
        }
        return summary;
    } catch (e) {
        console.error('Database Error:', e);
        throw new Error('Failed to fetch summary.');
    }
}

export async function fetchDeploymentById(id: string): Promise<DeploymentWithRelations | null> {
    noStore();
    try {
        const db = await readDb();
        const deployment = db.despliegues.find(d => d.id === id);

        if (!deployment) {
            return null;
        }

        const result = fetchWithRelations([deployment], db.programas, db.responsables);
        return result[0];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch deployment.');
    }
}
