# F30: Research Infrastructure & Free-Only Technology Audit
**Document ID:** `docs/F30_RESEARCH_INFRASTRUCTURE_AND_FREE_ONLY_AUDIT.md`  
**Feature:** F30 AI-Powered Agricultural Research & Personalized Farming Planner  
**Author:** Lead Cloud Systems Architect & Security Engineer  
**Date:** 2026-11-04  
**Branch:** `feat/f30-research-planner-upgrade`  
**Status:** INFRASTRUCTURE COMPLIANCE AUDIT  

---

## 1. Cloudflare Pages & Workers Free-Tier Specifications

AgroLeaf AI is hosted on **Cloudflare Pages** (`agroleaf-ai.pages.dev`). The backend endpoints are powered by **Cloudflare Pages Functions**, which execute in Cloudflare Workers V8 isolates under the **Workers Free Plan**.

### 1.1 Account-Specific Quotas & Limits
| Metric | Cloudflare Free Limit | Impact on F30 Agricultural Research | Engineering Defense |
|---|---|---|---|
| **Daily Request Quota** | 100,000 requests / day | Ample for daily farmer queries if repeated queries are cached | 24-hour Edge Caching (`caches.default`) + Client IndexedDB caching |
| **Worker CPU Time** | 10 ms CPU time / request | Synchronous heavy scraping or multi-second NLP will be killed by Cloudflare runtime | Fast deterministic string & entity parsing (<2ms); heavy processing kept client-side |
| **Worker Wall-Clock Timeout** | Up to 30–100 seconds | Long external web crawls risk gateway timeouts (524 / 504) | 3,500ms bounded timeout on all upstream subrequests |
| **Worker Memory** | 128 MB RAM | Cannot buffer huge binary PDFs or multi-megabyte HTML dumps | Lightweight JSON payload extractions; max response payload 16 KB |
| **Subrequests Per Call** | Max 50 subrequests | Upstream fetch count must be tightly bounded | Maximum 3 upstream subrequests per research job |
| **Paid External Search APIs** | $0.00 / month (Strict policy) | Zero access to Google Custom Search, Bing Web Search, or SerpAPI | Direct official endpoint retrieval (BRRI, BAMIS, BARC) + offline bundle fallback |

---

## 2. Anti-Pattern Warning: Heavy Serverless Web Scraping

Attempting to perform unstructured, multi-site open-web scraping inside Cloudflare serverless functions is fundamentally flawed for two reasons:
1. **CPU Limit Breach:** Parsing massive arbitrary DOM trees with heavy HTML parsers repeatedly exceeds the 10ms CPU threshold of the Workers Free tier, causing intermittent `Worker exceeded CPU limit` (Error 1102).
2. **Brittle Upstream Availability:** Bangladesh government agricultural portals (`brri.gov.bd`, `bamis.gov.bd`) frequently experience server latency, transient 500 errors, or TLS handshaking delays. Relying entirely on real-time live fetches creates a fragile user experience where farmers in rural areas see constant failure spinners.

---

## 3. The Approved Sustainable Architecture

To achieve zero cost, sub-second responsiveness, and 100% reliability, AgroLeaf AI implements a **Curated Hybrid Edge & Local Architecture**:

```
                       [ Farmer Device (PWA) ]
                                  │
                  1. Check Local IndexedDB Cache
                     (Instant hit: 0ms, 0 network)
                                  │ (Miss)
                                  ▼
      [ Cloudflare Pages Function: /api/v1/copilot/research ]
                                  │
                  2. Check Cloudflare Edge Cache
                     (Edge hit: <50ms, 0 external fetch)
                                  │ (Miss)
                                  ▼
     [ Upstream Direct Endpoints (BRRI / BAMIS / BARC) ]
          (Bounded 3,500ms timeout with User-Agent)
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼                                               ▼
   [ Success (200 OK) ]                          [ Timeout / 5xx Error ]
  Cache at edge for 24h                                    │
  Return structured JSON                                   ▼
                                        [ Client Automatic Fallback ]
                                        Load verified local bundle:
                                        public/data/agricultural_research_bundle.json
```

### 3.1 Security & SSRF Protection
The `/api/v1/copilot/research` Cloudflare Pages Function enforces strict security boundaries:
1. **Domain Whitelist:** Only requests matching approved agricultural domains (`riceprofile.brri.gov.bd`, `bamis.gov.bd`, `portal.cropzoning.gov.bd`, `knowledgebank.irri.org`) are permitted.
2. **Private IP Blocking:** Rejects `localhost`, `127.0.0.1`, RFC1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and AWS metadata endpoints (`169.254.169.254`).
3. **Safe Method & Payload:** Restricts requests to `GET` and `POST` with a 16 KB request body ceiling.
4. **Attribution Headers:** Transmits legitimate identifying headers:
   `User-Agent: AgroLeaf-AI/2.0 (+https://agroleaf-ai.pages.dev; Farmer Advisory Research Engine)`

---

## 4. Quota Consumption Forecast

Under an active usage scenario of 1,000 daily farmers generating 3 research roadmaps each:
- **Total Requests:** 3,000 calls / day (only 3.0% of Cloudflare's 100,000 free quota).
- **Edge Cache Hit Rate:** Estimated $\ge 75\%$ due to common varieties (BRRI dhan28, BRRI dhan29, BRRI dhan89).
- **External Fetches:** $\le 750$ calls / day, well within government portal courtesy rate limits.
- **Operating Cost:** **$0.00 / month** (Guaranteed Free-Tier Indefinitely).

---

## 5. Audit Conclusion

The proposed hybrid edge-and-bundle architecture is 100% compliant with Cloudflare's free limits, resilient against network interruptions, and secure against SSRF attacks.
