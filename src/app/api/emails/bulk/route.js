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
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    // We expect an array of IDs and an action type ('trash' or 'archive')
    const { gmailIds, action } = await request.json();

    if (!gmailIds || !Array.isArray(gmailIds) || gmailIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid gmailIds array' }, { status: 400 });
    }

    if (action === 'trash') {
      // 1. Tell Google to trash every selected email concurrently
      await Promise.all(
        gmailIds.map((id) =>
          gmail.users.messages.trash({ userId: 'me', id: id }).catch(e => console.error(`Failed to trash ${id} in Google`, e))
        )
      );

      // 2. Wipe them all from MongoDB in one optimized query
      await client.connect();
      const db = client.db('maildb');
      await db.collection('emails').deleteMany({ gmailId: { $in: gmailIds } });
    } 
    else if (action === 'archive') {
      // 1. Tell Google to remove the 'INBOX' label from every selected email
      await Promise.all(
        gmailIds.map((id) =>
          gmail.users.messages.modify({
            userId: 'me',
            id: id,
            requestBody: { removeLabelIds: ['INBOX'] }
          }).catch(e => console.error(`Failed to archive ${id} in Google`, e))
        )
      );
      
      // 2. Remove them from your local dashboard view
      await client.connect();
      const db = client.db('maildb');
      await db.collection('emails').deleteMany({ gmailId: { $in: gmailIds } });
    }

    return NextResponse.json({ success: true, message: `Successfully ${action}ed ${gmailIds.length} emails` });

  } catch (error) {
    console.error('❌ Bulk action error:', error);
    return NextResponse.json(
      { message: 'Failed to process bulk action', error: error.message },
      { status: 500 }
    );
  } finally {
    // Always close the database connection
    await client.close();
  }
}