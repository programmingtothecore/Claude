# Connect & Explore

A dating app with no gimmicks. Photos front and center, a three-part Story instead of hobbies, and a simple "Connect" button that enables chat once it's mutual.

## What's different

- **Connect, not Like.** One word, two states: asked, mutual.
- **Explore, not Swipe.** A browsable grid of real people, not a gambling machine.
- **Story, not checkboxes.** Every profile has three open-ended prompts:
  1. *Who I am*
  2. *Who I want to be*
  3. *What I'm looking for*
- **No scores, no badges, no tricks.** Just people and chat.

## Stack

- Node + Express + Socket.io + better-sqlite3 on the server
- React + Vite on the client
- JWT auth, bcrypt passwords, multer for photo uploads
- Single SQLite file (`data.db`), uploads on local disk

## Run it locally

```bash
npm run install:all    # install root + server + client deps (first time only)
npm run dev            # server on :3001, Vite on :5173
# open http://localhost:5173
```

On the very first server start, the `users` table is empty so `seed.js` runs automatically and creates ten demo accounts you can sign in as. Every demo user's password is `password123`. Their emails are printed to the console.

## Build for production

```bash
npm run build
npm start              # one process on :3001 serves API and the built SPA
# open http://localhost:3001
```

## Re-seed (after wiping `data.db`)

```bash
rm data.db
npm start              # or npm run dev - seed runs on empty DB
```

## Project layout

```
server/     Express + Socket.io + SQLite + uploads
client/     React + Vite SPA
data.db     SQLite database (auto-created, gitignored)
```
