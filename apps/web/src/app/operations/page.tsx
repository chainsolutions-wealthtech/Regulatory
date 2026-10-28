import { OperationsCockpitTemplate } from "@/components/templates/OperationsCockpitTemplate";
import { evaluateRuntimeReadiness } from "@/server/observability/runtime-health";
import { getRuntimePostgresPool, projectRepository, regulatoryStorageDriver } from "@/server/storage";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  // Read-only evaluation shares the exact contract with GET /api/health/ready.
  const [projects, readiness] = await Promise.all([
    projectRepository.listProjects(),
    evaluateRuntimeReadiness({
      storageDriver: regulatoryStorageDriver,
      nodeEnv: process.env.NODE_ENV,
      environment: process.env,
      databaseProbe: async () => {
        if (regulatoryStorageDriver !== "postgresql") return;
        await getRuntimePostgresPool().query("select 1");
      },
    }),
  ]);
  return <OperationsCockpitTemplate projects={projects} readiness={readiness} />;
}
