# Implementation backlog (prioritised)

Estimates are [E] for one agent who knows the repo; they include tests but not waiting for reviews.

| Priority | ID | Task | Agent | Effort | Difficulty | Skills | Depends on | Deliverable | Definition of done |
|---|---|---|---|---|---|---|---|---|---|
| 0 | T0.1 | Approve contracts (schema, API, ownership) | Owner + Claude | 1 h | Easy | Review | — | Approved docs | Owner says go |
| 0 | T0.2 | Prove Pages Functions on the preview (`/api/v1/health`) | Claude | 1–2 h | Easy | Cloudflare | T0.1 | Live health endpoint on the preview | `curl` returns `{ok:true}`; root-dir setting recorded |
| 0 | T0.3 | Frontend foundation: dependencies, store + outbox, feature stubs mounted, routes, per-feature i18n | Claude | 4–6 h | Medium | React, IndexedDB | T0.1 | Foundation PR | Tests, lint, build green; existing live E2E unchanged |
| 0 | T0.4 | API foundation: middleware (errors, device auth, rate limit, Turnstile), D1 migration, `wrangler.toml` | Claude | 4–6 h | Medium | Workers, SQL | T0.2 | API skeleton | Handler unit tests; migration applies on a preview D1 |
| 1 | T9 | F9 offline PWA (incl. Track 7 fix) | OpenCode | 2–3 d | Medium | Service workers | T0.3 | PWA branch | Airplane-mode script passes on Chrome desktop (with throttling) **and** a real Android phone (owner) |
| 1 | T14 | F14 reliability bands | Claude | 2–3 d | Medium | Calibration, UI | T0.3 | Bands + measured accuracy | No raw %; bands checked on the frozen test |
| 1 | T16 | F16 local history | Cline | 2 d | Easy–Med | React, IndexedDB | T0.3 | History page | Offline; no network; delete works; prune rule |
| 1 | T21 | F21 profile | Kilo | 1 d | Easy | React forms | T0.3, Kilo provider | Profile page | Optional fields only; delete |
| 1 | T8 | F8 weather awareness | Cline | 2–3 d | Medium | fetch, rules | T0.3 | Weather chips | Rule tests; sources cited; attribution; offline cache |
| 1 | T13.a | F13 data (R10c → dedup → audit) | Antigravity | 3–5 d | Hard | Data engineering | — | `dedup_keep.csv`, `SUMMARY.md` | 0 test-set leaks; per-class counts |
| 1 | R11 | Robust preprocessing | Antigravity | 1–2 wk | Hard | CV, eval | — | R11 report | R11 gate |
| 2 | T20 | F20 feedback + review | OpenCode | 3–4 d | Medium | React, Workers, D1, R2 | T0.4, T9 | Feedback flow | Idempotent; abuse limits; reviewer behind Access |
| 2 | T22 | F22 v1 help sheet + case summary | Kilo | 1–2 d | Easy | React, Web Share | T0.3, T14 | Help sheet | User-initiated share; no extra data |
| 2 | T10 | F10 rule-based action plan | Claude | 2–3 d | Medium | Content rules | T14, T8, T21 | Plan card | Sources per step; no doses |
| 2 | T23.a | F23 area API + aggregation | Claude | 1–2 d | Medium | SQL | T0.4 | Endpoints | Alert rule enforced; k-anonymity |
| 2 | T13.b | v11 training + gate + registry | Claude | 3–5 d | Hard | ML | T13.a | v11 decision | Written protocol; frozen-test result; rollback |
| 3 | T23.b | F23 map UI | Antigravity | 2–3 d | Medium | Leaflet, GeoJSON | T23.a, T21, boundary licence | Map page | Offline render; consent; no coordinates |
| 3 | T-INT | Integration, regression, deploy | Claude | 2–3 d | Medium | — | all | Release | All live E2E pass on the preview, then production after the rules check |
| Later | F22 v2 | Expert inbox | — | 3 d | Medium | — | Verified experts | — | Only with real, consenting reviewers |
| Later | F8+ | Push alerts (Web Push) | — | 2 d | Medium | — | T9 | — | Installed-PWA only; opt-in |
| Later | F14+ | OOD score research | Claude | 2 d | Hard | ML | T14 | — | Beats the `not_rice` output on validation |

**Can start immediately, without the foundation:** T13.a and R11 (Antigravity), because they touch only data and ML folders.
**Blocked until the foundation is merged:** every UI or API feature task.
**Blocked by people or information:** F22 v2 (real experts), the F23 alert threshold and boundary licence, agronomist review of F8 ranges and F10 wording, and Kilo's model provider.
