import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';

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

    // 3. Build robust query to handle labelIds / labels or missing fields
    let query = {};
    if (label === 'ALL') {
      query = {};
    } else if (label === 'INBOX') {
      query = {
        $or: [
          { labelIds: 'INBOX' },
          { labels: 'INBOX' },
          { labelIds: { $exists: false } },
          { labelIds: null },
          { labelIds: { $size: 0 } },
        ],
      };
    } else {
      query = {
        $or: [{ labelIds: label }, { labels: label }],
      };
    }

    // 4. Fetch the exact batch of cached emails requested from MongoDB, newest first
    const emails = await db
      .collection('emails')
      .find(query)
      .sort({ dateReceived: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // 5. Count total emails matching query
    const totalCount = await db.collection('emails').countDocuments(query);

    return NextResponse.json({
      success: true,
      emails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit) || 1,
        totalItems: totalCount,
        hasMore: skip + emails.length < totalCount,
      },
    });
  } catch (error) {
    console.error('❌ Database fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch cached emails from database', error: error.message },
      { status: 500 }
    );
  } finally {
    await client.close().catch(() => {});
  }
}