import { fetchPrograms, fetchResponsibles, fetchLastDeploymentDate } from "@/lib/data";
import { ProgramsManager } from "@/components/admin/programs-manager";
import { ResponsiblesManager } from "@/components/admin/responsibles-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default async function AdminPage() {
  const [programs, responsibles, lastDeploymentDate] = await Promise.all([
    fetchPrograms(),
    fetchResponsibles(),
    fetchLastDeploymentDate()
  ]);

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Fecha del último despliegue general: {lastDeploymentDate ? formatDate(lastDeploymentDate, 'PPP p') : 'N/A'}</p>
            </CardContent>
        </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <ProgramsManager programs={programs} />
        <ResponsiblesManager responsibles={responsibles} />
      </div>
    </div>
  );
}
