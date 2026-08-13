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
    mes: string;
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

export interface StatsTopMesActual {
    nombre: string;
    total: number;
    prod: number;
    preprod: number;
}

export interface StatsRecordMes {
    mes: string;
    total: number;
}

export interface StatsPorResponsableMes {
    responsable: string;
    mes: string;
    total: number;
}

export interface StatsPayload {
    totales: StatsTotales;
    porResponsable: StatsResponsable[];
    porPlataforma: StatsPlataforma[];
    porMes: StatsMes[];
    topProgramas: StatsPrograma[];
    porServicio: StatsServicio[];
    topMesActual: StatsTopMesActual[];
    recordMes: StatsRecordMes | null;
    porResponsableMes: StatsPorResponsableMes[];
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
    getFilteredDeployments(query: string, entorno: string, programaId?: string, responsableId?: string): Promise<DeploymentWithRelations[]>;
    getDeploymentById(id: string): Promise<DeploymentWithRelations | null>;
    createDeployment(payload: CreateDeploymentPayload): Promise<void>;
    updateDeployment(id: string, payload: UpdateDeploymentPayload): Promise<void>;
    deleteDeployment(id: string): Promise<void>;
    getLastDeployment(programaNombre: string, entorno: string): Promise<Despliegue | null>;
    getPrograms(): Promise<Programa[]>;
    getResponsibles(): Promise<Responsable[]>;
    getPlatforms(): Promise<Plataforma[]>;
    getSummary(): Promise<SummaryItem[]>;
    getServicios(): Promise<ServicioWithStats[]>;
    getServicioById(id: string): Promise<Servicio | null>;
    createServicio(payload: CreateServicioPayload): Promise<void>;
    updateServicio(id: string, payload: UpdateServicioPayload): Promise<void>;
    deleteServicio(id: string): Promise<void>;
    getProgramasConServicio(): Promise<ProgramaConServicio[]>;
    getProgramasByServicio(servicioId: string): Promise<ProgramaConResumen[]>;
    getProgramasSinServicio(): Promise<ProgramaConServicio[]>;
    updateProgramaServicio(programaId: string, servicioId: string | null): Promise<void>;
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
