"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";

export function GenerateProspectusButton({
  projectId,
  projectVersion,
}: {
  projectId: string;
  projectVersion: number;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="generate-action">
      <Button
        disabled={pending}
        icon="document"
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const response = await fetch(`/api/projects/${projectId}/generate`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ expectedVersion: projectVersion }),
            });
            const body = await response.json();
            if (!response.ok) {
              setMessage(body.error ?? "La génération a échoué.");
              return;
            }
            setMessage(`Aperçu régénéré : ${body.generation.generationId}`);
            router.refresh();
          })
        }
      >
        {pending ? "Génération…" : "Régénérer l’aperçu"}
      </Button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
