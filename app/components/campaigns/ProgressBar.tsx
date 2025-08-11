export function ProgressBar({value}: {value: number}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-3 rounded bg-gray-200">
      <div
        className="h-3 rounded bg-green-600 transition-all"
        style={{width: `${clamped}%`}}
      />
    </div>
  );
}
