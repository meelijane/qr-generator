import { describe, expect, it } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { fileNameFor, normaliseUrl } from './url.js';

describe('normaliseUrl', () => {
  it('adds https when missing', () => {
    expect(normaliseUrl('example.com/a')).toEqual({ ok: true, url: 'https://example.com/a' });
  });
  it('keeps full URLs, including query strings', () => {
    const href = 'https://shop.example.org/p?id=42&ref=flyer#top';
    expect(normaliseUrl(`  ${href}  `)).toEqual({ ok: true, url: href });
  });
  it('rejects empty, junk and non-web schemes', () => {
    expect(normaliseUrl('   ').ok).toBe(false);
    expect(normaliseUrl('hello').ok).toBe(false);
    expect(normaliseUrl('javascript:alert(1)').ok).toBe(false);
    expect(normaliseUrl('ftp://example.com').ok).toBe(false);
  });
});

describe('fileNameFor', () => {
  it('makes a readable, safe name', () => {
    expect(fileNameFor('https://www.example.com/menu/', 'png')).toBe('qr-example.com-menu.png');
  });
});

// The thing that actually matters: a scanner reads back exactly the link we put in.
describe('generated QR codes', () => {
  const links = [
    'https://example.com/',
    'https://shop.example.org/p?id=42&ref=flyer#top',
    `https://example.com/${'long-path/'.repeat(30)}`,
  ];
  for (const href of links) {
    it(`decodes back to ${href.slice(0, 50)}`, async () => {
      const buf = await QRCode.toBuffer(href, { errorCorrectionLevel: 'M', margin: 4, width: 600 });
      const png = PNG.sync.read(buf);
      const result = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
      expect(result?.data).toBe(href);
    });
  }
});
