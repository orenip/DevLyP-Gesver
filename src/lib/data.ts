import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
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
  fecha: Date | Timestamp;
  programaId: string;
  entorno: 'Preproducción' | 'Producción';
  version: string;
  accion?: string;
  responsableId: string;
  comentario?: string;
}

export type DeploymentWithRelations = Despliegue & {
  programa: Programa;
  responsable: Responsable;
};

const fetchWithRelations = async (despliegues: Despliegue[]): Promise<DeploymentWithRelations[]> => {
  const programaIds = [...new Set(despliegues.map(d => d.programaId))];
  const responsableIds = [...new Set(despliegues.map(d => d.responsableId))];

  const [programasSnap, responsablesSnap] = await Promise.all([
    programaIds.length > 0 ? getDocs(query(collection(db, 'programas'), where('__name__', 'in', programaIds))) : Promise.resolve({ docs: [] }),
    responsableIds.length > 0 ? getDocs(query(collection(db, 'responsables'), where('__name__', 'in', responsableIds))) : Promise.resolve({ docs: [] }),
  ]);

  const programasMap = new Map(programasSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Programa]));
  const responsablesMap = new Map(responsablesSnap.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() } as Responsable]));

  return despliegues.map(d => ({
    ...d,
    fecha: (d.fecha as Timestamp).toDate(),
    programa: programasMap.get(d.programaId) || { id: '', nombre: 'Desconocido' },
    responsable: responsablesMap.get(d.responsableId) || { id: '', nombre: 'Desconocido' },
  }));
};

export async function fetchFilteredDeployments(
  queryStr: string,
  entorno: string,
  programaId: string,
  responsableId: string
): Promise<DeploymentWithRelations[]> {
  noStore();
  try {
    let q = query(collection(db, 'despliegues'), orderBy('fecha', 'desc'));

    if (entorno) {
      q = query(q, where('entorno', '==', entorno));
    }
    if (programaId) {
      q = query(q, where('programaId', '==', programaId));
    }
    if (responsableId) {
      q = query(q, where('responsableId', '==', responsableId));
    }
    
    const snapshot = await getDocs(q);
    const despliegues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Despliegue));
    
    const deploymentsWithRelations = await fetchWithRelations(despliegues);
    
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
    const snapshot = await getDocs(collection(db, 'programas'));
    return snapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre as string }));
  } catch (e) {
    console.error('Database Error:', e);
    throw new Error('Failed to fetch programs.');
  }
}

export async function fetchResponsibles(): Promise<Responsable[]> {
    noStore();
    try {
      const snapshot = await getDocs(collection(db, 'responsables'));
      return snapshot.docs.map(doc => ({ id: doc.id, nombre: doc.data().nombre as string }));
    } catch (e) {
      console.error('Database Error:', e);
      throw new Error('Failed to fetch responsibles.');
    }
}

export async function fetchSummary() {
    noStore();
    try {
        const programs = await fetchPrograms();
        const summary: { programaNombre: string; Preproducción: string | null, Producción: string | null }[] = [];

        for(const program of programs) {
            const preprodQuery = query(collection(db, 'despliegues'), where('programaId', '==', program.id), where('entorno', '==', 'Preproducción'), orderBy('fecha', 'desc'), limit(1));
            const prodQuery = query(collection(db, 'despliegues'), where('programaId', '==', program.id), where('entorno', '==', 'Producción'), orderBy('fecha', 'desc'), limit(1));
            
            const [preprodSnap, prodSnap] = await Promise.all([getDocs(preprodQuery), getDocs(prodQuery)]);

            summary.push({
                programaNombre: program.nombre,
                Preproducción: !preprodSnap.empty ? preprodSnap.docs[0].data().version : null,
                Producción: !prodSnap.empty ? prodSnap.docs[0].data().version : null,
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
        const docSnap = await getDoc(doc(db, "despliegues", id));

        if (!docSnap.exists()) {
            return null;
        }

        const deployment = { id: docSnap.id, ...docSnap.data() } as Despliegue;
        const result = await fetchWithRelations([deployment]);
        return result[0];
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch deployment.');
    }
}
