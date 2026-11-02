// A particle of light flying to the right, with a short fading trail behind it.
// `scale` shrinks it (used when light is absorbed), `opacity` fades it.
export const Photon: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly color: string;
  readonly scale?: number;
  readonly opacity?: number;
}> = ({ x, y, color, scale = 1, opacity = 1 }) => (
  <g opacity={opacity}>
    {[4, 3, 2, 1].map((k) => (
      <circle
        key={k}
        cx={x - k * 16 * scale}
        cy={y}
        r={(17 - k * 3) * scale}
        fill={color}
        opacity={0.5 - k * 0.1}
      />
    ))}
    <circle cx={x} cy={y} r={17 * scale} fill={color} />
  </g>
);
