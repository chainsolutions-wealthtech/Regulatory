"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { FieldShell, Input, Select } from "@/components/atoms/Field";
import { FUND_CATEGORIES, MEMBER_STATES } from "@/domain/constants";

export function NewProjectForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="form-panel"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const response = await fetch("/api/projects", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(Object.fromEntries(form.entries())),
          });
          const body = await response.json();
          if (!response.ok) {
            setError(body.error ?? "Impossible de créer le projet.");
            return;
          }
          router.push(`/projects/${body.project.id}/questionnaire`);
          router.refresh();
        });
      }}
    >
      <div className="form-panel__intro"><h2>Informations de départ</h2><p>Ces éléments sélectionnent le parcours réglementaire initial. Ils pourront être confirmés dans le questionnaire.</p></div>
      <div className="form-grid">
        <FieldShell id="name" label="Nom du fonds" required><Input id="name" name="name" placeholder="Ex. FCP Horizon Obligataire" required /></FieldShell>
        <FieldShell id="managementCompanyName" label="Société de gestion" required><Input id="managementCompanyName" name="managementCompanyName" placeholder="Dénomination légale" required /></FieldShell>
        <FieldShell id="operation" label="Type d’opération" required><Select id="operation" name="operation" defaultValue="CREATE"><option value="CREATE">Création</option><option value="UPDATE">Mise à jour</option></Select></FieldShell>
        <FieldShell id="category" label="Catégorie du fonds" required><Select id="category" name="category" defaultValue="BOND">{FUND_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></FieldShell>
        <FieldShell id="countryCode" label="État de constitution" required><Select id="countryCode" name="countryCode" defaultValue="CI">{MEMBER_STATES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></FieldShell>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="form-panel__actions"><Button disabled={pending} icon="arrow" type="submit">{pending ? "Création…" : "Créer et commencer"}</Button></div>
    </form>
  );
}
