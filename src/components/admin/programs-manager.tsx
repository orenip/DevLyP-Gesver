import { Programa } from "@/lib/definitions";
import { ManagerTable } from "./manager-table";
import { createOrUpdateProgram, deleteProgram } from "@/lib/actions";

export function ProgramsManager({ programs }: { programs: Programa[] }) {
  return (
    <ManagerTable
      title="Programas"
      items={programs}
      createOrUpdateAction={createOrUpdateProgram}
      deleteAction={deleteProgram}
    />
  );
}
