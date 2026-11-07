"use client";

import { useEffect, useRef, useState } from "react";
import { SceneView } from "@/three/canvas/scene-view";
import { frameMetrics, RAIL } from "@/three/scenes/portico/layout";

/**
 * The portico continued: a rail under each pillar, from the foot of the hero
 * to the end of the page, each with a creeper that grows down it as you
 * scroll (src/three/scenes/portico/rail.tsx).
 *
 * Place it as the first child of a `relative` wrapper around everything
 * below the hero; the rails fill that wrapper's height.
 *
 * The pillars are positioned by the 3D camera, not by CSS, so the rails ask
 * the same function the camera uses (`frameMetrics`) where the pillars land
 * for the hero's current size, and stand there. Before that measurement —
 * on the server, and for a frame on the client — no rail renders, which is
 * also what every visitor below xl gets: like the portico, the rails are an
 * xl-and-up thing, decorative and aria-hidden.
 */
export function PorticoRails() {
  const box = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<ReturnType<typeof frameMetrics> | null>(null);
  const [room, setRoom] = useState(0);

  useEffect(() => {
    const hero = document.querySelector("[data-portico-hero]");
    const el = box.current;
    if (!hero || !el) return;
    const measure = () => {
      const r = hero.getBoundingClientRect();
      setM(frameMetrics(r.width, r.height));
      setRoom(el.getBoundingClientRect().height);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(hero);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A whole number of modules plus the next one's collar, so each rail ends
  // on a turned collar a little above the footer rather than mid-module.
  const height = m
    ? (Math.max(1, Math.floor((room / m.ppm - 0.15) / RAIL.len)) * RAIL.len + 0.1) * m.ppm
    : 0;
  const w = m ? RAIL.viewWidth * m.ppm : 0;
  const out = m ? RAIL.outset * m.ppm : 0;

  return (
    <div
      ref={box}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden xl:block"
    >
      {m && room > 0 ? (
        <>
          <div
            id="portico-rail-left"
            className="absolute top-0"
            style={{ left: m.pier - out - w / 2, width: w, height }}
          >
            <SceneView name="rail-left" />
          </div>
          <div
            id="portico-rail-right"
            className="absolute top-0"
            style={{ left: m.column + out - w / 2, width: w, height }}
          >
            <SceneView name="rail-right" />
          </div>
        </>
      ) : null}
    </div>
  );
}
