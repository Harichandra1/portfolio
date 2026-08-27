import { cn } from "@/lib/utils";

export type ResultRow = {
  label: string;
  /** The value for the subject being evaluated (e.g. "your" agent). */
  subject: string;
  /** The value for what it's compared against (e.g. "GPT-4o"). */
  baseline: string;
  /** Which side wins this row, for the subtle accent mark. `null` = no claim. */
  winner: "subject" | "baseline" | null;
};

/**
 * Shows a comparison honestly: wins and losses in the same table. For the
 * macos-agent case study this is the whole point — the single-shot loss and
 * the multi-turn win appear together, not the win alone. See
 * CONVENTIONS.md's honesty rule before removing a losing row from any table.
 */
export function ResultsTable({
  caption,
  subjectLabel,
  baselineLabel,
  rows,
  note,
}: {
  caption: string;
  subjectLabel: string;
  baselineLabel: string;
  rows: ResultRow[];
  note?: string;
}) {
  return (
    <figure className="border-border my-8 rounded-(--radius-lg) border">
      <figcaption className="border-border text-fg-subtle text-2xs border-b px-4 py-2.5 font-mono tracking-wide uppercase">
        {caption}
      </figcaption>
      <table className="w-full font-mono text-sm">
        <thead>
          <tr className="border-border border-b text-left">
            <th className="text-fg-subtle text-2xs px-4 py-2 font-normal tracking-wide uppercase">
              &nbsp;
            </th>
            <th className="text-fg-subtle text-2xs px-4 py-2 font-normal tracking-wide uppercase">
              {subjectLabel}
            </th>
            <th className="text-fg-subtle text-2xs px-4 py-2 font-normal tracking-wide uppercase">
              {baselineLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-border border-b last:border-b-0">
              <td className="text-fg-muted px-4 py-3">{row.label}</td>
              <td
                className={cn(
                  "px-4 py-3 tabular-nums",
                  row.winner === "subject" ? "text-accent font-semibold" : "text-fg",
                )}
              >
                {row.subject}
              </td>
              <td
                className={cn(
                  "px-4 py-3 tabular-nums",
                  row.winner === "baseline" ? "text-accent font-semibold" : "text-fg",
                )}
              >
                {row.baseline}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {note ? (
        <p className="border-border text-fg-subtle border-t px-4 py-2.5 text-xs">
          {note}
        </p>
      ) : null}
    </figure>
  );
}
