import styles from "./TrustBar.module.css";

const ITEMS = [
  {
    title: "Free Insured Shipping",
    text: "Signature on delivery",
    icon: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />,
  },
  {
    title: "30-Day Returns",
    text: "Free resizing for life",
    icon: <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />,
  },
  {
    title: "Certified Diamonds",
    text: "GIA and IGI graded",
    icon: <path d="M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 16M15 4l-3 16" />,
  },
  {
    title: "Lifetime Care",
    text: "Cleaning and inspection",
    icon: <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z" />,
  },
];

/** A row of service promises, shown on the home and product pages. */
export default function TrustBar({ compact = false }: { compact?: boolean }) {
  return (
    <ul className={styles.bar} data-compact={compact || undefined}>
      {ITEMS.map((item) => (
        <li key={item.title}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {item.icon}
          </svg>
          <span>
            <strong>{item.title}</strong>
            <small>{item.text}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
