import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { MongoClient } from 'mongodb';

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('maildb');

    // 1. Force Google to give us the 50 most recent emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults: 50
    });

    const messages = response.data.messages || [];
    let newlySynced = 0;

    for (const msg of messages) {
      // 2. Skip this email if it already exists in MongoDB
      const exists = await db.collection('emails').findOne({ gmailId: msg.id });
      if (exists) continue;

      // 3. Download the full, rich email payload
      const fullMsg = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full'
      });

      const payload = fullMsg.data.payload;
      const headers = payload.headers;
      const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      // Secure Base64URL decoder for Gmail data
      const decodeBody = (data) => Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

      // Recursively search for the HTML and Plain Text body parts
      let bodyHtml = '';
      let bodyText = '';
      
      const parseParts = (parts) => {
        if (!parts) return;
        for (const part of parts) {
          if (part.mimeType === 'text/html' && part.body.data) {
            bodyHtml = decodeBody(part.body.data);
          } else if (part.mimeType === 'text/plain' && part.body.data) {
            bodyText = decodeBody(part.body.data);
          } else if (part.parts) {
            parseParts(part.parts); // Check nested parts
          }
        }
      };

      if (payload.parts) {
        parseParts(payload.parts);
      } else if (payload.body && payload.body.data) {
        if (payload.mimeType === 'text/html') bodyHtml = decodeBody(payload.body.data);
        else bodyText = decodeBody(payload.body.data);
      }

      // Format the Sender's Name cleanly
      const fromHeader = getHeader('from');
      const fromNameMatch = fromHeader.match(/^(.*?)\s*</);
      const fromEmailMatch = fromHeader.match(/<([^>]+)>/);
      
      const fromName = fromNameMatch ? fromNameMatch[1].replace(/"/g, '').trim() : fromHeader.split('@')[0];
      const fromAddress = fromEmailMatch ? fromEmailMatch[1] : fromHeader;

      // Build the standard MongoDB Document
      const emailDoc = {
        gmailId: fullMsg.data.id,
        threadId: fullMsg.data.threadId,
        labelIds: fullMsg.data.labelIds || [],
        subject: getHeader('subject') || '(No Subject)',
        from: { name: fromName, address: fromAddress },
        to: [{ address: getHeader('to') }],
        dateReceived: new Date(parseInt(fullMsg.data.internalDate)),
        snippet: fullMsg.data.snippet,
        bodyHtml: bodyHtml || bodyText || '<p>No viewable content</p>',
        bodyText: bodyText || bodyHtml || '',
        isRead: !(fullMsg.data.labelIds || []).includes('UNREAD'),
      };

      // 4. Save safely into the database
      await db.collection('emails').insertOne(emailDoc);
      newlySynced++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Force sync complete. Added ${newlySynced} missing emails to your database.` 
    });

  } catch (error) {
    console.error('Force Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
}