import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HrDataService } from '../../services/hr-data.service';
import { ToastService } from '../../shared/services/toast.service';
import { DashboardMetrics, Employee, LeaveRequest } from '../../shared/models/hrms.models';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  metrics!: DashboardMetrics;
  recentEmployees: Employee[] = [];
  pendingLeaves: LeaveRequest[] = [];
  loading = true;

  showAddDeptModal = false;
  newDept = { name: '', managerName: '' };
  isSubmitting = false;

  kpiCards: { label: string; value: string; icon: string; trend: string; trendUp: boolean; color: string }[] = [];

  @ViewChild('attendanceChart') attendanceChartRef!: ElementRef;
  @ViewChild('leaveChart') leaveChartRef!: ElementRef;
  attendanceStats = { present: 0, absent: 0, late: 0, onLeave: 0 };
  private attendanceChartInstance: Chart | null = null;
  private leaveChartInstance: Chart | null = null;
  private allLeaves: any[] = [];

  constructor(private hr: HrDataService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {}

  loadDashboardData(): void {
    this.loading = true;
    forkJoin([
      this.hr.getDashboardMetrics(),
      this.hr.getEmployees(),
      this.hr.getLeaveRequests({ status: 'pending' }),
      this.hr.getAttendance(),
      this.hr.getLeaveRequests(),
    ]).subscribe({
      next: ([metrics, employees, pendingLeaves, attendance, allLeaves]: any[]) => {
        this.metrics = metrics;
        this.pendingLeaves = pendingLeaves;
        this.recentEmployees = employees.slice(0, 5);
        this.allLeaves = allLeaves;

        this.attendanceStats = {
          present:  attendance.filter((r: any) => r.status === 'present').length,
          absent:   attendance.filter((r: any) => r.status === 'absent').length,
          late:     attendance.filter((r: any) => r.status === 'late').length,
          onLeave:  attendance.filter((r: any) => r.status === 'half-day').length,
        };

        this.kpiCards = [
          { label: 'Total Employees', value: metrics.totalEmployees.toLocaleString(), icon: 'group',      trend: '+12 this month',          trendUp: true,  color: 'blue'  },
          { label: 'Active Today',    value: metrics.activeToday.toLocaleString(),    icon: 'how_to_reg', trend: `${metrics.attendanceRate}% rate`, trendUp: true,  color: 'green' },
          { label: 'Open Positions',  value: metrics.openPositions.toString(),        icon: 'work',       trend: '3 urgent',                trendUp: false, color: 'amber' },
          { label: 'Pending Leaves',  value: pendingLeaves.length.toString(),         icon: 'event_busy', trend: 'Needs review',            trendUp: false, color: 'red'   },
        ];

        this.loading = false;
        setTimeout(() => {
          this.initAttendanceChart();
          this.initLeaveChart(allLeaves);
        }, 150);
      },
      error: () => {
        this.toast.error('Failed to load dashboard data.');
        this.loading = false;
      }
    });
  }

  initAttendanceChart(): void {
    if (!this.attendanceChartRef) return;
    if (this.attendanceChartInstance) this.attendanceChartInstance.destroy();
    this.attendanceChartInstance = new Chart(this.attendanceChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'Absent', 'Late', 'On Leave'],
        datasets: [{
          data: [
            this.attendanceStats.present,
            this.attendanceStats.absent,
            this.attendanceStats.late,
            this.attendanceStats.onLeave,
          ],
          backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  initLeaveChart(leaves: any[]): void {
    if (!this.leaveChartRef) return;
    if (this.leaveChartInstance) this.leaveChartInstance.destroy();
    const types = ['annual', 'sick', 'parental', 'unpaid', 'bereavement', 'study'];
    const counts = types.map(t => leaves.filter((l: any) => l.type === t).length);
    this.leaveChartInstance = new Chart(this.leaveChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Annual', 'Sick', 'Parental', 'Unpaid', 'Bereavement', 'Study'],
        datasets: [{
          label: 'Leave Requests',
          data: counts,
          backgroundColor: ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b', '#6b7280', '#22c55e'],
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  onAddDepartment(): void {
    if (!this.newDept.name) {
      this.toast.warning('Department name is required.');
      return;
    }
    this.isSubmitting = true;
    this.hr.createDepartment(this.newDept).subscribe({
      next: () => {
        this.toast.success('Department created successfully.');
        this.closeDeptModal();
        this.loadDashboardData();
      },
      error: () => {
        this.toast.error('Failed to create department.');
        this.isSubmitting = false;
      }
    });
  }

  closeDeptModal(): void {
    this.showAddDeptModal = false;
    this.newDept = { name: '', managerName: '' };
    this.isSubmitting = false;
  }

  approveLeave(id: string): void {
    this.hr.updateLeaveStatus(id, 'approved').subscribe({
      next: () => {
        this.pendingLeaves = this.pendingLeaves.filter(l => l.id !== id);
        this.metrics.pendingLeaves = this.pendingLeaves.length;
        this.kpiCards = this.kpiCards.map(k =>
          k.label === 'Pending Leaves' ? { ...k, value: this.pendingLeaves.length.toString() } : k
        );
        this.toast.success('Leave approved.');
      },
      error: () => this.toast.error('Failed to approve leave.')
    });
  }

  rejectLeave(id: string): void {
    this.hr.updateLeaveStatus(id, 'rejected').subscribe({
      next: () => {
        this.pendingLeaves = this.pendingLeaves.filter(l => l.id !== id);
        this.metrics.pendingLeaves = this.pendingLeaves.length;
        this.kpiCards = this.kpiCards.map(k =>
          k.label === 'Pending Leaves' ? { ...k, value: this.pendingLeaves.length.toString() } : k
        );
        this.toast.success('Leave rejected.');
      },
      error: () => this.toast.error('Failed to reject leave.')
    });
  }

  get departmentTotal(): number {
    return this.metrics?.departmentBreakdown?.reduce((a, b) => a + b.count, 0) || 1;
  }

  barWidth(count: number): number {
    const max = Math.max(...(this.metrics?.departmentBreakdown || []).map(d => d.count));
    return Math.round(count / max * 100);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      'active': 'badge-success', 'on-leave': 'badge-warning',
      'probation': 'badge-info', 'terminated': 'badge-error',
    };
    return map[status] || 'badge-neutral';
  }

  leaveTypeLabel(type: string): string {
    const map: Record<string, string> = {
      annual: 'Annual', sick: 'Sick', parental: 'Parental',
      unpaid: 'Unpaid', bereavement: 'Bereavement', study: 'Study',
    };
    return map[type] || type;
  }
}
