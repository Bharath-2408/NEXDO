import type { IncomingMessage, ServerResponse } from 'http';
import { handleNexdoApiRequest } from '../src/backend/router';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key, X-Signature');
    res.end();
    return;
  }

  try {
    let bodyData: any = (req as any).body;
    if (bodyData === undefined && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      let bodyStr = '';
      for await (const chunk of req) {
        bodyStr += chunk;
      }
      try {
        bodyData = bodyStr ? JSON.parse(bodyStr) : undefined;
      } catch {
        bodyData = bodyStr;
      }
    }

    const apiRes = await handleNexdoApiRequest({
      method: req.method || 'GET',
      url: req.url || '/',
      body: bodyData,
      headers: req.headers as Record<string, string>,
    });

    for (const [key, val] of Object.entries(apiRes.headers)) {
      if (val) {
        res.setHeader(key, val);
      }
    }
    res.statusCode = apiRes.status;
    res.setHeader('Content-Type', 'application/json');
    res.end(apiRes.body !== undefined && apiRes.body !== null ? JSON.stringify(apiRes.body) : '');
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err?.message || 'Internal Server Error' }));
  }
}
