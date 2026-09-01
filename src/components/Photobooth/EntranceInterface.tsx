interface EntranceInterfaceProps {
  entering: boolean;
  visible: boolean;
  interactive?: boolean;
  archiveReady?: boolean;
  revealProgress?: number;
  onEnter: () => void;
  onEngagementChange: (engaged: boolean) => void;
}

export function EntranceInterface({
  entering,
  visible,
  interactive = true,
  archiveReady = true,
  revealProgress,
  onEnter,
  onEngagementChange,
}: EntranceInterfaceProps) {
  if (!visible) return null;

  return (
    <div
      className={`entry-interface${entering ? " entry-interface--entering" : ""}`}
      style={revealProgress === undefined ? undefined : { opacity: revealProgress }}
    >
      <div className="entry-action">
        <button
          type="button"
          className="entry-button"
          onClick={onEnter}
          onPointerEnter={() => onEngagementChange(true)}
          onPointerLeave={() => onEngagementChange(false)}
          onFocus={() => onEngagementChange(true)}
          onBlur={() => onEngagementChange(false)}
          disabled={entering || !interactive || !archiveReady}
          aria-label={archiveReady ? "Enter the photobooth" : "Archive loading"}
        >
          <span className="entry-button__label">{archiveReady ? "ENTER THE BOOTH" : "LOADING ARCHIVE"}</span>
          <span className="entry-button__line" aria-hidden="true"><i /></span>
          <span className="entry-button__support">Begin our little trip through time</span>
        </button>
      </div>
    </div>
  );
}
