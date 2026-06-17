import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET(request) {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    // 1. Extract dynamic instructions from the frontend URL
    const { searchParams } = new URL(request.url);
    const label = searchParams.get('label') || 'INBOX'; // Defaults to INBOX
    const page = parseInt(searchParams.get('page') || '1', 10); // Defaults to page 1
    const limit = parseInt(searchParams.get('limit') || '50', 10); // Loads 50 at a time

    // 2. Calculate how many emails to skip based on the current page
    const skip = (page - 1) * limit;

    await client.connect();
    const db = client.db('maildb');

    // 3. Build the smart query (Google uses 'SENT', 'TRASH', 'STARRED', 'DRAFT')
    const query = label === 'ALL' ? {} : { labelIds: label };

    // 4. Fetch the exact batch of emails requested, newest first
    const emails = await db.collection('emails')
      .find(query)
      .sort({ dateReceived: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // 5. Count the total emails in this folder so the frontend knows when to hide the "Load More" button
    const totalCount = await db.collection('emails').countDocuments(query);

    return NextResponse.json({
      success: true,
      emails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasMore: skip + emails.length < totalCount
      }
    });

  } catch (error) {
    console.error('❌ Database fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch emails', error: error.message },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}