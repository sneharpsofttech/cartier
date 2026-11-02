"use client";

import { useState } from "react";

/** Copies the current page's address, e.g. to share a finished ring design. */
export default function CopyLinkButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch {
          // Clipboard can be unavailable (insecure context); the address bar still has the link.
        }
      }}
    >
      {copied ? "Link copied" : "Copy link to this ring"}
    </button>
  );
}
