# Case Study: Building an Auto-updating arXiv Feed using Copilot CLI

This document is the write-up / tutorial that accompanies the code in this repository. It is written as a case-study showing how the GitHub Copilot CLI (agentic workflow) was used to implement the three homework problems and, specifically, to build Problem 3: an auto-updating arXiv feed (client-side renderer + scheduled GitHub Actions fetcher).

Notes about distribution
- This file was created inside the homework repo to be copied to a separate write-up repository for submission or presentation. If you copy this file to another repo, update the Live Site URL below and include any screenshots or video links in the placeholders.

Live site (demo)
- Site: https://winnie104703.github.io/bst236/
- ArXiv feed page: https://winnie104703.github.io/bst236/arxiv.html

Project summary
- Goal: implement an agentic pipeline that (1) fetches recent arXiv papers matching keywords, (2) stores them as a static JSON artifact, (3) renders them client-side in docs/arxiv.html, and (4) updates the artifact nightly using GitHub Actions.
- Rendering approach: client-side JS reads docs/arxiv.json produced by the fetch script. Rationale: easier CI commits, local testing, and small diffs.

Repository layout (key files)
- docs/arxiv.html — client HTML page (renderer hooks into docs/arxiv.js)
- docs/arxiv.js — client-side renderer that fetches and renders docs/arxiv.json
- docs/arxiv.json — canonical data artifact (produced by scripts/fetch_arxiv.py)
- scripts/fetch_arxiv.py — Fetch Agent: queries arXiv Atom API and writes JSON
- .github/workflows/update-arxiv.yml — Workflow Agent: scheduled nightly job to run the fetch script and commit changes
- SESSION_PLAN.md and HOMEWORK_WRITEUP.md — planning and write-up artifacts created during the session

Tools and services used
- Git + GitHub — version control and hosting
- GitHub Pages — static site hosting for the demo
- GitHub Actions — scheduled runner for nightly updates
- GitHub Copilot CLI — interactive agent for planning, prompting, and code generation
- Python 3 (standard library only) — fetch/parsing script (no external dependencies)
- Browser DevTools — inspect renderer and network interactions

Agent roles and orchestration
- Planner / Reviewer (human + Copilot CLI): design, approve plans, review PRs, and iterate on UX/requirements.
- Fetch Agent (scripts/fetch_arxiv.py): talks to the arXiv Atom API, parses XML, and writes docs/arxiv.json.
- Renderer Agent (docs/arxiv.js): client-side JavaScript that reads docs/arxiv.json and produces the user-facing list.
- Workflow Agent (.github/workflows/update-arxiv.yml): runs nightly and commits docs/arxiv.json changes.

How Copilot CLI was used (workflow)
1. Plan: used Copilot CLI /plan mode to create a session plan listing all files and agent responsibilities.
2. Implement: iteratively asked Copilot CLI to generate the fetch script, renderer JS, CSS changes, and workflow YAML. For each artifact the process was:
   - Provide a short spec (one or two sentences) describing the desired behavior.
   - Ask Copilot to produce a small, self-contained file (e.g., "Create scripts/fetch_arxiv.py that queries arXiv and writes docs/arxiv.json").
   - Run the generated code locally, inspect output, and request targeted fixes if necessary.
3. Test & iterate: run the fetch script locally, preview docs/arxiv.html via a local static server, and make small iterative styling/formatting edits.
4. Publish: push feature branch, open PR (optionally), merge to main, and rely on GitHub Actions and Pages for hosting.

Representative prompts and notes (what worked and required iteration)
- Prompt (fetch script):
  "Create scripts/fetch_arxiv.py that queries the arXiv Atom API for a given keyword, parses entries into JSON with fields id,title,summary,authors,updated,pdf_url, and writes docs/arxiv.json. Use only the Python standard library."
  - Result: Copilot produced a compact, standard-library-only script that required only minor fixes (XML namespace handling and pdf link fallback).
  - Iteration: asked for better error codes (non-zero on fetch/parse errors) and CLI args (--keywords, --max, --output).

- Prompt (renderer):
  "Create docs/arxiv.js — a small client-side renderer that fetches arxiv.json and renders title (link), authors, updated timestamp and truncated abstract; add labels 'Author:' and 'Abstract:'."
  - Result: Copilot produced a working renderer quickly; required a second prompt to format timestamps into a human-friendly timezone (EST).

- Prompt (workflow):
  "Create .github/workflows/update-arxiv.yml that runs nightly (cron 0 0 * * *), checks out the repo, sets up Python, runs scripts/fetch_arxiv.py, and commits/pushes docs/arxiv.json if changed."
  - Result: Good first draft generated; small edits added user.name/email and persist-credentials in actions/checkout.

What worked well
- Copilot CLI provided quick, runnable drafts of scripts and glue code, speeding up the implementation loop.
- The agentic pattern (small focused agents + planner) kept responsibilities clear and made testing incremental.
- Standard-library-only Python made CI simple and dependency-free.

What required human iteration
- XML namespaces and edge cases in arXiv Atom parsing required manual fixes and careful testing on live data.
- Timestamp/timezone formatting and user-facing wording (labels, narrative tone) needed human editing for clarity and UX.
- Git operations around publishing (gh-pages vs main/docs) required human decision and care to avoid overwriting important files.

Repro steps (how to rebuild locally)
1. Clone the repo and change into it:
   git clone https://github.com/winnie104703/bst236.git
   cd bst236
2. (Optional) Run the fetch script locally to produce docs/arxiv.json:
   python3 scripts/fetch_arxiv.py --keywords "machine learning" --max 15 --output docs/arxiv.json
3. Preview the page locally:
   cd docs && python3 -m http.server 8000
   Open http://localhost:8000/arxiv.html
4. To test the workflow manually, push changes to the repo and use Actions → workflow_dispatch to run the update job.

Prompts history (summary)
- Prompts were short, focused and iterative. Examples include:
  - "Create a fetch script that queries arXiv and writes JSON (no external deps)."
  - "Make the renderer show authors and truncated abstracts and label each field."
  - "Format timestamps to EST and show date/time to minute precision."
  - "Add a nightly GitHub Actions workflow to run the fetch script and commit changes."

Placeholders for visual aids
- Screenshot: docs/screenshots/site-preview.png (add screenshot here)
- Video: docs/videos/session-demo.mp4 (link or embed if available)

Limitations and future improvements
- The fetch script does limited error handling and may need exponential backoff and retries for robust production use.
- Consider adding caching, pagination, and better deduplication of arXiv versions.
- If publishing to a protected branch or organization, adjust the workflow to use a PAT stored in Secrets rather than GITHUB_TOKEN.

License & Contribution
- Author / Contribution: Yicheng He (primary author and implementer)

Acknowledgements
- Implementation guided and scaffolded by GitHub Copilot CLI (interactive agent), with human planning and review.

If you want, I can now:
- Convert this into a README.md that overwrites the repo README,
- Create a cleaned copy formatted for a separate write-up repo,
- Or append exact prompt transcripts and Copilot responses to the session-state logs here.

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>