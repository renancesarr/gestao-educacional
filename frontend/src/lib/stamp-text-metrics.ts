/** Browser font measurement used to keep the exported text inside the stamp. */
export function stampTextMeasurer(font: string): (line: string, size: number) => number {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return () => Infinity;
  return (line, size) => {
    context.font = `${size}px ${font}`;
    const metrics = context.measureText(line);
    return Math.max(metrics.width, metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight);
  };
}
