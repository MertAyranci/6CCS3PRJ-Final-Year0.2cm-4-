# Smart Photos (photo-revocation prototype)

Front-end research prototype for **6CCS3PRJ** — a WhatsApp-style **private chat** mock-up used to demonstrate **revocable photo permissions** (pre-send and post-send). This repository is the implementation submitted with the dissertation; fuller step-by-step instructions and a feature checklist appear in the report’s **User Guide** appendix.

**Deployed demo:** [https://smart-photos.vercel.app](https://smart-photos.vercel.app)

## Stack

- **Next.js** 16 (App Router), **React** 19, **TypeScript**
- **Tailwind CSS** v4
- **Vitest** and **React Testing Library** for automated tests

## Prerequisites

- **Node.js 20.x** (LTS recommended)
- **npm** (bundled with Node)

## Install and run (development)

```bash
cd photo-revocation-prototype
npm install
npm run dev
```

Open the URL shown in the terminal (default [http://localhost:3000](http://localhost:3000)). Use a full-screen browser window for the best view of the dual-handset layout.

## Production-style run

```bash
npm run build
npm run start
```

## Tests

```bash
npm run test          # single run
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

## Lint

```bash
npm run lint
```

## Repository layout (brief)

| Path | Role |
|------|------|
| `src/app/` | Next.js App Router entry (`page.tsx`), layout, global styles |
| `src/components/photo-revocation-demo/` | UI for the chat mock-up and flows |
| `src/lib/` | Shared permission logic; `src/lib/photo-revocation-demo/` holds domain types, state, and helpers |
| `tests/` | Vitest tests (`unit/`, `components/`, `app/`, `helpers/`) |
| `docs/` | Manual test plan and requirement traceability (if present) |

## Submission archive

When preparing **`photo-revocation-prototype.zip`**, include source, tests, configuration, and lockfile (`package-lock.json`). Exclude **`node_modules/`**, **`.next/`**, and generated **`coverage/`** — reinstall with `npm ci` or `npm install` after unzipping.
