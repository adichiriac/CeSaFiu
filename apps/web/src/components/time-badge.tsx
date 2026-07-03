/**
 * Borderless duration badge — clock glyph + "N min", bold weight only.
 * Per ROADMAP P5 spec: emphasis comes from the font, not a chip border.
 * Server-safe (no hooks); used on the landing test cards.
 */

type TimeBadgeProps = {
  minutes: string;
  className?: string;
};

export default function TimeBadge({minutes, className}: TimeBadgeProps) {
  return (
    <span className={className ? `homeTimeBadge ${className}` : 'homeTimeBadge'}>
      <svg
        className="homeTimeBadgeIcon"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.2 2" />
      </svg>
      {minutes}
    </span>
  );
}
