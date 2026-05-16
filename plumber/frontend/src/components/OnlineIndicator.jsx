import './OnlineIndicator.css';

/**
 * Reusable plumber availability indicator dot.
 * Renders as a positioned overlay on plumber avatars.
 *
 * @param {'online' | 'busy' | 'offline' | undefined} status
 * @param {boolean} showLabel - Whether to show text label
 */
export default function OnlineIndicator({ status = 'offline', showLabel = false }) {
  const resolvedStatus = status || 'offline';

  const labels = {
    online: 'Online',
    busy: 'Busy',
    offline: 'Offline',
  };

  return (
    <span className={`online-indicator ${resolvedStatus}`} title={labels[resolvedStatus]}>
      <span className="indicator-dot" />
      {showLabel && <span className="indicator-label">{labels[resolvedStatus]}</span>}
    </span>
  );
}
