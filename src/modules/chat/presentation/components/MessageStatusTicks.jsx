/** WhatsApp-style message delivery ticks — parallel stroke checks, no overlap glitches. */
export function MessageStatusTicks({ delivered, read, light = true }) {
  const color = read ? "#53bdeb" : light ? "rgba(255,255,255,0.65)" : "#8696a0";

  if (!delivered && !read) {
    return (
      <svg
        className="inline-block h-[11px] w-[11px] shrink-0"
        viewBox="0 0 12 11"
        fill="none"
        aria-hidden
      >
        <path
          d="M1.5 5.5L4.5 8.5L10.5 1.5"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="inline-block h-[11px] w-[18px] shrink-0"
      viewBox="0 0 18 11"
      fill="none"
      aria-hidden
    >
      <path
        d="M1 5.5L3.75 8.25L7.5 3"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 5.5L8.25 8.25L16.5 1"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
