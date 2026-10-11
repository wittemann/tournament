export default function Spinner() {
  return (
    <div role="status" className="flex justify-center py-8">
      <span className="loading loading-spinner loading-lg" aria-hidden="true" />
      <span className="sr-only">Lädt…</span>
    </div>
  );
}
