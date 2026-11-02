"use client";

import { useState } from "react";
import styles from "@/app/home.module.css";

// Point these at the store's own profiles once they exist.
// Filled glyphs (even-odd, so cut-outs show the circle behind).
const SOCIAL = [
  {
    label: "Facebook",
    href: "#",
    icon: "M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21z",
  },
  {
    label: "X",
    href: "#",
    icon: "M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.2L5.6 21h-3l7.1-8.1L2.2 3h6.2l4.3 5.7zm-1.1 16.2h1.7L7.4 4.7H5.6z",
  },
  {
    label: "Instagram",
    href: "#",
    icon: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm5.3-4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z",
  },
  {
    label: "YouTube",
    href: "#",
    icon: "M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z",
  },
];

/** The home page's sign-up band: heading, email form with consent, and social links. */
export default function HomeNewsletter() {
  const [done, setDone] = useState(false);

  return (
    <section className={styles.newsletter}>
      <div className={styles.newsInner}>
        <div>
          <h2>Stay Informed, Always</h2>
          <p>New collections, private events and the occasional offer, straight to your inbox.</p>
        </div>

        {done ? (
          <p className={styles.newsThanks}>Thank you for joining us.</p>
        ) : (
          <form
            className={styles.newsForm}
            onSubmit={(e) => {
              // Nothing is sent anywhere yet; connect this to your email provider.
              e.preventDefault();
              setDone(true);
            }}
          >
            <div className={styles.newsRow}>
              <input type="email" required placeholder="Email Address" aria-label="Email address" />
              <button>Send Message</button>
            </div>
            <label className={styles.newsAgree}>
              <input type="checkbox" required /> I agree to receive emails from DAZORA
            </label>
          </form>
        )}

        <div className={styles.connect}>
          <h3>Connect Globally</h3>
          <ul>
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a href={s.href} aria-label={s.label}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={s.icon} fillRule="evenodd" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
