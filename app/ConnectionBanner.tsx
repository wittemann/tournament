// Shown above stale data when a table could not be loaded or the live channel
// is down. The live region stays in the DOM so screen readers announce changes.
export default function ConnectionBanner({ show }: { show: boolean }) {
  return (
    <div role="status" aria-live="polite">
      {show && (
        <div className="alert alert-warning mb-4 text-sm">
          Keine Verbindung – die Daten sind evtl. nicht aktuell.
        </div>
      )}
    </div>
  );
}
