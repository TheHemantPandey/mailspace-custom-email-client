import { NextResponse } from 'next/server';
import { syncGmailInbox } from '../../../lib/gmailSync';

// Force Next.js to always execute this route dynamically on the server (do not cache)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fire up our sync orchestrator to pull the latest 15 messages
    const result = await syncGmailInbox(15);

    if (!result.success) {
      return NextResponse.json(
        { message: 'Sync pipeline execution failed', error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Sync process completed successfully',
      syncedCount: result.syncedCount,
    }, { status: 200 });

  } catch (error) {
    console.error('❌ API Sync Route Exception:', error);
    return NextResponse.json(
      { message: 'Internal Server Error encountered during execution', error: error.message },
      { status: 500 }
    );
  }
}