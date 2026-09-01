interface EntranceInterfaceProps {
  entering: boolean;
  visible: boolean;
  onEnter: () => void;
  onEngagementChange: (engaged: boolean) => void;
}

export function EntranceInterface({
  entering,
  visible,
  onEnter,
  onEngagementChange,
}: EntranceInterfaceProps) {
  if (!visible) return null;

  return (
    <div className={`entry-interface${entering ? " entry-interface--entering" : ""}`}>
      <header className="scene-copy">
        <p className="scene-brand">SNAPSHOT</p>
        <p className="scene-tagline">a little place for our memories</p>
      </header>

      <div className="entry-action">
        <button
          type="button"
          className="entry-button"
          onClick={onEnter}
          onPointerEnter={() => onEngagementChange(true)}
          onPointerLeave={() => onEngagementChange(false)}
          onFocus={() => onEngagementChange(true)}
          onBlur={() => onEngagementChange(false)}
          disabled={entering}
          aria-label="Enter the booth and begin our little trip through time"
        >
          <span className="entry-button__label">ENTER THE BOOTH</span>
          <span className="entry-button__line" aria-hidden="true"><i /></span>
          <span className="entry-button__support">Begin our little trip through time</span>
        </button>
      </div>
    </div>
  );
}
