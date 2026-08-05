export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const normalized = Math.min(100, Math.max(0, value));
  return (
    <div className="progress" aria-label={label ?? `Progression ${normalized}%`}>
      <div className="progress__track"><div className="progress__fill" style={{ width: `${normalized}%` }} /></div>
      <span className="progress__value">{normalized}%</span>
    </div>
  );
}
