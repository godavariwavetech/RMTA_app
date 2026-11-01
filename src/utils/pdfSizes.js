import { generatePDF } from 'react-native-html-to-pdf';

// Page sizes in points (1 inch = 72pt).
//   a4      — 210 x 297 mm
//   thermal — 3 inch wide receipt roll; height depends on the content.
export const PDF_SIZES = {
  a4: { key: 'a4', label: 'A4', description: 'Standard page, 210 × 297 mm', width: 595, height: 842 },
  thermal: {
    key: 'thermal',
    label: 'Thermal (3 inch)',
    description: 'Receipt roll, 3 inch wide',
    width: 216,
    height: 0, // computed from the content
  },
};

// Inline <body> style that suits the chosen size (smaller type and padding on
// the narrow thermal paper).
export const pdfBodyStyle = sizeKey =>
  sizeKey === 'thermal'
    ? 'font-family: Helvetica, Arial, sans-serif; padding: 6px; font-size: 10px; color: #000;'
    : 'font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #1F2937;';

// <style> block for the HTML <head>: smaller headings on thermal paper.
export const pdfHeadStyle = sizeKey =>
  sizeKey === 'thermal'
    ? '<style>h1{font-size:14px;margin:0 0 4px} h2{font-size:12px;margin:10px 0 4px} p{margin:0 0 6px} td{padding:3px 0 !important}</style>'
    : '';

// Rough height for a thermal receipt: a base plus space per table row/heading.
const estimateThermalHeight = html => {
  const rows = (html.match(/<tr/g) || []).length;
  const headings = (html.match(/<h[12]/g) || []).length;
  return Math.max(300, 120 + rows * 30 + headings * 40);
};

// Converts HTML to a PDF file in the requested size; resolves { filePath }.
export function convertToPdf({ html, fileName, sizeKey = 'a4' }) {
  const size = PDF_SIZES[sizeKey] || PDF_SIZES.a4;
  const height = sizeKey === 'thermal' ? estimateThermalHeight(html) : size.height;
  return generatePDF({
    html,
    fileName,
    base64: false,
    width: size.width,
    height,
    padding: 0,
  });
}
