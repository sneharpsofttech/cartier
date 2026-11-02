"use client";

import { useEffect, useState } from "react";
import styles from "@/app/home.module.css";

/** Counts down to the end of the current week (Sunday midnight), so the offer always has time left. */
function endOfWeek() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.getTime();
}

export default function Countdown() {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const end = endOfWeek();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const parts =
    left === null
      ? ["--", "--", "--", "--"]
      : [left / 86400000, (left / 3600000) % 24, (left / 60000) % 60, (left / 1000) % 60].map((v) =>
          String(Math.floor(v)).padStart(2, "0"),
        );

  return (
    <div className={styles.countdown} role="timer" aria-label="Time left on this offer">
      {["Days", "Hrs", "Mins", "Secs"].map((label, i) => (
        <span key={label}>
          <strong>{parts[i]}</strong>
          <small>{label}</small>
        </span>
      ))}
    </div>
  );
}
