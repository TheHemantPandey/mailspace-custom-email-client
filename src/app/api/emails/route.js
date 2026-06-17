import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Email from '../../../models/Email';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();

    // Parse URL parameters to allow filtering by labels (e.g., INBOX, UNREAD, SENT, TRASH)
    const { searchParams } = new URL(request.url);
    const labelFilter = searchParams.get('label') || 'INBOX';

    // Query MongoDB for emails matching the label, sorted chronologically (newest first)
    const emails = await Email.find({ labels: labelFilter })
      .sort({ dateReceived: -1 })
      .limit(50); // Cap at 50 for fast loading and good performance

    return NextResponse.json({
      success: true,
      count: emails.length,
      emails,
    }, { status: 200 });

  } catch (error) {
    console.error('❌ API Fetch Emails Route Exception:', error);
    return NextResponse.json(
      { message: 'Internal Server Error encountered while fetching documents', error: error.message },
      { status: 500 }
    );
  }
}