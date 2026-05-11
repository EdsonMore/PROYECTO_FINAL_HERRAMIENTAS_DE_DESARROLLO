"use client";

import React, { useEffect, useState } from "react";

interface Props {
  text: string;
  highlight?: string;
  className?: string;
}

export default function AnimatedHeading({ text, highlight, className = "" }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // activar animación después del montaje en cliente
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const renderChars = (str: string | undefined, baseIndex = 0) => {
    if (!str) return null;
    return str.split("").map((ch, i) => (
      <span
        key={baseIndex + i}
        className="animated-letter"
        style={{ ["--i" as any]: baseIndex + i }}
      >
        {ch === " " ? "\u00A0" : ch}
      </span>
    ));
  };

  const before = text ?? "";
  const hl = highlight ?? "";

  return (
    <h1 className={className} data-mounted={mounted ? "true" : "false"}>
      <div className="heading-line line-main">{renderChars(before, 0)}</div>
      <div className="heading-line line-highlight text-primary">{renderChars(hl, before.length)}</div>
    </h1>
  );
}
