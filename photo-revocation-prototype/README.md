# Photo Revocation Prototype

## Overview

This project is a web-based proof-of-concept developed for a final-year dissertation on consent revocation in WhatsApp-like photo sharing. The prototype focuses on how photo permissions may be configured, changed after sending, and observed across original and forwarded recipient views.

## What The Prototype Demonstrates

- a WhatsApp-style chat interface
- sender-side photo sharing controls
- revocation-related permission changes after sending
- forwarding from the original recipient to a third phone
- view-once behaviour for photo messages
- separate menu actions for replying, forwarding, and opening revocation permissions

## Software Requirements

- Node.js installed on the computer
- npm installed on the computer

Node.js 22 is recommended for the smoothest local use.

## Installation

Open a terminal inside the `photo-revocation-prototype` folder and run:

```bash
npm install
```

## Running The Prototype

Start the development server:

```bash
npm run dev
```

Then open the local address shown in the terminal. In a normal case this will be:

```text
http://localhost:3000
```

If port `3000` is already in use, Next.js may automatically choose another local port such as `3001`.

## Useful Commands

Run a production build check:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

## Notes For Review

- This is a prototype, not a production messaging system.
- The prototype is designed to demonstrate dissertation concepts rather than full WhatsApp feature parity.
- No backend service is required for the current local demonstration.

## If Shared As A Zip File

If this project is shared as a `.zip`, the recipient should:

1. extract the archive
2. open the `photo-revocation-prototype` folder
3. run `npm install`
4. run `npm run dev`
5. open the local URL printed in the terminal

The zip file should not include `node_modules` or `.next`.
