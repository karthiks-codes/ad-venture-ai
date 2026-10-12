"use client";

import { useEffect, useState } from "react";

export function LocalDateTime({ value }: { value: string | null }) {
  const [formatted, setFormatted] = useState(value ? "Loading local time…" : "—");

  useEffect(() => {
    if (!value) {
      setFormatted("—");
      return;
    }
    const date = new Date(value);
    setFormatted(
      Number.isNaN(date.getTime())
        ? "Invalid timestamp"
        : new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
          }).format(date),
    );
  }, [value]);

  return value ? (
    <time dateTime={value} title={`Original timestamp: ${value}`}>
      {formatted}
    </time>
  ) : (
    formatted
  );
}
