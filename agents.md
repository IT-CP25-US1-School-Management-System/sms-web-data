# AI Agent Instructions — SMS Web Data

## Project Overview

**SMS Web Data** is a modern web-based data management application built with **Vue 3**, **TypeScript**, and **Vite**. It features secure OAuth2 authentication via Keycloak and a responsive UI using **shadcn-vue** components. The application is Thai-localized (UI labels in Thai).

## Tech Stack

| Category            | Technology                                       |
| ------------------- | ------------------------------------------------ |
| Framework           | Vue 3 (Composition API + `<script setup>`)       |
| Language            | TypeScript (strict)                              |
| Build Tool          | Vite 7                                           |
| Package Manager     | Bun                                              |
| State Management    | Pinia 3                                          |
| Routing             | Vue Router 4                                     |
| HTTP Client         | Axios                                            |
| CSS Framework       | TailwindCSS 4 (via `@tailwindcss/vite`)          |
| UI Components       | shadcn-vue (New York style)                      |
| Icons               | Lucide Vue Next                                  |
| Form Validation     | Vee-Validate + Zod                               |
| Charts              | @unovis/ts                                       |
| Toast Notifications | vue-sonner                                       |
| Authentication      | OAuth2 with Keycloak (Authorization Code + PKCE) |

## Project Structure

```
src/
├── assets/              # Static assets (images, fonts, etc.)
├── components/          # Reusable Vue components
│   ├── ui/              # shadcn-vue UI primitives (DO NOT edit manually)
│   └── ModeToggle.vue   # Dark/light theme toggle
├── composables/         # Vue composables (reusable logic)
│   ├── usePagination.ts # Pagination helper
│   └── useToast.ts      # Toast notification helper
├── layouts/             # Layout components
│   ├── MainLayout.vue   # Main app layout with sidebar + breadcrumb
│   └── AppSidebar.vue   # Sidebar navigation component
├── lib/                 # Utility libraries and constants
│   ├── constants.ts     # App constants, route names, enums
│   ├── env.ts           # Environment variable access
│   ├── helpers.ts       # Utility/helper functions
│   └── utils.ts         # shadcn-vue utility (cn function)
├── router/              # Vue Router configuration
│   └── index.ts         # Route definitions and guards
├── stores/              # Pinia stores
│   ├── api.ts           # Axios instances & API functions
│   └── auth.ts          # Authentication state & actions
├── types/               # TypeScript type definitions
│   └── auth.ts          # Auth-related interfaces
├── views/               # Page-level components (one per route)
│   ├── HomeView.vue
│   ├── LoginView.vue
│   ├── ProfileView.vue
│   └── SettingsView.vue
├── App.vue              # Root component
├── main.ts              # App entry point
└── style.css            # Global styles (TailwindCSS)
```

## Coding Conventions

### General

- **Language**: Always use TypeScript. Never use plain JavaScript.
- **Vue SFC format**: Always use `<script setup lang="ts">` (Composition API with `<script setup>`).
- **No Options API**: Never use Options API (`data()`, `methods`, `computed` properties as objects).
- **Formatting**: Follow the existing code style. No semicolons are used inconsistently — match the style of the file you're editing.

### Naming Conventions

| Item              | Convention          | Example                              |
| ----------------- | ------------------- | ------------------------------------ |
| Vue components    | PascalCase          | `HomeView.vue`, `AppSidebar.vue`     |
| View components   | `*View.vue`         | `HomeView.vue`, `LoginView.vue`      |
| Layout components | `*Layout.vue`       | `MainLayout.vue`                     |
| Composables       | `use*.ts`           | `usePagination.ts`                   |
| Pinia stores      | `use*Store`         | `useAuthStore`                       |
| TypeScript types  | PascalCase          | `AuthTokens`, `UserInfo`             |
| Constants         | UPPER_SNAKE_CASE    | `ROUTE_NAMES`, `DATASET_SENSITIVITY` |
| Route names       | PascalCase strings  | `'Home'`, `'Login'`, `'Settings'`    |
| CSS classes       | TailwindCSS utility | `class="flex items-center gap-2"`    |

### Component Patterns

- **Page components** go in `src/views/` and are lazy-loaded in the router.
- **Reusable components** go in `src/components/`.
- **shadcn-vue UI components** live in `src/components/ui/` — do NOT manually edit these; use `npx shadcn-vue@latest add <component>` to add or update.
- **Layouts** go in `src/layouts/` and wrap page content via `<slot />`.
- Use `MainLayout` as the wrapper for all authenticated pages.

### Import Aliases

Always use the `@/` alias for imports:

```typescript
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { ROUTE_NAMES } from '@/lib/constants'
```

### State Management (Pinia)

- Define stores using `defineStore` with the **setup function** syntax (not options syntax).
- Use `ref()` for reactive state, `computed()` for derived state.
- Use `readonly()` when exposing state that should not be mutated externally.
- Store files go in `src/stores/`.

### API & HTTP Requests

- Two Axios instances exist in `src/stores/api.ts`:
  - `authApiInstance` — for authentication endpoints (`VITE_API_BASE_URL_AUTH`)
  - `dataApiInstance` — for data endpoints (`VITE_API_BASE_URL_DATA`), includes automatic 401 retry with session refresh.
- API functions are defined as named exports in `src/stores/api.ts`.
- Always define request/response types in `src/types/`.
- Axios interceptors handle token refresh and error logging automatically.

### Routing

- Route names are defined as constants in `src/lib/constants.ts` (`ROUTE_NAMES`).
- Always reference routes by name, never by path string.
- Use `meta: { requiresAuth: true }` for protected routes.
- Use `meta: { requiresGuest: true }` for guest-only routes (e.g., login).
- Views are lazy-loaded: `component: () => import('@/views/SomeView.vue')`.

### Authentication

- OAuth2 flow with Keycloak using Authorization Code + PKCE.
- Auth state is managed in `useAuthStore` (Pinia).
- Key auth methods: `initiateLogin()`, `handleCallback()`, `checkSession()`, `logout()`.
- Permission checking: `hasPermission(resourceName)`, `hasRole(roleName)`.
- Tokens are stored in memory (not localStorage) for security.

### Styling

- Use **TailwindCSS 4** utility classes exclusively. Avoid custom CSS unless absolutely necessary.
- Use `cn()` from `@/lib/utils` to merge class names conditionally.
- Support dark/light mode via `ModeToggle` component.
- Follow shadcn-vue theming with CSS variables defined in `src/style.css`.

### UI Text & Localization

- **All user-facing text must be in Thai** (ภาษาไทย).
- Date formatting uses Thai locale (`th-TH`) — see `src/lib/helpers.ts`.
- Examples: `"หน้าหลัก"` (Home), `"ตั้งค่าระบบ"` (Settings), `"โปรไฟล์"` (Profile).

### Environment Variables

- All env vars are prefixed with `VITE_` and accessed via `import.meta.env`.
- Centralized env access in `src/lib/env.ts`.
- Required variables:
  - `VITE_API_BASE_URL_AUTH` — Auth API base URL
  - `VITE_API_BASE_URL_DATA` — Data API base URL
  - `VITE_APP_NAME` — Application display name
  - `VITE_APP_VERSION` — Application version
  - `VITE_APP_MODE` — `development` | `production`

## Adding New Features

### Adding a New Page

1. Create a new view component in `src/views/NewPageView.vue`.
2. Add the route name to `ROUTE_NAMES` in `src/lib/constants.ts`.
3. Add the route definition in `src/router/index.ts` with `meta: { requiresAuth: true }`.
4. Add a menu entry in `src/layouts/AppSidebar.vue` if it should appear in the sidebar.
5. Add breadcrumb config in `src/layouts/MainLayout.vue`.

### Adding a New API Endpoint

1. Define request/response types in `src/types/`.
2. Create the API function in `src/stores/api.ts` using the appropriate Axios instance.
3. If state management is needed, create or update a Pinia store in `src/stores/`.

### Adding a New UI Component

- For shadcn-vue components: `bunx --bun shadcn-vue@latest add <component-name>`
- For custom components: create in `src/components/` with PascalCase naming.

### Adding a New Composable

1. Create `src/composables/use<Name>.ts`.
2. Export a function named `use<Name>` that returns reactive state and methods.

## Commands

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `bun install`     | Install dependencies          |
| `bun run dev`     | Start dev server (port 5173)  |
| `bun run build`   | Type-check and build for prod |
| `bun run preview` | Preview production build      |

## Important Notes

- **Do NOT edit** files in `src/components/ui/` directly — they are managed by shadcn-vue CLI.
- **Do NOT store tokens in localStorage** — use in-memory token management via `src/stores/api.ts`.
- **Always use route names** from `ROUTE_NAMES` constant — never hardcode path strings.
- **All new dependencies** should be installed via `bun add <package>`.
- The project uses **TailwindCSS v4** which uses `@tailwindcss/vite` plugin (no `tailwind.config.js` needed).
