// frontend/src/app/api/company-field-setting/route.ts
import { NextRequest, NextResponse } from 'next/server';

function getDjangoBackendUrl(): string {
  // Support API_URL (used globally across frontend), NEXT_PUBLIC_API_URL, or DJANGO_API_URL
  const rawUrl = process.env.API_URL;
  let cleaned = rawUrl.trim().replace(/\/+$/, '');
  
  // Strip trailing '/api' if present so we can reliably construct `${cleaned}/api/company-field-setting/` without double '/api/api/'
  if (cleaned.endsWith('/api')) {
    cleaned = cleaned.slice(0, -4);
  }
  return cleaned;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: 'company_id is required' },
        { status: 400 }
      );
    }

    const backendUrl = getDjangoBackendUrl();
    const targetUrl = `${backendUrl}/api/company-field-setting/?company_id=${companyId}`;
    console.log(`Forwarding GET to Django: ${targetUrl}`);
    
    const authHeader = request.headers.get('authorization') || '';
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      cache: 'no-store',
    });

    const responseText = await response.text();
    console.log(`Django GET response status: ${response.status}`);
    
    // Handle 404 cleanly when no setting has been created yet for this company
    if (response.status === 404) {
      return NextResponse.json(
        { 
          success: true, 
          data: { config: {} },
          message: 'No settings found for this company'
        },
        { status: 200 }
      );
    }

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse Django GET response as JSON:', responseText.substring(0, 200));
      return NextResponse.json(
        { 
          success: true, 
          data: { config: {} },
          message: 'Default settings initialized'
        },
        { status: 200 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in GET /company-field-setting:', error);
    return NextResponse.json(
      { 
        success: true, 
        data: { config: {} },
        message: 'Unable to connect to backend server, using default settings'
      },
      { status: 200 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.company_id) {
      return NextResponse.json(
        { success: false, message: 'company_id is required' },
        { status: 400 }
      );
    }

    if (!body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        { success: false, message: 'config object is required' },
        { status: 400 }
      );
    }

    const backendUrl = getDjangoBackendUrl();
    const targetUrl = `${backendUrl}/api/company-field-setting/`;
    console.log(`Forwarding POST to Django: ${targetUrl}`);
    
    const authHeader = request.headers.get('authorization') || '';
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`Django POST response status: ${response.status}`);
    
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse Django POST response as JSON:', responseText.substring(0, 200));
      return NextResponse.json(
        { success: false, message: 'Invalid JSON response from backend server' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in POST /company-field-setting:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to communicate with backend server' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.company_id) {
      return NextResponse.json(
        { success: false, message: 'company_id is required' },
        { status: 400 }
      );
    }

    if (!body.config || typeof body.config !== 'object') {
      return NextResponse.json(
        { success: false, message: 'config object is required' },
        { status: 400 }
      );
    }

    const backendUrl = getDjangoBackendUrl();
    const targetUrl = `${backendUrl}/api/company-field-setting/`;
    console.log(`Forwarding PUT to Django: ${targetUrl}`);
    
    const authHeader = request.headers.get('authorization') || '';
    
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`Django PUT response status: ${response.status}`);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse Django PUT response as JSON:', responseText.substring(0, 200));
      return NextResponse.json(
        { success: false, message: 'Invalid JSON response from backend server' },
        { status: 502 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in PUT /company-field-setting:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to communicate with backend server' },
      { status: 500 }
    );
  }
}