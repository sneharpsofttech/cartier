import Link from "next/link";
import styles from "./StepBar.module.css";

type Step = { label: string; detail?: string; href?: string };

/** What each step is called on small screens, where the second line is hidden. */
const SHORT = ["Stone", "Setting", "Review"];

/**
 * The ring creator's progress: numbered steps joined by a line, the current
 * one in gold. Finished or reachable steps link back.
 */
export default function StepBar({
  current,
  steps,
  compact = false,
}: {
  current: 0 | 1 | 2;
  steps: [Step, Step, Step];
  compact?: boolean;
}) {
  return (
    <nav className={styles.bar} data-compact={compact} aria-label="Ring creator steps">
      <ol>
        {steps.map((step, i) => {
          const state = i === current ? "current" : i < current ? "done" : "todo";
          const body = (
            <>
              <span className={styles.dot}>{state === "done" ? "✓" : i + 1}</span>
              <span className={styles.text}>
                <span className={styles.label}>{step.label}</span>
                <span className={styles.short}>{SHORT[i]}</span>
                {step.detail && <span className={styles.detail}>{step.detail}</span>}
              </span>
            </>
          );
          return (
            <li key={i} className={styles.step} data-state={state}>
              {step.href && i !== current ? (
                <Link href={step.href} className={styles.inner}>
                  {body}
                </Link>
              ) : (
                <span className={styles.inner} aria-current={i === current ? "step" : undefined}>
                  {body}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
