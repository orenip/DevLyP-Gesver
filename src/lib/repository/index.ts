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

export interface IRepository {
    getFilteredDeployments(query: string, entorno: string, programaId?: string, responsableId?: string): Promise<DeploymentWithRelations[]>;
    getDeploymentById(id: string): Promise<DeploymentWithRelations | null>;
    getPrograms(): Promise<Programa[]>;
    getResponsibles(): Promise<Responsable[]>;
    getPlatforms(): Promise<Plataforma[]>;
    getSummary(): Promise<SummaryItem[]>;
    createDeployment(payload: CreateDeploymentPayload): Promise<void>;
    updateDeployment(id: string, payload: UpdateDeploymentPayload): Promise<void>;
    deleteDeployment(id: string): Promise<void>;
}

// Para cambiar entre implementaciones, simplemente cambia el objeto que se exporta.
// Por defecto, usa el repositorio JSON.
// Para usar MySQL, cambia `jsonRepository` por `mysqlRepository`.
//export const repository: IRepository = jsonRepository;
export const repository: IRepository = mysqlRepository;
