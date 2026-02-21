# BST236 Homework — Auto-updating arXiv Feed (restored)

This repository contains work for the BST236 homework assignment. The arXiv auto-updating feed (Problem 3) is implemented and served from the `docs/` folder.

Live demo
- Site: https://winnie104703.github.io/bst236/
- ArXiv feed: https://winnie104703.github.io/bst236/arxiv.html

What this repo contains (key files)
- docs/arxiv.html — client-side page that renders the feed
- docs/arxiv.js — client-side renderer that loads docs/arxiv.json
- docs/arxiv.json — data artifact produced by the fetch script (auto-updated)
- scripts/fetch_arxiv.py — Fetch Agent: queries arXiv API and writes docs/arxiv.json
- .github/workflows/update-arxiv.yml — Workflow Agent: scheduled nightly job to run the fetch script and commit changes
- SESSION_PLAN.md — session plan and running log

Restoration note
- This README.md was recreated to replace a deleted copy during a docs/site publish step; it summarizes the current state and points to the live site. If you want the original README text restored exactly, provide a copy or let me extract it from an earlier backup if available.

How to run locally
1. Fetch latest data locally (optional):
   python3 scripts/fetch_arxiv.py --keywords "machine learning" --max 10 --output docs/arxiv.json
2. Preview site:
   cd docs && python3 -m http.server 8000
   Open http://localhost:8000/arxiv.html

How automation works
- The GitHub Actions workflow `.github/workflows/update-arxiv.yml` runs nightly (cron `0 0 * * *`) and executes `scripts/fetch_arxiv.py`. If docs/arxiv.json changes, the workflow commits and pushes the update.

Contact / Notes
- Session plan and running log are stored in `SESSION_PLAN.md` and `/.copilot/session-state/` for audit and prompts.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>