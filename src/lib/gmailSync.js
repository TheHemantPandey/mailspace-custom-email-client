import { simpleParser } from 'mailparser';
import connectDB from './db';
import Email from '../models/Email';

/**
 * Generates a fresh, valid short-term Access Token using your 
 * permanent long-term Google Refresh Token from .env.local
 */
async function getAccessToken() {
  const url = 'https://oauth2.googleapis.com/token';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to refresh access token: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

/**
 * Core Orchestrator: Connects to Gmail, scans the latest messages, 
 * parses raw content strings, and upserts structural items into Atlas.
 */
export async function syncGmailInbox(maxResults = 10) {
  await connectDB();
  console.log('🔄 Initiating background email synchronization sequence...');

  try {
    const accessToken = await getAccessToken();
    
    // Fetch a structural list of recent message metadata IDs from your inbox
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=label:INBOX`;
    const listResponse = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    const listData = await listResponse.json();
    if (!listData.messages || listData.messages.length === 0) {
      console.log('✅ No new messages discovered inside the inbox.');
      return { success: true, syncedCount: 0 };
    }

    let syncedCount = 0;

    for (const msgSummary of listData.messages) {
      // Check if this email ID already exists in MongoDB Atlas to avoid duplicate api operations
      const existingEmail = await Email.findOne({ gmailId: msgSummary.id });
      if (existingEmail) continue; 

      // Fetch the full raw format (MIME standard string) of the specific email message
      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgSummary.id}?format=raw`;
      const msgResponse = await fetch(msgUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const msgData = await msgResponse.json();

      if (!msgData.raw) continue;

      // Convert URL-safe base64 string back into standard clean text buffer data
      const rawEmailBuffer = Buffer.from(msgData.raw, 'base64url');

      // Parse the raw mail stream structures into structured text/html elements using mailparser
      const parsed = await simpleParser(rawEmailBuffer);

      // Map out clean metadata fallbacks for array conversions
      const fromAddress = parsed.from?.value?.[0] || { name: '', address: 'unknown@email.com' };
      const toAddresses = parsed.to?.value?.map(t => ({ name: t.name || '', address: t.address || '' })) || [];

      // Structure our operational dataset
      const emailDocument = {
        gmailId: msgSummary.id,
        threadId: msgData.threadId,
        subject: parsed.subject || '(No Subject)',
        from: {
          name: fromAddress.name || '',
          address: fromAddress.address.toLowerCase(),
        },
        to: toAddresses,
        dateReceived: parsed.date || new Date(),
        snippet: msgData.snippet || '',
        bodyHtml: parsed.html || parsed.textAsHtml || '',
        bodyText: parsed.text || '',
        isRead: !msgData.labelIds?.includes('UNREAD'),
        labels: msgData.labelIds || [],
      };

      // Atomic Update Operations: Upsert into MongoDB Atlas safely
      await Email.findOneAndUpdate(
        { gmailId: msgSummary.id },
        emailDocument,
        { upsert: true, new: true }
      );

      syncedCount++;
    }

    console.log(`🚀 Successfully synced and processed ${syncedCount} new operational messages.`);
    return { success: true, syncedCount };

  } catch (error) {
    console.error('❌ Synchronizer processing error encountered:', error);
    return { success: false, error: error.message };
  }
}