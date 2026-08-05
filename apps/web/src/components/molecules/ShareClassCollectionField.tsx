"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/atoms/Button";
import { Input, Select } from "@/components/atoms/Field";
import styles from "@/components/molecules/ShareClassCollectionField.module.css";
import {
  createDefaultShareClass,
  normalizeShareClasses,
  validateShareClasses,
} from "@/domain/structured-answers";
import type { ShareClassInput } from "@/domain/types";

export function ShareClassCollectionField({
  id,
  value,
  defaultCurrency,
  disabled,
  onChange,
}: {
  id: string;
  value: unknown;
  defaultCurrency?: string;
  disabled?: boolean;
  onChange: (value: ShareClassInput[]) => void;
}) {
  const normalizedIncoming = useMemo(
    () => normalizeShareClasses(value, defaultCurrency),
    [value, defaultCurrency],
  );
  const [rows, setRows] = useState<ShareClassInput[]>(normalizedIncoming);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(normalizedIncoming);
  }, [normalizedIncoming]);

  function updateRow(index: number, update: Partial<ShareClassInput>) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              ...update,
              initial_subscription_minimum:
                update.initial_subscription_minimum ?? row.initial_subscription_minimum,
              decimalization: update.decimalization ?? row.decimalization,
            }
          : row,
      ),
    );
    setError(null);
  }

  function addRow() {
    setRows((current) => [
      ...current,
      createDefaultShareClass(current.length, defaultCurrency),
    ]);
    setError(null);
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setError(null);
  }

  function commit() {
    try {
      validateShareClasses(rows);
      setError(null);
      onChange(rows);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Les classes de parts sont invalides.");
    }
  }

  return (
    <div className={styles.editor} id={id}>
      <div className={styles.intro}>
        <p>
          Chaque ligne alimente directement la collection canonique <code>share_classes</code>.
        </p>
        <Button
          disabled={disabled || rows.length >= 20}
          onClick={addRow}
          size="sm"
          type="button"
          variant="secondary"
        >
          Ajouter une classe
        </Button>
      </div>

      <div className={styles.rows}>
        {rows.map((row, index) => (
          <section className={styles.row} key={row.class_id || `share-class-${index}`}>
            <div className={styles.rowHeader}>
              <h3>Classe {index + 1}</h3>
              <Button
                disabled={disabled || rows.length === 1}
                onClick={() => removeRow(index)}
                size="sm"
                type="button"
                variant="danger"
              >
                Supprimer
              </Button>
            </div>

            <div className={styles.grid}>
              <label>
                <span>Identifiant stable</span>
                <Input
                  disabled={disabled}
                  maxLength={32}
                  value={row.class_id}
                  onChange={(event) =>
                    updateRow(index, { class_id: event.target.value.toUpperCase() })
                  }
                />
              </label>
              <label>
                <span>Devise</span>
                <Input
                  disabled={disabled}
                  maxLength={3}
                  value={row.currency}
                  onChange={(event) =>
                    updateRow(index, { currency: event.target.value.toUpperCase() })
                  }
                />
              </label>
              <label>
                <span>Politique de revenus</span>
                <Select
                  disabled={disabled}
                  value={row.income_policy}
                  onChange={(event) =>
                    updateRow(index, {
                      income_policy: event.target.value as ShareClassInput["income_policy"],
                    })
                  }
                >
                  <option value="CAPITALIZED">Capitalisation</option>
                  <option value="DISTRIBUTED">Distribution</option>
                </Select>
              </label>
              <label>
                <span>VL d’origine</span>
                <Input
                  disabled={disabled}
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={row.initial_nav}
                  onChange={(event) =>
                    updateRow(index, { initial_nav: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                <span>Minimum initial de souscription</span>
                <Input
                  disabled={disabled}
                  value={row.initial_subscription_minimum.display}
                  onChange={(event) =>
                    updateRow(index, {
                      initial_subscription_minimum: { display: event.target.value },
                    })
                  }
                />
              </label>
              <label>
                <span>Décimalisation</span>
                <Input
                  disabled={disabled}
                  value={row.decimalization.display}
                  onChange={(event) =>
                    updateRow(index, { decimalization: { display: event.target.value } })
                  }
                />
              </label>
            </div>
          </section>
        ))}
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.actions}>
        <span>
          {rows.length} classe{rows.length > 1 ? "s" : ""}
        </span>
        <Button disabled={disabled} onClick={commit} type="button">
          Enregistrer les classes
        </Button>
      </div>
    </div>
  );
}
