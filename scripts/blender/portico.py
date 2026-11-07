"""
The hero portico — a carved walnut pier and a marble Ionic column carrying an
entablature that turns from wood into stone partway across.

Everything is generated from code: every molding profile, flute, volute, leaf
and key. Nothing is sculpted by hand, so the model can be regenerated, and a
proportion changed here is a proportion changed everywhere.

Run (headless):

    blender -b -P scripts/blender/portico.py -- --out public/models --preview /tmp/portico.png

Flags:
    --out DIR        write portico.glb (+ the baked textures) into DIR
    --preview PNG    also render a composed preview at 1600x900
    --blend FILE     save the working .blend (procedural materials intact)
    --tex N          atlas size for the pillars (default 2048)
    --no-bake        skip baking and export (fast iteration on geometry)
    --samples N      bake samples (default 48)

Conventions (Blender space; the glTF exporter converts to three's Y-up):
    X right, Y away from the camera, Z up. Fronts face -Y.
    1 unit = 1 metre. Columns are 6.70 tall to the top of the abacus; the
    entablature adds 1.485 above that.

The entablature is exported as *modules*, not as one beam, because the hero
is a different width on every screen. The page places the two pillars at the
edges of whatever box it gets and stretches the two plain runs between them.
Moldings are extrusions along X, so stretching a run in X distorts nothing;
the Greek key and the dentils are NOT stretched — they are instanced at their
true size and only their spacing flexes. The layout rule lives in
src/three/scenes/portico/layout.ts and must match `assemble()` below.
"""

import bpy
import bmesh
import math
import os
import random
import sys
from math import sin, cos, pi, radians, log, exp, sqrt
from mathutils import Euler, Matrix, Vector

import numpy as np

# --------------------------------------------------------------------------
# args
# --------------------------------------------------------------------------
argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def arg(name, default=None):
    if name in argv:
        return argv[argv.index(name) + 1]
    return default


OUT = os.path.abspath(arg("--out", "out"))
PREVIEW = arg("--preview")
BLEND = arg("--blend")
TEX = int(arg("--tex", "2048"))
BAKE = "--no-bake" not in argv
SAMPLES = int(arg("--samples", "48"))

random.seed(7)

# --------------------------------------------------------------------------
# dimensions — the numbers the page's layout.ts mirrors are marked [layout]
# --------------------------------------------------------------------------
COL_TOP = 6.70  # top of both abaci                               [layout]
ENT_FRONT = -0.46  # architrave face, Y                               [layout]
ENT_BACK_P = -0.92  # profile depth behind the architrave face
END_OUT = 0.78  # end block reaches this far outboard of a pillar  [layout]
END_IN = 0.78  # ...and this far inboard                          [layout]
WALNUT_RUN = 4.0  # authored length of the walnut run                [layout]
MARBLE_RUN = 6.0  # authored length of the marble run                [layout]
CONSOLE_W = 0.46  # the console block at the wood/stone seam         [layout]
FRIEZE_Z0 = 0.57  # frieze band, relative to COL_TOP
FRIEZE_Z1 = 0.93
KEY_CELLS_X = 10  # Greek key module: 10 x 11 cells
KEY_CELLS_Z = 11
KEY_CELL = 0.0255
KEY_W = KEY_CELLS_X * KEY_CELL  # module width                     [layout]
KEY_H = KEY_CELLS_Z * KEY_CELL
KEY_Z = COL_TOP + (FRIEZE_Z0 + FRIEZE_Z1) / 2 - KEY_H / 2
WAVE_W = 0.36  # running-scroll module on the walnut frieze           [layout]
WAVE_H = 0.3
WAVE_Z = COL_TOP + (FRIEZE_Z0 + FRIEZE_Z1) / 2 - WAVE_H / 2
DENTIL_P = 0.125  # dentil pitch                                      [layout]
DENTIL_W = 0.075


# --------------------------------------------------------------------------
# small geometry kit
# --------------------------------------------------------------------------
def V(*a):
    return Vector(a)


class MB:
    """Mesh builder: accumulate parts, emit one object."""

    def __init__(self):
        self.v, self.f = [], []

    def add(self, verts, faces, M=None):
        o = len(self.v)
        if M is not None:
            verts = [M @ Vector(v) for v in verts]
        self.v.extend(tuple(v) for v in verts)
        self.f.extend(tuple(i + o for i in f) for f in faces)
        return self

    def addmb(self, other, M=None):
        return self.add(other.v, other.f, M)

    def obj(self, name, angle=38, weld=True):
        return make_obj(name, self.v, self.f, angle, weld)


def make_obj(name, verts, faces, angle=38, weld=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.validate(clean_customdata=False)
    if weld:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-6)
        bm.to_mesh(me)
        bm.free()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if angle is not None:
        me.shade_smooth()
        me.set_sharp_from_angle(angle=radians(angle))
    return ob


def recalc(verts, faces):
    """Make a closed part's winding consistent and outward."""
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in verts]
    for f in faces:
        try:
            bm.faces.new([vs[i] for i in f])
        except ValueError:
            pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.verts.index_update()
    out_v = [tuple(v.co) for v in bm.verts]
    out_f = [tuple(v.index for v in f.verts) for f in bm.faces]
    bm.free()
    return out_v, out_f


def T(x=0, y=0, z=0):
    return Matrix.Translation((x, y, z))


def R(axis, deg):
    return Matrix.Rotation(radians(deg), 4, axis)


def S(x, y=None, z=None):
    y = x if y is None else y
    z = x if z is None else z
    return Matrix.Diagonal((x, y, z, 1))


# ---- molding profiles ---------------------------------------------------
class Prof:
    """A 2D profile traced bottom-to-top along the visible face.

    p = projection outward from the path (or radius for a lathe), z = height.
    Every curve helper is named for what it looks like, and `convex` means
    bulging away from the solid.
    """

    def __init__(self, p, z):
        self.pts = [(p, z)]

    @property
    def p(self):
        return self.pts[-1][0]

    @property
    def z(self):
        return self.pts[-1][1]

    def to(self, p, z):
        self.pts.append((p, z))
        return self

    def by(self, dp, dz):
        return self.to(self.p + dp, self.z + dz)

    def quarter(self, dp, dz, convex=True, n=7):
        p0, z0 = self.p, self.z
        hfirst = convex if dp > 0 else not convex
        for i in range(1, n + 1):
            a = (i / n) * pi / 2
            if hfirst:
                self.to(p0 + dp * sin(a), z0 + dz * (1 - cos(a)))
            else:
                self.to(p0 + dp * (1 - cos(a)), z0 + dz * sin(a))
        return self

    def torus(self, h, bulge, n=10):
        p0, z0 = self.p, self.z
        for i in range(1, n + 1):
            a = pi * i / n
            self.to(p0 + bulge * sin(a), z0 + h / 2 * (1 - cos(a)))
        return self

    def scotia(self, h, depth, dp=0.0, n=10):
        p0, z0 = self.p, self.z
        for i in range(1, n + 1):
            t = i / n
            a = pi * t
            self.to(p0 + dp * t - depth * sin(a), z0 + h / 2 * (1 - cos(a)))
        return self

    def cyma_recta(self, dp, dz, n=6):
        # concave below, convex above (a crowning sima)
        self.quarter(dp / 2, dz / 2, convex=False, n=n)
        return self.quarter(dp / 2, dz / 2, convex=True, n=n)

    def cyma_reversa(self, dp, dz, n=6):
        # convex below, concave above (an ogee bed molding)
        self.quarter(dp / 2, dz / 2, convex=True, n=n)
        return self.quarter(dp / 2, dz / 2, convex=False, n=n)


def sweep(pts, path, closed=False):
    """Sweep a (p, z) profile along a polyline in XY. Corners are mitred, so a
    rectangle path gives true mitred moldings and a straight path gives a
    run. The outward side is the right-hand side of travel (CCW from above
    = outward)."""
    n = len(path)
    segs = n if closed else n - 1
    seg_n = []
    for i in range(segs):
        a = Vector(path[i])
        b = Vector(path[(i + 1) % n])
        d = (b - a).normalized()
        seg_n.append(Vector((d.y, -d.x)))
    vn = []
    for i in range(n):
        if closed:
            n1, n2 = seg_n[i - 1], seg_n[i % segs]
        else:
            n1, n2 = seg_n[max(i - 1, 0)], seg_n[min(i, segs - 1)]
        vn.append((n1 + n2) / (1 + n1.dot(n2)))
    P = len(pts)
    verts, faces = [], []
    for i in range(n):
        base = Vector(path[i])
        for p, z in pts:
            q = base + vn[i] * p
            verts.append((q.x, q.y, z))
    for i in range(n if closed else n - 1):
        i2 = (i + 1) % n
        for j in range(P - 1):
            faces.append((i * P + j, i2 * P + j, i2 * P + j + 1, i * P + j + 1))
    return verts, faces


def rect(hx, hy):
    return [(-hx, -hy), (hx, -hy), (hx, hy), (-hx, hy)]


def lathe(pts, segs=64):
    verts, faces = [], []
    P = len(pts)
    for i in range(segs):
        a = 2 * pi * i / segs
        c, s = cos(a), sin(a)
        for r, z in pts:
            verts.append((r * c, r * s, z))
    for i in range(segs):
        i2 = (i + 1) % segs
        for j in range(P - 1):
            faces.append((i * P + j, i2 * P + j, i2 * P + j + 1, i * P + j + 1))
    return verts, faces


def box(x0, x1, y0, y1, z0, z1):
    v = [
        (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
        (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
    ]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return v, f


def sphere(rx, ry, rz, seg=14, rings=9):
    verts = [(0, 0, -rz)]
    for i in range(1, rings):
        t = pi * i / rings - pi / 2
        for k in range(seg):
            a = 2 * pi * k / seg
            verts.append((rx * cos(t) * cos(a), ry * cos(t) * sin(a), rz * sin(t)))
    verts.append((0, 0, rz))
    faces = []
    top = len(verts) - 1
    for k in range(seg):
        faces.append((0, 1 + (k + 1) % seg, 1 + k))
    for i in range(rings - 2):
        b = 1 + i * seg
        for k in range(seg):
            k2 = (k + 1) % seg
            faces.append((b + k, b + k2, b + seg + k2, b + seg + k))
    b = 1 + (rings - 2) * seg
    for k in range(seg):
        faces.append((top, b + k, b + (k + 1) % seg))
    return recalc(verts, faces)


def tube(points, radii, res=8, cap=True):
    """A swept circle with parallel-transported frames, tapering per point."""
    pts = [Vector(p) for p in points]
    n = len(pts)
    if isinstance(radii, (int, float)):
        radii = [radii] * n
    Ts = [(pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(n)]
    up = Vector((0, 0, 1)) if abs(Ts[0].z) < 0.9 else Vector((1, 0, 0))
    N = Ts[0].cross(up).normalized()
    Ns = []
    for i in range(n):
        if i > 0:
            ax = Ts[i - 1].cross(Ts[i])
            if ax.length > 1e-9:
                N = Matrix.Rotation(Ts[i - 1].angle(Ts[i]), 3, ax.normalized()) @ N
        Ns.append(N.copy())
    verts, faces = [], []
    for i in range(n):
        B = Ts[i].cross(Ns[i])
        for k in range(res):
            a = 2 * pi * k / res
            verts.append(pts[i] + (Ns[i] * cos(a) + B * sin(a)) * radii[i])
    for i in range(n - 1):
        for k in range(res):
            k2 = (k + 1) % res
            faces.append((i * res + k, i * res + k2, (i + 1) * res + k2, (i + 1) * res + k))
    if cap:
        c0 = len(verts)
        verts.append(pts[0] - Ts[0] * radii[0] * 0.6)
        for k in range(res):
            faces.append((c0, (k + 1) % res, k))
        c1 = len(verts)
        verts.append(pts[-1] + Ts[-1] * radii[-1] * 0.6)
        b = (n - 1) * res
        for k in range(res):
            faces.append((c1, b + k, b + (k + 1) % res))
        return recalc([tuple(v) for v in verts], faces)
    return [tuple(v) for v in verts], faces


def solidify(verts, faces, th):
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in verts]
    for f in faces:
        try:
            bm.faces.new([vs[i] for i in f])
        except ValueError:
            pass
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=th)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.verts.index_update()
    out = ([tuple(v.co) for v in bm.verts], [tuple(v.index for v in f.verts) for f in bm.faces])
    bm.free()
    return out


# ---- ornament -----------------------------------------------------------
def leaf(L, W, curl=0.6, lobes=3, cup=0.22, th=0.012, su=18, sv=8, lean=0.0):
    """An acanthus-like leaf: grows +Z, faces -Y. `curl` (0..1) rolls the tip
    forward and down; `lobes` scallops the edge; the midrib stands proud and
    the lobes are veined, so it catches light like a carving rather than a
    flat cut-out."""
    spine, frames = [], []
    pos = Vector((0, 0, 0))
    for i in range(su + 1):
        u = i / su
        A = lean + curl * pi * max(0.0, (u - 0.42) / 0.58) ** 1.7
        t = Vector((0, -sin(A), cos(A)))
        nrm = Vector((0, -cos(A), -sin(A)))
        spine.append(pos.copy())
        frames.append(nrm)
        pos += t * (L / su)
    verts, faces = [], []
    for i in range(su + 1):
        u = i / su
        # a narrow stalk, widest past the middle, drawn to a point
        env = sin(pi * min(1.0, 0.04 + u * 0.98)) ** 0.75 * (0.45 + 0.55 * min(1.0, u * 3.0))
        # lobes: each a pointed finger leaning toward the tip, with a
        # rounded "eye" between them — the acanthus silhouette
        q = (u * lobes + 0.15) % 1.0
        tri = (0.7 - q) / 0.7 if q < 0.7 else (q - 0.7) / 0.3
        lobe = 0.55 + 0.45 * (1 - tri) ** 1.25 if lobes else 1.0
        lobe += 0.06 * abs(sin(pi * u * lobes * 4))  # serration
        w = 0.5 * W * env * lobe if i < su else 0.0
        for j in range(sv + 1):
            v = -1 + 2 * j / sv
            h = cup * w * (1 - v * v)
            h += 0.10 * W * max(0.0, 1 - abs(v) * 5) ** 2  # midrib
            h -= 0.04 * W * (cos(pi * v * 2.5) ** 2) * (abs(v) > 0.2)  # veins
            # each lobe folds: alternately toward and away from the eye
            h += 0.07 * W * v * v * cos(2 * pi * q)
            # the lobe edges lift and roll at the tip
            h += 0.12 * W * (abs(v) ** 3) * u
            P = spine[i] + Vector((v * w, 0, 0)) + frames[i] * h
            verts.append(tuple(P))
    for i in range(su):
        for j in range(sv):
            a = i * (sv + 1) + j
            faces.append((a, a + 1, a + sv + 2, a + sv + 1))
    return solidify(verts, faces, th)


def rosette(r, petals=8, depth=0.5):
    """Flower: a domed button in a ring of petals. Faces -Y, centred at 0."""
    mb = MB()
    for k in range(petals):
        a = 360 * k / petals
        lv, lf = leaf(r * 0.95, r * 0.62, curl=0.18, lobes=1, cup=0.35, th=r * 0.07, su=8, sv=6)
        M = R("Y", a) @ T(0, 0, r * 0.18) @ R("X", 8)
        mb.add(lv, lf, M)
    sv, sf = sphere(r * 0.3, r * 0.22, r * 0.3, 12, 8)
    mb.add(sv, sf, T(0, -r * 0.18, 0))
    # flatten into relief
    return MB().add(mb.v, mb.f, S(1, depth, 1))


def egg_and_dart(egg=0.05):
    """One egg in its shell, plus the dart. Local: faces -Y, egg centre 0."""
    mb = MB()
    ev, ef = sphere(egg * 0.62, egg * 0.45, egg, 14, 10)
    mb.add(ev, ef, T(0, -egg * 0.12, -egg * 0.08))
    # the shell: a U of tube around the egg
    pts = []
    for i in range(17):
        a = pi * (0.05 + 0.9 * i / 16)
        pts.append((cos(a) * egg * 0.85, -egg * 0.08, -sin(a) * egg * 1.12 + egg * 0.35))
    tv, tf = tube(pts, egg * 0.1, 6)
    mb.add(tv, tf)
    # the dart, between this egg and the next
    dv = [(0, -egg * 0.25, egg * 0.3), (egg * 0.09, 0, egg * 0.3), (-egg * 0.09, 0, egg * 0.3),
          (0, -egg * 0.05, -egg * 1.0)]
    df = [(0, 1, 2), (0, 3, 1), (0, 2, 3), (1, 3, 2)]
    dv, df = recalc(dv, df)
    mb.add(dv, df, T(egg * 1.18, 0, 0))
    return mb


def log_spiral(Rv, r_eye, turns):
    b = log(Rv / r_eye) / (2 * pi * turns)
    return b


def volute_face(Rv, turns=2.5, r_eye=None, ch=0.028, nphi=120, nrho=30):
    """The face of an Ionic volute: a disc whose surface is a spiral channel,
    crest to crest. Left-hand volute (the spiral unwinds outward to the left
    from the top). Local: face plane y=0, facing -Y, centred at 0."""
    r_eye = r_eye or Rv * 0.17
    b = log_spiral(Rv, r_eye, turns)
    th0 = pi / 2
    verts, faces = [], []
    for i in range(nrho + 1):
        rho = r_eye + (Rv - r_eye) * (i / nrho) ** 0.85
        Th = th0 + log(Rv / rho) / b
        for k in range(nphi):
            phi = 2 * pi * k / nphi
            f = ((Th - phi) / (2 * pi)) % 1.0
            # outermost half turn hasn't begun yet: keep it as plain fillet
            d = ch * sin(pi * f) ** 0.7 * min(1.0, (Rv - rho) / (Rv * 0.06) + 0.0)
            verts.append((rho * cos(phi), d, rho * sin(phi)))
    for i in range(nrho):
        for k in range(nphi):
            k2 = (k + 1) % nphi
            a, b2 = i * nphi + k, i * nphi + k2
            faces.append((a, a + nphi, b2 + nphi, b2))
    # the ridge riding the crest
    mb = MB().add(verts, faces)
    pts, rads = [], []
    n = int(140 * turns)
    for i in range(n + 1):
        th = th0 + 2 * pi * turns * i / n
        r = Rv * exp(-b * (th - th0))
        pts.append((r * cos(th), -0.002, r * sin(th)))
        rads.append(0.016 * (r / Rv) ** 0.35 + 0.003)
    tv, tf = tube(pts, rads, 7)
    mb.add(tv, tf)
    # the eye
    ev, ef = sphere(r_eye * 1.05, r_eye * 0.6, r_eye * 1.05, 14, 9)
    mb.add(ev, ef, T(0, -r_eye * 0.1, 0))
    return mb, b


def mirror_x(mb):
    out = MB()
    out.v = [(-x, y, z) for (x, y, z) in mb.v]
    out.f = [tuple(reversed(f)) for f in mb.f]
    return out


def ionic_volutes(xv, zv, Rv, y_front, y_back, turns=2.5):
    """Two volutes joined by a sagging canalis, each carried back as a
    waisted bolster (pulvinus) with a three-ring belt — the side of an Ionic
    capital that a three-quarter view actually shows."""
    mb = MB()
    face, b = volute_face(Rv, turns)
    mb.addmb(face, T(-xv, y_front, zv))
    mb.addmb(mirror_x(face), T(xv, y_front, zv))
    # bolsters
    depth = y_back - y_front
    pr = Prof(Rv, 0).by(0, 0.05 * depth)
    pr.quarter(-0.16 * Rv, 0.30 * depth, convex=False, n=8)
    mid = pr.z
    pr.torus(0.035 * depth, 0.06 * Rv, 6).by(0, 0.01 * depth).torus(0.05 * depth, 0.09 * Rv, 6)
    pr.by(0, 0.01 * depth).torus(0.035 * depth, 0.06 * Rv, 6)
    pr.quarter(0.16 * Rv, depth - pr.z - 0.05 * depth, convex=False, n=8)
    pr.to(Rv, depth)
    pts = [(r, z) for (r, z) in pr.pts]
    lv, lf = lathe(pts, 48)
    for sx in (-1, 1):
        mb.add(lv, lf, T(sx * xv, y_front, zv) @ R("X", -90))
    # the canalis: a concave band from the volute tops down to the sag line
    th_in = pi / 2 + 1.5 * pi
    r_in = Rv * exp(-b * 1.5 * pi)
    xs = xv - r_in
    nx, nz = 48, 6
    cv, cf = [], []
    for i in range(nx + 1):
        x = -xv + 2 * xv * i / nx
        sag = zv - 0.16 * Rv * cos(pi * x / (2 * xv)) ** 2
        z_bot = sag if abs(x) < xs else zv
        z_top = zv + Rv
        for j in range(nz + 1):
            t = j / nz
            z = z_bot + (z_top - z_bot) * t
            cv.append((x, y_front + 0.006 + 0.02 * sin(pi * t), z))
    for i in range(nx):
        for j in range(nz):
            a = i * (nz + 1) + j
            cf.append((a, a + nz + 1, a + nz + 2, a + 1))
    mb.add(cv, cf)
    # the line along the canalis' lower edge, and the straight top border
    sag_pts = []
    for i in range(41):
        x = -xs + 2 * xs * i / 40
        sag_pts.append((x, y_front + 0.004, zv - 0.16 * Rv * cos(pi * x / (2 * xv)) ** 2 + 0.008))
    tv, tf = tube(sag_pts, 0.011, 6)
    mb.add(tv, tf)
    tv, tf = tube([(-xv, y_front - 0.002, zv + Rv - 0.012), (xv, y_front - 0.002, zv + Rv - 0.012)], 0.013, 6)
    mb.add(tv, tf)
    # body behind the canalis
    bv, bf = box(-xv, xv, y_front + 0.02, y_back - 0.02, zv - 0.16 * Rv, zv + Rv)
    mb.add(bv, bf)
    return mb


def greek_key_cells():
    """The running key as filled cells on a 10 x 11 grid, period 10 in x.
    Row 0 is the base line, row 10 the top border; the hook spirals two and a
    half turns. Built from cells so every module tiles seamlessly."""
    cells = set()
    for x in range(10):
        cells.add((x, 0))
        cells.add((x, 10))
    for z in range(0, 9):
        cells.add((0, z))
    for x in range(0, 9):
        cells.add((x, 8))
    for z in range(2, 9):
        cells.add((8, z))
    for x in range(4, 9):
        cells.add((x, 2))
    for z in range(2, 7):
        cells.add((4, z))
    for x in range(4, 7):
        cells.add((x, 6))
    for z in range(4, 7):
        cells.add((6, z))
    return cells


def key_module(cell, h):
    """One module of the key in relief: cell-exact, with side walls only
    where the (periodic) neighbour is empty, so modules butt invisibly."""
    cells = greek_key_cells()
    W = KEY_CELLS_X

    def filled(x, z):
        return ((x % W), z) in cells

    verts, faces = [], []

    def quad(a, b, c, d):
        o = len(verts)
        verts.extend([a, b, c, d])
        faces.append((o, o + 1, o + 2, o + 3))

    for (x, z) in cells:
        x0, x1, z0, z1 = x * cell, (x + 1) * cell, z * cell, (z + 1) * cell
        y = -h
        quad((x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1))
        if not filled(x - 1, z):
            quad((x0, 0, z0), (x0, y, z0), (x0, y, z1), (x0, 0, z1))
        if not filled(x + 1, z):
            quad((x1, y, z0), (x1, 0, z0), (x1, 0, z1), (x1, y, z1))
        if z == 0 or not filled(x, z - 1):
            quad((x0, 0, z0), (x1, 0, z0), (x1, y, z0), (x0, y, z0))
        if z == KEY_CELLS_Z - 1 or not filled(x, z + 1):
            quad((x0, y, z1), (x1, y, z1), (x1, 0, z1), (x0, 0, z1))
    return verts, faces


# --------------------------------------------------------------------------
# the Ionic column (marble)
# --------------------------------------------------------------------------
def fluted_shaft(z0, z1, R0, Rt, band, flutes=24, m=8, depth=0.05, ff=0.2):
    """Fluted shaft with entasis, split by a mid band, every flute ending in
    a rounded stop at both ends of both drums."""
    L = z1 - z0
    zb0, zb1 = band
    zones = [(z0 + 0.05, zb0 - 0.05), (zb1 + 0.05, z1 - 0.06)]
    P = 2 * pi / flutes
    tl = (1 - ff) * P * R0 * 0.55

    def R(z):
        u = (z - z0) / L
        return R0 if u < 1 / 3 else R0 - (R0 - Rt) * ((u - 1 / 3) / (2 / 3)) ** 1.35

    def fade(z):
        for a, b2 in zones:
            if a <= z <= b2:
                e = min(z - a, b2 - z)
                return 1.0 if e >= tl else sqrt(max(0.0, 1 - (1 - e / tl) ** 2))
        return 0.0

    # ring heights: coarse along the shaft, dense around every stop
    zs = set()
    k = 0
    while z0 + k * 0.12 < z1:
        zs.add(round(z0 + k * 0.12, 5))
        k += 1
    zs.add(z1)
    for a, b2 in zones:
        for e in [i / 10 * tl for i in range(11)]:
            zs.add(round(a + e, 5))
            zs.add(round(b2 - e, 5))
        zs.add(round(a - 0.004, 5))
        zs.add(round(b2 + 0.004, 5))
    zs = sorted(z for z in zs if z0 <= z <= z1)
    angles, kinds = [], []
    for f in range(flutes):
        angles.append(f * P)
        kinds.append(-1)
        for i in range(m):
            angles.append(f * P + ff * P + (1 - ff) * P * i / m)
            kinds.append(i / m)
    A = len(angles)
    verts, faces = [], []
    for z in zs:
        r0 = R(z)
        fd = fade(z)
        for ang, t in zip(angles, kinds):
            d = 0.0 if t < 0 else depth * sqrt(max(0.0, 1 - (2 * t - 1) ** 2)) * fd
            r = r0 - d * (r0 / R0)
            verts.append((r * cos(ang), r * sin(ang), z))
    for i in range(len(zs) - 1):
        for k in range(A):
            k2 = (k + 1) % A
            faces.append((i * A + k, i * A + k2, (i + 1) * A + k2, (i + 1) * A + k))
    return verts, faces, R


def build_column():
    mb = MB()
    # plinth
    p = Prof(-0.69, 0.0).to(0.0, 0.0).by(0, 0.165).quarter(-0.025, 0.025, convex=True, n=5)
    p.to(-0.69, p.z)
    v, f = sweep(p.pts, rect(0.70, 0.70), closed=True)
    mb.add(v, f)
    # Attic base
    z = 0.19
    pr = Prof(0.0, z).to(0.60, z)
    pr.torus(0.18, 0.075, 14).by(-0.03, 0).by(0, 0.018)
    pr.scotia(0.11, 0.055, dp=-0.015, n=12).by(0.01, 0).by(0, 0.018).by(-0.04, 0)
    pr.torus(0.12, 0.05, 12).by(0.01, 0).by(0, 0.022)
    pr.quarter(-0.035, 0.07, convex=False, n=8)
    base_top = pr.z
    v, f = lathe(pr.pts, 96)
    mb.add(v, f)
    R0 = pr.p  # 0.5
    # shaft with its band
    neck = 5.98
    band = (base_top + 0.45 * (neck - base_top), base_top + 0.45 * (neck - base_top) + 0.16)
    sv, sf, Rz = fluted_shaft(base_top, neck, R0, 0.43, band)
    mb.add(sv, sf)
    # the band: fillet, bead, a fat torus, bead, fillet
    rb = Rz(band[0])
    pb = Prof(rb - 0.01, band[0]).to(rb + 0.02, band[0]).by(0, 0.012)
    pb.torus(0.03, 0.02, 6).by(0, 0.004).torus(0.07, 0.04, 10).by(0, 0.004).torus(0.03, 0.02, 6)
    pb.by(0, band[1] - pb.z - 0.0).to(rb - 0.01, band[1])
    v, f = lathe(pb.pts, 96)
    mb.add(v, f)
    # neck: fillet + astragal carved as bead-and-reel
    rt = 0.43
    pn = Prof(rt - 0.01, neck).to(rt + 0.015, neck).by(0, 0.015).by(-0.015, 0)
    pn.by(0, 0.012)
    v, f = lathe(pn.pts, 96)
    mb.add(v, f)
    zb = neck + 0.027 + 0.035
    nb = 36
    for i in range(nb):
        a = 360 * i / nb
        # bead: long along the ring; reel: a thin disc across it
        bv, bf = sphere(0.024, 0.02, 0.021, 10, 7)
        mb.add(bv, bf, R("Z", a) @ T(0, -(rt + 0.004), zb))
        rv, rf = sphere(0.006, 0.02, 0.023, 10, 6)
        mb.add(rv, rf, R("Z", a + 180 / nb) @ T(0, -(rt + 0.004), zb))
    cyl = Prof(rt - 0.005, neck + 0.027).to(rt - 0.005, zb + 0.035)
    v, f = lathe(cyl.pts, 64)
    mb.add(v, f)
    # echinus with egg-and-dart
    Rv, xv, yf, yb = 0.27, 0.64, -0.50, 0.50
    zv = 6.29
    e0 = zb + 0.035
    pe = Prof(rt - 0.01, e0).quarter(0.15, 6.26 - e0, convex=True, n=10).to(0.3, 6.26)
    v, f = lathe(pe.pts, 96)
    mb.add(v, f)
    egg = egg_and_dart(0.058)
    ne = 24
    zr = e0 + (6.26 - e0) * 0.45
    rr = rt - 0.01 + 0.15 * sin(pi / 2 * 0.62)
    for i in range(ne):
        a = 360 * i / ne
        mb.addmb(egg, R("Z", a) @ T(0, -rr + 0.015, zr) @ R("X", -22))
    # volutes, canalis, bolsters
    mb.addmb(ionic_volutes(xv, zv, Rv, yf, yb))
    # abacus
    za = zv + Rv
    pa = Prof(-0.02, za).to(0.0, za).by(0, 0.055).cyma_reversa(0.045, 0.06, 5).by(0, 0.025)
    pa.to(-0.55, COL_TOP)
    v, f = sweep(pa.pts, rect(0.58, 0.56), closed=True)
    mb.add(v, f)
    return mb.obj("Column")


# --------------------------------------------------------------------------
# the carved walnut pier
# --------------------------------------------------------------------------
PX, PY = 0.37, 0.33  # pier half-width, half-depth (slimmed: the copy beside it needs the room)


def wall_with_recess(hw, z0, z1, rhw, rz0, rz1, depth):
    """A flat wall (plane y=0, facing -Y, spanning x in [-hw, hw]) with a
    sunk panel. Returns verts, faces in wall space."""
    v, f = [], []

    def quad(a, b, c, d):
        o = len(v)
        v.extend([a, b, c, d])
        f.append((o, o + 1, o + 2, o + 3))

    # frame strips
    quad((-hw, 0, z0), (hw, 0, z0), (hw, 0, rz0), (-hw, 0, rz0))
    quad((-hw, 0, rz1), (hw, 0, rz1), (hw, 0, z1), (-hw, 0, z1))
    quad((-hw, 0, rz0), (-rhw, 0, rz0), (-rhw, 0, rz1), (-hw, 0, rz1))
    quad((rhw, 0, rz0), (hw, 0, rz0), (hw, 0, rz1), (rhw, 0, rz1))
    d = depth
    # reveals
    quad((-rhw, 0, rz0), (rhw, 0, rz0), (rhw, d, rz0), (-rhw, d, rz0))
    quad((-rhw, d, rz1), (rhw, d, rz1), (rhw, 0, rz1), (-rhw, 0, rz1))
    quad((-rhw, d, rz0), (-rhw, d, rz1), (-rhw, 0, rz1), (-rhw, 0, rz0))
    quad((rhw, 0, rz0), (rhw, 0, rz1), (rhw, d, rz1), (rhw, d, rz0))
    # panel floor
    quad((-rhw, d, rz0), (rhw, d, rz0), (rhw, d, rz1), (-rhw, d, rz1))
    return v, f


def panel_bead(rhw, rz0, rz1, r=0.016):
    """A half-round bead around a panel's opening, lying on the wall."""
    pts = []
    for i in range(9):
        a = pi * i / 8
        pts.append((r * (1 - cos(a)) - r * 0.2, r * sin(a)))
    # traced from the outer edge inward, so the crown's faces point out of
    # the wall (a profile walked outward faces down, like a soffit)
    pts.reverse()
    # path in the wall plane: x across, "y" up the wall; z = height off it
    path = [(-rhw, rz0), (rhw, rz0), (rhw, rz1), (-rhw, rz1)]
    v, f = sweep(pts, path, closed=True)
    # (x, y=up, z=out) -> wall space (x, -out, up)
    M = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
    return [tuple(M @ Vector(p)) for p in v], f


def rinceau(hw, z0, z1, seed=3):
    """The vine: a stem rising from an urn in a sine, throwing a scroll into
    each bay it leaves empty, every scroll ending in a flower and dressed in
    leaves. Panel space: x across, z up, relief toward -Y from y=0."""
    rnd = random.Random(seed)
    mb = MB()
    # urn
    urn = Prof(0.0, 0.0).to(0.07, 0.0).by(0, 0.02).to(0.035, 0.05).quarter(0.09, 0.12, convex=True, n=6)
    urn.quarter(0.03, 0.08, convex=True, n=5).quarter(-0.09, 0.12, convex=True, n=6).to(0.05, urn.z + 0.04)
    urn.quarter(0.04, 0.05, convex=False, n=4).by(0, 0.015).to(0.0, urn.z)
    uv, uf = lathe(urn.pts, 32)
    uz = z0 + 0.02
    mb.add(uv, uf, T(0, 0.01, uz) @ S(1, 0.42, 1))
    urn_top = uz + urn.z
    # leaves spilling from the urn's mouth
    for sgn in (-1, 1):
        lv, lf = leaf(0.22, 0.11, curl=0.1, lobes=2, cup=0.12, th=0.008)
        mb.add(lv, lf, T(sgn * 0.05, -0.002, urn_top - 0.05) @ R("Y", sgn * 58) @ S(1, 0.45, 1))
    # stem
    zs0, zs1 = urn_top - 0.02, z1 - 0.12
    period = 0.92
    amp = 0.42 * hw
    stem = []
    n = 160
    for i in range(n + 1):
        z = zs0 + (zs1 - zs0) * i / n
        x = amp * sin(2 * pi * (z - zs0) / period) * min(1.0, (z - zs0) / 0.25)
        stem.append((x, -0.012, z))
    rad = [0.03 - 0.014 * i / n for i in range(n + 1)]
    tv, tf = tube(stem, rad, 8)
    mb.add(tv, tf, S(1, 0.75, 1))
    # scrolls at each trough/crest
    k = 0
    while True:
        zc = zs0 + period * (0.25 + 0.5 * k)
        if zc > zs1 - 0.2:
            break
        side = 1 if k % 2 == 0 else -1  # crest swings right -> scroll fills left
        side = -side
        xs = amp * sin(2 * pi * (zc - 0.1 - zs0) / period)
        start = Vector((xs, -0.012, zc - 0.1))
        r0 = min(hw - abs(xs) - 0.01, 0.2) * 0.55 + 0.05
        c = Vector((xs + side * r0, -0.012, zc - 0.1))
        pts, rads = [], []
        turns = 1.05
        m = 80
        for i in range(m + 1):
            t = i / m
            th = pi - side * 0 + (-1 if side > 0 else 1) * 2 * pi * turns * t
            # start pointing up out of the stem
            r = r0 * (1 - 0.62 * t)
            ang = (pi if side > 0 else 0.0) + (-side) * 2 * pi * turns * t
            pts.append((c.x + r * cos(ang), -0.012, c.z + r * sin(ang)))
            rads.append(0.022 * (1 - 0.55 * t))
        pv, pf = tube(pts, rads, 7)
        mb.add(pv, pf, S(1, 0.75, 1))
        # leaves springing from the scroll's outer side, splayed outward
        # in the direction of growth — the scroll is the stalk, they are
        # the foliage, and together they fill the bay
        for i in (6, 20, 34, 50):
            a = Vector(pts[i])
            b2 = Vector(pts[i + 2])
            d = (b2 - a).normalized()
            outward = (a - c).normalized()
            dirv = (d * 0.8 + outward * 0.6).normalized()
            beta = math.degrees(math.atan2(dirv.x, dirv.z))
            Lr = 0.12 * (1 - 0.4 * i / m) + 0.035
            lv, lf = leaf(Lr, Lr * 0.6, curl=0.12, lobes=3, cup=0.22, th=0.01, su=14, sv=7)
            base = a + outward * 0.012
            mb.add(lv, lf, T(base.x, -0.006, base.z) @ R("Y", beta) @ S(1, 0.8, 1))
        # a sheath leaf where the scroll leaves the stem
        lv, lf = leaf(0.24, 0.13, curl=0.08, lobes=3, cup=0.16, th=0.009)
        mb.add(lv, lf, T(start.x, -0.006, start.z - 0.04) @ R("Y", side * 30) @ S(1, 0.7, 1))
        # the flower at the scroll's heart
        ros = rosette(0.058, 8, depth=0.7)
        mb.addmb(ros, T(c.x, -0.022, c.z))
        k += 1
    # top: a fleuron
    for a in (-40, 0, 40):
        lv, lf = leaf(0.16, 0.08, curl=0.12, lobes=2, cup=0.15, th=0.008)
        mb.add(lv, lf, T(stem[-1][0], -0.008, zs1 - 0.02) @ R("Y", a) @ S(1, 0.5, 1))
    bud = sphere(0.035, 0.02, 0.05, 12, 8)
    mb.add(*bud, T(stem[-1][0], -0.02, zs1 + 0.1))
    return mb


def husk_chain(z_top, z_bot, n=11):
    """A ribbon bow and a hanging chain of bellflowers, each a little smaller
    than the one above. Panel space, relief toward -Y."""
    mb = MB()
    # bow: two loops and two tails
    for s in (-1, 1):
        pts = []
        for i in range(25):
            a = 2 * pi * i / 24
            pts.append((s * (0.07 + 0.065 * cos(a)), -0.01, z_top + 0.035 * sin(a)))
        tv, tf = tube(pts, 0.009, 6, cap=False)
        mb.add(tv, tf, S(1, 0.6, 1))
        tail = [(s * 0.01, -0.01, z_top), (s * 0.06, -0.01, z_top - 0.09), (s * 0.05, -0.01, z_top - 0.2)]
        tv, tf = tube(tail, [0.01, 0.009, 0.005], 6)
        mb.add(tv, tf, S(1, 0.6, 1))
    kv, kf = sphere(0.025, 0.014, 0.022, 10, 7)
    mb.add(kv, kf, T(0, -0.012, z_top))
    z = z_top - 0.07
    for i in range(n):
        s = 1.0 - 0.45 * i / (n - 1)
        h = 0.11 * s
        # three petals
        for a, sc in ((0, 1.0), (-38, 0.75), (38, 0.75)):
            pv, pf = sphere(0.022 * s * sc, 0.014 * s, 0.05 * s * sc, 10, 7)
            mb.add(pv, pf, T(0, -0.01, z - h * 0.45) @ R("Y", a) @ T(0, 0, -0.03 * s))
        bv, bf = sphere(0.012 * s, 0.01, 0.012 * s, 8, 6)
        mb.add(bv, bf, T(0, -0.012, z - h - 0.012 * s))
        z -= h + 0.03 * s
        if z < z_bot:
            break
    return mb


def build_pilaster():
    mb = MB()
    # plinth + base moldings around the shaft rectangle
    p = Prof(-0.38, 0.0).to(0.20, 0.0).by(0, 0.2).quarter(-0.02, 0.02, convex=True, n=4).to(-0.38, 0.22)
    v, f = sweep(p.pts, rect(PX, PY), closed=True)
    mb.add(v, f)
    pr = Prof(0.12, 0.22).to(0.12, 0.22)
    pr.torus(0.13, 0.05, 12).by(-0.03, 0).by(0, 0.015)
    pr.scotia(0.08, 0.04, dp=-0.01, n=10).by(0.008, 0).by(0, 0.012).by(-0.03, 0)
    pr.torus(0.07, 0.03, 8).by(-0.015, 0).by(0, 0.015).quarter(-pr.p, 0.07, convex=False, n=7)
    v, f = sweep(pr.pts, rect(PX, PY), closed=True)
    mb.add(v, f)
    s0 = pr.z  # ~0.6
    s1 = 5.74
    # walls with sunk panels
    rz0, rz1 = s0 + 0.2, s1 - 0.16
    depth = 0.05
    fv, ff = wall_with_recess(PX - 0.03, s0, s1, PX - 0.14, rz0, rz1, depth)
    sv, sf = wall_with_recess(PY - 0.03, s0, s1, PY - 0.14, rz0, rz1, depth)
    bv, bf = panel_bead(PX - 0.14, rz0, rz1)
    sbv, sbf = panel_bead(PY - 0.14, rz0, rz1)
    walls = [
        (T(0, -PY, 0), PX, fv, ff, bv, bf),
        (T(PX, 0, 0) @ R("Z", 90), PY, sv, sf, sbv, sbf),
        (T(0, PY, 0) @ R("Z", 180), PX, fv, ff, bv, bf),
        (T(-PX, 0, 0) @ R("Z", -90), PY, sv, sf, sbv, sbf),
    ]
    for M, hw, wv, wf, b_v, b_f in walls:
        mb.add(wv, wf, M)
        mb.add(b_v, b_f, M)
    # rounded corners: a bead running up each arris
    for sx in (-1, 1):
        for sy in (-1, 1):
            cx, cy = sx * (PX - 0.03), sy * (PY - 0.03)
            tv, tf = tube([(cx, cy, s0), (cx, cy, s1)], 0.03, 12, cap=False)
            mb.add(tv, tf)
    # the carving
    vine = rinceau(PX - 0.14, rz0, rz1)
    mb.addmb(vine, T(0, -PY + depth, 0))
    for M in (T(PX - depth, 0, 0) @ R("Z", 90), T(-PX + depth, 0, 0) @ R("Z", -90)):
        mb.addmb(husk_chain(rz1 - 0.16, rz0 + 1.1), M)
        ros = rosette(0.075, 8, 0.6)
        mb.addmb(ros, M @ T(0, 0, rz0 + 0.45))
    # ---- composite capital ----
    pn = Prof(0.0, s1).to(0.0, s1).torus(0.05, 0.028, 8).by(0, 0.012).by(0.0, 0.0)
    v, f = sweep(pn.pts, rect(PX, PY), closed=True)
    mb.add(v, f)
    bell0 = pn.z
    zv, Rv, xv = 6.36, 0.17, PX
    yf = -PY - 0.09
    za = zv + Rv  # abacus bottom
    pb = Prof(-0.005, bell0).to(-0.005, bell0).quarter(0.05, za - bell0 - 0.0, convex=False, n=8)
    v, f = sweep(pb.pts, rect(PX - 0.01, PY - 0.01), closed=True)
    mb.add(v, f)
    # egg-and-dart band at the volute eyes
    pe = Prof(0.0, 6.2).to(0.0, 6.2).quarter(0.06, 0.1, convex=True, n=7).by(0, 0.015).to(-0.05, 6.315)
    v, f = sweep(pe.pts, rect(PX + 0.02, PY + 0.02), closed=True)
    mb.add(v, f)
    egg = egg_and_dart(0.036)
    n_egg = max(3, int(2 * (xv - Rv) / 0.09))
    for i in range(n_egg):
        x = -(n_egg - 1) * 0.045 + 0.09 * i
        mb.addmb(egg, T(x, -PY - 0.07, 6.255) @ R("X", -25))
    # two rows of acanthus
    def leaves_on_face(M, xs, L, W, z0, y_off, curl, lean):
        for x in xs:
            lv, lf = leaf(L, W, curl=curl, lobes=4, cup=0.3, th=0.014, lean=lean, su=22, sv=10)
            mb.add(lv, lf, M @ T(x, y_off, z0))

    faces_M = [(T(0, -PY, 0), PX), (T(PX, 0, 0) @ R("Z", 90), PY), (T(-PX, 0, 0) @ R("Z", -90), PY)]
    for M, hw in faces_M:
        leaves_on_face(M, [-hw * 0.5, hw * 0.5], 0.38, 0.32, bell0 + 0.0, -0.012, 0.55, 0.12)
        leaves_on_face(M, [0.0], 0.5, 0.32, bell0 + 0.02, 0.014, 0.62, 0.06)
    # composite volutes
    mb.addmb(ionic_volutes(xv, zv, Rv, yf, PY + 0.05, turns=2.3))
    # abacus, concave-sided feel via a deep cavetto
    pa = Prof(-0.03, za).to(-0.03, za).quarter(0.09, 0.07, convex=False, n=7).by(0, 0.04)
    pa.quarter(0.03, 0.035, convex=True, n=5).by(0, COL_TOP - pa.z).to(-(PY + 0.06), COL_TOP)
    v, f = sweep(pa.pts, rect(PX + 0.07, PY + 0.07), closed=True)
    mb.add(v, f)
    ros = rosette(0.085, 9, 0.55)
    mb.addmb(ros, T(0, -PY - 0.1 - 0.06, za + 0.08))
    return mb.obj("Pilaster")


# --------------------------------------------------------------------------
# entablature
# --------------------------------------------------------------------------
def ent_profile():
    z = COL_TOP
    p = Prof(ENT_BACK_P, z).to(0.0, z)
    # architrave: three fasciae, each capped by a small ogee
    p.by(0, 0.13).cyma_reversa(0.018, 0.022, 3).by(0, 0.14).cyma_reversa(0.018, 0.022, 3)
    p.by(0, 0.16)
    # its crown
    p.cyma_reversa(0.05, 0.06, 5).by(0, 0.02)
    # step back to the frieze
    p.to(0.02, p.z)
    fz0 = p.z
    p.to(0.02, z + FRIEZE_Z1)
    # bed molding, dentil band, ovolo
    p.cyma_reversa(0.05, 0.05, 5).to(0.08, p.z)
    dz0 = p.z
    p.by(0, 0.105)
    dz1 = p.z
    p.quarter(0.08, 0.06, convex=True, n=7)
    # corona soffit with a drip
    p.to(0.36, p.z).by(0, 0.012).by(0.012, 0).by(0, -0.012).to(0.40, p.z)
    p.by(0, 0.14).by(0.015, 0).by(0, 0.015)
    p.cyma_recta(0.12, 0.16, 8)
    p.by(0, 0.03)
    top = p.z
    p.to(ENT_BACK_P, top).to(ENT_BACK_P, z)
    return p.pts, fz0, (dz0, dz1), top


def run_path(x0, x1):
    return [(x0, ENT_FRONT), (x1, ENT_FRONT)]


def end_block(prof, outboard_left):
    """The entablature's end over a pillar, returned round the outer side."""
    yb = ENT_FRONT + 1.0
    if outboard_left:
        path = [(-END_OUT, yb), (-END_OUT, ENT_FRONT), (END_IN, ENT_FRONT)]
    else:
        path = [(-END_IN, ENT_FRONT), (END_OUT, ENT_FRONT), (END_OUT, yb)]
    return sweep(prof, path)


def console_bracket(cw, zb, zt):
    """An ancon: an S-scroll bracket with carved volutes on both cheeks,
    acanthus down its face, and a turned drop beneath. It stands in front of
    the entablature where the walnut gives way to marble, so the change of
    material happens at a piece of carving rather than at a bare cut."""
    mb = MB()
    H = zt - zb
    bw = cw - 0.1  # bracket width
    x0, x1 = (cw - bw) / 2, (cw + bw) / 2

    def front(t):
        e = t * t * (3 - 2 * t)
        return 0.11 + 0.31 * e ** 1.15 + 0.03 * sin(pi * t)

    n = 48
    outline = [(0.0, zb)] + [(front(i / n), zb + H * i / n) for i in range(n + 1)] + [(0.0, zt)]
    verts, faces = [], []
    m = len(outline)
    for x in (x0, x1):
        for (pp, pz) in outline:
            verts.append((x, ENT_FRONT - pp, pz))
    for j in range(m - 1):
        faces.append((j, j + 1, m + j + 1, m + j))
    faces.append(tuple(range(m)))
    faces.append(tuple(m + j for j in reversed(range(m))))
    v, f = recalc(verts, faces)
    mb.add(v, f)
    # the face is fluted: two channels following the S, three raised
    # fillets between them — it reads as carved at any distance
    nx = 40
    fv, ffc = [], []
    rows = [(front(i / n), zb + H * i / n) for i in range(n + 1)]
    for (pp, pz) in rows:
        for k in range(nx + 1):
            u = k / nx
            x = x0 + 0.012 + (bw - 0.024) * u
            g = 0.0
            for c in (0.3, 0.7):
                d = abs(u - c) / 0.13
                if d < 1:
                    g = max(g, sqrt(1 - d * d))
            fv.append((x, ENT_FRONT - pp - 0.012 + 0.022 * g, pz))
    for j in range(n):
        for k in range(nx):
            a_ = j * (nx + 1) + k
            ffc.append((a_, a_ + 1, a_ + nx + 2, a_ + nx + 1))
    mb.add(fv, ffc)
    # carved volutes on both cheeks: big at the top, small at the foot
    big_r, small_r = 0.15, 0.085
    big = (front(0.84) - big_r - 0.005, zb + H * 0.84)
    small = (front(0.1) - small_r * 0.2, zb + H * 0.1)
    for (pc, zc), r, turns in ((big, big_r, 2.0), (small, small_r, 1.6)):
        face, _ = volute_face(r, turns, ch=0.018, nphi=72, nrho=16)
        # volute_face faces -Y; turn it to face -X (left cheek) and +X (right)
        mb.addmb(face, T(x0 - 0.002, ENT_FRONT - pc, zc) @ R("Z", -90))
        mb.addmb(mirror_x(face), T(x1 + 0.002, ENT_FRONT - pc, zc) @ R("Z", 90) @ S(-1, 1, 1))
    # a rosette where the face meets the soffit
    mb.addmb(rosette(0.075, 8, 0.8), T(cw / 2, ENT_FRONT - front(0.95) - 0.02, zt - 0.09))
    # the drop: a turned finial hanging under the foot
    fin = Prof(0.0, 0.0).to(0.012, 0.0).quarter(0.04, 0.05, convex=True, n=6).quarter(-0.03, 0.06, convex=True, n=6)
    fin.to(0.022, fin.z + 0.02).torus(0.03, 0.02, 6).to(0.045, fin.z).by(0, 0.015).to(0.0, fin.z)
    fv, ff = lathe(fin.pts, 24)
    mb.add(fv, ff, T(cw / 2, ENT_FRONT - 0.09, zb - fin.z))
    return mb


def wave_module(W, H):
    """One repeat of a running scroll (the Vitruvian wave) in relief: a
    baseline that throws up a curl, a leaf in the crook, a bud. Origin at the
    module's left foot, relief toward -Y. Modules butt end to end."""
    mb = MB()
    zb = H * 0.1
    tv, tf = tube([(x * W / 12, -0.012, zb) for x in range(13)], 0.019, 8, cap=False)
    mb.add(tv, tf, S(1, 0.8, 1))
    c = Vector((0.56 * W, 0, 0.55 * H))
    Rr = 0.37 * H
    a0 = radians(205)
    # rising stalk: a cubic from the baseline into the curl's outer turn
    p0 = Vector((0.0, 0, zb))
    p3 = c + Vector((cos(a0), 0, sin(a0))) * Rr
    tan3 = Vector((sin(a0), 0, -cos(a0)))  # clockwise
    p1 = Vector((0.2 * W, 0, zb))
    p2 = p3 - tan3 * 0.18 * H
    pts, rads = [], []
    for i in range(16):
        t = i / 16
        q = (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3
        pts.append((q.x, -0.012, q.z))
        rads.append(0.019 - 0.004 * t)
    k = 70
    for i in range(k + 1):
        t = i / k
        a = a0 - 2 * pi * 1.2 * t
        r = Rr * (1 - 0.72 * t)
        pts.append((c.x + r * cos(a), -0.012, c.z + r * sin(a)))
        rads.append(0.015 * (1 - 0.45 * t))
    tv, tf = tube(pts, rads, 7)
    mb.add(tv, tf, S(1, 0.8, 1))
    sv, sf = sphere(0.026, 0.016, 0.026, 10, 7)
    mb.add(sv, sf, T(c.x, -0.01, c.z))
    # a leaf tucked in the crook, pointing on to the next curl
    lv, lf = leaf(0.5 * W, 0.26 * W, curl=0.1, lobes=3, cup=0.24, th=0.009, su=14, sv=7)
    mb.add(lv, lf, T(0.58 * W, -0.006, zb + 0.016) @ R("Y", 70) @ S(1, 0.85, 1))
    lv, lf = leaf(0.3 * W, 0.18 * W, curl=0.1, lobes=2, cup=0.24, th=0.008, su=12, sv=6)
    mb.add(lv, lf, T(0.3 * W, -0.006, 0.62 * H) @ R("Y", -35) @ S(1, 0.85, 1))
    return mb


def egg_module():
    """Two eggs and two darts spanning one dentil pitch, so the egg-and-dart
    above the dentils keeps step with them. Origin at the pitch centre on
    the ovolo, faces -Y tipped down toward the viewer."""
    mb = MB()
    egg = egg_and_dart(0.03)
    for x in (-DENTIL_P / 4, DENTIL_P / 4):
        mb.addmb(egg, T(x, 0, 0))
    return mb


def build_entablature():
    prof, fz0, (dz0, dz1), top = ent_profile()
    objs = {}
    fz_mid = COL_TOP + (FRIEZE_Z0 + FRIEZE_Z1) / 2
    egg_z = dz1 + 0.028
    egg_y = ENT_FRONT - 0.15

    # ---- walnut: the end over the pier, and the plain run
    mb = MB().add(*end_block(prof, True))
    mb.addmb(rosette(0.15, 10, 0.8), T(0, ENT_FRONT - 0.02, fz_mid))
    mb.addmb(rosette(0.15, 10, 0.8), T(-END_OUT - 0.02, ENT_FRONT + 0.45, fz_mid) @ R("Z", -90))
    # a carved leaf-tip cyma on the walnut end's bed molding, front and side
    objs["Ent_WalnutEnd"] = mb.obj("Ent_WalnutEnd")
    objs["Ent_WalnutRun"] = MB().add(*sweep(prof, run_path(0, WALNUT_RUN))).obj("Ent_WalnutRun")

    # ---- the console at the seam
    mb = MB().add(*sweep(prof, run_path(0, CONSOLE_W)))
    mb.addmb(console_bracket(CONSOLE_W, COL_TOP - 0.16, dz1 + 0.06))
    objs["Ent_Console"] = mb.obj("Ent_Console")

    # ---- marble: the run, and the end over the column with its own
    # dentils, eggs and rosettes, front and returned
    objs["Ent_MarbleRun"] = MB().add(*sweep(prof, run_path(0, MARBLE_RUN))).obj("Ent_MarbleRun")
    mb = MB().add(*end_block(prof, False))
    em = egg_module()
    x = -END_IN + DENTIL_P / 2
    while x < END_OUT + 0.08 - DENTIL_P / 2:
        mb.add(*box(x - DENTIL_W / 2, x + DENTIL_W / 2, ENT_FRONT - 0.08 - 0.055, ENT_FRONT - 0.07, dz0, dz1 - 0.012))
        mb.addmb(em, T(x, egg_y, egg_z) @ R("X", 35))
        x += DENTIL_P
    y = ENT_FRONT - 0.08 + DENTIL_P / 2 + 0.04
    while y < ENT_FRONT + 0.9:
        X = END_OUT + 0.08
        mb.add(*box(X - 0.01, X + 0.055, y - DENTIL_W / 2, y + DENTIL_W / 2, dz0, dz1 - 0.012))
        mb.addmb(em, T(END_OUT + 0.15, y, egg_z) @ R("Z", 90) @ R("X", 35))
        y += DENTIL_P
    mb.addmb(rosette(0.15, 10, 0.8), T(0, ENT_FRONT - 0.02, fz_mid))
    mb.addmb(rosette(0.15, 10, 0.8), T(END_OUT + 0.02, ENT_FRONT + 0.45, fz_mid) @ R("Z", 90))
    objs["Ent_MarbleEnd"] = mb.obj("Ent_MarbleEnd")

    # ---- instanced modules. Each origin is where layout.ts puts it:
    #   Key/KeyStop: left foot of the band, on the frieze face
    #   Dentil: centre-bottom, on the dentil band
    #   Egg: pitch centre on the ovolo (already tipped)
    #   Wave: left foot of the band, on the walnut frieze face
    kv, kf = key_module(KEY_CELL, 0.022)
    objs["Key"] = make_obj("Key", kv, kf, angle=30)
    objs["KeyStop"] = make_obj("KeyStop", *box(0, KEY_CELL, -0.022, 0, 0, KEY_H), angle=30)
    dv, df = box(-DENTIL_W / 2, DENTIL_W / 2, -0.055, 0.0, 0, dz1 - dz0 - 0.012)
    objs["Dentil"] = make_obj("Dentil", dv, df, angle=30)
    eg = MB().addmb(em, R("X", 35))
    objs["Egg"] = eg.obj("Egg")
    wm = wave_module(WAVE_W, WAVE_H)
    objs["Wave"] = wm.obj("Wave")
    return objs, (dz0, dz1, egg_y, egg_z)


# --------------------------------------------------------------------------
# layout — MUST match src/three/scenes/portico/layout.ts
# --------------------------------------------------------------------------
SEAM_AT = 0.38


def layout(X):
    a = -X + END_IN
    b = X - END_IN
    seam = a + SEAM_AT * (b - a) - CONSOLE_W / 2
    m0 = seam + CONSOLE_W
    out = {
        "pilaster": -X,
        "column": X,
        "walnutRun": (a, (seam - a) / WALNUT_RUN),
        "console": seam,
        "marbleRun": (m0, (b - m0) / MARBLE_RUN),
    }
    # key: whole modules, spacing flexed, a stop bar closing the right end
    k0, k1 = m0 + 0.08, b - 0.08 - KEY_CELL
    count = max(1, int((k1 - k0) / KEY_W))
    sx = (k1 - k0) / (count * KEY_W)
    out["key"] = ([k0 + i * KEY_W * sx for i in range(count)], sx)
    out["keyStops"] = [k1]
    # dentils (and the eggs above them) on the marble run only
    span = b - m0
    nd = max(1, round(span / DENTIL_P))
    pitch = span / nd
    out["dentils"] = [m0 + (i + 0.5) * pitch for i in range(nd)]
    # the walnut frieze's running scroll
    w0, w1 = a + 0.06, seam - 0.06
    nw = max(1, int((w1 - w0) / WAVE_W))
    wsx = (w1 - w0) / (nw * WAVE_W)
    out["wave"] = ([w0 + i * WAVE_W * wsx for i in range(nw)], wsx)
    return out


def place_modules(mods, X, extra, link=None):
    """Put every piece where the page would put it for a half-span of X.
    With `link`, linked copies go into that collection (for the preview);
    without, the module objects themselves are moved (for baking in
    context), and only one of each instanced module is used."""
    dz0, dz1, egg_y, egg_z = extra
    L = layout(X)
    placed = []

    def put(name, M):
        src = mods[name]
        if link is not None:
            ob = bpy.data.objects.new(name + "_i", src.data)
            link.objects.link(ob)
        else:
            ob = src
        ob.matrix_world = M
        placed.append(ob)

    put("Pilaster", T(L["pilaster"], 0, 0))
    put("Column", T(L["column"], 0, 0))
    for name, x in (("Vine_Pier", L["pilaster"]), ("Foliage_Pier", L["pilaster"]),
                    ("Vine_Column", L["column"]), ("Foliage_Column", L["column"])):
        if name in mods:
            put(name, T(x, 0, 0))
    put("Pilaster_Shadow", T(L["pilaster"], 0, 0))
    put("Column_Shadow", T(L["column"], 0, 0))
    put("Ent_WalnutEnd", T(L["pilaster"], 0, 0))
    put("Ent_MarbleEnd", T(L["column"], 0, 0))
    a, sx = L["walnutRun"]
    put("Ent_WalnutRun", T(a, 0, 0) @ S(sx, 1, 1))
    put("Ent_Console", T(L["console"], 0, 0))
    m0, sx = L["marbleRun"]
    put("Ent_MarbleRun", T(m0, 0, 0) @ S(sx, 1, 1))
    xs, ksx = L["key"]
    ws, wsx = L["wave"]
    ds = L["dentils"]
    if link is None:  # one of each, mid-run, for baking in context
        xs, ws, ds = [xs[len(xs) // 2]], [ws[len(ws) // 2]], [ds[len(ds) // 2]]
    for x in xs:
        put("Key", T(x, ENT_FRONT - 0.02, KEY_Z) @ S(ksx, 1, 1))
    for x in L["keyStops"]:
        put("KeyStop", T(x, ENT_FRONT - 0.02, KEY_Z))
    for x in ds:
        put("Dentil", T(x, ENT_FRONT - 0.08, dz0))
        put("Egg", T(x, egg_y, egg_z))
    for x in ws:
        put("Wave", T(x, ENT_FRONT - 0.02, WAVE_Z) @ S(wsx, 1, 1))
    return placed


# --------------------------------------------------------------------------
# the rails: what continues down the page below the portico
# --------------------------------------------------------------------------
# A slim reeded rail, a turned collar at its head. The page stacks it, one
# module under the next, from the foot of each pillar to the end of the
# page; the collar sits on every joint, which is also what hides the seam
# in the grain. Baked once in walnut and once in marble, on the same UVs.
RAIL_LEN = 1.6  # module length                                         [layout]
RAIL_HX, RAIL_HY = 0.15, 0.1


def build_rail():
    hx, hy = RAIL_HX, RAIL_HY
    sec = [(-hx, hy), (-hx, -hy + 0.02)]
    for i in range(1, 5):
        a = pi / 2 * i / 4
        sec.append((-hx + 0.02 - 0.02 * cos(a), -hy + 0.02 - 0.02 * sin(a)))
    sec += [(-0.075, -hy), (-0.064, -hy + 0.012), (-0.046, -hy + 0.012)]
    for i in range(13):
        a = pi * i / 12
        sec.append((-0.038 * cos(a), -hy - 0.03 * sin(a) + 0.004))
    sec += [(0.046, -hy + 0.012), (0.064, -hy + 0.012), (0.075, -hy)]
    for i in range(0, 4):
        a = pi / 2 * i / 4
        sec.append((hx - 0.02 + 0.02 * sin(a), -hy + 0.02 - 0.02 * cos(a)))
    sec += [(hx, -hy + 0.02), (hx, hy)]
    mb = MB()
    zs = [0.0, RAIL_LEN]
    m = len(sec)
    v = [(x, y, z) for z in zs for (x, y) in sec]
    f = [(i, i + 1, m + i + 1, m + i) for i in range(m - 1)]
    mb.add(v, f)
    # the collar at the head of the module
    pc = Prof(0.0, RAIL_LEN - 0.1).to(0.0, RAIL_LEN - 0.1).by(0.015, 0).by(0, 0.012)
    pc.torus(0.05, 0.028, 8).by(0, 0.008).torus(0.022, 0.012, 6).by(-0.015, 0).to(-0.08, RAIL_LEN)
    cv, cf = sweep(pc.pts, rect(hx + 0.004, hy + 0.004), closed=True)
    mb.add(cv, cf)
    return mb.obj("Rail", angle=40)


def bake_rail(rail, mats):
    """Bake the module in the middle of a stack of three, far above the
    floor, so its light runs on into the modules above and below it."""
    rail.hide_render = False
    uv_pack([rail])
    rail.location = (30, 0, 12)
    stack = []
    for dz in (-RAIL_LEN, RAIL_LEN):
        o = bpy.data.objects.new("RailCtx", rail.data)
        bpy.context.scene.collection.objects.link(o)
        o.location = (30, 0, 12 + dz)
        stack.append(o)
    for name, mat in mats:
        assign(rail, mat)
        lit = bpy.data.images.new(name + "_lit", 512, 1024, float_buffer=True)
        bake_into([rail], [mat], lit, "DIFFUSE", {"DIRECT", "INDIRECT", "COLOR"}, True, LIT_SAMPLES)
        save_encoded(lit, name, LIT_SCALE)
    for o in stack:
        bpy.data.objects.remove(o)
    rail.location = (0, 0, 0)
    rail.hide_render = True


# --------------------------------------------------------------------------
# creepers
# --------------------------------------------------------------------------
# A twisted liana climbs each pillar, crosses the capital and runs along the
# cornice; from it hang laburnum (pier side) and wisteria (column side), and
# white blossom is scattered along it. Everything is pillar-local, so it
# travels with its pillar at any width and never crosses the stretched runs'
# baked texture in a way that would need re-baking.
#
# The stems export as meshes. Leaves and flowers export as four prototype
# meshes plus a list of instances (creepers.json), drawn on the page with a
# painted, oil-on-canvas shader rather than with baked light — the pillars
# are carved and lit; the plant is painted onto them.
#
# Per vertex (stems) and per instance (the rest) the page gets four numbers:
#   sway  how far the wind may move it (0 on the trunk, 1 at a raceme's tip)
#   sun   how much of the sun it sees (ray cast against the architecture)
#   sky   how much of the sky it sees
#   grow  when it appears as the creeper grows in on load (0..1)

PROTOS = ("Proto_Leaf", "Proto_Blossom", "Proto_Bud", "Proto_Floret")


def lin(h):
    """Hex sRGB to linear RGB (srgb() is defined further down, with the
    materials; these palettes are needed earlier)."""
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


LEAF_GREENS = [lin(h) for h in ("#4c6a2b", "#5a7a31", "#3e5926", "#6b8a3a", "#7f9a45", "#56702f")]
LEAF_YOUNG = lin("#93ab52")
BLOSSOM = [lin(h) for h in ("#f4efe1", "#f1ead8", "#f7f3ea")]
BUD = lin("#ebe3cb")
LABURNUM = [lin(h) for h in ("#f0c02e", "#f4cd3f", "#e9b222", "#f2c63a")]
LABURNUM_TIP = lin("#c8b84e")
WISTERIA = [lin(h) for h in ("#e48fbf", "#d97cb0", "#c983c9", "#e39bc6")]
WISTERIA_TIP = lin("#9f3f74")


class MBX:
    """Mesh builder that also carries a UV and an RGBA colour per vertex."""

    def __init__(self):
        self.v, self.f, self.uv, self.c = [], [], [], []

    def add(self, verts, faces, M=None, uv=None, col=(1, 1, 1, 1)):
        o = len(self.v)
        if M is not None:
            verts = [M @ Vector(v) for v in verts]
        self.v.extend(tuple(v) for v in verts)
        self.f.extend(tuple(i + o for i in f) for f in faces)
        n = len(verts)
        if uv is None:
            self.uv.extend([(0.5, 0.5)] * n)
        elif isinstance(uv, tuple):
            self.uv.extend([uv] * n)
        else:
            self.uv.extend(uv)
        if callable(col):
            self.c.extend(col(Vector(v)) for v in verts)
        elif len(col) == n and n != 4 and isinstance(col[0], (tuple, list)):
            self.c.extend(col)
        else:
            self.c.extend([tuple(col)] * n)
        return self

    def obj(self, name):
        return make_obj_ex(name, self.v, self.f, self.uv, self.c)


def make_obj_ex(name, verts, faces, uvs, cols):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    uvl = me.uv_layers.new(name="UVMap")
    vi = np.empty(len(me.loops), dtype=np.int32)
    me.loops.foreach_get("vertex_index", vi)
    uva = np.asarray(uvs, dtype=np.float32)[vi]
    uvl.data.foreach_set("uv", uva.ravel())
    ca = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    ca.data.foreach_set("color", np.asarray(cols, dtype=np.float32).ravel())
    me.color_attributes.active_color = ca
    me.update()
    me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ---- prototypes ---------------------------------------------------------
# Each grows along +Z from its origin and faces -Y. Vertex colour alpha is
# a tint mask: 1 takes the instance's colour, 0 keeps its own (a flower's
# yellow heart, a bud's green sepals).


def proto_leaf():
    nu, nv = 10, 6
    V, UV, F = [], [], []
    for i in range(nu + 1):
        u = i / nu
        w = 0.28 * sin(pi * min(1.0, u * 0.98 + 0.02)) ** 0.7 * (1 - 0.25 * u)
        for j in range(nv + 1):
            v = j / nv
            x = (v - 0.5) * 2 * w
            y = 0.32 * abs(x) + 0.14 * u * u  # folded on the midrib, tip drooping
            V.append((x + 0.03 * sin(pi * u), y, u))
            UV.append((v, u))
    for i in range(nu):
        for j in range(nv):
            a = i * (nv + 1) + j
            F.append((a, a + 1, a + nv + 2, a + nv + 1))
    return MBX().add(V, F, uv=UV, col=(1, 1, 1, 1))


def proto_blossom():
    mb = MBX()
    nr, nw = 6, 4
    for k in range(5):
        V, UV, F = [], [], []
        for i in range(nr + 1):
            r = 0.06 + 0.44 * i / nr
            t = (r - 0.06) / 0.44
            w = 0.21 * sin(pi * min(1.0, 0.08 + t * 0.9)) ** 0.45 * (0.55 + 0.45 * t)
            for j in range(nw + 1):
                v = j / nw
                x = (v - 0.5) * 2 * w
                y = -0.32 * r * r + 0.08 * (2 * v - 1) ** 2 * t  # cupped forward, edges curl
                V.append((x, y, r))
                UV.append((v, t))
        for i in range(nr):
            for j in range(nw):
                a = i * (nw + 1) + j
                F.append((a, a + 1, a + nw + 2, a + nw + 1))
        mb.add(V, F, R("Y", 72 * k + 10), uv=UV, col=(1, 1, 1, 1))
    cv, cf = sphere(0.085, 0.05, 0.085, 10, 7)
    mb.add(cv, cf, T(0, -0.03, 0), col=lin("#c9c25a") + (0.0,))
    for k in range(16):
        a = 2 * pi * k / 16
        r = 0.12 + 0.03 * (k % 2)
        sv, sf = sphere(0.022, 0.022, 0.022, 6, 4)
        mb.add(sv, sf, T(r * cos(a), -0.1, r * sin(a)), col=lin("#e8a92a") + (0.0,))
    return mb


def proto_bud():
    mb = MBX()
    bv, bf = sphere(0.3, 0.3, 0.5, 10, 8)
    green = lin("#6f8a3a") + (0.0,)
    mb.add(bv, bf, T(0, 0, 0.5), col=lambda p: green if p.z < 0.22 else (1, 1, 1, 1))
    for k in range(3):
        lv = proto_leaf()
        mb.add(lv.v, lv.f, R("Z", 120 * k) @ R("X", 20) @ S(0.55, 0.55, 0.4), uv=lv.uv, col=green)
    return mb


def proto_floret():
    """A pea flower — laburnum and wisteria are both legumes, so one shape
    serves both and the instance colour does the rest: a reflexed banner,
    two wings, a keel, and a green calyx."""
    mb = MBX()
    V, UV, F = [], [], []
    nr, na = 5, 12
    for i in range(nr + 1):
        rho = i / nr
        for k in range(na + 1):
            ph = -pi * 0.15 + pi * 1.3 * k / na
            x = 0.42 * rho * cos(ph)
            z = 0.4 + 0.44 * rho * sin(ph)
            V.append((x, 0.28 * rho * rho, z))
            UV.append((k / na, rho))
    for i in range(nr):
        for k in range(na):
            a = i * (na + 1) + k
            F.append((a, a + na + 1, a + na + 2, a + 1))
    mb.add(V, F, uv=UV, col=(1, 1, 1, 1))
    kv, kf = sphere(0.12, 0.15, 0.27, 10, 7)
    mb.add(kv, kf, T(0, -0.13, 0.12) @ R("X", -25), col=(0.92, 0.92, 0.92, 1.0))
    for sx in (-1, 1):
        wv, wf = sphere(0.11, 0.09, 0.25, 8, 6)
        mb.add(wv, wf, T(sx * 0.14, -0.08, 0.16) @ R("Y", sx * 22), col=(1, 1, 1, 1))
    cv, cf = sphere(0.09, 0.09, 0.12, 8, 6)
    mb.add(cv, cf, T(0, 0.04, 0.42), col=lin("#7a9440") + (0.0,))
    return mb


# ---- paths ----------------------------------------------------------------
def catmull(ctrl, step=0.025):
    P = [Vector(c) for c in ctrl]
    out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(i - 1, 0)], P[i], P[i + 1], P[min(i + 2, len(P) - 1)]
        n = max(2, int((p2 - p1).length / step))
        for k in range(n):
            t = k / n
            out.append(
                0.5
                * (
                    2 * p1
                    + (-p0 + p2) * t
                    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                    + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
                )
            )
    out.append(P[-1])
    return out


def superellipse(th, a, b, p=4.0):
    c, s = cos(th), sin(th)
    return (a * math.copysign(abs(c) ** (2 / p), c), b * math.copysign(abs(s) ** (2 / p), s))


def shaft_r(z):
    """The column's radius at z, plus what the band and base add."""
    r = 0.5 if z < 2.53 else 0.5 - 0.07 * ((z - 2.53) / 3.45) ** 1.35
    if 2.9 < z < 3.17:
        r += 0.05
    if z < 0.78:
        r = 0.68
    return r


def beam_ctrl(x0, x1, sgn, phase):
    """A run along the cornice, festooned: it rides over the crown, swings
    down in front of the corona to hang across the frieze, and climbs back
    over the lip — each loop a different depth."""
    pts = []
    n = max(2, int(abs(x1 - x0) / 0.8))
    for i in range(n):
        xa = x0 + (x1 - x0) * i / n
        xb = x0 + (x1 - x0) * (i + 1) / n
        depth = 0.45 + 0.25 * sin(i * 2.1 + phase)
        q = (xb - xa)
        pts.append((xa, -1.07, 8.13))
        pts.append((xa + 0.2 * q, -0.97, 7.84))
        pts.append((xa + 0.5 * q, -0.72, 8.12 - depth))
        pts.append((xa + 0.8 * q, -0.97, 7.84))
    pts.append((x1, -1.07, 8.13))
    end = pts[-1]
    pts.append((end[0] + sgn * 0.08, -1.02, end[2] + 0.1))
    pts.append((end[0] + sgn * 0.1, -0.98, end[2] + 0.2))
    return pts


def pier_paths():
    d = 0.5 - PX  # the vine was drawn for a 1 m pier; pull it in to this one
    ctrl = [(0.78 - d, -0.72 + d, 0.0), (0.7 - d, -0.62 + d, 0.14)]
    for k in range(25):
        t = k / 24
        th = radians(-50) + t * 2 * 2 * pi
        x, y = superellipse(th, PX + 0.075, PY + 0.075)
        ctrl.append((x, y, 0.32 + t * 5.3 + 0.04 * sin(k * 2.3)))
    ctrl += [(0.6 - d, -0.68 + d, 5.95), (0.73 - d, -0.79 + d, 6.3), (0.66 - d, -0.75 + d, 6.62),
             (0.7 - d, -0.67, 6.95), (0.74 - d, -0.66, 7.4), (0.8 - d, -0.82, 7.8), (0.86 - d, -1.06, 8.02)]
    climb = len(catmull(ctrl))
    main = catmull(ctrl + beam_ctrl(1.05, 3.05, 1, 0.4))
    left = catmull([(0.62, -1.07, 8.08), (0.2, -0.95, 7.92), (-0.2, -0.68, 7.64), (-0.6, -0.67, 7.5),
                    (-0.95, -0.72, 7.7), (-1.2, -0.97, 7.97), (-1.3, -1.08, 8.15), (-1.24, -1.0, 8.32)])
    drop = catmull([(1.32, -1.07, 8.06), (1.36, -0.9, 7.86), (1.38, -0.66, 7.6), (1.42, -0.63, 7.2),
                    (1.45, -0.61, 6.86), (1.47, -0.6, 6.68)])
    spray = catmull([(2.4, -1.07, 8.05), (2.45, -0.82, 7.85), (2.5, -0.66, 7.55), (2.48, -0.66, 7.4)])
    return main, climb, [left, drop, spray]


def column_paths():
    ctrl = [(-0.86, -0.74, 0.0), (-0.76, -0.66, 0.2), (-0.7, -0.64, 0.55)]
    for k in range(25):
        t = k / 24
        z = 0.85 + t * 5.05
        th = radians(-130) - t * 2 * 2 * pi
        r = shaft_r(z) + 0.07
        ctrl.append((r * cos(th), r * sin(th), z + 0.04 * sin(k * 1.7)))
    ctrl += [(-0.55, -0.62, 6.08), (-0.82, -0.66, 6.32), (-0.72, -0.71, 6.62), (-0.74, -0.65, 6.95),
             (-0.78, -0.65, 7.4), (-0.85, -0.83, 7.8), (-0.9, -1.06, 8.02)]
    climb = len(catmull(ctrl))
    main = catmull(ctrl + beam_ctrl(-1.1, -3.0, -1, 2.1))
    right = catmull([(-0.8, -1.07, 8.08), (-0.3, -0.92, 7.9), (0.2, -0.67, 7.62), (0.6, -0.67, 7.55),
                     (0.95, -0.76, 7.76), (1.2, -0.99, 8.0), (1.3, -1.08, 8.15), (1.26, -1.0, 8.32)])
    drop = catmull([(-1.5, -1.07, 8.06), (-1.55, -0.9, 7.86), (-1.58, -0.66, 7.6), (-1.6, -0.63, 7.2),
                    (-1.62, -0.61, 6.86), (-1.63, -0.6, 6.68)])
    twig = catmull([(-1.62, -0.61, 6.9), (-1.75, -0.64, 6.8), (-1.86, -0.62, 6.72)])
    spray = catmull([(-2.5, -1.07, 8.05), (-2.55, -0.82, 7.85), (-2.6, -0.66, 7.55), (-2.58, -0.66, 7.42)])
    return main, climb, [right, drop, twig, spray]


# ---- the plant ------------------------------------------------------------
class Plant:
    def __init__(self, name, seed):
        self.name = name
        self.rnd = random.Random(seed)
        self.stems = []  # (points, radii, sway, grow)
        self.inst = {p: [] for p in PROTOS}  # (M, colour, sway, grow)

    def stem(self, pts, r0, r1, g0, g1, sway=0.0, sway_tip=None):
        n = len(pts)
        radii = [r0 + (r1 - r0) * (i / (n - 1)) ** 0.8 for i in range(n)]
        grow = [g0 + (g1 - g0) * i / (n - 1) for i in range(n)]
        st = sway_tip if sway_tip is not None else sway
        sw = [sway + (st - sway) * i / (n - 1) for i in range(n)]
        self.stems.append((pts, radii, sw, grow))

    def strand(self, pts, grows, r=0.018, amp=0.048, turns_per_m=1.8, until=0.65):
        """A second, thinner liana twisting round the first, growing with it."""
        n = int(len(pts) * until)
        out = []
        acc = 0.0
        for i in range(n):
            P = Vector(pts[i])
            Tn = (Vector(pts[min(i + 1, len(pts) - 1)]) - Vector(pts[max(i - 1, 0)])).normalized()
            if i:
                acc += (Vector(pts[i]) - Vector(pts[i - 1])).length
            side = Tn.cross(Vector((0, 0, 1)))
            if side.length < 1e-3:
                side = Vector((1, 0, 0))
            side.normalize()
            up = side.cross(Tn).normalized()
            a = 2 * pi * turns_per_m * acc
            out.append(P + (side * cos(a) + up * sin(a)) * amp)
        self.stem(out, r, r * 0.6, 0.0, 1.0)
        self.stems[-1] = (out, self.stems[-1][1], [0.0] * n, list(grows[:n]))

    def put(self, proto, M, colour, sway, grow):
        self.inst[proto].append((M, colour, sway, grow))

    def frame(self, D, F):
        """Rotation taking local +Z to D and local -Y toward F."""
        Z = D.normalized()
        Fp = (F - Z * F.dot(Z))
        if Fp.length < 1e-4:
            Fp = Vector((0, -1, 0)) - Z * (-Z.y)
        Yl = -Fp.normalized()
        Xl = Yl.cross(Z).normalized()
        Yl = Z.cross(Xl)
        return Matrix((Xl, Yl, Z)).transposed()

    def foliate(self, pts, g0, g1, every=0.13, size=(0.1, 0.16), upward=0.0, bloom_every=0.9, sway=0.25):
        rnd = self.rnd
        acc, nxt, nbloom = 0.0, every * rnd.random(), bloom_every * (0.3 + rnd.random())
        side_sign = 1
        n = len(pts)
        for i in range(1, n - 1):
            acc += (pts[i] - pts[i - 1]).length
            P = pts[i]
            Tn = (pts[i + 1] - pts[i - 1]).normalized()
            g = g0 + (g1 - g0) * i / (n - 1)
            if P.z < 6.6:
                out = Vector((P.x, P.y, 0))
                out = out.normalized() if out.length > 1e-3 else Vector((0, -1, 0))
            else:
                out = Vector((0, -1, 0.35)).normalized()
            if acc >= nxt:
                nxt = acc + every * (0.7 + 0.6 * rnd.random())
                for _ in range(rnd.choice((1, 2, 2, 3))):
                    side_sign = -side_sign
                    side = Tn.cross(out)
                    side = side.normalized() if side.length > 1e-3 else Vector((1, 0, 0))
                    D = side * side_sign * 0.85 + out * 0.5 + Vector((0, 0, -0.35 + upward)) + Tn * 0.2
                    D += Vector((rnd.uniform(-0.25, 0.25), rnd.uniform(-0.2, 0.2), rnd.uniform(-0.25, 0.25)))
                    F = out * 0.6 + Vector((0, -0.6, 0.25))
                    sz = rnd.uniform(*size) * (1.1 - 0.3 * i / n)
                    R3 = self.frame(D, F)
                    M = Matrix.Translation(P + D.normalized() * 0.03) @ R3.to_4x4() @ S(sz * rnd.uniform(0.85, 1.1), sz, sz)
                    young = i > n * 0.85
                    colour = LEAF_YOUNG if young and rnd.random() < 0.6 else rnd.choice(LEAF_GREENS)
                    self.put("Proto_Leaf", M, colour, sway * rnd.uniform(0.7, 1.3), g + 0.02)
            if acc >= nbloom:
                nbloom = acc + bloom_every * (0.6 + 0.8 * rnd.random())
                self.blossom(P + out * 0.05, out, g + 0.03)

    def blossom(self, P, out, g, buds=2):
        rnd = self.rnd
        F = (out * 0.55 + Vector((0, -0.8, 0.2))).normalized()
        D = Vector((0, 0, 1)) - F * F.z
        D.rotate(Matrix.Rotation(rnd.uniform(0, 2 * pi), 3, F))
        for c in range(rnd.choice((1, 2, 2, 3))):
            sz = rnd.uniform(0.11, 0.15)
            jit = Vector((rnd.uniform(-1, 1), rnd.uniform(-0.3, 0.3), rnd.uniform(-1, 1))) * 0.07 * (c > 0)
            Dc = D.copy()
            Dc.rotate(Matrix.Rotation(rnd.uniform(-0.6, 0.6), 3, F))
            M = Matrix.Translation(P + jit) @ self.frame(Dc, F).to_4x4() @ S(sz)
            self.put("Proto_Blossom", M, rnd.choice(BLOSSOM), 0.15, g)
        for _ in range(buds):
            off = Vector((rnd.uniform(-1, 1), rnd.uniform(-0.6, 0.2), rnd.uniform(-0.6, 1))).normalized() * 0.12
            Db = (off + Vector((0, 0, 0.3))).normalized()
            Mb = Matrix.Translation(P + off) @ self.frame(Db, F).to_4x4() @ S(rnd.uniform(0.045, 0.06))
            self.put("Proto_Bud", Mb, BUD, 0.2, g + 0.02)

    def raceme(self, A, L, n, colours, tip, size, g0, leaf_kind="trifoliate"):
        """A hanging spike of pea flowers, open at the top and still in bud
        at the tip, the way laburnum and wisteria flower."""
        rnd = self.rnd
        axis = []
        k = 24
        bend = rnd.uniform(-1, 1)
        for i in range(k + 1):
            t = i / k
            axis.append(A + Vector((0.035 * bend * sin(pi * t * 0.9), -0.05 * t, -L * t)))
        self.stem(axis, 0.009, 0.004, g0, g0 + 0.08, sway=0.05, sway_tip=1.0)
        for i in range(n):
            t = (i + 0.5) / n
            P = A + Vector((0.035 * bend * sin(pi * t * 0.9), -0.05 * t, -L * t))
            ph = i * 2.39996
            Rr = Vector((cos(ph), sin(ph), 0))
            r = (0.05 * (1 - 0.55 * t) + 0.006) * (size / 0.05)
            F = (Rr * 0.8 + Vector((0, -0.55, -0.2))).normalized()
            D = (Vector((0, 0, 1)) - F * F.z * 0.6 + Rr * 0.25).normalized()
            s = size * (1 - 0.5 * t) * rnd.uniform(0.85, 1.1)
            if t < 0.8:
                col = rnd.choice(colours)
                col = tuple(c * (1 - 0.3 * t) + tc * 0.3 * t for c, tc in zip(col, tip))
                M = Matrix.Translation(P + Rr * r) @ self.frame(D, F).to_4x4() @ S(s)
                self.put("Proto_Floret", M, col, 0.15 + 0.85 * t, g0 + 0.05 + 0.08 * t)
            else:
                M = Matrix.Translation(P + Rr * r * 0.6) @ self.frame((D - Vector((0, 0, 0.8))).normalized(), F).to_4x4() @ S(s * 0.55)
                self.put("Proto_Bud", M, tip, 0.15 + 0.85 * t, g0 + 0.05 + 0.08 * t)
        # its leaves, above it
        cnt = 3 if leaf_kind == "trifoliate" else 7
        for j in range(cnt):
            if leaf_kind == "trifoliate":
                ang = radians(-40 + 40 * j)
                D = Vector((sin(ang), -0.5, cos(ang) * 0.3 - 0.7)).normalized()
                base = A + Vector((0, -0.02, 0.05))
            else:
                ang = radians(-60 + 20 * j)
                base = A + Vector((-0.12 + 0.04 * j, -0.03, 0.12 - 0.01 * j))
                D = Vector((sin(ang) * 0.9, -0.35, -0.6)).normalized()
            M = Matrix.Translation(base) @ self.frame(D, Vector((0, -1, 0.2))).to_4x4() @ S(0.14, 0.21, 0.21)
            self.put("Proto_Leaf", M, rnd.choice(LEAF_GREENS), 0.35, g0)

    def tendril(self, P, d, g):
        rnd = self.rnd
        pts = []
        base = Vector(P)
        for i in range(40):
            t = i / 39
            a = 2 * pi * 2.2 * t
            r = 0.035 * (1 - 0.8 * t)
            pts.append(base + d * (0.09 * t) + Vector((cos(a), 0, sin(a))) * r)
        self.stem(pts, 0.003, 0.0015, g, g + 0.03, sway=0.3)


def build_plant(name, paths, raceme_spec, seed):
    main, climb, branches = paths
    pl = Plant(name, seed)
    n = len(main)
    f_climb = climb / n
    g_climb = 0.62
    # grow: the climb takes most of the time, the run along the beam the rest
    pl.stem(main, 0.046, 0.016, 0.0, 1.0)
    pl.stems[-1] = (main, pl.stems[-1][1], [0.0 if i < climb else 0.12 for i in range(n)],
                    [g_climb * i / climb if i < climb else g_climb + (1 - g_climb) * (i - climb) / (n - climb) for i in range(n)])
    grow_main = pl.stems[0][3]
    pl.strand(main, grow_main, until=f_climb * 0.75)
    pl.foliate(main[:climb], 0.0, g_climb, every=0.13, size=(0.17, 0.26), bloom_every=0.7)
    pl.foliate(main[climb:], g_climb, 1.0, every=0.09, size=(0.15, 0.23), upward=0.75, bloom_every=0.42, sway=0.35)
    for b in branches:
        # a branch starts growing where it leaves the main stem
        j = min(range(n), key=lambda i: (main[i] - b[0]).length)
        g0 = grow_main[j]
        pl.stem(b, 0.026, 0.009, g0, min(1.0, g0 + 0.25), sway=0.1, sway_tip=0.3)
        pl.foliate(b, g0, min(1.0, g0 + 0.25), every=0.09, size=(0.13, 0.2), upward=0.35, bloom_every=0.45, sway=0.35)
    for (A, L, cnt, colours, tip, size, kind) in raceme_spec:
        pl.raceme(Vector(A), L, cnt, colours, tip, size, 0.8, kind)
    # tendrils along the beam run
    for i in range(climb, n, 18):
        pl.tendril(main[i] + Vector((0, -0.03, 0.03)), Vector((0, -0.4, 1)).normalized(), grow_main[i])
    return pl


def plant_meshes(pl, protos):
    """The stem mesh (exported) and the realized foliage (for baking the
    shadows it throws on the pillar, and for the preview)."""
    sm = MBX()
    pt_index = []  # per stem point: (stem idx, point idx) for later lighting
    for si, (pts, radii, sw, gr) in enumerate(pl.stems):
        res = 7 if radii[0] > 0.008 else 5
        tv, tf = tube(pts, radii, res, cap=False)
        # tube() returns rings of `res` verts per point; data per point
        acc, uv, col = 0.0, [], []
        for i in range(len(pts)):
            if i:
                acc += (Vector(pts[i]) - Vector(pts[i - 1])).length
            for k in range(res):
                uv.append((k / res, acc / 0.25))
                col.append((sw[i], 1.0, 1.0, gr[i]))
                pt_index.append((si, i))
        sm.add(tv, tf, uv=uv, col=col)
    fol = MBX()
    for proto, items in pl.inst.items():
        pm = protos[proto]
        for (M, colour, sway, grow) in items:
            tinted = []
            for c in pm.c:
                if c[3] > 0.5:
                    tinted.append((c[0] * colour[0], c[1] * colour[1], c[2] * colour[2], 1.0))
                else:
                    tinted.append((c[0], c[1], c[2], 1.0))
            fol.add(pm.v, pm.f, M, uv=pm.uv, col=tinted)
    return sm, pt_index, fol


def light_samples():
    sun = (Euler(SUN_ROT).to_matrix() @ Vector((0, 0, 1))).normalized()
    suns = []
    for (a, b) in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
        d = sun.copy()
        d.rotate(Euler((radians(3 * a), radians(3 * b), 0)))
        suns.append(d.normalized())
    skies = []
    n = 14
    for i in range(n):
        z = 0.15 + 0.85 * (i + 0.5) / n
        r = sqrt(1 - z * z)
        a = i * 2.39996
        skies.append(Vector((r * cos(a), r * sin(a), z)))
    return sun, suns, skies


def visibility(depsgraph, P, dirs, push):
    sc = bpy.context.scene
    free = 0
    for d in dirs:
        o = P + d * push
        hit = sc.ray_cast(depsgraph, o, d, distance=40.0)[0]
        free += 0 if hit else 1
    return free / len(dirs)


# --------------------------------------------------------------------------
# materials
# --------------------------------------------------------------------------
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


class NT:
    def __init__(self, mat):
        mat.use_nodes = True
        self.nt = mat.node_tree
        self.nt.nodes.clear()

    def n(self, kind, **props):
        node = self.nt.nodes.new(kind)
        for k, v in props.items():
            setattr(node, k, v)
        return node

    def sock(self, node, key, out=False):
        coll = node.outputs if out else node.inputs
        if isinstance(key, int):
            return coll[key]
        for s in coll:
            if s.identifier == key:
                return s
        return coll[key]

    def set(self, node, key, val):
        s = self.sock(node, key)
        if isinstance(val, bpy.types.NodeSocket):
            self.nt.links.new(val, s)
        else:
            s.default_value = val

    def o(self, node, key=0):
        return self.sock(node, key, out=True)

    def mix(self, a, b, fac, blend="MIX"):
        m = self.n("ShaderNodeMix", data_type="RGBA", blend_type=blend)
        self.set(m, "Factor_Float", fac)
        self.set(m, "A_Color", a)
        self.set(m, "B_Color", b)
        return self.o(m, "Result_Color")

    def math(self, op, a, b=0.0):
        m = self.n("ShaderNodeMath", operation=op)
        self.set(m, 0, a)
        self.set(m, 1, b)
        return self.o(m)

    def ramp(self, fac, stops):
        r = self.n("ShaderNodeValToRGB")
        els = r.color_ramp.elements
        while len(els) > 1:
            els.remove(els[-1])
        els[0].position, els[0].color = stops[0]
        for pos, col in stops[1:]:
            e = els.new(pos)
            e.color = col
        self.set(r, "Fac", fac)
        return self.o(r, "Color")

    def ao(self, dist, samples=16):
        a = self.n("ShaderNodeAmbientOcclusion", samples=samples)
        self.set(a, "Distance", dist)
        return self.o(a, "AO")


def mat_marble(name):
    m = bpy.data.materials.new(name)
    t = NT(m)
    out = t.n("ShaderNodeOutputMaterial")
    bs = t.n("ShaderNodeBsdfPrincipled")
    tc = t.n("ShaderNodeTexCoord")
    co = t.o(tc, "Object")
    # broad cloudy body
    n1 = t.n("ShaderNodeTexNoise")
    t.set(n1, "Vector", co)
    t.set(n1, "Scale", 0.55)
    t.set(n1, "Detail", 6.0)
    t.set(n1, "Roughness", 0.55)
    body = t.ramp(t.o(n1, "Fac"), [(0.3, srgb("#d9cbb2")), (0.5, srgb("#ebe1cf")), (0.72, srgb("#f3ece0"))])
    # veins: iso-lines of a distorted noise
    n2 = t.n("ShaderNodeTexNoise")
    t.set(n2, "Vector", co)
    t.set(n2, "Scale", 0.9)
    t.set(n2, "Detail", 9.0)
    t.set(n2, "Roughness", 0.62)
    t.set(n2, "Distortion", 2.2)
    vein = t.ramp(t.o(n2, "Fac"), [(0.478, (1, 1, 1, 1)), (0.5, (0.35, 0.35, 0.35, 1)), (0.522, (1, 1, 1, 1))])
    n3 = t.n("ShaderNodeTexNoise")
    t.set(n3, "Vector", co)
    t.set(n3, "Scale", 2.6)
    t.set(n3, "Detail", 8.0)
    t.set(n3, "Distortion", 1.4)
    vein2 = t.ramp(t.o(n3, "Fac"), [(0.49, (1, 1, 1, 1)), (0.5, (0.7, 0.7, 0.7, 1)), (0.51, (1, 1, 1, 1))])
    veins = t.mix(vein, vein2, 1.0, "MULTIPLY")
    col = t.mix(srgb("#b4a286"), body, veins)
    # carving grime: crevices warmer and darker, so detail reads at any size
    ao = t.ao(0.22, 16)
    shade = t.ramp(ao, [(0.0, srgb("#a08f78")), (0.55, srgb("#e2d8c6")), (1.0, (1, 1, 1, 1))])
    col = t.mix(col, shade, 1.0, "MULTIPLY")
    t.set(bs, "Base Color", col)
    rough = t.math("MULTIPLY", ao, -0.28)
    rough = t.math("ADD", rough, 0.62)
    t.set(bs, "Roughness", rough)
    t.nt.links.new(t.o(bs), t.sock(out, "Surface"))
    return m


def mat_walnut(name, axis):
    m = bpy.data.materials.new(name)
    t = NT(m)
    out = t.n("ShaderNodeOutputMaterial")
    bs = t.n("ShaderNodeBsdfPrincipled")
    tc = t.n("ShaderNodeTexCoord")
    co = t.o(tc, "Object")
    # fibres and figure, stretched along the grain
    mp = t.n("ShaderNodeMapping")
    t.set(mp, "Vector", co)
    t.set(mp, "Scale", (7.0, 7.0, 0.18) if axis == "Z" else (0.18, 7.0, 7.0))
    streak = t.n("ShaderNodeTexNoise")
    t.set(streak, "Vector", t.o(mp))
    t.set(streak, "Scale", 3.0)
    t.set(streak, "Detail", 8.0)
    t.set(streak, "Roughness", 0.6)
    fig = t.n("ShaderNodeTexNoise")
    t.set(fig, "Vector", t.o(mp))
    t.set(fig, "Scale", 0.6)
    t.set(fig, "Detail", 2.0)
    # growth rings: fine, gently wandering lines (scale 9 ~ 3.5cm apart)
    wave = t.n("ShaderNodeTexWave", wave_type="RINGS", rings_direction=axis)
    t.set(wave, "Vector", co)
    t.set(wave, "Scale", 9.0)
    t.set(wave, "Distortion", 1.6)
    t.set(wave, "Detail", 2.0)
    t.set(wave, "Detail Scale", 1.5)
    grain = t.mix(t.o(wave, "Fac"), t.o(streak, "Fac"), 0.62)
    wood = t.ramp(
        grain,
        [(0.2, srgb("#45200f")), (0.5, srgb("#592914")), (0.8, srgb("#6e3519")), (1.0, srgb("#7c3e1e"))],
    )
    figc = t.ramp(t.o(fig, "Fac"), [(0.3, srgb("#c4ae9c")), (0.7, (1, 1, 1, 1))])
    wood = t.mix(wood, figc, 1.0, "MULTIPLY")
    # carved wood polished by hands: crevices dark with old wax, raised
    # parts rubbed lighter
    ao = t.ao(0.16, 16)
    shade = t.ramp(ao, [(0.0, srgb("#4a2c1e")), (0.5, srgb("#c9b2a2")), (0.85, (1, 1, 1, 1)), (1.0, srgb("#fff0e0"))])
    col = t.mix(wood, shade, 1.0, "MULTIPLY")
    t.set(bs, "Base Color", col)
    rough = t.math("MULTIPLY", ao, -0.3)
    rough = t.math("ADD", rough, 0.62)
    t.set(bs, "Roughness", rough)
    t.set(bs, "Coat Weight", 0.35)
    t.set(bs, "Coat Roughness", 0.25)
    t.nt.links.new(t.o(bs), t.sock(out, "Surface"))
    return m


def assign(ob, mat):
    ob.data.materials.clear()
    ob.data.materials.append(mat)


# --------------------------------------------------------------------------
# scene, lights, bake
# --------------------------------------------------------------------------
SUN_ROT = (radians(50), radians(-6), radians(-40))
LIT_SCALE = 1.6  # lit textures hold radiance / LIT_SCALE                [layout]
LIT_SAMPLES = int(arg("--lit-samples", "256"))
TEX_DIR = os.path.join(OUT, "portico")


def setup_scene():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    try:
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        sc.cycles.device = "GPU"
    except Exception as e:  # noqa: BLE001
        print("GPU unavailable:", e)
    world = bpy.data.worlds.new("World")
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = srgb("#f4efe8")
    bg.inputs["Strength"].default_value = 0.6
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 3.0
    sun.angle = radians(12)
    sun.color = (1.0, 0.95, 0.88)
    so = bpy.data.objects.new("Sun", sun)
    so.rotation_euler = SUN_ROT
    sc.collection.objects.link(so)
    # an unseen floor, the colour of the page: its bounce is what lifts the
    # soffits and the undersides of the capitals out of black
    fv = [(-40, -40, 0), (40, -40, 0), (40, 40, 0), (-40, 40, 0)]
    floor = make_obj("Floor", fv, [(0, 1, 2, 3)], angle=None)
    fm = bpy.data.materials.new("Floor")
    t = NT(fm)
    o = t.n("ShaderNodeOutputMaterial")
    d = t.n("ShaderNodeBsdfDiffuse")
    t.set(d, "Color", srgb("#efe9e0"))
    t.nt.links.new(t.o(d), t.sock(o, "Surface"))
    assign(floor, fm)
    floor.visible_camera = False
    return floor


def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def uv_pack(objs, margin=0.0025):
    select_only(objs)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=radians(52), island_margin=margin, area_weight=0.0, scale_to_bounds=False)
    bpy.ops.uv.pack_islands(rotate=True, margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake_into(objs, mats, img, kind, flt, clear, samples, hidden=()):
    for m in mats:
        nt = m.node_tree
        tgt = nt.nodes.get("BakeTarget") or nt.nodes.new("ShaderNodeTexImage")
        tgt.name = "BakeTarget"
        tgt.image = img
        nt.nodes.active = tgt
    for o in hidden:
        o.hide_render = True
    bpy.context.scene.cycles.samples = samples
    select_only(objs)
    kw = dict(type=kind, use_clear=clear, margin=16)
    if flt is not None:
        kw["pass_filter"] = flt
    t0 = __import__("time").time()
    bpy.ops.object.bake(**kw)
    print(f"    {kind:9s} {img.name:16s} {len(objs)} objs  {__import__('time').time() - t0:6.1f}s")
    for o in hidden:
        o.hide_render = False


def save_encoded(img, name, scale=1.0, srgb_encode=True, quality=88):
    """Write a float bake out as an 8-bit WebP, dividing by `scale` so that
    radiance above 1 survives, and sRGB-encoding so the darks keep their
    precision. The page multiplies `scale` back in."""
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    rgb = np.clip(px[:, :3] / scale, 0, 1)
    if srgb_encode:
        rgb = np.where(rgb <= 0.0031308, rgb * 12.92, 1.055 * np.power(rgb, 1 / 2.4) - 0.055)
    hi = np.percentile(px[:, :3].max(axis=1), 99.7)
    out = bpy.data.images.new(name, w, h, alpha=False)
    o = np.ones((w * h, 4), dtype=np.float32)
    o[:, :3] = rgb
    out.pixels.foreach_set(o.ravel())
    path = os.path.join(TEX_DIR, name + ".webp")
    out.filepath_raw = path
    out.file_format = "WEBP"
    out.save(filepath=path, quality=quality)
    print(f"    wrote {name}.webp  (p99.7 radiance {hi:.2f}, scale {scale})")


def bake_atlas(name, phases, mat, size):
    """Bake one texture atlas: the lit colour (albedo x all light, shadows
    and bounce included — what Cycles would render, minus the view-dependent
    gloss) and the roughness. `phases` is a list of (objects, hidden): a
    run is baked with every instanced module and the creepers hidden, so it
    never carries the ghost shadow of something the page will put elsewhere
    at another width; an end block keeps the creeper's shadow, because the
    creeper travels with it."""
    objs = [o for ph, _ in phases for o in ph]
    for o in objs:
        assign(o, mat)
    uv_pack(objs)
    lit = bpy.data.images.new(name + "_lit", size, size, float_buffer=True)
    rough = bpy.data.images.new(name + "_rough", size // 2, size // 2)
    rough.colorspace_settings.name = "Non-Color"
    for i, (ph, hidden) in enumerate(phases):
        bake_into(ph, [mat], lit, "DIFFUSE", {"DIRECT", "INDIRECT", "COLOR"}, i == 0, LIT_SAMPLES, hidden)
    bake_into(objs, [mat], rough, "ROUGHNESS", None, True, 1)
    save_encoded(lit, name, LIT_SCALE)
    rf = np.empty(rough.size[0] * rough.size[1] * 4, dtype=np.float32)
    rough.pixels.foreach_get(rf)
    rough.pixels.foreach_set(rf)  # (already linear 0..1)
    save_encoded(rough, name + "_rough", 1.0, srgb_encode=False, quality=80)


def shadow_plane(name, cx, cy, hw, hd):
    """A floor patch that will hold the pillar's own baked contact shadow."""
    v = [(cx - hw, cy - hd, 0.002), (cx + hw, cy - hd, 0.002), (cx + hw, cy + hd, 0.002), (cx - hw, cy + hd, 0.002)]
    ob = make_obj(name, v, [(0, 1, 2, 3)], angle=None)
    me = ob.data
    uvl = me.uv_layers.new(name="UVMap")
    for loop in me.loops:
        x, y, _ = me.vertices[loop.vertex_index].co
        uvl.data[loop.index].uv = ((x - (cx - hw)) / (2 * hw), (y - (cy - hd)) / (2 * hd))
    return ob


def bake_shadow(plane, caster, size=512, also=()):
    m = bpy.data.materials.new(plane.name + "_bake")
    t = NT(m)
    out = t.n("ShaderNodeOutputMaterial")
    bs = t.n("ShaderNodeBsdfDiffuse")
    t.set(bs, "Color", (1, 1, 1, 1))
    t.nt.links.new(t.o(bs), t.sock(out, "Surface"))
    assign(plane, m)
    img = bpy.data.images.new(plane.name, size, size, float_buffer=True)
    keep = (plane, caster, *also)
    others = [o for o in bpy.context.scene.objects if o.type == "MESH" and o not in keep]
    bake_into([plane], [m], img, "DIFFUSE", {"DIRECT", "INDIRECT"}, True, 512, others)
    px = np.empty(size * size * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(size, size, 4)
    lum = px[..., :3].mean(axis=2)
    ref = np.percentile(lum, 97)
    a = np.clip(1.0 - lum / max(ref, 1e-6), 0, 1)
    # soft edges, so the patch never shows its square
    yy, xx = np.mgrid[0:size, 0:size] / (size - 1)
    edge = np.clip(np.minimum.reduce([xx, 1 - xx, yy, 1 - yy]) / 0.2, 0, 1)
    a = a * (edge * edge * (3 - 2 * edge))
    # stored as a single grey channel: the page uses it as an alpha map
    g = np.repeat(np.clip(a, 0, 1)[..., None], 3, axis=2)
    o = np.ones((size, size, 4), dtype=np.float32)
    o[..., :3] = g
    final = bpy.data.images.new(plane.name + "_a", size, size, alpha=False)
    final.pixels.foreach_set(o.ravel())
    path = os.path.join(TEX_DIR, "shadow_" + plane.name.split("_")[0].lower() + ".webp")
    final.filepath_raw = path
    final.file_format = "WEBP"
    final.save(filepath=path, quality=85)
    print("    wrote", os.path.basename(path))
    # for the preview render: a dark, alpha-blended patch
    em = bpy.data.materials.new(plane.name)
    t = NT(em)
    out = t.n("ShaderNodeOutputMaterial")
    tx = t.n("ShaderNodeTexImage")
    tx.image = final
    tr = t.n("ShaderNodeBsdfTransparent")
    df = t.n("ShaderNodeBsdfDiffuse")
    t.set(df, "Color", srgb("#2a2018"))
    mx = t.n("ShaderNodeMixShader")
    t.set(mx, 0, t.o(tx, "Color"))
    t.set(mx, 1, t.o(tr))
    t.set(mx, 2, t.o(df))
    t.nt.links.new(t.o(mx), t.sock(out, "Surface"))
    assign(plane, em)


# --------------------------------------------------------------------------
# preview
# --------------------------------------------------------------------------
def make_cam(fov_deg):
    cam = bpy.data.cameras.new("Cam")
    cam.sensor_fit = "VERTICAL"
    cam.sensor_height = 24.0
    cam.lens = 12.0 / math.tan(radians(fov_deg) / 2)
    co = bpy.data.objects.new("Cam", cam)
    bpy.context.scene.collection.objects.link(co)
    bpy.context.scene.camera = co
    return co


def look_at(co, loc, target):
    co.location = loc
    d = Vector(target) - Vector(loc)
    co.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def shoot(path, w, h, samples):
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.film_transparent = True
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    sc.render.filepath = path
    sc.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)
    flatten(path, w, h)


def flatten(path, w, h):
    """Composite a transparent render over the page colour."""
    img = bpy.data.images.load(path)
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(h, w, 4)
    bgd = np.array([0xFB, 0xFA, 0xF8], dtype=np.float32) / 255
    px[..., :3] = px[..., :3] * px[..., 3:4] + bgd * (1 - px[..., 3:4])
    px[..., 3] = 1
    img.pixels.foreach_set(px.ravel())
    img.filepath_raw = path
    img.save()


def render_preview(mods, extra, path, w=1600, h=900):
    fov = 22
    total_h = COL_TOP + 1.485
    dist = (total_h * 1.1) / 2 / math.tan(radians(fov) / 2)
    half_w = math.tan(radians(fov) / 2) * dist * (w / h)
    X = half_w - END_OUT - 0.75
    col = bpy.data.collections.new("Assembled")
    bpy.context.scene.collection.children.link(col)
    for o in mods.values():
        o.hide_render = True
    place_modules(mods, X, extra, link=col)
    if not BAKE:
        for n in ("Pilaster_Shadow_i", "Column_Shadow_i"):
            bpy.data.objects[n].hide_render = True
    co = make_cam(fov)
    co.location = (0, -dist, total_h / 2 + 0.2)
    co.rotation_euler = (radians(90), 0, 0)
    shoot(path, w, h, 96)
    if "--closeups" in argv:
        base = path[:-4]
        L = layout(X)
        px, cx = L["pilaster"], L["column"]
        shots = [
            ("cap_pier", (px + 1.6, -4.2, 6.1), (px, 0, 6.2), 30),
            ("cap_col", (cx - 1.6, -4.2, 6.1), (cx, 0, 6.2), 30),
            ("shaft_pier", (px + 1.0, -3.4, 2.8), (px, 0, 2.8), 36),
            ("base_col", (cx - 1.2, -3.6, 1.0), (cx, 0, 0.6), 34),
            ("seam", (L["console"] + 0.9, -3.6, 6.3), (L["console"] + 0.2, 0, 7.2), 34),
            ("laburnum", (px + 1.9, -3.4, 6.8), (px + 1.3, -0.6, 7.0), 34),
            ("wisteria", (cx - 1.9, -3.4, 6.8), (cx - 1.3, -0.6, 7.0), 34),
        ]
        for name, loc, tgt, f in shots:
            c = make_cam(f)
            look_at(c, loc, tgt)
            shoot(f"{base}_{name}.png", 900, 900, 64)


# --------------------------------------------------------------------------
def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    os.makedirs(TEX_DIR, exist_ok=True)
    setup_scene()
    col = build_column()
    pil = build_pilaster()
    ent, extra = build_entablature()
    mods = {"Column": col, "Pilaster": pil, **ent}
    total = 0
    for o in mods.values():
        n = sum(len(p.vertices) - 2 for p in o.data.polygons)
        total += n
        print(f"{o.name:18s} {n:>8d} tris")
    print(f"{'total':18s} {total:>8d} tris")
    mods["Pilaster_Shadow"] = shadow_plane("Pilaster_Shadow", 0.45, 0.6, 1.9, 1.9)
    mods["Column_Shadow"] = shadow_plane("Column_Shadow", 0.45, 0.6, 1.9, 1.9)

    # ---- the creepers
    protos = {"Proto_Leaf": proto_leaf(), "Proto_Blossom": proto_blossom(),
              "Proto_Bud": proto_bud(), "Proto_Floret": proto_floret()}
    plants = {
        "Pier": build_plant("Pier", pier_paths(), [
            ((1.47, -0.6, 6.64), 0.95, 80, LABURNUM, LABURNUM_TIP, 0.09, "trifoliate"),
            ((1.72, -0.62, 6.74), 0.62, 54, LABURNUM, LABURNUM_TIP, 0.08, "trifoliate"),
        ], 21),
        "Column": build_plant("Column", column_paths(), [
            ((-1.63, -0.6, 6.64), 0.9, 100, WISTERIA, WISTERIA_TIP, 0.07, "pinnate"),
            ((-1.9, -0.62, 6.7), 0.62, 72, WISTERIA, WISTERIA_TIP, 0.064, "pinnate"),
            ((-1.38, -0.61, 6.72), 0.45, 52, WISTERIA, WISTERIA_TIP, 0.06, "pinnate"),
        ], 33),
    }
    proto_objs = {k: pm.obj(k) for k, pm in protos.items()}
    rail = build_rail()
    rail.hide_render = True
    stem_index = {}
    for k, pl in plants.items():
        sm, idx, fol = plant_meshes(pl, protos)
        mods["Vine_" + k] = sm.obj("Vine_" + k)
        mods["Foliage_" + k] = fol.obj("Foliage_" + k)
        stem_index[k] = idx
        print(f"creeper {k}: {sum(len(v) for v in pl.inst.values())} instances, "
              f"{len(fol.f)} foliage faces, {len(sm.f)} stem faces")
    foliage = [mods[n] for n in ("Vine_Pier", "Foliage_Pier", "Vine_Column", "Foliage_Column")]
    m_vine = bpy.data.materials.new("VinePreview")
    t = NT(m_vine)
    o_ = t.n("ShaderNodeOutputMaterial")
    bs_ = t.n("ShaderNodeBsdfPrincipled")
    t.set(bs_, "Base Color", srgb("#5b4129"))
    t.set(bs_, "Roughness", 0.8)
    t.nt.links.new(t.o(bs_), t.sock(o_, "Surface"))
    m_fol = bpy.data.materials.new("FoliagePreview")
    t = NT(m_fol)
    o_ = t.n("ShaderNodeOutputMaterial")
    bs_ = t.n("ShaderNodeBsdfPrincipled")
    at_ = t.n("ShaderNodeAttribute")
    at_.attribute_name = "Col"
    t.set(bs_, "Base Color", t.o(at_, "Color"))
    t.set(bs_, "Roughness", 0.6)
    t.nt.links.new(t.o(bs_), t.sock(o_, "Surface"))
    for k in plants:
        assign(mods["Vine_" + k], m_vine)
        assign(mods["Foliage_" + k], m_fol)
    for o in proto_objs.values():
        o.hide_render = True

    m_col = mat_marble("MarbleColumn")
    m_ent = mat_marble("MarbleEnt")
    w_pil = mat_walnut("WalnutPier", "Z")
    w_ent = mat_walnut("WalnutEnt", "X")
    stone_runs = [ent[k] for k in ("Ent_Console", "Ent_MarbleRun")]
    stone_mods = [ent[k] for k in ("Key", "KeyStop", "Dentil", "Egg")]
    wood_mods = [ent["Wave"]]
    assign(col, m_col)
    assign(pil, w_pil)
    for o in stone_runs + stone_mods + [ent["Ent_MarbleEnd"]]:
        assign(o, m_ent)
    for o in [ent["Ent_WalnutEnd"], ent["Ent_WalnutRun"]] + wood_mods:
        assign(o, w_ent)

    if BAKE:
        # bake in context: everything where the page would put it, with the
        # runs at their authored length
        X0 = END_IN + (WALNUT_RUN + CONSOLE_W / 2) / SEAM_AT / 2
        place_modules(mods, X0, extra)
        bpy.context.view_layer.update()
        print("lighting the creepers")
        write_creepers(plants, mods, stem_index, X0)
        print("baking shadows")
        bake_shadow(mods["Pilaster_Shadow"], pil, also=(mods["Vine_Pier"], mods["Foliage_Pier"]))
        bake_shadow(mods["Column_Shadow"], col, also=(mods["Vine_Column"], mods["Foliage_Column"]))
        instanced = stone_mods + wood_mods
        print("baking atlases")
        bake_atlas("pier", [([pil], ())], w_pil, TEX)
        bake_atlas("column", [([col], ())], m_col, TEX)
        bake_atlas("stone", [(stone_runs, instanced + foliage), ([ent["Ent_MarbleEnd"]], instanced),
                             (stone_mods, foliage)], m_ent, TEX)
        bake_atlas("wood", [([ent["Ent_WalnutRun"]], instanced + foliage), ([ent["Ent_WalnutEnd"]], instanced),
                            (wood_mods, foliage)], w_ent, TEX // 2)
        for o in mods.values():
            o.matrix_world = Matrix.Identity(4)
        print("baking the rails")
        bake_rail(rail, [("rail_wood", mat_walnut("WalnutRail", "Z")), ("rail_stone", mat_marble("MarbleRail"))])
        for o in mods.values():
            o.matrix_world = Matrix.Identity(4)

    if BLEND:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(BLEND))

    if BAKE:
        export(list(o for k, o in mods.items() if not k.startswith(("Vine_", "Foliage_"))),
               os.path.join(TEX_DIR, "portico.raw.glb"), colours=False)
        export([mods["Vine_Pier"], mods["Vine_Column"], rail, *proto_objs.values()],
               os.path.join(TEX_DIR, "creepers.raw.glb"), colours=True)

    if PREVIEW:
        render_preview(mods, extra, os.path.abspath(PREVIEW))


def export(objs, path, colours):
    select_only(objs)
    kw = dict(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="NONE",
    )
    if colours:
        kw["export_vertex_color"] = "ACTIVE"
    else:
        kw["export_vertex_color"] = "NONE"
    bpy.ops.export_scene.gltf(**kw)


# Blender (Z up) to glTF/three (Y up): the exporter applies this to every
# mesh, so instance matrices written by hand must be conjugated by it too.
TO_THREE = Matrix.Rotation(radians(-90), 4, "X")


def write_creepers(plants, mods, stem_index, X0):
    """Light every leaf and flower by casting rays at the architecture, write
    the instances to creepers.json, and the stems' light into their vertex
    colours (green = sun, blue = sky)."""
    import json

    sun, suns, skies = light_samples()
    dg = bpy.context.evaluated_depsgraph_get()
    out = {"stride": 23, "sun": list(round(c, 5) for c in (TO_THREE @ sun.to_4d()).xyz), "groups": {}}
    for k, pl in plants.items():
        px = -X0 if k == "Pier" else X0
        off = Vector((px, 0, 0))
        group = {}
        for proto, items in pl.inst.items():
            flat = []
            for (M, colour, sway, grow) in items:
                P = M.translation + off
                face = -(M.to_3x3() @ Vector((0, 1, 0))).normalized()
                Pp = P + face * 0.015
                sv = visibility(dg, Pp, suns, 0.05)
                kv = visibility(dg, Pp, skies, 0.05)
                Mt = TO_THREE @ M @ TO_THREE.inverted()
                flat += [round(Mt[r][c], 5) for c in range(4) for r in range(4)]
                flat += [round(x, 4) for x in colour] + [round(sway, 3), round(sv, 3), round(kv, 3), round(grow, 4)]
            group[proto] = flat
        out["groups"][k.lower()] = group
        # stems: one light value per path point, shared by its ring
        vine = mods["Vine_" + k]
        me = vine.data
        ca = me.color_attributes["Col"]
        cols = np.empty(len(me.vertices) * 4, dtype=np.float32)
        ca.data.foreach_get("color", cols)
        cols = cols.reshape(-1, 4)
        cache = {}
        for vi, key in enumerate(stem_index[k]):
            if key not in cache:
                si, i = key
                P = Vector(pl.stems[si][0][i]) + off
                cache[key] = (visibility(dg, P, suns, 0.06), visibility(dg, P, skies, 0.06))
            cols[vi, 1], cols[vi, 2] = cache[key]
        ca.data.foreach_set("color", cols.ravel())
    with open(os.path.join(TEX_DIR, "creepers.json"), "w") as fh:
        json.dump(out, fh, separators=(",", ":"))
    n = sum(len(v) // 23 for g in out["groups"].values() for v in g.values())
    print(f"    wrote creepers.json ({n} instances)")


if "--lib" not in argv:
    main()
