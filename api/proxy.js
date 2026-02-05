
export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key, Cache-Control, Pragma');

  // Log every request
  console.log(`[PROXY] ${req.method} request to ${req.url}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(204).end();
  }

  try {
    // Extract the path after /api/apollo
    // req.url is like /api/apollo/mixed_companies/search?query=...
    const fullPath = req.url || '';
    const path = fullPath.replace(/^\/api\/apollo/, '');

    // Safety check for recursive or wrong paths
    if (path.startsWith('/api/proxy')) {
      return res.status(400).json({ error: 'Recursive proxy call detected', path });
    }

    const targetUrl = `https://api.apollo.io/v1${path}`;
    console.log(`[PROXY] Forwarding to: ${targetUrl}`);

    // Build headers for upstream request
    const headers = {};

    // Copy relevant headers from incoming request
    const skipHeaders = ['host', 'origin', 'referer', 'connection', 'content-length'];
    for (const [key, value] of Object.entries(req.headers)) {
      if (!skipHeaders.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    }

    // Check for API key presence
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      console.warn('[PROXY WARNING] No X-Api-Key header found in request');
    } else {
      console.log('[PROXY] X-Api-Key is present (length: ' + apiKey.length + ')');
    }

    // Explicitly set content-type if missing for POST/PUT
    if (!headers['content-type'] && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      headers['content-type'] = 'application/json';
    }

    // Prepare fetch options
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    // Add body for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // req.body is already parsed by Vercel if content-type is json
      if (req.body) {
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);

    console.log(`[PROXY] Upstream Response: ${response.status} ${response.statusText}`);

    // Get response body as text (can be JSON or other)
    const data = await response.text();

    // Copy response headers
    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Pulse-Proxy-Debug', 'true');

    return res.status(response.status).send(data);

  } catch (error) {
    console.error('[PROXY ERROR]', error);
    return res.status(500).json({
      error: 'Proxy failed',
      details: error.message,
      stack: error.stack
    });
  }
}
