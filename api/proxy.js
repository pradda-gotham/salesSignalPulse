
import { URL } from 'url';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, Cache-Control',
      },
    });
  }

  try {
    const url = new URL(request.url);
    // Extract the path after /api/apollo
    // Example: /api/apollo/people/search -> /people/search
    const path = url.pathname.replace('/api/apollo', '');
    const query = url.search;
    
    const targetUrl = `https://api.apollo.io/v1${path}${query}`;

    console.log(`[PROXY] Forwarding to: ${targetUrl}`);

    // Create new headers, filtering out host/origin to avoid issues
    const headers = new Headers();
    request.headers.forEach((value, key) => {
        if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
            headers.set(key, value);
        }
    });
    
    // Ensure content-type is passed
    if (request.headers.get('content-type')) {
        headers.set('content-type', request.headers.get('content-type'));
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
    });

    // Proxy the response back with CORS headers
    const data = await response.blob();
    const responseHeaders = new Headers(response.headers);
    
    // Force CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[PROXY ERROR]', error);
    return new Response(JSON.stringify({ error: 'Proxy failed', details: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
