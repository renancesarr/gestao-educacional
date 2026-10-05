import type { Ref } from 'react';
import type { StampShape, StampTextLayout } from '../lib/stamp-layout.ts';

export function StampPreview({ layout, shape, color, font, svgRef }: { layout: StampTextLayout; shape: StampShape; color: string; font: string; svgRef?: Ref<SVGSVGElement> }) {
  return <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Prévia do carimbo" viewBox="0 0 400 400" width="400" height="400" style={{ maxWidth: '100%', height: 'auto' }}>
    {shape === 'round'
      ? <circle cx="200" cy="200" r="188" fill="none" stroke={color} strokeWidth="6" />
      : <rect x="12" y="12" width="376" height="376" fill="none" stroke={color} strokeWidth="6" />}
    <text x="200" textAnchor="middle" dominantBaseline="middle" xmlSpace="preserve" fill={color} fontSize={layout.fontSize} fontFamily={font}>
      {layout.lines.map((line, index) => <tspan key={index} x="200" y={200 + (index - (layout.lines.length - 1) / 2) * layout.lineHeight}>{line}</tspan>)}
    </text>
  </svg>;
}
