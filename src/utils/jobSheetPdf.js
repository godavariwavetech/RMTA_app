import FileShare from 'react-native-share';

import { convertToPdf, pdfBodyStyle, pdfHeadStyle } from './pdfSizes';
import { shopInfoFrom } from './shopInfo';

// Builds and shares the job sheet PDF. Used by the job list (the "Share job sheet PDF"
// button on a card) and by the "Job created" screen, so both make the same document.

const esc = v =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// The fields the PDF and the share sheet need, from a job record.
export function jobSheetInfo(record) {
  const j = record || {};
  const jobId = j.job_id || j.job_sheet_id || j.id || j.insertId || '';
  const jobCode = j.job_code || j.job_number || (jobId ? `Job #${jobId}` : 'Job Sheet');
  const deviceName = [j.device_brand, j.device_model].filter(Boolean).join(' ') || 'Device';
  const price =
    j.estimated_cost != null && j.estimated_cost !== ''
      ? `₹${Number(j.estimated_cost).toLocaleString('en-IN')}`
      : '';
  return { j, jobId, jobCode, deviceName, price };
}

// `member` is the shop owner's record (useMemberProfile()): its shop name, contact
// number and GST/RC number head the sheet instead of RMTA.
export function buildJobSheetHtml(record, sizeKey, member) {
  const { j, jobId, jobCode, deviceName, price } = jobSheetInfo(record);
  const shop = shopInfoFrom(member);
  const shopName = shop.name || 'Service Record';
  const shopLines = [
    shop.address,
    shop.mobile && `Contact: ${shop.mobile}`,
    shop.gst && `GST / RC No: ${shop.gst}`,
  ].filter(Boolean);
  const row = (label, value) =>
    value !== null && value !== undefined && value !== ''
      ? `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`
      : '';
  const created = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return `
    <html>
      <head>${pdfHeadStyle(sizeKey)}<style>
        *{box-sizing:border-box} body{font-family:Helvetica,Arial,sans-serif;color:#17243A;background:#fff}
        .brand{background:#071A3D;color:#fff;padding:22px 24px;border-radius:12px;margin-bottom:22px}
        .brand small{color:#9CCBFF;font-size:10px;letter-spacing:2px;font-weight:bold}
        .shop{font-size:11px;color:#D4DFEF;margin:2px 0 0}
        h1{font-size:24px;margin:8px 0 4px;color:#fff} .meta{font-size:11px;color:#D4DFEF;margin:0}
        h2{font-size:13px;color:#173B82;margin:18px 0 8px;padding-bottom:6px;border-bottom:1px solid #DCE5F1}
        table{width:100%;border-collapse:collapse} tr:nth-child(even){background:#F6F8FB}
        th,td{padding:8px 10px;text-align:left;font-size:11px;border-bottom:1px solid #E8EDF4}
        th{width:36%;color:#64748B;font-weight:normal} td{color:#17243A;font-weight:bold;word-break:break-word}
        .footer{margin-top:24px;padding-top:10px;border-top:1px solid #DCE5F1;color:#64748B;font-size:9px;text-align:center}
        ${sizeKey === 'thermal' ? '.brand{padding:10px;border-radius:6px;margin-bottom:12px}h1{font-size:16px}h2{font-size:11px;margin:10px 0 4px}th,td{font-size:9px;padding:5px 4px}' : ''}
      </style></head>
      <body style="${pdfBodyStyle(sizeKey)}">
        <header class="brand">
          <small>JOB SHEET</small>
          <h1>${esc(shopName)}</h1>
          ${shopLines.map(l => `<p class="shop">${esc(l)}</p>`).join('')}
          <p class="meta" style="margin-top:8px">${esc(jobCode)} · ${esc(created)}</p>
        </header>
        <h2 style="border-bottom:1px solid #E5E7EB;padding-bottom:8px;">Customer</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Job ID', jobId)}
          ${row('Job reference', j.job_code || j.job_number)}
          ${row('Name', j.customer_name)}
          ${row('Mobile', j.customer_mobile)}
        </table>
        <h2 style="border-bottom:1px solid #E5E7EB;padding-bottom:8px;">Device</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Device', deviceName)}
          ${row('Storage', j.storage)}
          ${row('Color', j.color)}
          ${row('IMEI 1', j.imei1)}
          ${row('IMEI 2', j.imei2)}
        </table>
        <h2 style="border-bottom:1px solid #E5E7EB;padding-bottom:8px;">Condition</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Screen', j.screen)}
          ${row('Body', j.body)}
          ${row('Camera', j.camera)}
          ${row('Speaker', j.speaker)}
          ${row('Charging port', j.chargingpoint)}
          ${row('Battery', j.batterey)}
        </table>
        <h2 style="border-bottom:1px solid #E5E7EB;padding-bottom:8px;">Repair</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Category', j.repair_category)}
          ${row('Problem', j.problem_description)}
          ${row('Estimated cost', price)}
          ${row('Estimated delivery', j.estimated_delivery)}
        </table>
        <p class="footer">Thank you for choosing ${esc(shop.name || 'us')}${shop.mobile ? ` · For queries call ${esc(shop.mobile)}` : ''} · Keep this sheet for your service records</p>
      </body>
    </html>`;
}

// Creates the PDF and opens the system share sheet (WhatsApp, Gmail, Drive...). Resolves
// { saved: true, filePath } when the share sheet could not open and the file was only saved.
export async function shareJobSheetPdf(record, sizeKey, member) {
  const { jobCode, deviceName } = jobSheetInfo(record);
  const shop = shopInfoFrom(member);
  const file = await convertToPdf({
    html: buildJobSheetHtml(record, sizeKey, member),
    fileName: `JobSheet-${jobCode}`.replace(/[^A-Za-z0-9_-]/g, '_'),
    sizeKey,
  });
  const url = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
  try {
    await FileShare.open({
      title: `Job Sheet ${jobCode}`,
      message: [
        `Job Sheet ${jobCode} - ${deviceName}`,
        shop.name,
        shop.mobile && `Contact: ${shop.mobile}`,
      ]
        .filter(Boolean)
        .join('\n'),
      url,
      type: 'application/pdf',
      failOnCancel: false,
    });
    return { saved: false, filePath: file.filePath };
  } catch (shareErr) {
    return { saved: true, filePath: file.filePath };
  }
}
