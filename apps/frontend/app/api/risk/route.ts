import 'dotenv/config';
import { NextRequest, NextResponse } from 'next/server';


const { getQuoteCost } = require('../../../../backend/src/risk_utils/quote.js');
console.log('getQuoteCost', getQuoteCost);

export async function POST(req: NextRequest) {
  try {
    const { amountIn } = await req.json();
    console.log('amountIn', amountIn);
    if (typeof amountIn !== 'number' || isNaN(amountIn) || amountIn <= 0) {
      return NextResponse.json(
        { error: 'Invalid amountIn' },
        { status: 400 }
      );
    }
    // Call the JS function, which should return the quote result
    console.log('post amountIn', amountIn);
    const result = await getQuoteCost(amountIn);
    console.log('result', result);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
};
