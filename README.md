# HRMS Enterprise — Angular Frontend

**Stitch Enterprise Workforce Management Suite**  
Angular 17 · SCSS · Standalone Components · Lazy-Loaded Modules

---

## Project Structure

```
src/app/
├── app.module.ts              # Root module
├── app-routing.module.ts      # Lazy-loaded route tree
├── app.component.ts           # Root component
│
├── auth/                      # Authentication flows
│   ├── login/                 # Login page (email/password + SSO)
│   ├── register/              # Multi-step registration wizard
│   ├── reset-password/        # Forgot password flow
│   └── account-setup/        # Security setup with MFA toggle
│
├── core/
│   ├── guards/auth.guard.ts   # Route protection
│   └── services/
│       ├── auth.service.ts    # Auth state + JWT management
│       └── hr-data.service.ts # Mock data service (replace with API)
│
├── layout/
│   ├── app-shell.component.ts # Main layout shell (sidebar + topbar + router-outlet)
│   ├── sidebar/               # Collapsible left navigation
│   └── topbar/                # Top bar with search, notifications, user menu
│
├── shared/
│   ├── models/hrms.models.ts  # All TypeScript interfaces
│   └── shared.module.ts       # Shared pipes & directives
│
└── features/                  # Lazy-loaded feature modules
    ├── welcome/               # Public landing page
    ├── dashboard/             # Organization Health dashboard with KPIs & charts
    ├── employees/             # Employee Directory (list + grid view, filters, detail panel)
    ├── recruitment/           # ATS: Kanban board + job requisitions + candidate list
    ├── attendance/            # Time & Attendance tracking + leave management
    ├── payroll/               # Payroll register with summary cards
    ├── reports/               # Report catalog with run & schedule
    └── settings/              # Profile, org, security, notifications, integrations
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
# → http://localhost:4200

# Production build
npm run build:prod
```

## Demo Credentials

Email: `admin@enterprise.com`  
Password: any string (8+ chars)

The app uses a mock data service. Replace `hr-data.service.ts` with real HTTP calls when connecting to the Django backend.

---

## Design System

- **Framework**: Angular 17 (NgModule-based, lazy loading)
- **Styling**: SCSS with CSS custom properties (design tokens from Enterprise Core)
- **Typography**: Inter (Google Fonts)
- **Icons**: Material Symbols Outlined
- **Colors**: Corporate blue palette (`#0058be` primary, `#131b2e` navy, `#f8f9ff` surface)
- **Layout**: 4px base grid, max-width 1440px, 12-column fluid grid

## Backend Integration

All data flows through `HrDataService`. To connect the Django backend:

1. Replace `Observable<T>` returns with `HttpClient` calls
2. Add `HttpClientModule` interceptors for JWT auth headers
3. Map API response shapes to the TypeScript interfaces in `hrms.models.ts`
4. Update environment files with API base URL:
   ```ts
   // src/environments/environment.ts
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:8000/api/v1'
   };
   ```

Click the blue Deploy button.

Vercel will spin up a cloud environment, pull your repository code, install your dependencies safely on their end, and run the compilation build.

Once the deployment tracker completes and shows the confetti celebration screen, click on the window preview image to open your live, running web application.

