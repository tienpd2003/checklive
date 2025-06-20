import { NextResponse } from 'next/server';
import { findChromeExecutable } from '@/app/utils/chrome-finder';

export async function GET() {
  try {
    console.log('=== Testing Chrome Finder ===');
    
    const startTime = Date.now();
    const chromeExecutable = findChromeExecutable();
    const endTime = Date.now();
    
    console.log('=== Chrome Finder Test Complete ===');
    console.log('Time taken:', endTime - startTime, 'ms');
    console.log('Result:', chromeExecutable);

    return NextResponse.json({
      status: 'success',
      message: 'Chrome finder test completed',
      data: {
        chromeExecutable,
        timeTaken: endTime - startTime,
        found: !!chromeExecutable
      }
    });

  } catch (error) {
    console.error('Chrome finder test error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Chrome finder test failed: ' + (error as Error).message
    }, { status: 500 });
  }
} 