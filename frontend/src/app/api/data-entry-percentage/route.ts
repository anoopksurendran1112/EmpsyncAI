// app/api/data-entry-percentage/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const djangoApiUrl = process.env.API_URL;
    
    if (!djangoApiUrl) {
      console.error('API_URL environment variable is not set');
      return NextResponse.json(
        { 
          success: false, 
          message: 'API_URL environment variable is not configured',
          error: 'Missing API_URL in environment variables'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    const companyId = request.headers.get('x-company-id');
    if (companyId) {
      headers['X-Company-ID'] = companyId;
    }
    
    const baseUrl = djangoApiUrl.endsWith('/') ? djangoApiUrl.slice(0, -1) : djangoApiUrl;
    const url = `${baseUrl}/data-entry-percentage/`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status
    });

  } catch (error) {
    console.error('Error in data-entry-percentage API proxy:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch data entry percentage from backend',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const djangoApiUrl = process.env.API_URL;
    
    if (!djangoApiUrl) {
      console.error('API_URL environment variable is not set');
      return NextResponse.json(
        { 
          success: false, 
          message: 'API_URL environment variable is not configured',
          error: 'Missing API_URL in environment variables'
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');
    const userId = searchParams.get('user_id');
    
    const headers: Record<string, string> = {};
    
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    const companyIdHeader = request.headers.get('x-company-id');
    if (companyIdHeader) {
      headers['X-Company-ID'] = companyIdHeader;
    }
    
    const queryString = new URLSearchParams();
    if (companyId) queryString.append('company_id', companyId);
    if (userId) queryString.append('user_id', userId);
    
    const baseUrl = djangoApiUrl.endsWith('/') ? djangoApiUrl.slice(0, -1) : djangoApiUrl;
    const url = `${baseUrl}/data-entry-percentage/?${queryString.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      credentials: 'include',
    });

    const data = await response.json();
    
    return NextResponse.json(data, { 
      status: response.status
    });

  } catch (error) {
    console.error('Error in data-entry-percentage API proxy:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch data entry percentage from backend',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}