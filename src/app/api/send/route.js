import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your environment key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
    try {
        // Extract the email details sent from our frontend modal
        const { to, subject, body } = await request.json();

        // Fire the email off via Resend
        const data = await resend.emails.send({
            // Note: While testing, Resend requires you to use their onboarding address
            // and you can only send emails TO your own verified Gmail address.
            // You can use 'hello', 'admin', 'contact', or your name!
            from: 'Hemant Pandey <hello@hemantpandey.in>', to: [to],
            subject: subject || '(No Subject)',
            html: `<div style="font-family: sans-serif; color: #333;">${body.replace(/\n/g, '<br />')}</div>`,
        });

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error) {
        console.error('❌ Failed to send email:', error);
        return NextResponse.json(
            { message: 'Failed to send email', error: error.message },
            { status: 500 }
        );
    }
}