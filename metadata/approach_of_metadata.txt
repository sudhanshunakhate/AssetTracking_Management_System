System Prompt: AI-Maintained Project Metadata System (v2.0)
PURPOSE

You maintain a /metadata directory alongside the source code. Its job is to let any AI agent (including a future you, with no memory of this session) answer "where is X and how does it work" without reading the whole repo — by reading a small, structured metadata file first, then jumping straight to the exact file/lines needed.

Metadata is a means to save tokens and time, not an end in itself. If maintaining metadata for something costs more effort than just reading the code would, don't create metadata for it. Apply this system with judgment, not maximal literalism.

SCOPE: What gets tracked vs. what doesn't

Track metadata for things a future agent would otherwise have to search for:

Features (user-facing capabilities)
Modules/folders (what they're for, what depends on them)
API endpoints, DB tables/schemas
Non-trivial components/pages (ones with real logic, state, or API calls)
Architecture decisions
Cross-cutting workflows (auth flow, checkout flow, etc.)

Do NOT create a metadata file for:

Presentational components with no logic (a <Badge> that just renders a colored span)
Trivial utility functions (a one-line formatter)
Anything where the code itself is shorter than the metadata describing it

Rule of thumb: if you'd need more than 30 seconds to explain the thing's purpose, it deserves a metadata entry. If not, skip it. When unsure, skip it — you can add it later when it stops being trivial.

METADATA FOLDER STRUCTURE

Keep it flat and shallow. Don't create empty directories in advance.

metadata/
  project.json          # one-time: stack, architecture style, conventions
  features/
    <feature-id>.json
  modules/
    <folder-path-slug>.json
  api/
    <endpoint-slug>.json
  db/
    schema.json          # single file, all tables — don't split unless huge
  decisions/
    <ADR-number>-<slug>.json
  changelog.json          # single running log, newest entries on top
  index.json              # the "table of contents" — see below

Create a subfolder only when you actually have ≥1 file to put in it. Don't pre-scaffold empty categories "for later."

FILE SCHEMAS (concrete, not descriptive)
metadata/index.json — always read this first
json
{
  "features": { "auth-login": "features/auth-login.json" },
  "modules": { "src/components/auth": "modules/components-auth.json" },
  "api": { "POST /api/login": "api/post-login.json" },
  "db_tables": ["users", "sessions"],
  "last_updated": "2026-07-29T00:00:00Z"
}
metadata/features/<id>.json
json
{
  "id": "auth-login",
  "status": "done | in-progress | planned",
  "description": "One or two sentences.",
  "files": ["src/pages/Login.tsx", "src/api/auth.ts"],
  "api_endpoints": ["POST /api/login"],
  "db_tables": ["users", "sessions"],
  "depends_on": [],
  "notes": "Anything a future agent needs to not re-break.",
  "updated": "2026-07-29"
}
metadata/modules/<slug>.json
json
{
  "path": "src/components/auth",
  "purpose": "Login/signup UI components.",
  "key_files": {
    "LoginForm.tsx": "Handles login form + client validation, calls POST /api/login"
  },
  "depends_on": ["src/api/auth.ts"],
  "used_by": ["src/pages/Login.tsx"],
  "updated": "2026-07-29"
}
metadata/api/<slug>.json
json
{
  "endpoint": "POST /api/login",
  "file": "src/api/auth.ts",
  "auth_required": false,
  "request": { "email": "string", "password": "string" },
  "response": { "token": "string" },
  "errors": ["401 invalid credentials", "429 rate limited"],
  "db_tables": ["users", "sessions"],
  "updated": "2026-07-29"
}
metadata/decisions/<n>-<slug>.json
json
{
  "id": "ADR-003",
  "problem": "...",
  "decision": "...",
  "reason": "...",
  "tradeoffs": "...",
  "date": "2026-07-29"
}

No file-level or function-level metadata by default. Line numbers and per-symbol JSON entries are explicitly not maintained — they go stale the moment anyone edits a file, and grep/AST search finds them faster than any registry would. If you need to locate a symbol, search the code directly; that's what it's for.

WORKFLOW: When to read/write metadata
Starting any task
Read metadata/index.json.
Read the specific feature/module/api files relevant to the task — not all of them.
Only read actual source code once metadata tells you which files matter.
If metadata doesn't cover the area at all (new/untracked part of the codebase), read the code directly and treat this as an opportunity to add metadata after.
After completing and the user accepts a change

Update only what actually changed:

The specific feature/module/api JSON file(s) touched.
index.json if a new feature/module/endpoint was added.
changelog.json — one line, e.g. "2026-07-29: added rate limiting to POST /api/login".

Do not regenerate unrelated metadata files "to be safe." Do not touch decisions/ unless an actual architectural decision was made this task.

Never do a full-repo metadata rebuild unless:
The user explicitly asks for it, or
Metadata is missing/corrupted for something you need right now.
GUARDRAILS (the part that keeps this sustainable)
Metadata updates are a final step, not a parallel activity. Finish the actual code change and confirm it works, then update metadata in one pass.
One JSON file per concept, updated in place — don't create a new versioned file per change; overwrite with an updated "updated" date.
If a task is small (typo fix, style tweak, renaming a local variable), skip metadata updates entirely. Reserve metadata work for changes that alter a feature's behavior, an API's contract, or a module's structure.
Don't ask permission to read metadata (it's cheap and expected), but do flag it to the user if you're about to do a full-repo scan because metadata didn't cover something — that's a signal metadata coverage has a gap, not a normal step.
If you notice metadata and code have drifted apart (metadata describes something the code no longer does), fix the metadata as part of your next edit to that area — don't do a special pass just for this unless asked.
PROJECT INITIALIZATION (new project only)
Create /metadata with just project.json and index.json (empty features/modules maps).
As you build each feature, add its entry. Don't pre-write metadata for features that don't exist yet.
project.json — stack, folder conventions, naming conventions, one-time facts:
json
{
  "stack": "Next.js 15, Postgres, Prisma",
  "conventions": {
    "folders": "feature-based under src/features/*",
    "api_style": "REST, camelCase JSON"
  }
}