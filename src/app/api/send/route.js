import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { fromAddress, to, cc, bcc, subject, bodyHtml, attachments } = await request.json();

    if (!to || !fromAddress) {
      return NextResponse.json({ error: 'Missing recipient or sender' }, { status: 400 });
    }

    // Helper to safely split comma-separated emails into arrays
    const parseEmails = (str) => str ? str.split(',').map(e => e.trim()).filter(e => e) : [];

    const toArray = parseEmails(to);
    const ccArray = parseEmails(cc);
    const bccArray = parseEmails(bcc);

    // FEATURE: Always BCC your personal Gmail so it shows in your standard dashboard
    if (!bccArray.includes('hellohemantpandey@gmail.com')) {
      bccArray.push('hellohemantpandey@gmail.com');
    }

    // Deliver the email with the new advanced parameters
    const data = await resend.emails.send({
      from: `Hemant Pandey <${fromAddress}>`, 
      to: toArray,
      cc: ccArray.length > 0 ? ccArray : undefined,
      bcc: bccArray,
      subject: subject || '(No Subject)',
      html: `<div style="font-family: sans-serif; color: #333;">${bodyHtml}</div>`,
      attachments: attachments || [], // Expects array of { filename, content: 'base64string' }
    });

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error) {
    console.error('❌ Failed to send email via Resend:', error);
    return NextResponse.json(
      { message: 'Failed to send email', error: error.message },
      { status: 500 }
    );
  }
}