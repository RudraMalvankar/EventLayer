This `dev/` folder contains non-destructive copies of developer scripts and sample outputs
moved from the repository root for clarity. Originals were left in place under `scripts/`.

Purpose

- Keep development helpers and scrape outputs separated from runtime code.
- These files are copies for local reference and debugging. The runtime app uses `src/` modules.

Files copied here (non-destructive):

- `dev/scripts/*` — local scraper and maintenance scripts
- `dev/scrape_outputs/*` — sample JSON outputs from local scraper runs
- `dev/events.json` — sample event dataset used during development

If you want to remove the originals in `scripts/`, review imports and update paths before deleting.

To restore a file to its original location, copy it back into the project root.

-- TechPulse dev housekeeping
