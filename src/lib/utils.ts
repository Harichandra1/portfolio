import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, with later Tailwind utilities winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "2026-08-04" -> "August 4, 2026" */
export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(d);
}

/** Machine-readable date for <time dateTime>. */
export function isoDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}
