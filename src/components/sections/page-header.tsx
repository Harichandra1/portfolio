import { Container } from "@/components/ui/container";

export function PageHeader({
  title,
  lead,
  children,
  width = "wide",
}: {
  title: string;
  lead?: string;
  children?: React.ReactNode;
  width?: "prose" | "default" | "wide";
}) {
  return (
    <Container width={width} className="pt-14 pb-10">
      <h1 className="font-display text-fg text-4xl text-balance sm:text-5xl">{title}</h1>
      {lead ? (
        <p className="text-fg-muted mt-4 max-w-xl text-lg text-pretty">{lead}</p>
      ) : null}
      {children}
    </Container>
  );
}
