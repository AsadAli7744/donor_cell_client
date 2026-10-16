import { toPng } from 'html-to-image';

/**
 * Capture a DOM node as PNG and trigger a browser download.
 * @param {HTMLElement | null} element
 * @param {string} fileName - without extension
 */
export async function downloadAsPng(element, fileName = 'download') {
  if (!element) return;
  const dataUrl = await toPng(element, {
    cacheBust: true,
    backgroundColor: '#ffffff',
    pixelRatio: 2,
  });
  const link = document.createElement('a');
  link.download = `${fileName}.png`;
  link.href = dataUrl;
  link.click();
}
