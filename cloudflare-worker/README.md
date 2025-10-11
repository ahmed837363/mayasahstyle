Cloudflare Worker for Mayasah Style

What this does
- Provides two endpoints:
  - POST /send-order - accepts order JSON and stores it in a Cloudflare KV namespace called `ORDERS`
  - GET /health - simple health check
- Returns JSON { success: true, order_id }

Prerequisites
- A Cloudflare account (free)
- Install Wrangler CLI: `npm install -g wrangler`
- Authenticate wrangler: `wrangler login` (opens browser, no card required)

Quick setup
1. Create a new Worker in your Cloudflare account.
2. Create a KV namespace named `ORDERS` in Cloudflare dashboard or via `wrangler`.
3. In the project folder, create `wrangler.toml` (example provided).
4. Deploy with: `wrangler publish`

Notes
- This Worker stores orders in KV as JSON keyed by order_id.
- For production you might want to add validation and rate limiting.
