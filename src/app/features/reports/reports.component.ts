import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HrDataService } from '../../services/hr-data.service';

interface ReportItem {
  name: string; desc: string; icon: string;
  lastRun?: string; format: string;
}
interface ReportCategory {
  title: string; icon: string; color: string; reports: ReportItem[];
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {

  reportCategories: ReportCategory[] = [
    {
      title: 'Workforce Analytics', icon: 'group', color: 'blue',
      reports: [
        { name: 'Headcount Summary',     desc: 'Total employees by department, location and contract type.', icon: 'bar_chart',      lastRun: '2 hours ago',   format: 'XLSX' },
        { name: 'Attrition Analysis',    desc: 'Employee turnover trends and voluntary vs involuntary exit ratios.', icon: 'trending_down', lastRun: 'Yesterday',      format: 'PDF'  },
        { name: 'Diversity & Inclusion', desc: 'Workforce composition by gender, ethnicity, age band and disability.', icon: 'diversity_3',  lastRun: '3 days ago',    format: 'PDF'  },
        { name: 'Org Chart Export',      desc: 'Visual organisational structure for all or selected departments.', icon: 'account_tree',  lastRun: '1 week ago',    format: 'PDF'  },
      ],
    },
    {
      title: 'Attendance & Time', icon: 'schedule', color: 'green',
      reports: [
        { name: 'Daily Attendance',   desc: 'Clock-in/out records, anomalies and attendance rate per team.', icon: 'checklist',   lastRun: 'Today 08:00',  format: 'XLSX' },
        { name: 'Leave Utilization',  desc: 'Leave balances, accrual rates and usage breakdown by type.', icon: 'event_busy',   lastRun: 'Yesterday',    format: 'XLSX' },
        { name: 'Overtime Report',    desc: 'Total overtime hours by individual, team and month.', icon: 'more_time',    lastRun: '5 days ago',   format: 'PDF'  },
        { name: 'Absence Trends',     desc: 'Unplanned absence patterns, Bradford Factor scores.', icon: 'person_off',   lastRun: '1 week ago',   format: 'PDF'  },
      ],
    },
    {
      title: 'Recruitment', icon: 'work', color: 'purple',
      reports: [
        { name: 'Hiring Pipeline',    desc: 'Stage-by-stage candidate conversion and drop-off rates.', icon: 'view_kanban',  lastRun: '2 days ago',   format: 'PDF'  },
        { name: 'Time-to-Fill',       desc: 'Average days from requisition open to accepted offer by role.', icon: 'timer',        lastRun: '1 week ago',   format: 'XLSX' },
        { name: 'Source Effectiveness', desc: 'Applications, hires and cost-per-hire by recruitment channel.', icon: 'hub',          lastRun: '1 week ago',   format: 'PDF'  },
        { name: 'Offer Acceptance',   desc: 'Acceptance rates, decline reasons and counter-offer analysis.', icon: 'handshake',    lastRun: '2 weeks ago',  format: 'PDF'  },
      ],
    },
    {
      title: 'Payroll & Compensation', icon: 'payments', color: 'amber',
      reports: [
        { name: 'Payroll Summary',       desc: 'Gross, net and deductions by pay period with currency breakdown.', icon: 'receipt_long',     lastRun: 'Yesterday',   format: 'XLSX' },
        { name: 'Compensation Bands',    desc: 'Salary ranges vs market benchmarks per role and grade.', icon: 'legend_toggle',    lastRun: '1 month ago', format: 'PDF'  },
        { name: 'Benefits Enrollment',   desc: 'Benefits uptake, opt-out rates and cost allocation by plan.', icon: 'health_and_safety',lastRun: '1 month ago', format: 'PDF'  },
        { name: 'Tax & Compliance',      desc: 'Tax withholdings, statutory filings and audit-ready schedules.', icon: 'gavel',            lastRun: '2 weeks ago', format: 'PDF'  },
      ],
    },
  ];

 quickMetrics = [
    { label: 'Reports Generated', value: '247', trend: 'This month', up: true },
    { label: 'Scheduled Reports',  value:  '18', trend: 'Running weekly', up: true },
    { label: 'Data Accuracy',      value: '99.2%', trend: '↑ 0.4% vs last month', up: true },
  ];

  realMetrics: any = null;

  constructor(private hr: HrDataService) {}

  ngOnInit(): void {
    this.loadRealMetrics();
  }

  loadRealMetrics(): void {
    forkJoin({
      employees: this.hr.getEmployees(),
      leaves: this.hr.getLeaveRequests(),
      candidates: this.hr.getCandidates(),
      payroll: this.hr.getPayrollRecords(),
    }).subscribe({
      next: ({ employees, leaves, candidates, payroll }: any) => {
        this.quickMetrics = [
          { label: 'Total Employees', value: String(employees.length), trend: 'Active staff', up: true },
          { label: 'Pending Leaves', value: String(leaves.filter((l: any) => l.status === 'pending').length), trend: 'Awaiting review', up: false },
          { label: 'Candidates', value: String(candidates.length), trend: `${candidates.filter((c: any) => c.stage === 'hired').length} hired`, up: true },
        ];
      },
      error: () => {}
    });
  }

  selectedReport: ReportItem | null = null;
  runState: 'idle' | 'running' | 'done' = 'idle';
  selectedFormat = 'PDF';
  dateRange = 'last_30';
  scheduleModal = false;
  scheduleReport: ReportItem | null = null;
  scheduleFreq = 'weekly';

  showAddReportModal = false;
  newReport = {
    name: '',
    desc: '',
    category: '',
    format: 'PDF',
    icon: 'bar_chart'
  };

  runReport(r: ReportItem): void {
    this.selectedReport = r;
    this.runState = 'running';
    setTimeout(() => {
      this.runState = 'done';
    }, 2200);
  }

  downloadReport(): void {
    if (!this.selectedReport) {
      return;
    }

    const filename = `${this.selectedReport.name.replace(/\s+/g, '_')}.${this.selectedFormat.toLowerCase()}`;
    const content = `Report: ${this.selectedReport.name}\nFormat: ${this.selectedFormat}\nDate: ${new Date().toLocaleString()}\n\nThis is a generated report file from HRMS Enterprise.`;
    const mimeType = this.selectedFormat === 'PDF'
      ? 'application/pdf'
      : this.selectedFormat === 'XLSX'
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'text/csv';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  openSchedule(r: ReportItem, event: Event): void {
    event.stopPropagation();
    this.scheduleReport = r;
    this.scheduleModal = true;
  }

  confirmSchedule(): void {
    this.scheduleModal = false;
    this.scheduleReport = null;
  }

  deleteReport(cat: ReportCategory, report: ReportItem, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete the "${report.name}" report?`)) {
      const index = cat.reports.indexOf(report);
      if (index > -1) {
        cat.reports.splice(index, 1);
      }
    }
  }

  openAddReport(): void {
    this.showAddReportModal = true;
    this.newReport = {
      name: '',
      desc: '',
      category: this.reportCategories[0].title,
      format: 'PDF',
      icon: 'bar_chart'
    };
  }

  saveReport(): void {
    if (!this.newReport.name || !this.newReport.desc) {
      return;
    }

    const category = this.reportCategories.find(c => c.title === this.newReport.category);
    if (category) {
      category.reports.unshift({
        name: this.newReport.name,
        desc: this.newReport.desc,
        icon: this.newReport.icon,
        format: this.newReport.format,
        lastRun: 'Just now'
      });
      this.showAddReportModal = false;
    }
  }

  closeOverlay(): void {
    if (this.runState !== 'running') {
      this.runState = 'idle';
      this.selectedReport = null;
    }
  }
}

