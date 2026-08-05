import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/server/project-store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ projects: await listProjects() });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  const required = ["name", "category", "countryCode", "operation", "managementCompanyName"];
  const missing = required.filter((key) => typeof body[key] !== "string" || String(body[key]).trim() === "");
  if (missing.length > 0) return NextResponse.json({ error: `Champs obligatoires manquants : ${missing.join(", ")}` }, { status: 422 });
  const project = await createProject({
    name: String(body.name),
    category: String(body.category) as "MONETARY" | "BOND" | "EQUITY" | "DIVERSIFIED" | "FUND_OF_FUNDS",
    countryCode: String(body.countryCode),
    operation: String(body.operation) as "CREATE" | "UPDATE",
    managementCompanyName: String(body.managementCompanyName),
  });
  return NextResponse.json({ project }, { status: 201 });
}
