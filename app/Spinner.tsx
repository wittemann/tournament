import StatusCard from './StatusCard';

export default function Spinner() {
  return (
    <div role="status">
      <StatusCard>
        <span
          className="loading loading-spinner loading-sm"
          aria-hidden="true"
        />
        Lädt…
      </StatusCard>
    </div>
  );
}
