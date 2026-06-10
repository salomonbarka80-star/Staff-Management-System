import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { HrDataService } from '../../services/hr-data.service';
import { ToastService } from '../../shared/services/toast.service';
import { AttendanceRecord, LeaveRequest } from '../../shared/models/hrms.models';

interface ScheduleEvent {
  title: string; day: number; hour: number; duration: number;
  color: 'default' | 'green' | 'amber' | 'purple';
}

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss'],
})
export class AttendanceComponent implements OnInit {
  attendanceRecords: AttendanceRecord[] = [];
  allEmployees: any[] = [];
  todayRecords: any[] = [];
  leaveRequests: LeaveRequest[] = [];
  loading = true;
  activeTab: 'today' | 'leaves' | 'schedule' = 'today';
  searchQuery = '';
  filterStatus = '';
  leaveFilterStatus = '';
  showRequestModal = false;
  showSuccessToast = false;
  requestForm!: FormGroup;
  submittingRequest = false;

  summaryStats = { present: 0, absent: 0, late: 0, onLeave: 0 };

  weekLabel = 'Week 45 · Nov 4–8, 2024';
  weekDays = [
    { label: 'Mon', date: '4 Nov' },
    { label: 'Tue', date: '5 Nov' },
    { label: 'Wed', date: '6 Nov' },
    { label: 'Thu', date: '7 Nov' },
    { label: 'Fri', date: '8 Nov' },
  ];
  hours = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

  scheduleEvents: ScheduleEvent[] = [
    { title: 'Team Standup',         day: 0, hour: 1, duration: 1, color: 'default' },
    { title: 'Team Standup',         day: 1, hour: 1, duration: 1, color: 'default' },
    { title: 'Team Standup',         day: 2, hour: 1, duration: 1, color: 'default' },
    { title: 'Team Standup',         day: 3, hour: 1, duration: 1, color: 'default' },
    { title: 'Team Standup',         day: 4, hour: 1, duration: 1, color: 'default' },
    { title: 'HR All-Hands',         day: 1, hour: 2, duration: 2, color: 'green'   },
    { title: 'Performance Reviews',  day: 2, hour: 6, duration: 3, color: 'amber'   },
    { title: 'L&D Workshop',         day: 3, hour: 3, duration: 2, color: 'purple'  },
    { title: 'Sprint Planning',      day: 0, hour: 3, duration: 2, color: 'green'   },
  ];

  leaveTypeColors: Record<string, string> = {
    annual: '#0058be', sick: '#ba1a1a', parental: '#7c3aed',
    unpaid: '#b45309', bereavement: '#6b7280', study: '#1a7a4a',
  };
  leaveTypes = ['annual', 'sick', 'parental', 'unpaid', 'bereavement', 'study'];

  constructor(private hr: HrDataService, private fb: FormBuilder, private toast: ToastService) {}

  ngOnInit(): void {
    this.requestForm = this.fb.group({
      type:      ['annual', Validators.required],
      startDate: ['', Validators.required],
      endDate:   ['', Validators.required],
      reason:    [''],
    });

    this.loadAttendanceData();
  }

 loadAttendanceData(): void {
  this.loading = true;
  const today = new Date().toISOString().split('T')[0];
  forkJoin([
    this.hr.getAttendance(today),
    this.hr.getLeaveRequests(),
    this.hr.getEmployees(),
  ]).subscribe({
    next: ([records, leaves, employees]: any[]) => {
      this.attendanceRecords = records;
      this.leaveRequests = leaves;
      this.allEmployees = employees;

      // Merge employees with their attendance record for today
      this.todayRecords = employees.map((emp: any) => {
        const record = records.find((r: any) => r.employee?.id === emp.id);
        return {
          employeeId: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          department: emp.department,
          date: today,
          status: record?.status ?? 'not-marked',
          checkIn: record?.checkIn ?? null,
          checkOut: record?.checkOut ?? null,
          totalHours: record?.totalHours ?? null,
          shiftStart: record?.shiftStart ?? '08:00',
          shiftEnd: record?.shiftEnd ?? '17:00',
          recordId: record?.id ?? null,
        };
      });

      this.updateSummaryStats();
      this.loading = false;
    },
    error: () => {
      this.toast.error('Failed to load attendance data.');
      this.loading = false;
    }
  });
}

  markAttendance(employeeId: number, status: string): void {
  const today = new Date().toISOString().split('T')[0];
  this.hr.markAttendance({
    employeeId,
    status,
    date: today,
    shiftStart: '08:00',
    shiftEnd: '17:00',
    checkIn: status !== 'absent' ? new Date().toTimeString().slice(0, 5) : undefined,
  }).subscribe({
    next: (record: any) => {
      const idx = this.todayRecords.findIndex(r => r.employeeId === employeeId);
      if (idx > -1) {
        this.todayRecords[idx] = {
          ...this.todayRecords[idx],
          status: record.status,
          checkIn: record.checkIn,
          recordId: record.id,
        };
        this.todayRecords = [...this.todayRecords];
      }
      this.updateSummaryStats();
      this.toast.success(`Marked as ${status}.`);
    },
    error: () => this.toast.error('Failed to mark attendance.')
  });
}

updateSummaryStats(): void {
  this.summaryStats = {
    present: this.todayRecords.filter(r => r.status === 'present').length,
    absent:  this.todayRecords.filter(r => r.status === 'absent').length,
    late:    this.todayRecords.filter(r => r.status === 'late').length,
    onLeave: this.todayRecords.filter(r => r.status === 'half-day').length,
  };
}

  /* ── Computed ── */
 get filteredRecords(): any[] {
  let r = [...this.todayRecords];
  if (this.searchQuery) {
    const q = this.searchQuery.toLowerCase();
    r = r.filter(rec =>
      `${rec.firstName} ${rec.lastName}`.toLowerCase().includes(q) ||
      rec.department?.name?.toLowerCase().includes(q)
    );
  }
  if (this.filterStatus) r = r.filter(rec => rec.status === this.filterStatus);
  return r;
}

  get filteredLeaves(): LeaveRequest[] {
    return this.leaveFilterStatus
      ? this.leaveRequests.filter(l => l.status === this.leaveFilterStatus)
      : this.leaveRequests;
  }

  get pendingCount(): number { return this.leaveRequests.filter(l => l.status === 'pending').length; }

 get attendanceRate(): number {
  const t = this.todayRecords.length;
  return t ? Math.round(this.summaryStats.present / t * 100) : 0;
}

  get computedDays(): number {
    const { startDate, endDate } = this.requestForm.value;
    if (!startDate || !endDate) return 0;
    const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000;
    return diff >= 0 ? Math.round(diff) + 1 : 0;
  }

  /* ── Helpers ── */
 statusClass(s: string): string {
    const m: Record<string, string> = {
      present: 'badge-success', absent: 'badge-error',
      late: 'badge-warning', 'half-day': 'badge-info',
      holiday: 'badge-neutral', remote: 'badge-info',
      'not-marked': 'badge-neutral',
    };
    return m[s] || 'badge-neutral';
  }

  leaveStatusClass(s: string): string {
    const m: Record<string, string> = {
      pending: 'badge-warning', approved: 'badge-success',
      rejected: 'badge-error', cancelled: 'badge-neutral',
    };
    return m[s] || 'badge-neutral';
  }

  initials(r: AttendanceRecord): string {
    return `${r.employee.firstName[0]}${r.employee.lastName[0]}`;
  }

  getEventForCell(dayIdx: number, hourIdx: number): ScheduleEvent | null {
    return this.scheduleEvents.find(e => e.day === dayIdx && e.hour === hourIdx) ?? null;
  }

  isEventContinuation(dayIdx: number, hourIdx: number): boolean {
    return this.scheduleEvents.some(e =>
      e.day === dayIdx && hourIdx > e.hour && hourIdx < e.hour + e.duration
    );
  }

  /* ── Actions ── */
  approveLeave(id: string): void {
    this.hr.updateLeaveStatus(id, 'approved').subscribe({
      next: () => {
        const i = this.leaveRequests.findIndex(l => l.id === id);
        if (i > -1) this.leaveRequests = [
          ...this.leaveRequests.slice(0, i),
          { ...this.leaveRequests[i], status: 'approved' as const },
          ...this.leaveRequests.slice(i + 1),
        ];
        this.toast.success('Leave request approved.');
      },
      error: () => this.toast.error('Failed to approve leave request.'),
    });
  }

  rejectLeave(id: string): void {
    this.hr.updateLeaveStatus(id, 'rejected').subscribe({
      next: () => {
        const i = this.leaveRequests.findIndex(l => l.id === id);
        if (i > -1) this.leaveRequests = [
          ...this.leaveRequests.slice(0, i),
          { ...this.leaveRequests[i], status: 'rejected' as const },
          ...this.leaveRequests.slice(i + 1),
        ];
        this.toast.success('Leave request rejected.');
      },
      error: () => this.toast.error('Failed to reject leave request.'),
    });
  }

  submitRequest(): void {
  if (this.requestForm.invalid) { this.requestForm.markAllAsTouched(); return; }
  this.submittingRequest = true;
  const v = this.requestForm.value;
  const payload: Partial<LeaveRequest> = {
    type: v.type,
    startDate: v.startDate,
    endDate: v.endDate,
    days: this.computedDays,
    reason: v.reason,
  };
  this.hr.createLeaveRequest(payload).subscribe({
    next: (newReq: LeaveRequest) => {
      this.leaveRequests = [newReq, ...this.leaveRequests];
      this.showRequestModal = false;
      this.submittingRequest = false;
      this.requestForm.reset({ type: 'annual' });
      this.toast.success('Leave request submitted successfully!');
    },
    error: () => {
      this.submittingRequest = false;
      this.toast.error('Failed to submit leave request.');
    }
  });
}

  closeModal(event: MouseEvent): void {
    this.showRequestModal = false;
  }

}

