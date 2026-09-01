interface AtmosphericOverlayProps {
  entering: boolean;
  visible: boolean;
}

export function AtmosphericOverlay({ entering, visible }: AtmosphericOverlayProps) {
  return (
    <div
      className={`entry-atmosphere${visible ? " entry-atmosphere--visible" : ""}${entering ? " entry-atmosphere--entering" : ""}`}
      aria-hidden="true"
    >
      <div className="entry-haze" />
      <div className="entry-grid" />
      <div className="entry-grain" />
      <div className="entry-vignette" />
      <div className="entry-border" />
      <div className="entry-dust">
        {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
      </div>
      <p className="entry-meta entry-meta--left">L / ARCHIVE 01</p>
      <p className="entry-meta entry-meta--right">FOR WHAT ONCE FELT LIKE HOME</p>
    </div>
  );
}
