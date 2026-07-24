# OmniStack Digital Website

A fullstack marketing website for OmniStack Digital — built with Node.js/Express, PostgreSQL, and vanilla HTML/CSS/JS.

## Project structure

```
server.js               — Express backend (API routes + static file serving)
public/
  index.html            — Main site markup
  admin.html            — Lead inbox markup
  css/
    style.css           — Main site styles
    admin.css           — Admin dashboard styles
  js/
    main.js             — Main site interactivity (nav, form, animations)
    admin.js            — Admin dashboard logic
  attached_assets/      — SVG logo files
```

## Running

```bash
node server.js
```

Serves on port 5000. The workflow `Start application` handles this automatically.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/contact` | Save a contact form submission |
| GET | `/api/submissions` | List all submissions (admin) |
| DELETE | `/api/submissions/:id` | Delete a submission |

## Pages

- `/` — Public marketing site
- `/admin` — Lead inbox dashboard (no auth — add before going live)

## Database

Uses Replit's built-in PostgreSQL. Table: `contact_submissions` (id, name, email, service, message, created_at).

## User preferences

- Keep files split: HTML markup, CSS styles, and JS logic in separate files
