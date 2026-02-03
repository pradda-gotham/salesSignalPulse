
import { URL } from 'url';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);

  // Log every request
  console.log(`[PROXY] ${request.method} request to ${url.pathname}`);
  console.log(`[PROXY] Headers:`, JSON.stringify(Object.fromEntries(request.headers.entries())));

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, Cache-Control, Pragma',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Extract the path after /api/apollo
    const path = url.pathname.replace('/api/apollo', '');
    const query = url.search;

    // Safety check for recursive or wrong paths
    if (path.startsWith('/api/proxy')) {
      return new Response(JSON.stringify({ error: 'Recursive proxy call detected', path }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const targetUrl = `https://api.apollo.io/v1${path}${query}`;

    console.log(`[PROXY] Forwarding to: ${targetUrl}`);

    // Create new headers
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['host', 'origin', 'referer', 'connection', 'content-length'].includes(lowerKey)) {
        headers.set(key, value);
      }
    });

    // Check for API key presence
    const apiKey = request.headers.get('x-api-key') || request.headers.get('X-Api-Key');
    if (!apiKey) {
      console.warn('[PROXY WARNING] No X-Api-Key header found in request');
    } else {
      console.log('[PROXY] X-Api-Key is present (length: ' + apiKey.length + ')');
    }

    // Explicitly set content-type if missing for POST/PUT
    if (!headers.get('content-type') && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      headers.set('content-type', 'application/json');
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
    });

    console.log(`[PROXY] Upstream Response: ${response.status} ${response.statusText}`);

    // Get response body
    const data = await response.blob();

    // Relay headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    // Debug header
    responseHeaders.set('X-Pulse-Proxy-Debug', 'true');

    return new Response(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('[PROXY ERROR]', error);
    return new Response(JSON.stringify({
      error: 'Proxy failed',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
