import QRCode from 'qrcode';
import { fileNameFor, normaliseUrl } from './url.js';
import './style.css';

const form = document.querySelector('#qr-form');
const input = document.querySelector('#url');
const error = document.querySelector('#url-error');
const result = document.querySelector('#result');
const preview = document.querySelector('#preview');
const encoded = document.querySelector('#encoded');
const pngLink = document.querySelector('#download-png');
const svgLink = document.querySelector('#download-svg');

// Medium error correction: survives smudges and printing, keeps codes small enough to scan easily.
const OPTIONS = { errorCorrectionLevel: 'M', margin: 4, color: { dark: '#000000', light: '#ffffff' } };

let svgUrl;

function showError(message) {
  error.textContent = message;
  input.setAttribute('aria-invalid', 'true');
  result.hidden = true;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const parsed = normaliseUrl(input.value);
  if (!parsed.ok) return showError(parsed.error);

  error.textContent = '';
  input.removeAttribute('aria-invalid');
  input.value = parsed.url;

  try {
    const [svg, png] = await Promise.all([
      QRCode.toString(parsed.url, { ...OPTIONS, type: 'svg' }),
      QRCode.toDataURL(parsed.url, { ...OPTIONS, width: 1024 }),
    ]);

    preview.innerHTML = svg;
    const svgEl = preview.querySelector('svg');
    svgEl.setAttribute('role', 'img');
    svgEl.setAttribute('aria-label', `QR code linking to ${parsed.url}`);

    encoded.textContent = parsed.url;
    encoded.href = parsed.url;

    if (svgUrl) URL.revokeObjectURL(svgUrl);
    svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    svgLink.href = svgUrl;
    svgLink.download = fileNameFor(parsed.url, 'svg');
    pngLink.href = png;
    pngLink.download = fileNameFor(parsed.url, 'png');

    result.hidden = false;
    result.querySelector('h2').focus();
  } catch {
    showError('That link is too long to fit in a QR code.');
  }
});
