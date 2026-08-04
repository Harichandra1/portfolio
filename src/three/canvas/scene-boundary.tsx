"use client";

import { Component, type ReactNode } from "react";

/**
 * Last line of defence for the 3D layer: a shader that fails to compile, a
 * model that 404s, or a driver quirk must degrade to the poster image rather
 * than take down the page around it.
 */
export class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Surfaced in dev; on Vercel this lands in the function/browser logs.
    console.error("[three] scene failed, falling back to poster:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
