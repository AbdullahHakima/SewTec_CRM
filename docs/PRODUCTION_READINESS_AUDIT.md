# SewTec CRM production-readiness audit

Audit date: 2026-09-14 (Africa/Cairo)  
Scope: current local working tree; Next.js frontend, ASP.NET Core API, SQLite persistence, authentication, authorization, Arabic RTL/mobile behavior, operator migration and recovery controls.  
Environment verdict: **local hardening is substantially complete, but this repository is not yet approved for its first production deployment.** No deployment or physical-phone verification was performed.

## Readiness decision

All critical and high application-code findings identified in the audit have an implemented fix and automated regression evidence. The backend access matrix, company-wide phone identity constraint, transactional workflows, stale-write handling, account/session controls, pagination, browser-state isolation, mobile interaction alternatives, and operator-only database procedures are in place.

Three acceptance items still block a production declaration:

1. The isolated copy of the existing development database contains invalid phone data for `cust_01` and `cust_02`. The migration correctly stopped before changing any record. An operator must review and correct those source values, rerun the preflight on another copy, and then perform the documented migration drill. The application never merges or fabricates phone data automatically.
2. The final slow-network lab profile does not meet the requested mobile LCP target. The current median LCP is 3.54 seconds under 4× CPU throttling, 150 ms latency, 1.6 Mbps download, disabled cache, and a fresh browser context. CLS and interaction targets pass. This is a performance acceptance gap, not a data-integrity or authorization defect.
3. Hosting-specific HTTPS, secret injection, persistent-volume restart, proxy behavior, backup/restore, rollback, monitoring, and physical Android/iPhone journeys remain untested because the system is still local.

The full action-to-API mapping is in [FEATURE_ACCESS_MATRIX.md](FEATURE_ACCESS_MATRIX.md). Deployment, migration, merge, backup, restore, and rollback procedures are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Severity scale

| Severity | Meaning |
|---|---|
| Critical | Cross-account data exposure, unrestricted privileged operation, or broad database disclosure. |
| High | A practical account, integrity, duplicate, transaction, or migration failure that can materially affect production records. |
| Medium | A material UX, performance, defense-in-depth, reporting, or operability gap without a demonstrated cross-account data path. |
| Low | Maintainability or polish issue with limited production impact. |

## Findings and remediation evidence

| ID / severity | Affected location and reproduction before remediation | Impact | Implemented fix | Verification status |
|---|---|---|---|---|
| SEC-01 / Critical | API controllers previously trusted caller-supplied branch/assignment fields and did not consistently scope child collections or direct IDs. A rep could request records outside their assignment, and reports/searches did not share one access rule. | Customer, opportunity, follow-up, interaction, activity, and installed-machine data could cross user or branch boundaries. | `Security/CurrentUser.cs`, `Data/CrmDbContext.cs`, `Data/CrmDbContext.Integrity.cs`, and every relevant controller now use authenticated account identity, EF query filters, relationship-based child scoping, branch assignment validation, and server-stamped actor/owner fields. Catalog reads remain shared only for authenticated users. | **Resolved.** HTTP matrix tests cover anonymous, rep A, rep B, another branch, forged fields, direct child/customer IDs, search, reports, imports, mentoring, monitoring, and account actions. |
| SEC-02 / Critical | Registration and sensitive account changes were not consistently restricted; a newly registered user response could include a token that effectively switched identity. | Unauthorized account creation or accidental impersonation; weak admin boundaries. | `AuthController.cs`, `UsersController.cs`, and `UserDirectoryController.cs` close anonymous registration, return account metadata without an impersonation token, permit only `admin`/`rep`, scope admins to their branch, protect the final active branch admin, and require owned-work reassignment before removal. | **Resolved.** Admin/rep/anonymous and cross-branch tests pass; account-safeguard integration tests pass. |
| SEC-03 / High | A disabled, renamed, role-changed, or password-reset account could retain an already issued session. Browser CRM state could also survive an identity transition. | Former permissions or another user’s in-memory records could remain active. | `AppUser.SessionVersion`, backend token validation, and account mutations rotate the session version. `api-client.ts`, `auth-context.tsx`, and `crm-store.ts` validate `/auth/me`, clear CRM data on identity changes, reject delayed responses from an old session epoch, and synchronize logout through storage/session events. Corrupt legacy CRM storage is discarded. | **Resolved.** Revoked-token integration test, empty-session tests, delayed-response guards, and the two-tab browser logout journey pass. |
| SEC-04 / Critical | Demo reset, database download, automatic demo seeding, or fallback JWT configuration could expose or replace records in an incorrectly configured environment. | Whole-company data disclosure or destructive reset; predictable production authentication. | `DemoController.cs` and `SystemController.cs` return 404 for application reset/backup routes. Migrations and bootstrap are explicit operator commands. Production requires a strong JWT key and explicit `AllowedHosts`; demo seed is Development-only and command-gated. Login rate limiting, bounded errors/logs, restricted origins, and security response headers were added in `Program.cs` and `next.config.ts`. | **Resolved for local code/config.** Production security tests, direct 404 tests, header checks, and missing-production-config tests pass. Host proxy/TLS acceptance remains open. |
| DATA-01 / High | Customer phone checks were application-only and did not normalize Arabic digits, punctuation, or equivalent Egyptian local/international prefixes across both phone fields. Concurrent requests could race. | Duplicate customers and conflicting primary/secondary identities. | `CustomerPhone` stores the normalized company-wide identity under a unique database key. `CrmDbContext.ValidatePhone`, customer workflows, and the security migration cover Arabic digits and `01…`, `20…`, `+20…`, and `0020…` equivalents. Structured HTTP 409 responses disclose a matching customer ID only when that customer is visible to the caller. | **Resolved for valid migrated data.** Equivalent formats, primary/secondary collisions, edits, simultaneous creates, scoped disclosure, and database uniqueness tests pass. Existing invalid development data remains an explicit migration blocker. |
| DATA-02 / High | Timestamp-derived IDs, incomplete related-record validation, and multiple independent saves could collide or leave partial state. Repeating follow-up completion or a stage change could duplicate activity and balance effects. | Orphaned, duplicated, or partially committed CRM history and incorrect totals. | New records use collision-resistant GUID-based IDs. `WriteTransactionMiddleware.cs` buffers write responses and commits only for successful results; SQLite writes use an asynchronous in-process queue. Services validate ownership, enums, quantities, amounts, required text, and dates. Completion/import/interaction flows are atomic and repeated transitions are idempotent or conflict. | **Resolved.** Failure-injection tests confirm rollback; repeated completion/stage tests and save/reload browser journeys pass. |
| DATA-03 / High | Concurrent editors could silently overwrite one another. | Lost updates and incorrect pipeline/follow-up state. | Customer, opportunity, and follow-up rows have collision-resistant revision values. `RevisionFilter.cs` requires `If-Match` on edits (428 when absent) and returns a structured 409 when stale. The frontend retains the latest revisions and exposes actionable conflicts. | **Resolved.** Missing and stale revision HTTP tests pass. |
| DATA-04 / High | Startup schema patching and implicit initialization offered no auditable legacy baseline, conflict gate, or restoration evidence. | Partial or unsafe upgrades to the only SQLite file. | Versioned EF migrations now define a legacy baseline, security/phone identities, and durable actor IDs. `DatabaseUpgrade.cs` supports report-only preflight, schema comparison before legacy baselining, SQLite backup, integrity check, and a `.upgrade.json` result. `tools/reviewed_customer_merge.py` requires a review token, preserves provenance, reparents related rows transactionally, and makes its own backup. | **Resolved in tooling; blocked on source data review.** Fresh-schema/migration tests and merge backup/restore tests pass. The copied development DB stopped on two invalid phones exactly as designed. |
| DATA-05 / Medium | Team/mentoring aggregation depended on display names, so renaming a user could detach historical activity. | Incomplete or misattributed performance and mentoring reports. | Interactions, activities, and mentoring notes now persist actor/rep IDs; the migration backfills only unambiguous name matches. `TeamQueryService.cs` groups by durable IDs and the upgrade report exposes unmapped historical rows for review. User renames propagate denormalized customer assignment labels. | **Resolved for new data.** Rename regression and reporting tests pass. Nonzero future upgrade-report counts require operator review. |
| API-01 / High | Large endpoints returned whole collections and the browser calculated broad totals locally. | Increasing latency, memory use, and accidental over-fetch across scoped data. | Customers, opportunities, follow-ups, and catalog return a stable paged contract with SQL filtering, total count, and scoped summary. Search is capped and server-scoped. Product pages use stable sorting and full-catalog summary queries without returning every product. | **Resolved.** Stable/disjoint page tests, filters, totals, scoped summaries, and frontend consumers pass. |
| UX-01 / High | Normal authenticated operation could accept demo/local-storage state; forms sometimes closed or announced success before a confirmed server save, and some failures used `alert`, `prompt`, or console-only handling. | Apparent success after failed writes, lost form input, data leakage between users, and poor recovery. | The backend is the data source of truth. CRM state is session-memory only, empty server results are accepted, writes are awaited, repeat submissions are blocked, input remains after failure, and Arabic inline errors/retry controls are used. Follow-up rescheduling now uses an accessible Cairo date/time sheet. | **Resolved.** Failed-save preservation/retry and create/edit/machine persistence browser journeys pass after fresh navigation/reload. |
| UX-02 / High | Mobile layouts contained dense tables, drag-dependent opportunity movement, small controls, modal/keyboard risks, and crowded information. | Core tasks could be unreachable or error-prone on phones. | Customer cards are the default, navigation and action areas are compact, forms use bottom-sheet behavior and 16 px inputs, touch targets target 44×44 CSS px, horizontal overflow is constrained, and opportunities expose a tap-based stage/details action. Secondary information moved behind dialogs, tabs, and details surfaces. | **Resolved in emulation.** Thirty-five route/form surfaces were exercised at 360/390/430/768/1440 px in each light/dark confirmation batch, with RTL and no page-wide overflow or runtime errors in the recorded run. Physical phone acceptance remains open. |
| A11Y-01 / Medium | Dialog focus, loading/error/empty states, dark contrast, motion, Arabic clipping, and accessible action names were inconsistent. | Keyboard, low-vision, and slow-network users could miss state or actions. | Shared modal focus/escape behavior, list status, inline alerts, empty states, skip link, focus styles, reduced-motion rules, theme contrast corrections, accessible labels, and responsive text controls were applied. The initial customer loading state is distinct from a genuine empty result. | **Substantially resolved.** Batched axe/geometry inspections informed deterministic fixes. Those final contrast edits compiled and passed functional tests; per the bounded UI-audit process, a further screenshot/axe loop was not run. Physical keyboard/screen-reader confirmation remains an acceptance item. |
| PERF-01 / Medium | Initial pages loaded broad state and eager dialog/table code; list hooks also added an unconditional delay. | Slow first useful paint and delayed interaction on mobile. | Session restore renders a data-empty authenticated shell while `/auth/me` validates in parallel; large drawers/search/table code is dynamically loaded; initial list requests are immediate while text search remains debounced; server paging replaces whole-database reads; false empty states and duplicate subtitle totals were removed. | **Partially resolved.** 10k API p95 and interaction/CLS targets pass. Slow-profile median LCP remains 3.54 s versus the requested 2.5 s and is an open acceptance gap. |
| DEF-01 / Medium | Production CSP was absent. | Weaker browser-side defense if markup/script injection is introduced later. | API and frontend set CSP, frame denial, no-sniff, no-referrer, permissions policy, and API no-store. No `dangerouslySetInnerHTML` use was found. | **Mitigated.** Current static Next build still requires `'unsafe-inline'` for scripts/styles. A nonce-based CSP is recommended during hosting work if dynamic rendering/caching tradeoffs are accepted. |

## Functional and persistence verification

The feature matrix records each visible action, its HTTP method, stored tables, rep/admin behavior, and acceptance evidence. Key persistence proof includes:

- customer creation survives direct navigation and browser reload;
- customer notes survive a fresh reload;
- an installed-machine quantity of two is stored once and confirmed by a new API query;
- failed customer creation retains the form and shows the server error, then succeeds on a safe retry;
- follow-up completion updates follow-up/customer state and creates interaction/activity/optional retry in one transaction;
- opportunity win/reopen changes reconcile customer pipeline and lifetime totals;
- catalog imports roll back when a row is invalid;
- account changes invalidate previous tokens;
- cross-tab logout removes the authenticated workspace;
- a rep cannot access another rep’s direct IDs, related history, reports, or forged assignments.

The browser evidence uses `artifacts/browser-test.db`, a disposable SQLite fixture. The real `backend/sewtec_crm.db` was not migrated or used for write verification.

## Performance evidence

### API load profile

Profile: Windows local ASP.NET TestServer pipeline, file-backed SQLite, 10,000 customers plus 30,000 related rows, 20 distinct users, 200 paged reads, and 40 creates. Login/setup are excluded. This does not include network sockets, TLS, reverse proxy, disk characteristics of a future host, or multiple API processes.

| Operation | p50 | p95 | Maximum | Requested local target |
|---|---:|---:|---:|---:|
| Paged routine reads | 120.9 ms | 236.9 ms | 299.1 ms | p95 < 500 ms — **pass** |
| Single-customer writes | 164.1 ms | 227.7 ms | 232.3 ms | p95 < 500 ms — **pass** |

SQLite is adequate for this measured single-process profile. Reassess with the eventual filesystem, proxy, backups, write mix, and concurrency before changing database platforms or adding API replicas.

### Mobile browser lab profile

Profile: Microsoft Edge headless, 390×844 touch emulation, Arabic locale, Africa/Cairo timezone, 4× CPU throttle, 150 ms latency, 1.6 Mbps download, 0.75 Mbps upload, disabled cache, fresh contexts, local production Next build, and an isolated small fixture. Event Timing values are laboratory interaction durations and are not field INP. Emulation is not a physical-device test.

The final three-run artifact records LCP values of 3.428, 3.536, and 3.608 seconds (median 3.536 seconds), CLS of 0 in all three runs, and a maximum measured interaction duration of 152 ms. The traced LCP element is the customer-page subtitle and the profile transfers roughly 0.62 MB of resources. The client-authenticated architecture cannot server-render private customer content from a local-storage bearer token; additional LCP work should be based on a real deployment trace and may require a server-readable, HttpOnly session design rather than cosmetic loading-screen changes.

## Automated and visual evidence

| Check | Result |
|---|---|
| Backend integration/unit suite | 53 passed, 0 failed, excluding the opt-in performance test |
| Frontend scripted suites | All four scripts passed (core mutations, acceptance journeys, catalog, edge/failure cases) |
| Type checking | Passed through the final Next production build |
| ESLint | 0 errors, 0 warnings after cleanup |
| Next.js production build | Passed; all application routes generated |
| npm dependency audit | 0 vulnerabilities at all severities |
| NuGet vulnerability check | No vulnerable direct or transitive packages reported by configured sources |
| Browser core journeys | 5/5 passed against the latest isolated API/UI build |
| API probes/contracts | `/health` 200, `/ready` 200, paged catalog returned 5 requested items out of 15, security headers present |
| Responsive/theme batch | 70 light/dark route/form surface cases across 360, 390, 430, 768, and 1440 px; recorded geometry had no page-wide horizontal overflow |
| Reviewed merge tool | Proposal/token/apply/backup/restore/integrity regression passed |

Generated JSON, databases, screenshots, and audit logs under `artifacts/` are local evidence and are ignored by git because they may contain test identifiers or copied CRM data.

## UI audit score

The hardened local UI scores **16/20 (Good)** for this audit: accessibility 3/4, performance 2/4, responsive behavior 4/4, theming 3/4, and code integrity 4/4. The deductions reflect the unconfirmed final contrast pass/physical accessibility check, the slow-profile LCP miss, and the need to verify themes on physical devices. The static detector’s remaining gray-on-color warning concerns nested inactive text classes overridden by the active red tab state; it was reviewed as implementation-specific rather than a visible failure.

## Required release gate

Do not declare production readiness until all of the following are recorded:

- the two invalid development phone records are reviewed and corrected at the source;
- report-only, baseline/migration, `.upgrade.json`, record counts, authentication, access matrix, and core journeys pass on a fresh database copy;
- a backup made with SQLite’s backup API restores successfully on the intended host and rollback is rehearsed;
- production secrets, exact `AllowedHosts`, HTTPS/HSTS, proxy/IP trust, persistent storage, liveness/readiness, logs, alerts, and restart behavior are verified;
- the LCP target passes under an agreed deployment browser/network profile, or the product owner explicitly accepts a documented threshold with field monitoring;
- physical Android and iPhone runs cover login, customer save/edit, installed machines, opportunity stage change, follow-up completion/reschedule/no-answer, interaction logging, catalog, and logout in light/dark RTL;
- the exact release commit passes the automated commands in `DEPLOYMENT.md` with no unreviewed database or artifact files included.
