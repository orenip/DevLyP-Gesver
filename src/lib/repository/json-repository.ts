import { unstable_noStore as noStore } from 'next/cache';
import { randomUUID } from 'crypto';
import { readDb, writeDb, Despliegue, Programa, Responsable, Plataforma } from '../data';
import type { IRepository, DeploymentWithRelations, SummaryItem, CreateDeploymentPayload, UpdateDeploymentPayload } from '.';

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

const getOrCreate = async (collectionName: 'programas' | 'responsables' | 'plataformas', name: string) => {
    const db = await readDb();
    let collection: (Programa[] | Responsable[] | Plataforma[]) = db[collectionName] || [];
    
    let item = collection.find(p => p.nombre.toLowerCase() === name.toLowerCase());

    if (!item) {
        const newItem = { id: randomUUID(), nombre: name };
        if (!db[collectionName]) {
          db[collectionName] = [];
        }
        (db[collectionName] as any[]).push(newItem);
        await writeDb(db);
        return newItem.id;
    }
    return item.id;
};

export const jsonRepository: IRepository = {
    async getFilteredDeployments(queryStr: string, entorno: string, programaId?: string, responsableId?: string): Promise<DeploymentWithRelations[]> {
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
    },
    async getDeploymentById(id: string): Promise<DeploymentWithRelations | null> {
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
    },
    async getLastDeployment(programaNombre: string, entorno: string): Promise<Despliegue | null> {
        const data = await readDb();
        const programa = data.programas.find(p => p.nombre === programaNombre);
        if (!programa) {
            return null;
        }
        const deployments = data.despliegues
            .filter(d => d.programaId === programa.id && d.entorno === entorno)
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        return deployments.length > 0 ? deployments[0] : null;
    },
    async getPrograms(): Promise<Programa[]> {
        noStore();
        try {
            const db = await readDb();
            return db.programas.sort((a, b) => a.nombre.localeCompare(b.nombre));
        } catch (e) {
            console.error('Database Error:', e);
            throw new Error('Failed to fetch programs.');
        }
    },
    async getResponsibles(): Promise<Responsable[]> {
        noStore();
        try {
            const db = await readDb();
            return db.responsables.sort((a, b) => a.nombre.localeCompare(b.nombre));
        } catch (e) {
            console.error('Database Error:', e);
            throw new Error('Failed to fetch responsibles.');
        }
    },
    async getPlatforms(): Promise<Plataforma[]> {
        noStore();
        try {
            const db = await readDb();
            return (db.plataformas || []).sort((a, b) => a.nombre.localeCompare(b.nombre));
        } catch (e) {
            console.error('Database Error:', e);
            throw new Error('Failed to fetch platforms.');
        }
    },
    async getSummary(): Promise<SummaryItem[]> {
        noStore();
        try {
            const db = await readDb();
            const { programas, despliegues, responsables } = db;
            
            const summaryMap = new Map<string, SummaryItem>();

            // Initialize summary for all programs
            for (const program of programas) {
                summaryMap.set(program.id, {
                    programaId: program.id,
                    programaNombre: program.nombre,
                    Preproducción: null,
                    Producción: null,
                });
            }
            
            // Sort deployments by date descending
            const sortedDeployments = [...despliegues].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            
            const latestDeployments = new Map<string, Despliegue>();

            for (const deployment of sortedDeployments) {
                const key = `${deployment.programaId}-${deployment.entorno}`;
                if (!latestDeployments.has(key)) {
                    latestDeployments.set(key, deployment);
                }
            }
            
            const deploymentsWithRelations = fetchWithRelations(Array.from(latestDeployments.values()), programas, responsables);
            
            for (const deployment of deploymentsWithRelations) {
                const summaryItem = summaryMap.get(deployment.programa.id);
                if (summaryItem) {
                    if (deployment.entorno === 'Preproducción') {
                        summaryItem.Preproducción = deployment;
                    } else if (deployment.entorno === 'Producción') {
                        summaryItem.Producción = deployment;
                    }
                }
            }

            return Array.from(summaryMap.values()).sort((a,b) => a.programaNombre.localeCompare(b.programaNombre));
        } catch (e) {
            console.error('Database Error:', e);
            throw new Error('Failed to fetch summary.');
        }
    },
    async createDeployment(payload: CreateDeploymentPayload): Promise<void> {
        const { programa, responsable, plataforma, ...deploymentData } = payload;
        const programaId = await getOrCreate('programas', programa);
        const responsableId = await getOrCreate('responsables', responsable);
        const plataformaId = await getOrCreate('plataformas', plataforma);

        const db = await readDb();
        const plataformaNombre = db.plataformas?.find(p => p.id === plataformaId)?.nombre || plataforma;

        const newDeployment: Despliegue = {
            id: randomUUID(),
            ...deploymentData,
            programaId,
            responsableId,
            plataforma: plataformaNombre,
        };
        db.despliegues.push(newDeployment);
        await writeDb(db);
    },
    async updateDeployment(id: string, payload: UpdateDeploymentPayload): Promise<void> {
        const { programa, responsable, plataforma, ...deploymentData } = payload;
        const programaId = await getOrCreate('programas', programa);
        const responsableId = await getOrCreate('responsables', responsable);
        const plataformaId = await getOrCreate('plataformas', plataforma);
        
        const db = await readDb();
        const plataformaNombre = db.plataformas?.find(p => p.id === plataformaId)?.nombre || plataforma;

        const deploymentIndex = db.despliegues.findIndex(d => d.id === id);
        if (deploymentIndex === -1) {
            throw new Error('Deployment not found');
        }
        
        db.despliegues[deploymentIndex] = {
            ...db.despliegues[deploymentIndex],
            ...deploymentData,
            programaId,
            responsableId,
            plataforma: plataformaNombre,
        };
        await writeDb(db);
    },
    async deleteDeployment(id: string): Promise<void> {
        const db = await readDb();
        db.despliegues = db.despliegues.filter(d => d.id !== id);
        await writeDb(db);
    }
};
