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
      <h1 className="text-fg text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      {lead ? <p className="text-fg-muted mt-3 max-w-xl text-pretty">{lead}</p> : null}
      {children}
    </Container>
  );
}
