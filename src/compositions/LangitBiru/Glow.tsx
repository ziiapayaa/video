import { COLORS } from "./theme";

// A soft radial glow: a circle that fades out to transparent. Give every use its
// own `id`. Gradient ids are shared by every SVG in the page, which includes the
// outgoing scene while two scenes crossfade.
export const Glow: React.FC<{
  readonly id: string;
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly color?: string;
}> = ({ id, cx, cy, r, color = COLORS.sunSoft }) => (
  <>
    <defs>
      <radialGradient id={id}>
        <stop offset="0%" stopColor={color} stopOpacity={0.65} />
        <stop offset="45%" stopColor={color} stopOpacity={0.22} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
  </>
);
