import { NextResponse } from "next/server";
import { evaluateRuntimeReadiness } from "@/server/observability/runtime-health";
import { getRuntimePostgresPool, regulatoryStorageDriver } from "@/server/storage";

export const runtime = "nodejs";

export async function GET() {
  const readiness = await evaluateRuntimeReadiness({
    storageDriver: regulatoryStorageDriver,
    nodeEnv: process.env.NODE_ENV,
    environment: process.env,
    databaseProbe: async () => {
      if (regulatoryStorageDriver !== "postgresql") return;
      await getRuntimePostgresPool().query("select 1");
    },
  });

  return NextResponse.json(readiness, {
    status: readiness.ready ? 200 : 503,
    headers: { "cache-control": "no-store" },
  });
}
