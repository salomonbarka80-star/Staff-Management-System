import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './layout/app-shell.component';

const routes: Routes = [
  { path: '', redirectTo: '/welcome', pathMatch: 'full' },
  {
    path: 'welcome',
    loadChildren: () => import('./features/welcome/welcome.module').then(m => m.WelcomeModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
      },
      {
        path: 'employees',
        loadChildren: () => import('./features/employees/employees.module').then(m => m.EmployeesModule),
      },
      {
        path: 'departments',
        loadChildren: () => import('./features/department/department.module').then(m => m.DepartmentModule),
      },
      {
        path: 'recruitment',
        loadChildren: () => import('./features/recruitment/recruitment.module').then(m => m.RecruitmentModule),
      },
      {
        path: 'attendance',
        loadChildren: () => import('./features/attendance/attendance.module').then(m => m.AttendanceModule),
      },
      {
        path: 'payroll',
        loadChildren: () => import('./features/payroll/payroll.module').then(m => m.PayrollModule),
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsModule),
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.module').then(m => m.SettingsModule),
      },
    ],
  },
  { path: '**', redirectTo: '/welcome' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
