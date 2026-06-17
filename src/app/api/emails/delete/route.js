import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { MongoClient } from 'mongodb';

// Initialize Google OAuth client globally (this is fine because it doesn't "close")
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

export async function POST(request) {
  // 1. Move the MongoDB client INSIDE the function so it resets on every request
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    const { gmailId } = await request.json();

    if (!gmailId) {
      return NextResponse.json({ error: 'Missing gmailId' }, { status: 400 });
    }

    // 2. Move the actual email to the Trash folder in Google
    await gmail.users.messages.trash({
      userId: 'me',
      id: gmailId,
    });

    // 3. Connect to MongoDB, delete the copy, and finish
    await client.connect();
    const db = client.db('maildb'); 
    await db.collection('emails').deleteOne({ gmailId: gmailId });

    return NextResponse.json({ success: true, message: 'Email moved to trash' });

  } catch (error) {
    console.error('❌ Delete error:', error);
    return NextResponse.json(
      { message: 'Failed to delete email', error: error.message },
      { status: 500 }
    );
  } finally {
    // 4. Safely close this specific local connection
    await client.close();
  }
}