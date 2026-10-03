# Frontend Next.js MVP Implementation Plan
> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.
**Goal:** Build a separate Next.js frontend that lets a `SUPER_ADMIN` validate the institutional MVP from passkey access through direct enrollment.
**Architecture:** Keep the existing Node backend and static UI running. Add an independent `frontend/` Next.js App Router package; browser requests stay on the Next origin and rewrite `/api/*` to the backend configured by `BACKEND_URL`. Every operation targeting an institution includes `targetTenantId`; the backend remains the source of authorization, validation, and persistence.
**Tech Stack:** Next.js App Router, React, TypeScript, `@simplewebauthn/browser` 14.0.0 (the version currently used by the backend project), CSS/Tailwind styling, Node's built-in test runner, and the existing HTTP API. Use the official `create-next-app` defaults after confirming their exact options against the installed CLI.
## Global Constraints
- Preserve the backend and existing static interface; do not move domain rules to the frontend.
- The UI journey is: authenticate/activate SUPER_ADMIN, create or open institution, people, collaborators, course, PPC subjects, and direct enrollment.
- Every institutional HTTP call includes the current `targetTenantId`; context in the URL or UI does not replace this field.
- Do not add institution-list or general people-list behavior because the backend does not provide those routes.
- Do not store personal data in browser local storage. Keep temporary IDs and current selections in memory; users can re-enter IDs or use existing search/list endpoints after reload.
- Keep course, collaborator, subject, and enrollment updates within the currently implemented API contracts and state transitions.
Test browser-facing behavior through the agreed UI journey separately.
- Keep the six-step sequence legible on mobile, visible keyboard focus, persistent labels, and announced loading/success/error states.
---
## Task 1: Scaffold the frontend and its API boundary
**Files:**
- Create: `frontend/package.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/globals.css`
- Create: `frontend/.gitignore`
- Create: `frontend/.env.example`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/api.test.ts`
- Modify: `README.md`
**Interfaces:**
- `apiRequest<T>(path: string, options?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown }, fetcher?: typeof fetch): Promise<T>` sends same-origin requests with `credentials: 'same-origin'`, JSON headers/body when a body is present, returns `null` for 204, and throws a safe message for non-2xx responses.
- `withTargetTenant<T extends Record<string, unknown>>(targetTenantId: string, operation: T): T & { targetTenantId: string }` adds the selected target after operation data so caller-supplied fields cannot override the target.
- Next.js rewrite: `/api/:path*` → `${BACKEND_URL}/api/:path*`.
- [ ] **Step 1: Add focused failing API-helper tests**
Test that a POST JSON body is sent with same-origin credentials; a PATCH uses its requested method; a 204 response resolves to `null`; a normalized API error becomes a user-safe error; and `withTargetTenant` places the selected ID last even when the operation object contains a conflicting ID.
- [ ] **Step 2: Verify the expected failure**
Run: `node --test --test-isolation=none --test-name-pattern='API client|institution target' frontend/src/lib/api.test.ts`
Expected: the test command cannot resolve the not-yet-created frontend test files or helper exports.
- [ ] **Step 3: Implement the minimal Next.js shell and API boundary**
Create the independent TypeScript App Router package using current `create-next-app` defaults, add the proxy rewrite, implement `apiRequest` and `withTargetTenant`, and create a plain shell that renders the product name and a route-content slot. Do not include sample institutions, people, metrics, or activity.
- [ ] **Step 4: Verify the focused pass**
Run: `npm run test --prefix frontend`
Expected: helper tests pass and use only an injected fetch stub; no server or database starts.
- [ ] **Step 5: Run the affected package checks**
Run: `npm run lint --prefix frontend && npm run build --prefix frontend`
Expected: Next.js compiles the standalone frontend and accepts its type/lint checks with `BACKEND_URL=http://127.0.0.1:3001` configured for the rewrite.
---
## Task 2: Authenticate the platform operator and choose the institution
**Files:**
- Create: `frontend/src/app/access/page.tsx`
- Create: `frontend/src/components/platform-access.tsx`
- Create: `frontend/src/components/institution-onboarding.tsx`
- Create: `frontend/src/lib/platform-auth.ts`
- Create: `frontend/src/lib/platform-auth.test.ts`
- Modify: `frontend/src/app/page.tsx`
**Interfaces:**
- `beginPlatformLogin(username)` calls `POST /api/platform/login/options` and returns WebAuthn options.
- `verifyPlatformLogin(username, response)` calls `POST /api/platform/login/verify`; the session is delivered by the backend cookie through the Next rewrite.
- `getPlatformSession()` and `logoutPlatformSession()` call `GET /api/platform/session` and `DELETE /api/platform/session` to restore and end the session.
- `beginPlatformActivation(username, activationCode)` and `verifyPlatformActivation(username, response)` use `/api/platform/activation/options` and `/api/platform/activation/verify`.
- `createInstitution(input)` calls `POST /api/platform/institutions`; a successful response contains `tenantId`, which navigates to `/institutions/[tenantId]`.
- Opening an existing institution accepts an ID and navigates to `/institutions/[tenantId]`; no institution-search call is made.
- [ ] **Step 1: Add focused failing tests for the access/API contract**
Test that login and activation use the correct two-step route pairs, send username and activation code only to their options request, pass the WebAuthn response only to verification, restore/logout use the session routes, and onboarding sends its scope and first-admin fields to the existing create endpoint.
- [ ] **Step 2: Verify the expected failure**
Run: `node --test --test-isolation=none --test-name-pattern='platform login|activation|institution onboarding' frontend/src/lib/platform-auth.test.ts`
Expected: the access-contract tests fail because the functions and forms do not yet exist.
- [ ] **Step 3: Implement passkey access and institution selection**
Declare `@simplewebauthn/browser` 14.0.0 as a frontend dependency and use it with the established backend request shapes. On load, call the session endpoint and show the authenticated workspace or access screen. Support existing-account activation by one-time code, passkey login, and logout. Do not accept an institutional target before platform authentication. Create the institution with the structured scope DTO; show the returned ID and continue to its route. Provide an explicit existing-institution ID field because the API has no institution-list endpoint.
- [ ] **Step 4: Verify the focused pass**
Run: `npm run test --prefix frontend`
Expected: access and API-contract tests pass with an injected request boundary and no real WebAuthn ceremony.
- [ ] **Step 5: Run package checks**
Run: `npm run lint --prefix frontend && npm run build --prefix frontend`
Expected: login, activation, onboarding, and open-by-ID routes compile without leaking API secrets to client bundles.
---
## Task 3: Implement people, collaborators, courses, and PPC steps
**Files:**
- Create: `frontend/src/app/institutions/[tenantId]/page.tsx`
- Create: `frontend/src/components/institution-journey.tsx`
- Create: `frontend/src/components/step-progress.tsx`
- Create: `frontend/src/components/steps/people-step.tsx`
- Create: `frontend/src/components/steps/collaborators-step.tsx`
- Create: `frontend/src/components/steps/course-step.tsx`
- Create: `frontend/src/components/steps/ppc-step.tsx`
- Create: `frontend/src/lib/academic-api.ts`
- Create: `frontend/src/lib/academic-api.test.ts`
- Modify: `frontend/src/app/globals.css`
**Interfaces:**
- `createPerson(targetTenantId, input)` and `searchPerson(targetTenantId, identifier)` call existing global people endpoints.
- `createCollaborator`, `listCollaborators`, and `updateCollaborator` call the existing collaborator create/search/PATCH endpoints.
- `createCourse`, `listCourses`, and `updateCourse` call existing course create/search/PATCH endpoints.
- `createSubject`, `getCourseDetail`, and `updateSubject` call existing course-detail and subject endpoints.
- Every function uses `withTargetTenant`; typed results expose only fields already returned by the backend.
- [ ] **Step 1: Add failing tests for DTO mapping and target propagation**
Test each helper using injected fetch: create/search people; create/list/toggle collaborator; create/list/rename/deactivate course; create/read/update subject. Assert exact route, method, JSON fields, selected `targetTenantId`, and that IDs/codes are not silently modified. Include a request rejection and verify the helper surfaces a normalized message.
- [ ] **Step 2: Verify the expected failure**
Run: `node --test --test-isolation=none --test-name-pattern='people|collaborator|course|subject' frontend/src/lib/academic-api.test.ts`
Expected: missing API helpers fail before component implementation.
- [ ] **Step 3: Implement the four academic steps**
People supports create and search by CPF or institutional ID. A created/searched person is kept as an in-memory option for later steps. Collaborators support create, list, and active toggle; course supports create, list, name update, and active toggle; PPC supports subject creation, multi-collaborator selection, course detail, and subject update without changing code. Render the approved six-step progress rail, mark only server-confirmed completions, show generated IDs for copy, and keep active step and available actions explicit at desktop and mobile widths.
- [ ] **Step 4: Verify the focused pass**
Run: `npm run test --prefix frontend`
Expected: every API helper sends the route's intended DTO and explicit tenant ID; no test imports backend store internals.
- [ ] **Step 5: Run package checks**
Run: `npm run lint --prefix frontend && npm run build --prefix frontend`
Expected: the four steps compile with accessible labels, fieldsets for grouped scope/teachers, and no invented entity-list API.
---
## Task 4: Complete direct enrollment and verify the whole journey
**Files:**
- Create: `frontend/src/components/steps/enrollment-step.tsx`
- Create: `frontend/src/lib/enrollment-api.ts`
- Create: `frontend/src/lib/enrollment-api.test.ts`
- Modify: `frontend/src/components/institution-journey.tsx`
- Modify: `README.md`
**Interfaces:**
- `createEnrollment(targetTenantId, { personId, courseId })` calls `POST /api/platform/enrollments`.
- `listEnrollments(targetTenantId, courseId, status?)` calls `POST /api/platform/enrollments/search`.
- `transitionEnrollment(targetTenantId, courseId, enrollmentId, status)` calls `PATCH /api/platform/courses/:courseId/enrollments/:enrollmentId`.
- The step accepts only `ativa`, `trancada`, `cancelada`, and `jubilada`; backend remains authoritative about legal transitions.
- [ ] **Step 1: Add failing tests for enrollment DTOs and UI states**
Test target propagation, direct enrollment fields, optional state filtering, and status updates using injected fetch. Verify success results include the student profile ID and the request helper reports normalized duplicate/ineligible errors.
- [ ] **Step 2: Verify the expected failure**
Run: `node --test --test-isolation=none --test-name-pattern='enrollment|matrícula' frontend/src/lib/enrollment-api.test.ts`
Expected: enrollment tests fail while its API adapter and form are absent.
- [ ] **Step 3: Implement the final step and accessible feedback**
Add enrollment create/list/filter/manual status update. Offer only `trancada`, `cancelada`, and `jubilada` from `ativa`; offer `ativa`, `cancelada`, and `jubilada` from `trancada`; show no transition action for terminal states. Use selected in-memory people and courses when available; otherwise allow IDs to be entered. Do not present course eligibility as guaranteed by the browser. Show the backend response and IDs, and keep form values after errors. No personal data is written to browser storage.
- [ ] **Step 4: Verify the focused pass**
Run: `npm run test --prefix frontend`
Expected: all unit tests pass, remain isolated from database/network, and assert every institutional request carries the route's `targetTenantId`.
- [ ] **Step 5: Verify integration, render, and interaction**
Run: `npm run test:sqlite` in the backend workspace.
Expected: the existing SQLite-backed HTTP journey from onboarding through enrollment passes all 14 tests.
Run: start the backend with `PORT=3001 PUBLIC_ORIGIN=http://localhost:3000` and `npm run dev --prefix frontend` with `BACKEND_URL=http://127.0.0.1:3001`; verify at 375×812 and 1280×800 using the host browser that passkey/login/activation states, onboarding, all six steps, form-value preservation on errors, empty results, keyboard focus, and ID selection are usable. Confirm all API writes include the ID in the current institution route and no personal data is stored in the browser.
Run: `npm run lint --prefix frontend && npm run build --prefix frontend`
Expected: lint and production build both pass.
## Unresolved decisions
- Existing-institution discovery stays ID-based until a separate backend requirement adds institution listing. No additional product decision blocks this plan.
- The operator-local provisioned `SUPER_ADMIN` remains a prerequisite; the frontend does not create global accounts.
