import type { Metadata } from "next";
import { NewProjectTemplate } from "@/components/templates/NewProjectTemplate";

export const metadata: Metadata = { title: "Nouveau prospectus" };

export default function NewProjectPage() {
  return <NewProjectTemplate />;
}
