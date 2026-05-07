# Ampla Uganda UI Standards

## Primary UI Library

Use Material UI (MUI) as the primary UI library for new screens and major refactors.

Recommended packages already in the app:

- `@mui/material`
- `@mui/icons-material`
- `@mui/x-data-grid`
- `@mui/x-date-pickers`
- `@mui/x-charts`

## Migration Guidance

- Build new forms, dialogs, buttons, tabs, layout surfaces, and admin screens with MUI.
- Use the shared theme in `src/app/theme/amplaTheme.js`.
- Keep existing React Bootstrap screens working while migrating feature by feature.
- Avoid introducing additional UI libraries unless there is a clear gap MUI cannot cover.
- Prefer MUI icons over inline SVGs or new icon packages.
- For charts, prefer the existing MUI charts package or Recharts until chart usage is consolidated.

## Branding

All user-facing product/business text should use `Ampla Uganda`.

Avoid older names such as `poweredStock`, `myStock`, or domain-specific labels in visible UI.
