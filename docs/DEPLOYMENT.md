# SewTec CRM — local hardening and future deployment runbook

Status: local development only. No deployment has been performed. Do not treat a successful build as hosting acceptance.

## Configuration and first administrator

Production requires `Jwt__Key` containing at least 32 random bytes, `ASPNETCORE_ENVIRONMENT=Production`, `AllowedHosts` containing the exact public host names, and `ConnectionStrings__DefaultConnection` pointing at durable storage. Never use the development signing key or demo credentials. Store secrets in the hosting secret store, outside git and command-line arguments. `Demo__Enabled` must remain false. Anonymous registration is closed. The Compose template maps `SEWTEC_ALLOWED_HOSTS` and refuses to start without it.

Run the published API from its configuration directory. For an empty database, run `dotnet SewTec.CRM.Api.dll --migrate` as an operator before serving traffic. Set `Bootstrap__Username`, `Bootstrap__Password` (at least 12 characters), `Bootstrap__FullName`, and `Bootstrap__BranchId` through the operator environment, then run `dotnet SewTec.CRM.Api.dll --bootstrap-admin`. Remove those bootstrap variables immediately afterwards. Bootstrap refuses a database that already contains any account. Further users are created by a branch admin through Settings.

The development seed is available only through an explicit Development migration with `--seed-demo`. It is a disposable test fixture and must never be applied to a production database.

## Existing SQLite database migration

1. Stop writes and make a consistent SQLite backup with the SQLite backup API. A raw copy of only the main file while WAL writes are active is not a valid backup procedure.
2. Restore that backup to an isolated copy. Run the new binary against the copy using an explicit connection string and `--migrate --report-only`.
3. Review the generated `.preflight.json` with operator-only file permissions. Invalid Egyptian mobile identities or primary/secondary collisions block migration. Do not silently discard or substitute real phone numbers.
4. For an unversioned legacy database, run `--migrate --baseline-legacy` against the copy. The command compares the legacy schema, writes a backup, records the explicit baseline, applies versioned migrations, and checks integrity. Missing columns block baselining; do not stamp a mismatched schema manually.
5. Verify record counts, customer history, authentication, branch isolation, phone identities, and all core journeys on the migrated copy. Only then repeat the reviewed command on the development database during a write outage.

A successful migration also writes `<database>.upgrade.json`. Review and retain it with the change record. It lists every applied migration, SQLite integrity status, completion time, and historical interaction/activity/mentoring rows whose actor or rep ID could not be mapped unambiguously. Nonzero unmapped counts require an operator review before the related team or mentoring reports can be accepted as complete; names are never guessed when more than one branch account could match.

The actual development database has **not been migrated**. Its isolated copy failed the phone preflight on 2026-09-13. See the local restricted artifact `artifacts/development-upgrade-copy.db.preflight.json`; the original database was preserved.

## Reviewed duplicate merges

`python tools/reviewed_customer_merge.py COPY.db SOURCE_ID TARGET_ID` produces a read-only proposal and a SHA-256 review token. The token binds the source, destination and every related record. Review the original records and intended owner before applying:

```text
python tools/reviewed_customer_merge.py COPY.db SOURCE_ID TARGET_ID --apply REVIEW_TOKEN --reviewer OPERATOR_ID --reason "Reviewed duplicate"
```

The tool creates an independent backup, archives complete original customer/history snapshots inside `OperatorCustomerMergeAudit`, reparents all five related record collections, retains their IDs, reconciles counts, and commits in one transaction. It refuses stale reviews, cross-branch merges, and more than two distinct mobile identities. It never runs automatically. Cross-branch duplicates need a separate reviewed ownership decision; API duplicate detection does not disclose the other branch's customer.

## Backup, restore and rollback

Backups contain all branches, phone numbers and password hashes. Restrict access to operators, encrypt backups at rest, retain several generations off the application host, and document retention/recovery objectives. The application no longer provides whole-database downloads.

For a restore drill, stop the test API, restore a selected backup to a new path through SQLite's backup API, run `PRAGMA integrity_check` and `PRAGMA foreign_key_check`, compare all table counts and history IDs, then start the matching application version against that path. Exercise login and a save/reload journey. The merge regression test performs a backup/restore and validates integrity and pre-merge customer counts. Broader operational recovery drills remain required for the eventual host.

Rollback pairs a previous application artifact with its pre-migration database backup; do not run an older binary against a newer schema. Stop writes, preserve the failed database for investigation, restore to a separate path, verify, then switch the configured database path. Document the potential loss of writes since the chosen backup.

## Future hosting requirements

- Terminate HTTPS at a maintained reverse proxy. Redirect HTTP, enable HSTS only after HTTPS validation, and verify certificate renewal. Publish the frontend on the same origin; proxy `/api` to the API. Do not expose the database or diagnostic files.
- The Compose template binds local ports only. Its database volume is `/app/data`, separate from application binaries. `SEWTEC_JWT_KEY` is mandatory. The frontend build uses `/api` and `BACKEND_INTERNAL_URL=http://backend:5018`. Compose has not been deployed or host-tested.
- Configure explicit CORS origins only if using a separate frontend origin. Configure trusted proxy addresses before relying on forwarded client IPs for rate limiting; never trust arbitrary forwarded headers.
- Run one API process for this measured SQLite workload. Writes queue asynchronously in-process and remain transactional in SQLite. Re-measure before adding replicas or changing the storage filesystem; do not put SQLite on an unvalidated network share.
- `/health` is process liveness. `/ready` requires a reachable database with no pending migrations. Connect both to host monitoring without exposing internals in error responses.
- Run with a nonprivileged service account, operator-only database permissions, structured request logs, rotated logs, and alerts for 5xx, 429, failed readiness and backup failures. Do not log credentials, tokens, request bodies or database contents.
- Verify host-specific secrets, persistence across restarts, recovery, rollback, TLS, real proxy IP behavior and actual Android/iPhone journeys before launch.

## Local verification commands

```text
dotnet test backend.tests --filter Category!=Performance
cd frontend
npm test
npx tsc --noEmit
npm run lint
npm run build
npm audit
```

From the repository root: `python -m unittest discover -s tools -p test_*.py` and `dotnet list backend package --vulnerable --include-transitive`.

For the isolated load profile set `SEWTEC_RUN_LOAD_TEST=1` and an absolute `SEWTEC_LOAD_REPORT` output path, then run `dotnet test backend.tests --filter Category=Performance`. Its 20 users exercise the real HTTP middleware/controllers and file-backed SQLite through ASP.NET TestServer. Socket, TLS, proxy and hosting costs are excluded.
