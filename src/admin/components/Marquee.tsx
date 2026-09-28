import * as React from 'react';

const styles = `
.marquee {
  --marquee-gap: 8px;
  --marquee-duration: 20s;
}

.marquee__content + .marquee__content {
  margin-left: var(--marquee-gap);
}

@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-50% - var(--marquee-gap) / 2)); }
}

@media (prefers-reduced-motion: reduce) {
  .marquee       { overflow-x: auto; }
  .marquee__track { animation: none; }
  .marquee__content[aria-hidden="true"] { display: none; }
}
`;

export const Marquee: React.FC<{
  items: React.ReactNode[];
}> = ({ items }) => {
  const marqueeRef = React.useRef<HTMLDivElement | null>(null);
  const animationRef = React.useRef<Animation | null>(null);
  const currentRateRef = React.useRef(1);
  const targetRateRef = React.useRef(1);
  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    const track = marquee.querySelector<HTMLElement>('.marquee__track');
    if (!track) return;

    const [animation] = track.getAnimations();
    if (animation) animationRef.current = animation;

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function animatePlaybackRate() {
    const animation = animationRef.current;
    if (!animation) return;

    const current = currentRateRef.current;
    const target = targetRateRef.current;
    const next = current + (target - current) * 0.08;

    currentRateRef.current = next;
    animation.updatePlaybackRate(next);

    if (Math.abs(target - next) > 0.001) {
      rafRef.current = requestAnimationFrame(animatePlaybackRate);
      return;
    }

    currentRateRef.current = target;
    animation.updatePlaybackRate(target);
    rafRef.current = null;
  }

  function setTargetRate(rate: number) {
    targetRateRef.current = rate;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(animatePlaybackRate);
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div
        ref={marqueeRef}
        className="marquee overflow-hidden w-full"
        aria-label="Scrolling content"
        onMouseEnter={() => setTargetRate(0.35)}
        onMouseLeave={() => setTargetRate(1)}
        onFocus={() => setTargetRate(0.35)}
        onBlur={() => setTargetRate(1)}
      >
        <div
          className="marquee__track flex w-max will-change-transform"
          style={{
            animation: 'marquee-scroll var(--marquee-duration) linear infinite',
          }}
        >
          <ul
            className="marquee__content flex items-center shrink-0 min-w-full list-none p-0 m-0"
            style={{ gap: 'var(--marquee-gap)' }}
          >
            {items.map((item, index) => (
              <li
                className="marquee__item flex-none whitespace-nowrap"
                key={`item-${index}`}
              >
                {item}
              </li>
            ))}
          </ul>

          <ul
            className="marquee__content flex items-center shrink-0 min-w-full list-none p-0 m-0"
            style={{ gap: 'var(--marquee-gap)' }}
            aria-hidden="true"
          >
            {items.map((item, index) => (
              <li
                className="marquee__item flex-none whitespace-nowrap"
                key={`duplicate-item-${index}`}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};
