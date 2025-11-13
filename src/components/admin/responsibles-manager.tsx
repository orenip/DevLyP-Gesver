import { Responsable } from "@/lib/definitions";
import { ManagerTable } from "./manager-table";
import { createOrUpdateResponsible, deleteResponsible } from "@/lib/actions";

export function ResponsiblesManager({ responsibles }: { responsibles: Responsable[] }) {
  return (
    <ManagerTable
      title="Responsables"
      items={responsibles}
      createOrUpdateAction={createOrUpdateResponsible}
      deleteAction={deleteResponsible}
    />
  );
}
