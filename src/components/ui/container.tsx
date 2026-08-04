import { cn } from "@/lib/utils";

type ContainerProps = React.ComponentPropsWithoutRef<"div"> & {
  /** `prose` is narrower, for long-form reading. `wide` is for grids. */
  width?: "prose" | "default" | "wide";
};

const widths = {
  prose: "max-w-2xl",
  default: "max-w-3xl",
  wide: "max-w-5xl",
} as const;

export function Container({ width = "default", className, ...props }: ContainerProps) {
  return (
    <div
      className={cn("px-gutter mx-auto w-full", widths[width], className)}
      {...props}
    />
  );
}
