/* eslint-disable @typescript-eslint/no-unused-expressions, prefer-const -- Shipped v2 comma-expression statements are preserved to prevent legacy visual changes. */
// Finish recovered from the shipped v2 bundle; identity in content/storybook-generated/history/vector-revision-start.
import type {EyeFinish,Region,RegionPaint,Template} from '../../shared-types/src/index';
import type {MediumImages} from './storybook-texture';
import {fixedSeed as M,seededRandom as N} from "./texture";
function fe(e:string, t:number) {
  let n = parseInt(e.slice(1), 16);
  return `rgb(${[n >>> 16, (n >>> 8) & 255, n & 255].map((e) => Math.round(e * t)).join(`,`)})`;
}
function q(e:string, t:number[], n:number) {
  let r = parseInt(e.slice(1), 16);
  return `rgb(${[r >>> 16, (r >>> 8) & 255, r & 255].map((e, r) => Math.round(e * (1 - n) + t[r] * n)).join(`,`)})`;
}
function pe(e:string) {
  let t = parseInt(e.slice(1), 16),
    n = t >>> 16,
    r = (t >>> 8) & 255,
    i = t & 255;
  return n > r * 1.2 && r > i * 1.25
    ? q(e, [255, 195, 72], 0.7)
    : q(e, [255, 255, 255], 0.32);
}
function me(e?:EyeFinish) {
  let t = -0.85 - (e?.geometry?.rotation ?? 0);
  return { x: 0.43 + 0.23 * Math.cos(t), y: 0.43 + 0.21 * Math.sin(t) };
}
function he(e:CanvasRenderingContext2D, t:Region, n:Path2D, r?:string, i?:MediumImages, a?:EyeFinish) {
  let o = a?.geometry ?? {
      cx: t.bounds.x + t.bounds.width / 2,
      cy: t.bounds.y + t.bounds.height / 2,
      width: t.bounds.width,
      height: t.bounds.height,
      rotation: 0,
    },
    { width: s, height: c } = o,
    l = o.cx - s / 2,
    u = o.cy - c / 2,
    d = me(a),
    f = (t:number, n:number, r:number, i:number) => {
      (e.beginPath(),
        e.ellipse(l + s * t, u + c * n, s * r, c * i, 0, 0, Math.PI * 2));
    };
  if (
    (e.save(),
    e.clip(n),
    e.translate(o.cx, o.cy),
    e.rotate(o.rotation),
    e.translate(-o.cx, -o.cy),
    r)
  ) {
    let t = e.createLinearGradient(l, u, l + s, u + c);
    (t.addColorStop(0, `#cbbdc2`),
      t.addColorStop(0.4, `#fff9ed`),
      t.addColorStop(0.85, `#fffcf5`),
      t.addColorStop(1, q(r, [255, 249, 238], 0.95)),
      (e.fillStyle = t),
      e.fillRect(l, u, s, c),
      e.save(),
      f(0.4, 0.42, 0.4, 0.44),
      e.clip());
    let n = e.createLinearGradient(l, u, l + s * 0.15, u + c);
    (n.addColorStop(0, q(r, [13, 9, 15], 0.78)),
      n.addColorStop(0.38, q(r, [22, 12, 16], 0.26)),
      n.addColorStop(0.64, r),
      n.addColorStop(0.78, pe(r)),
      n.addColorStop(1, q(r, [65, 34, 24], 0.25)),
      (e.fillStyle = n),
      e.fillRect(l, u, s, c),
      i?.iris &&
        ((e.globalCompositeOperation = `multiply`),
        (e.globalAlpha = 0.55),
        e.drawImage(i.iris, l, u - c * 0.02, s * 0.8, c * 0.88),
        (e.globalCompositeOperation = `source-over`),
        (e.globalAlpha = 1)));
    let a = e.createRadialGradient(
      l + s * 0.43,
      u + c * 0.39,
      0,
      l + s * 0.43,
      u + c * 0.43,
      c * 0.29,
    );
    (a.addColorStop(0, q(r, [4, 3, 8], 0.98)),
      a.addColorStop(0.7, q(r, [6, 4, 9], 0.95)),
      a.addColorStop(1, q(r, [10, 6, 12], 0.86)),
      (e.fillStyle = a),
      f(0.4, 0.42, 0.19, 0.225),
      e.fill(),
      e.restore());
    let o = e.createLinearGradient(l, u, l, u + c * 0.52);
    (o.addColorStop(0, `rgba(27,13,20,.48)`),
      o.addColorStop(0.7, `rgba(27,13,20,.10)`),
      o.addColorStop(1, `rgba(27,13,20,0)`),
      (e.fillStyle = o),
      e.fillRect(l, u, s, c * 0.52));
  } else
    ((e.strokeStyle = `#000000`),
      (e.lineWidth = Math.max(2.5, s * 0.028)),
      f(0.4, 0.42, 0.19, 0.225),
      e.stroke());
  if (((e.fillStyle = `#FFFFFF`), r)) {
    let t = e.createRadialGradient(
      l + s * d.x,
      u + c * d.y,
      0,
      l + s * d.x,
      u + c * d.y,
      s * 0.14,
    );
    (t.addColorStop(0, `rgba(255,255,255,.50)`),
      t.addColorStop(1, `rgba(255,255,255,0)`),
      (e.fillStyle = t),
      e.fillRect(
        l + s * (d.x - 0.18),
        u + c * (d.y - 0.18),
        s * 0.36,
        c * 0.36,
      ),
      (e.fillStyle = `#fffefb`));
  }
  (f(d.x, d.y, 0.09, 0.073),
    e.fill(),
    r || e.stroke(),
    f(d.x + 0.055, d.y + 0.075, 0.035, 0.028),
    e.fill(),
    r || e.stroke(),
    e.restore());
}
function ge(e:CanvasRenderingContext2D, t:Region, n:Path2D, r:RegionPaint, i:Template, a?:MediumImages) {
  let o = i.paintingProfile?.eyes.find((e) => e.regionId === t.id),
    s = i.paintingProfile?.groups.find((e) => e.regionIds.includes(t.id)),
    c = s?.bounds ?? t.bounds;
  if (
    (e.save(),
    e.clip(n),
    (e.fillStyle = r.color),
    e.fillRect(
      t.bounds.x - 2,
      t.bounds.y - 2,
      t.bounds.width + 4,
      t.bounds.height + 4,
    ),
    o)
  ) {
    (he(e, t, n, r.color, a, o), e.restore());
    return;
  }
  if (r.paintType !== `smooth` && a) {
    if (r.paintType === `crayon`) {
      let n = N(M(`${i.id}:${s?.id ?? t.id}:wax-pressure`));
      (e.save(),
        e.translate(c.x + c.width / 2, c.y + c.height / 2),
        e.rotate(((s?.direction ?? t.direction) * Math.PI) / 180));
      let a = Math.hypot(c.width, c.height);
      ((e.lineCap = `round`),
        (e.strokeStyle = fe(r.color, 0.76)),
        (e.globalAlpha = 0.075));
      for (let t = 0; t < 34; t++) {
        let t = (n() - 0.5) * a,
          r = (n() - 0.5) * a,
          i = a * (0.08 + n() * 0.16);
        ((e.lineWidth = 10 + n() * 25),
          e.beginPath(),
          e.moveTo(t, r),
          e.bezierCurveTo(
            t + i * 0.25,
            r - 3,
            t + i * 0.7,
            r + 4,
            t + i,
            r + 1,
          ),
          e.stroke());
      }
      e.restore();
    } else {
      let n = N(M(`${i.id}:${s?.id ?? t.id}:pencil-pressure`));
      (e.save(),
        e.translate(c.x + c.width / 2, c.y + c.height / 2),
        e.rotate(((s?.direction ?? t.direction) * Math.PI) / 180));
      let a = Math.hypot(c.width, c.height);
      e.lineCap = `round`;
      for (let t = 0; t < 90; t++) {
        let t = (n() - 0.5) * a,
          i = (n() - 0.5) * a,
          o = 25 + n() * 85;
        ((e.strokeStyle = fe(r.color, 0.64 + n() * 0.2)),
          (e.globalAlpha = 0.07 + n() * 0.11),
          (e.lineWidth = 1.3 + n() * 2.8),
          e.beginPath(),
          e.moveTo(t, i),
          e.bezierCurveTo(
            t + o * 0.25,
            i - 2,
            t + o * 0.7,
            i + 3,
            t + o,
            i + 1,
          ),
          e.stroke());
      }
      e.restore();
    }
    let n = r.paintType === `crayon` ? a.wax : a.pencil,
      o = e.createPattern(n, `repeat`);
    if (o) {
      let n = r.paintType === `crayon` ? 2.1 : 1.9,
        i = (((s?.direction ?? t.direction) - 35) * Math.PI) / 180;
      (o.setTransform({
        a: n * Math.cos(i),
        b: n * Math.sin(i),
        c: -n * Math.sin(i),
        d: n * Math.cos(i),
        e: 0,
        f: 0,
      }),
        (e.globalAlpha = 1),
        (e.fillStyle = o),
        e.fillRect(
          t.bounds.x - 2,
          t.bounds.y - 2,
          t.bounds.width + 4,
          t.bounds.height + 4,
        ),
        (e.globalAlpha = 1));
    }
    let l = e.createPattern(a.paper, `repeat`);
    l &&
      (l.setTransform({ a: 1.5, b: 0, c: 0, d: 1.5, e: 0, f: 0 }),
      (e.fillStyle = l),
      e.fillRect(
        t.bounds.x - 2,
        t.bounds.y - 2,
        t.bounds.width + 4,
        t.bounds.height + 4,
      ));
  }
  let l = r.paintType === `smooth` ? 1 : 0.65,
    u = e.createLinearGradient(c.x, c.y, c.x + c.width * 0.7, c.y + c.height);
  if (
    (u.addColorStop(0, `rgba(26,22,42,0)`),
    u.addColorStop(0.52, `rgba(26,22,42,0)`),
    u.addColorStop(
      1,
      `rgba(26,22,42,${l * (t.material === `skin` ? 0.1 : 0.17)})`,
    ),
    (e.fillStyle = u),
    e.fillRect(c.x, c.y, c.width, c.height),
    s?.shading)
  )
    for (let t of s.shading.curves)
      for (let n of [1, 0.65, 0.3])
        ((e.strokeStyle =
          s.shading.kind === `hair`
            ? `rgba(255,239,202,${0.055 * l})`
            : `rgba(40,22,59,${0.027 * l})`),
          (e.lineWidth =
            c.width * (s.shading.kind === `hair` ? 0.035 : 0.055) * n),
          (e.lineCap = `round`),
          e.beginPath(),
          e.moveTo(c.x + t[0] * c.width, c.y + t[1] * c.height),
          e.bezierCurveTo(
            c.x + t[2] * c.width,
            c.y + t[3] * c.height,
            c.x + t[4] * c.width,
            c.y + t[5] * c.height,
            c.x + t[6] * c.width,
            c.y + t[7] * c.height,
          ),
          e.stroke());
  if (t.material === `hair`) {
    let t = e.createRadialGradient(
      c.x + c.width * 0.4,
      c.y + c.height * 0.28,
      0,
      c.x + c.width * 0.4,
      c.y + c.height * 0.28,
      c.width * 0.67,
    );
    (t.addColorStop(0, `rgba(255,238,188,${0.22 * l})`),
      t.addColorStop(0.47, `rgba(255,238,188,${0.08 * l})`),
      t.addColorStop(1, `rgba(255,238,188,0)`),
      (e.fillStyle = t),
      e.fillRect(c.x, c.y, c.width, c.height),
      (e.strokeStyle = `rgba(73,35,22,${0.035 * l})`),
      (e.lineWidth = 2.2));
    for (let t = 0; t < 12; t++) {
      let n = c.x + (c.width * (t + 0.5)) / 12;
      (e.beginPath(),
        e.moveTo(n, c.y),
        e.bezierCurveTo(
          n - c.width * 0.06,
          c.y + c.height * 0.3,
          n + c.width * 0.09,
          c.y + c.height * 0.62,
          n - c.width * 0.04,
          c.y + c.height,
        ),
        e.stroke());
    }
  } else if (t.material === `fabric`) {
    let t = e.createLinearGradient(
      c.x,
      c.y,
      c.x + c.width,
      c.y + c.height * 0.08,
    );
    (t.addColorStop(0, `rgba(48,22,66,.055)`),
      t.addColorStop(0.2, `rgba(255,255,255,.025)`),
      t.addColorStop(0.56, `rgba(48,22,66,.07)`),
      t.addColorStop(0.82, `rgba(255,255,255,.03)`),
      t.addColorStop(1, `rgba(48,22,66,.045)`),
      (e.globalAlpha = l),
      (e.fillStyle = t),
      e.fillRect(c.x, c.y, c.width, c.height));
  } else if ([`metal`, `glass`, `plastic`].includes(t.material)) {
    let t = e.createLinearGradient(
      c.x,
      c.y,
      c.x + c.width,
      c.y + c.height * 0.2,
    );
    (t.addColorStop(0, `rgba(255,255,255,0)`),
      t.addColorStop(0.25, `rgba(255,255,255,${0.17 * l})`),
      t.addColorStop(0.44, `rgba(255,255,255,0)`),
      t.addColorStop(1, `rgba(255,255,255,0)`),
      (e.fillStyle = t),
      e.fillRect(c.x, c.y, c.width, c.height));
  }
  e.restore();
}
export {he as drawStorybookEye,ge as drawStorybookFinish};
