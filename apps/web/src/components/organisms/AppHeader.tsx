import { Button } from "@/components/atoms/Button";

export function AppHeader({ title, description, actionHref, actionLabel }: { title: string; description?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <header className="app-header">
      <div><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>
      {actionHref && actionLabel ? <Button href={actionHref} icon="plus">{actionLabel}</Button> : null}
    </header>
  );
}
