# Naturgy React Standards (Workshop UI) — MUI v5

## Purpose
Defines UI/UX and engineering standards for the React/Vite frontend using **Material UI (MUI) v5**.
This file is the repo-backed SSOT for UI standards and should be added as a Source to the Copilot Space "React-Standards".

## Stack
- React + Vite + TypeScript (strict)
- UI library: **MUI v5**
  - `@mui/material`
  - `@mui/icons-material`
  - `@mui/x-data-grid` (tables)
- Styling approach:
  - Use **ThemeProvider** + `sx` prop
  - Avoid custom CSS except minimal global resets

## Project structure (feature-based)
Recommended:

- `frontend/src/app/`
  - `theme.ts` (MUI theme + tokens)
  - `providers.tsx` (ThemeProvider, CssBaseline)
  - `router.tsx` (if used)
- `frontend/src/features/`
  - `meters/` `contracts/` `readings/` `billing/`
    - `pages/` (screens)
    - `components/` (feature UI)
    - `api/` (feature-specific calls)
    - `types.ts`
- `frontend/src/shared/`
  - `ui/` (reusable presentational components)
  - `api/` (`httpClient.ts`, error mapping)
  - `utils/` (pure helpers)
  - `hooks/`

Rules:
- Business logic stays in feature services/helpers.
- `shared/ui` must not include business rules.

## Theme & tokens (Naturgy brand)
- Define a single theme in `frontend/src/app/theme.ts`.
- Use semantic tokens (not raw colors in components).

### Brand colors (from www.naturgy.es)
| Token | Hex | Usage |
|---|---|---|
| primary.main | `#002855` | Sidebar, AppBar, main header backgrounds |
| primary.light | `#1A4A7A` | Hover states on dark surfaces |
| primary.dark | `#001B3D` | Pressed / active sidebar items |
| secondary.main | `#64BE28` | CTA buttons, success accents |
| secondary.light | `#7ED348` | Hover on green buttons |
| secondary.dark | `#4A9A1E` | Pressed green buttons |
| warning.main | `#F39200` | Highlights, badges, brand-accent orange |
| background.default | `#F5F5F5` | Main content area background |
| background.paper | `#FFFFFF` | Cards, dialogs, paper surfaces |
| text.primary | `#333333` | Body text |
| text.secondary | `#666666` | Secondary/caption text |

### Typography
- Font family: **"Inter"** (Google Fonts) as primary; fallback: `"Helvetica Neue", Arial, sans-serif`.
- Load via `<link>` in `index.html` or `@import` in CSS.
- h4–h6: fontWeight 600.

### Logo
- Naturgy SVG logo displayed in the sidebar header.
- Source: `public/naturgy-logo.svg` (inline SVG, white version for dark sidebar).
- Dimensions: constrained to max-height 32px in sidebar.

Must:
- Centralize colors, spacing and typography in the theme.
- Components should use `sx` with theme values, not hard-coded hex values.

## Layout (App shell)
- Use MUI **Drawer** (permanent on desktop) for left navigation.
- Use MUI **AppBar** (optional) for top header.
- Main content wrapped with MUI **Container** (`maxWidth="lg"`) and consistent padding.
- Page header pattern:
  - Title: `Typography variant="h4"`
  - Primary action button aligned right (e.g., “New Contract”)

## UI patterns

### Tables / Lists
- Use **DataGrid** (`@mui/x-data-grid`) for entity listings.
- Standard columns:
  - key fields
  - actions column with icon buttons (edit/delete)
- Provide empty state message when no rows.

### Forms
- Use MUI **TextField**, **Select**, **FormControl**, **FormHelperText**.
- Validation:
  - Use React Hook Form + Zod (recommended) OR a minimal deterministic validator.
  - Show field-level errors via `helperText` and `error` props.
- Conditional fields:
  - For contracts, show/hide fields based on `contractType` (FLAT/FIXED) consistently.

### Feedback & UX
- Errors:
  - Global error banner: **Alert severity="error"**
  - Form errors: helperText
- Success:
  - **Snackbar** with **Alert severity="success"**
- Loading:
  - Page-level: **LinearProgress**
  - Action-level: disable button + show spinner (CircularProgress size small)

## API client standard
- Central HTTP client in `frontend/src/shared/api/httpClient.ts`:
  - base URL uses `/api` (via Vite proxy in dev)
  - consistent error mapping:
    - 400: show server message
    - 404: not found message
    - 500: generic error
- Do not log sensitive data (PII).

## TypeScript rules
- Avoid `any`.
- Define DTO types for backend payloads.
- Prefer `unknown` + parsing over `any`.
- Keep monetary values as string/number consistently (align with backend).

## Testing
- Setup:
  - Vitest + React Testing Library (recommended for Vite)
- Minimum:
  - Unit tests for pure helpers (billing-related UI helpers, mapping)
  - 1 UI test for a critical screen (Billing/Invoices page or CSV import)

## Accessibility
- Every input has a label.
- Icon-only buttons have `aria-label`.
- Dialogs focus management (MUI handles most).
- Ensure contrast is acceptable (theme tokens).

## Non-goals
- Do not change backend endpoints or business rules.
- Do not introduce another UI library (no Bootstrap/Tailwind concurrently).
- Avoid heavy state libraries unless required (Redux/etc.).

## Done criteria
- All screens use MUI components consistently.
- Theme is applied globally via ThemeProvider + CssBaseline.
- Build passes: `npm --prefix frontend run build`.