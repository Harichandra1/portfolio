"use client";

import { View } from "@react-three/drei";

/**
 * Both halves of drei's `View` come from this one module, deliberately.
 *
 * `View` pairs an in-page `<View>` with a `<View.Port />` inside the canvas via
 * a tunnel held in a module-level singleton. If the two halves were reached
 * through separate dynamic imports that resolved to separate module instances,
 * they would use different tunnels and nothing would ever render — silently,
 * with no error. Routing both through this file keeps them on one instance.
 */

/** Claims a rectangle of the shared canvas. Lives in the DOM tree. */
export function ViewSlot({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <View className={className}>{children}</View>;
}

/** The receiving end. Rendered once, inside the shared <Canvas>. */
export function ViewPort() {
  return <View.Port />;
}
