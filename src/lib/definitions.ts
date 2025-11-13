import { z } from 'zod';
import type { Despliegue as PrismaDespliegue, Programa, Responsable } from '@prisma/client';

export type { Programa, Responsable };

export enum Entorno {
  Preproduccion = 'Preproduccion',
  Produccion = 'Produccion',
}

export const EntornoLabel: { [key in Entorno]: string } = {
  [Entorno.Preproduccion]: 'Preproducción',
  [Entorno.Produccion]: 'Producción',
};

export type Despliegue = PrismaDespliegue & {
  programa: Programa;
  responsable: Responsable;
};

export const deploymentSchema = z.object({
  id: z.number().optional(),
  fecha: z.date({
    required_error: 'La fecha es requerida.',
  }),
  programa: z.string().min(1, 'El programa es requerido.'),
  entorno: z.nativeEnum(Entorno, {
    errorMap: () => ({ message: 'Seleccione un entorno válido.' }),
  }),
  version: z.string().min(1, 'La versión es requerida.'),
  accion: z.string().optional().nullable(),
  responsable: z.string().min(1, 'El responsable es requerido.'),
  comentario: z.string().optional().nullable(),
});

export const adminSchema = z.object({
    id: z.number().optional(),
    nombre: z.string().min(1, 'El nombre es requerido.'),
});

export type DeploymentFormState = {
  errors?: {
    fecha?: string[];
    programa?: string[];
    entorno?: string[];
    version?: string[];
    accion?: string[];
    responsable?: string[];
    comentario?: string[];
  };
  message?: string | null;
} | undefined;

export type AdminFormState = {
    errors?: {
        nombre?: string[];
    };
    message?: string | null;
} | undefined;


export type SummaryData = {
  programa: string;
  preproduccion: { version: string; fecha: Date } | null;
  produccion: { version: string; fecha: Date } | null;
}[];

export type SearchParams = {
  query?: string;
  entorno?: string;
  programaId?: string;
  responsableId?: string;
};
