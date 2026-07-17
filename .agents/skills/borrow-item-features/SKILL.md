---
name: borrow-item-features
description: >
  Architecture guide and feature development playbook for the "Pinjam Jap" department
  asset borrowing system. Covers the project's data model, page structure, API patterns,
  UI conventions, and provides actionable guidance for adding new features.
---

# Pinjam Jap — Borrow Item System

## Project Overview

A lightweight, mobile-first web app that lets department staff **browse**, **borrow**, and
**return** shared assets (cables, adapters, tools, etc.). Built with vanilla HTML/CSS/JS
and backed by **Google Sheets via SheetDB** as a zero-ops database.

### Core User Flow

```
index.html (asset list + search)
  └─ click card → asset.html?id=<id>
      ├─ if status=available → show Borrow form
      └─ if status=borrowed  → show Return form + borrower info
```

---

## Architecture & File Map

```
borrow-item/
├── index.html          # Landing page — asset list with live search
├── asset.html          # Detail page — borrow/return actions + history timeline
├── js/
│   └── app.js          # ALL application logic (single file, ~325 lines)
├── css/
│   └── style.css       # Global styles, design tokens, responsive rules
└── qrcode.png          # Static asset (QR code image)
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Single `app.js` file | Both pages share the same script; functions guard themselves with `if (!element) return` |
| SheetDB as backend | Zero server setup; Google Sheet acts as DB with REST API |
| No build tools | Pure HTML/CSS/JS — open `index.html` directly or via Live Server |
| No client-side routing | Multi-page app with `window.location.search` for params |
| No authentication | Trust-based; borrower verified only by Staff ID match on return |

---

## Data Model (Google Sheet)

### Main Sheet (assets)

| Column | Type | Description |
|---|---|---|
| `id` | string | Unique asset identifier |
| `name` | string | Display name of the asset |
| `status` | `"available"` \| `"borrowed"` \| `"Borrowed"` | Current availability state (case-insensitive in code) |
| `staffId` | string | ID of the current borrower (empty when available) |
| `borrowerName` | string | Name of the current borrower |
| `team` | string | Team/department of the borrower |
| `date` | string/number | Borrow date (may be Excel serial number) |
| `returnDate` | string | Return date (empty while borrowed) |
| `Category` | string | Asset category (e.g. "Soundbar", "Sound System", "Gaming Console") |

### History Sheet

Same columns as main sheet. A new row is **appended** on each return, creating an
immutable audit log.

---

## API Patterns (SheetDB)

All API calls go through `https://sheetdb.io/api/v1/ihekm93q9pwgf`.

| Action | Method | Endpoint | Body |
|---|---|---|---|
| List all assets | `GET` | `/` | — |
| Search by ID | `GET` | `/search?id=<id>` | — |
| Update asset | `PATCH` | `/id/<id>` | `{ data: { ... } }` |
| Log to history | `POST` | `/?sheet=history` | `{ data: [{ ... }] }` |
| Search history | `GET` | `/search?id=<id>&sheet=history` | — |

> **Important**: SheetDB has rate limits on the free tier. Batch operations and caching
> should be considered for any feature that adds volume.

---

## UI & Styling Conventions

### Design Tokens (CSS Custom Properties in `:root`)

```css
--primary: #3b82f6;      /* Blue — links, focus rings, primary actions */
--primary-hover: #2563eb; /* Darker blue — hover states */
--success: #10b981;       /* Green — available status, borrow button */
--warning: #f59e0b;       /* Amber — borrowed status, return button */
--text-muted: #64748b;    /* Slate — secondary text */
--bg-light: #f8fafc;      /* Light bg — input backgrounds */
--border-color: #e2e8f0;  /* Border — cards, inputs */
```

### Component Patterns

- **Cards**: `.card` class with rounded corners, soft shadow, white bg
- **Badges**: `.badge.available` (green) / `.badge.borrowed` (red)
- **Action Cards**: `.action-card.borrow` (green top border) / `.action-card.return` (amber)
- **Modals**: Built dynamically in JS via `showModal(message, type, callback)`
  - Types: `"success"` (green checkmark) / `"error"` (red X with shake)
  - Auto-detects error keywords in message text
  - Auto-dismisses success modals with callbacks after 2 seconds
- **Loading**: `.loader-spinner` CSS animation

### Responsive Breakpoints

- Single breakpoint at `max-width: 600px`
- Mobile-first considerations: `env(safe-area-inset-*)`, iOS zoom prevention (`font-size: 16px` on inputs)

---

## Development Guidelines for New Features

### 1. Adding a New Data Field

When the Google Sheet gets a new column:

1. **Update the PATCH/POST payloads** in `app.js` (borrow and return handlers)
2. **Display the field** in `asset.html` (info section or form)
3. **Include it in history logging** (the POST to `?sheet=history`)
4. Optionally add it to the **search filter** in `displayAssets()`

### 2. Adding a New Page

Follow the existing multi-page pattern:

1. Create `newpage.html` with the same `<link>` to `css/style.css` and `<script>` to `js/app.js`
2. Add a new function in `app.js` that guards with `if (!document.getElementById('page-specific-element')) return;`
3. Call that function at the bottom of `app.js` alongside `loadAssets()` and `handleAssetPage()`
4. Add navigation links using the `.back-link` pattern from `asset.html`

### 3. Modifying the Modal System

The `showModal()` function in `app.js` (lines 6–123) is self-contained:

- **Adding a new type**: Add a new icon SVG block (follow the success/error pattern)
- **Changing behavior**: The `callback` parameter runs after modal close; success modals with callbacks auto-dismiss in 2s
- **Styling**: Modal styles are inline; keyframes are injected once via `#modal-keyframes` style tag

### 4. Search & Filtering Enhancements

- Search matches asset `name`, `id`, and current `borrowerName`.
- Side-by-side select dropdowns filter assets dynamically by **Availability** and **Category**.
- Dynamic categories are fetched and parsed from the main sheet data (extracting unique values from the `Category` key).
- Filtering logic executes client-side on the cached `allAssets` array.

---

## Feature Improvement Ideas

### High Priority (Quality of Life)

- [ ] **Form validation**: Add real-time validation with visual feedback (red borders, helper text) instead of only modal alerts
- [ ] **Loading states on buttons**: Disable buttons and show spinner during API calls to prevent double-submissions
- [ ] **Confirmation dialog before borrow/return**: Add a "Are you sure?" step with asset details summary
- [ ] **Toast notifications** instead of blocking modals for non-critical feedback
- [ ] **Offline detection**: Show a banner when the network is unavailable (the app is fully API-dependent)

### Medium Priority (Functionality)

- [ ] **Asset categories/tags**: Add a `category` column and filter chips on the index page (e.g., "Cables", "Adapters", "Tools")
- [ ] **Full history view**: Currently capped at 2 recent entries — add a "View All" expandable section or dedicated history page
- [ ] **Due date / overdue tracking**: Add an expected return date at borrow time; highlight overdue items in red
- [ ] **Admin panel**: A separate page to add/edit/delete assets directly (currently requires editing the Google Sheet)
- [ ] **QR code scanning**: Use the device camera to scan asset QR codes and auto-navigate to the asset detail page

### Lower Priority (Polish & Performance)

- [ ] **Skeleton loading screens**: Replace "Loading assets..." text with animated skeleton cards
- [ ] **Client-side caching**: Cache `allAssets` in `sessionStorage` with a TTL to reduce API calls
- [ ] **Dark mode**: Add a toggle using `prefers-color-scheme` media query and a CSS class swap
- [ ] **PWA support**: Add a `manifest.json` and service worker for installability and offline shell
- [ ] **Pagination or virtual scrolling**: For when the asset list grows beyond ~50 items
- [ ] **Accessibility**: Add ARIA labels, keyboard navigation for cards, focus trapping in modals

---

## Known Quirks & Gotchas

1. **Date handling**: The `formatDate()` helper (line 126) handles Excel serial numbers (`value > 30000`) because SheetDB sometimes returns raw spreadsheet values instead of formatted dates
2. **No error recovery**: API failures show a static error message; there's no retry mechanism
3. **Staff ID matching**: Return verification uses loose string comparison (`trim()` only) — be careful with leading zeros or whitespace
4. **Duplicate CSS rules**: `.card` and `.history-item` are defined multiple times in `style.css` (later rules override earlier ones). When editing styles, check for multiple definitions
5. **Both pages load both functions**: `loadAssets()` and `handleAssetPage()` both run on every page load; each guards itself by checking for page-specific DOM elements
6. **No CORS considerations**: SheetDB handles CORS headers; if the API is swapped, CORS must be configured
7. **Rate limiting**: SheetDB free tier has API call limits; heavy usage may hit throttling
