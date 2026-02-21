# BST236 Assignment 1 — Case Study: Using Copilot CLI

This write-up documents how the repository's three deliverables were implemented and how GitHub Copilot CLI (agentic workflow) was used to produce them. This file is intended to be copied into a separate write-up repository for submission; it references the live demo hosted from this repo.

Live demo
- Site: https://winnie104703.github.io/bst236/
- ArXiv feed page: https://winnie104703.github.io/bst236/arxiv.html

Brief introduction to the three problems
- Problem 1 — Multi-page website: Create a minimal multi-page static site (homepage and project pages) hosted under docs/ and linked from the homepage.
- Problem 2 — Valentine Pac-Man: A small interactive browser game page demonstrating client-side interactivity and assets.
- Problem 3 — Auto-updating arXiv Feed: An agentic pipeline that fetches recent arXiv papers (machine learning), stores them as a static JSON artifact, renders them client-side, and updates the artifact nightly via GitHub Actions.

Summary of approach
- Use Copilot CLI to plan and scaffold small, focused agents (Fetcher, Renderer, Workflow) and to generate runnable drafts for scripts, client JS, CSS tweaks, and workflow YAML.
- Prefer client-side rendering for Problem 3: the fetch script writes docs/arxiv.json and docs/arxiv.html loads it via docs/arxiv.js. This keeps CI commits small and simplifies local testing.

Problem 1 — Multi-page website
- Goal: Provide a clean homepage linking to project pages (index, pacman, arXiv feed).
- Implementation highlights:
  - Files: docs/index.html, docs/assets/css/style.css, docs/pacman.html (project page stub).
  - Copilot usage: prompts asked Copilot CLI to scaffold semantic HTML structure and a minimal, responsive CSS theme. Example prompt: "Create a minimal homepage with a header, nav, and a brief bio section."
  - What worked: Rapid scaffolding and small iterative styling edits.
  - Notes: Navigation simplified per reviewer feedback to keep the header focused.

Problem 2 — Valentine Pac-Man (interactive demo)
- Goal: Deliver a small JS-based game page showing client-side interactivity.
- Implementation highlights:
  - Files: docs/pacman.html, docs/assets/js/pacman.js, supporting assets.
  - Copilot usage: prompts asked for a simple game loop, basic keyboard controls, and asset placeholders. Example prompt: "Create a small Pac-Man style demo with a player, collectible, and basic scoring."
  - What worked: Copilot generated workable scaffolding for the game loop and movement code; manual tweaks were required for asset placements and polish.

Problem 3 — Auto-updating arXiv Feed (detailed)
- Goal: Automate nightly updates of a curated machine learning feed from arXiv and render it on docs/arxiv.html.
- Components produced:
  - scripts/fetch_arxiv.py — Fetch Agent that queries arXiv Atom API and writes docs/arxiv.json (standard-library-only, CLI args: --keywords, --max, --output).
  - docs/arxiv.js — Renderer Agent: client-side JS that fetches docs/arxiv.json and renders title, authors, human-friendly timestamp, truncated abstract, and PDF link.
  - .github/workflows/update-arxiv.yml — Workflow Agent: GitHub Actions job that runs nightly (cron '0 0 * * *'), executes the fetch script, and commits/pushes docs/arxiv.json if changed.

- Why this design:
  - Client-side rendering keeps diffs minimal (only data changes), simplifies local testing, and decouples rendering from CI.
  - Using GitHub Actions as the scheduler provides a simple, auditable automation mechanism that commits artifacts back into the repo.

- Agent orchestration and roles
  - Planner/Reviewer (human + Copilot CLI): define scope, approve changes, and guide iterations.
  - Fetch Agent (scripts/fetch_arxiv.py): fetches and parses the Atom feed into JSON artifact.
  - Renderer Agent (docs/arxiv.js): transforms JSON into DOM output on page load.
  - Workflow Agent (.github/workflows/update-arxiv.yml): schedules runs and commits updates.

- Representative prompts and iterations (Problem 3)
  - Fetch script prompt: "Create scripts/fetch_arxiv.py that queries arXiv API for a given keyword, parses Atom XML to extract id,title,summary,authors,updated,pdf_url, and writes docs/arxiv.json using only the Python standard library."
    - Iteration: fixed XML namespace parsing, added pdf link fallback, added CLI args, and set non-zero exit codes on failure.
  - Renderer prompt: "Create docs/arxiv.js that fetches arxiv.json and renders title (link), Author:, Abstract:, and a PDF link; truncate long abstracts." 
    - Iteration: added human-friendly EST timestamp formatting and labels.
  - Workflow prompt: "Create a GitHub Actions workflow to run nightly, set up Python, invoke scripts/fetch_arxiv.py, and commit changes only when docs/arxiv.json differs."
    - Iteration: added git user.name/email and actions/checkout persist-credentials.

Tools & services used
- Git, GitHub, GitHub Pages, GitHub Actions
- GitHub Copilot CLI (primary assistant for generating code and plans)
- Python 3 (standard library)
- Browser and DevTools for visual verification and debugging

What worked well and limitations
- Copilot CLI produced runnable first drafts quickly, enabling fast iterate-test cycles.
- Human oversight was required for XML edge-cases, timestamp formatting, and user-facing text quality.
- The fetch script could be hardened with retries, rate-limiting awareness, and better error reporting for production use.

Submission-ready cleanup
- Removed placeholder references to screenshots or videos from earlier drafts.
- This write-up focuses on describing the three problems and implementation decisions; visual artifacts can be added separately if required by the grader.

Contribution
- Implementation and write-up: Yicheng He

---
