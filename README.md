# BugIdle

An idle pixel-art game about hunting software bugs. Pick a route, and your bugs fight wild bugs on their own. Catch new ones, fill the Bugdex (each entry explains the real bug), level up, evolve, and beat the bosses of Localhost, Staging, Production, Legacy and the Cloud.

## Running locally

### Requirements

- [Node.js](https://nodejs.org/) 20 or newer (comes with npm)
- Git

Check your versions:

```
node -v
npm -v
```

### Setup

```
git clone https://github.com/filipe-jsales/bugidle.git
cd bugidle
npm install
```

### Play

```
npm run dev
```

Open the address it prints (usually http://localhost:5173). The page reloads by itself when you change the code. Stop the server with `Ctrl+C`.

To use another port: `npm run dev -- --port 3000`.

### All commands

| Command | What it does |
|---|---|
| `npm run dev` | Starts the game in development mode with live reload |
| `npm test` | Runs all unit tests once |
| `npm run test:watch` | Runs the tests again on every file change |
| `npm run typecheck` | Checks the TypeScript types without building |
| `npm run build` | Typechecks and builds the production version into `dist/` |
| `npm run preview` | Serves the `dist/` build locally (run `npm run build` first) |
| `npm run simulate` | Plays the whole game headless and prints a balance report (add seeds: `npm run simulate -- 1 2 3`) |

### Save data

Progress is saved in the browser's localStorage, so each browser keeps its own save. To move or back up a save, use the **Save** button in the game to export or import it as JSON. **Apagar progresso** (erase progress) in the same window starts over.

## Docs

See [docs/instructions.md](docs/instructions.md) for the architecture and rules, and [docs/backlog.md](docs/backlog.md) for what is done and what is next.
