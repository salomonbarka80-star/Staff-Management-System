import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
  features = [
    { icon: 'group', title: 'Employee Records', desc: 'Centralized digital files with version control and audit trails for all employee data.' },
    { icon: 'work', title: 'Recruitment & ATS', desc: 'End-to-end applicant tracking from requisition to offer letter with analytics.' },
    { icon: 'event_available', title: 'Time & Attendance', desc: 'Real-time tracking, shift scheduling, and leave management across teams.' },
    { icon: 'payments', title: 'Payroll Integration', desc: 'Seamless data exchange with payroll systems supporting multiple currencies.' },
    { icon: 'bar_chart', title: 'Analytics & Reports', desc: 'Actionable insights on workforce trends, performance, and compliance.' },
    { icon: 'verified_user', title: 'Enterprise Security', desc: 'Role-based access control with SSO, MFA, and AES-256 data encryption.' },
  ];

  stats = [
    { value: '500K+', label: 'Employees Managed' },
    { value: '99.9%', label: 'Uptime Reliability' },
  ];

  partners = ['TECHCORP', 'GLOBEX', 'SYNERGY', 'VOYAGER', 'LUMINA'];

  constructor(private router: Router) {}

  getStarted(): void { this.router.navigate(['/auth/register']); }
  signIn(): void { this.router.navigate(['/auth/login']); }
}
