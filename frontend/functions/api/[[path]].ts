// Proxy /api/* to Cloud Run
export async function onRequest({ request, params, env }: any) {
  const incoming = new URL(request.url);

  // Set in Pages → Settings → Environment variables (e.g., https://fastapi-xxxxx-uc.a.run.app)
  const base = new URL(env.API_BASE_URL);

  // If your FastAPI app expects paths WITHOUT the /api prefix, strip it:
  base.pathname = `/${params.path ?? ""}`;

  // If your FastAPI app actually expects the /api prefix, use this instead:
  // base.pathname = `/api/${params.path ?? ""}`;

  base.search = incoming.search;

  // Clone request (stream body if not GET/HEAD)
  const init: RequestInit = {
    method: request.method,
    headers: new Headers(request.headers),
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
  };

  // Avoid leaking the original Host
  (init.headers as Headers).set("host", base.host);

  // Optional: add your own auth header to backend
  // (init.headers as Headers).set("x-origin", "pages");

  const resp = await fetch(base.toString(), init);

  // Pass through response (streaming)
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: resp.headers,
  });
}

