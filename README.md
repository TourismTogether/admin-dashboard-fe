# Admin Dashboard

React-based admin dashboard application for managing personal and group tasks.

**Inspired by [OptimAI](https://optimai.network).**

## Prerequisites

- Node.js 18+
- pnpm 8+ (required package manager)

## Installation

### Install pnpm (if not already installed)

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start development server:

```bash
pnpm dev
```

3. Build for production:

```bash
pnpm build
```

4. Preview production build:

```bash
pnpm preview
```

## Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── group-tasks/          # Group task components
│   │   │   ├── GroupTaskTimelineView.tsx
│   │   │   └── GroupTaskWeekView.tsx
│   │   ├── personal-tasks/      # Personal task feature components
│   │   │   ├── dialogs/          # Dialog components
│   │   │   │   ├── CreateTableDialog.tsx
│   │   │   │   ├── EditTableDialog.tsx
│   │   │   │   ├── CreateSwimlaneDialog.tsx
│   │   │   │   ├── TaskDialog.tsx
│   │   │   │   ├── TaskDetailDialog.tsx
│   │   │   │   ├── DeleteTableDialog.tsx
│   │   │   │   ├── DeleteSwimlaneDialog.tsx
│   │   │   │   └── DeleteTaskDialog.tsx
│   │   │   ├── tables/           # Table components
│   │   │   │   ├── WeekTable.tsx
│   │   │   │   └── TablesList.tsx
│   │   │   ├── task-summary/     # Task summary components
│   │   │   │   ├── TaskSummaryTables.tsx
│   │   │   │   ├── TaskTabs.tsx
│   │   │   │   ├── TasksTable.tsx
│   │   │   │   ├── KanbanBoard.tsx
│   │   │   │   ├── TaskCard.tsx
│   │   │   │   └── Pagination.tsx
│   │   │   ├── performance-stats/
│   │   │   │   ├── PerformanceStats.tsx
│   │   │   │   └── index.ts
│   │   │   └── shared/
│   │   │       ├── types.ts
│   │   │       ├── utils.ts
│   │   │       └── index.ts
│   │   ├── portfolio/            # Portfolio feature components
│   │   │   ├── dialogs/
│   │   │   │   └── DeletePortfolioDialog.tsx
│   │   │   ├── AvatarInput.tsx
│   │   │   ├── AvatarPreview.tsx
│   │   │   ├── ContributionCalendar.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── HistorySection.tsx
│   │   │   ├── PortfolioForm.tsx
│   │   │   ├── ProfileCard.tsx
│   │   │   ├── ReadmeCard.tsx
│   │   │   ├── shared/
│   │   │   │   └── utils.ts
│   │   │   └── index.ts
│   │   ├── self-study/          # Self-study feature components
│   │   │   ├── PomodoroTimer.tsx
│   │   │   ├── TaskList.tsx
│   │   │   └── index.ts
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── select.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   └── textarea.tsx
│   │   └── ProtectedRoute.tsx
│   ├── layouts/
│   │   ├── DashboardLayout.tsx
│   │   └── RootLayout.tsx
│   ├── pages/
│   │   ├── BrainstormPage.tsx
│   │   ├── GroupTaskPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── PersonalTaskPage.tsx
│   │   ├── PortfolioPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── SelfStudyPage.tsx
│   │   └── SettingsPage.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── brainstormApi.ts
│   │   │   └── portfolioApi.ts
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── store/
│   │   ├── authSlice.ts
│   │   └── store.ts
│   ├── main.tsx
│   ├── index.css
│   └── style.css
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
└── tsconfig.json
```

## Component Organization

### Personal Tasks Components

The personal tasks feature is organized into logical folders:

- **`dialogs/`**: All dialog/modal components for creating, editing, and deleting entities
- **`tables/`**: Table components for displaying week tables and table lists
- **`task-summary/`**: Components for task summary views including tabs, tables, kanban board, and pagination
- **`performance-stats/`**: Components for displaying performance statistics and charts
- **`shared/`**: Shared TypeScript types and utility functions used across personal tasks components

### Portfolio Components

Portfolio feature components for managing user portfolios:

- **`dialogs/`**: Dialog components for portfolio operations
- **`shared/`**: Shared utilities for portfolio components

### Self-Study Components

Self-study feature components including Pomodoro timer and task list.

### Brainstorm

Brainstorm page and API client for creating and editing Mermaid diagrams (flowchart, ER, mindmap, etc.). Diagrams are stored per user with name and type.

### Benefits of This Structure

- **Better organization**: Related components are grouped together
- **Easier maintenance**: Clear separation of concerns
- **Reusability**: Shared utilities and types in one place
- **Scalability**: Easy to add new features or components

## Features

- **Personal Tasks**:
  - Week-based task management with swimlanes
  - Task summary with tabs (Incomplete, Done, Kanban)
  - Performance statistics and charts
  - Drag and drop task management
- **Group Tasks**: View and manage group tasks

- **Portfolio**: Manage user portfolios with profile, history, and contribution calendar

- **Brainstorm**: Create and edit Mermaid diagrams (flowchart, ER, mindmap, class, sequence, etc.) with live preview and optional Mermaid Live link

- **Self-Study**: Pomodoro timer and task list for self-study sessions

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Recharts** - Chart library for statistics
- **date-fns** - Date manipulation
- **class-variance-authority** - Component variants
- **mermaid** - Diagram rendering (flowchart, ER, mindmap, etc.)
- **pako** - Compression for Mermaid Live URL encoding

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run linter (if configured)

## Development Guidelines

1. **Use pnpm** for all package management operations
2. **Follow the folder structure** when adding new components
3. **Use shared types** from `shared/types.ts` for consistency
4. **Use shared utilities** from `shared/utils.ts` when possible
5. **Export components** through `index.ts` files for cleaner imports

## Environment

- `VITE_API_URL` (optional): API base URL. Default: `http://localhost:8081` (must match admin-dashboard-server port).

## License

ISC (or specify your license)
