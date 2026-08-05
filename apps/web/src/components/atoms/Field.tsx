import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function FieldShell({ id, label, help, required, children }: { id: string; label: string; help?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="field-shell">
      <label className="field-shell__label" htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label>
      {help ? <p className="field-shell__help">{help}</p> : null}
      {children}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field-control" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="field-control field-control--textarea" rows={5} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="field-control" {...props} />;
}
