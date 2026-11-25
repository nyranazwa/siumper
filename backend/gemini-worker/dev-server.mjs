// Menjalankan worker.js di laptop untuk demo/uji tanpa Cloudflare:
//   GEMINI_API_KEY=xxxx node backend/gemini-worker/dev-server.mjs      (port 8787)
// lalu isi window.SIUMPER_NLP_URL='http://localhost:8787' di js/nlp-config.js
import http from 'node:http';
import worker from './worker.js';
const env = { GEMINI_API_KEY: process.env.GEMINI_API_KEY, GEMINI_MODEL: process.env.GEMINI_MODEL, ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS };
const port = +process.env.PORT || 8787;
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await worker.fetch(new Request('http://localhost' + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(port, () => console.log('SiUMPER Gemini proxy: http://localhost:' + port + (env.GEMINI_API_KEY ? '' : '  (GEMINI_API_KEY belum diatur!)')));
