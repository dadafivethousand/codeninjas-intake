# Code Ninjas Woodbridge — Intake Form

Standalone lead-capture form (React + Vite) deployed on **Cloudflare Pages**.
Submissions are stored in a dedicated Cloudflare **KV** namespace (`CN_LEADS`),
separate from the gyms' worker.

## Stack
- Frontend: React + Vite (builds to `dist/`)
- Backend: Cloudflare Pages Functions in `functions/api/`
  - `POST /api/lead` — validates and stores a lead
  - `GET  /api/leads?key=SECRET` — lists stored leads (protected)
- Storage: KV namespace `CN_LEADS`

## Develop
```bash
npm install
npm run dev            # frontend only
# full stack (functions + KV) locally:
npx wrangler pages dev -- npm run dev
```

## Deploy
```bash
npm run build
npx wrangler pages deploy dist --project-name codeninjas-intake
```

## Viewing leads
Any of:
- Cloudflare dashboard → Workers & Pages → KV → `CN_LEADS` → browse keys
- CLI: `npx wrangler kv key list --namespace-id f4b730169b5c4004a2b04191391fb058`
- Admin endpoint: set a secret once, then visit `/api/leads?key=YOUR_SECRET`
  ```bash
  npx wrangler pages secret put ADMIN_KEY --project-name codeninjas-intake
  ```

Lead record shape:
```json
{ "firstName": "", "lastName": "", "email": "", "phone": "", "createdAt": "", "source": "codeninjas-intake" }
```
