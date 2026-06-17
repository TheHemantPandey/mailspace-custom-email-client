import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { MongoClient } from 'mongodb';

// Initialize Google OAuth client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export async function POST(request) {
  // Create a fresh database connection for each request
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    const { gmailId } = await request.json();

    if (!gmailId) {
      return NextResponse.json({ error: 'Missing gmailId' }, { status: 400 });
    }

    // 1. Tell Google to remove the UNREAD label from the actual email
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });

    // 2. Update your MongoDB copy so the dashboard UI reflects the change
    await client.connect();
    const db = client.db('maildb'); 
    await db.collection('emails').updateOne(
      { gmailId: gmailId },
      { $set: { isRead: true } }
    );

    return NextResponse.json({ success: true, message: 'Message marked as read perfectly' });

  } catch (error) {
    console.error('❌ Mark Read error:', error);
    return NextResponse.json(
      { message: 'Failed to update read status', error: error.message },
      { status: 500 }
    );
  } finally {
    // Always close the database connection securely
    await client.close();
  }
}