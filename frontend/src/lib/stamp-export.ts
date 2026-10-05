function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadStampSvg(svg: SVGSVGElement) {
  const source = new XMLSerializer().serializeToString(svg);
  downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), 'carimbo.svg');
}

export async function downloadStampPng(svg: SVGSVGElement) {
  const source = new XMLSerializer().serializeToString(svg);
  await document.fonts.ready;
  const imageUrl = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = svg.viewBox.baseVal.width;
    canvas.height = svg.viewBox.baseVal.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Este navegador não conseguiu gerar o PNG.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value)
      : reject(new Error('Não foi possível exportar o PNG.')), 'image/png'));
    downloadBlob(blob, 'carimbo.png');
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
