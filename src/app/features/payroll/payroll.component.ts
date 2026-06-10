import { Component, OnInit } from '@angular/core';
import { HrDataService } from '../../services/hr-data.service';
import { ToastService } from '../../shared/services/toast.service';
import { PayrollRecord } from '../../shared/models/hrms.models';

interface Deduction { name: string; amount: number; type: 'tax' | 'benefit' | 'other'; }

interface PayrollEntry {
  id: string; name: string; initials: string; dept: string; position: string;
  gross: number; deductions: number; net: number; currency: string;
  period: string; status: string; payDate: string;
  breakdown: Deduction[];
}

@Component({
  selector: 'app-payroll',
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.scss'],
})
export class PayrollComponent implements OnInit {
  payrollRecords: PayrollRecord[] = [];
  payroll: PayrollEntry[] = [];
  loading = true;

  selectedPeriod = 'Nov 2024';
  searchQuery = '';
  filterStatus = '';
  periods = ['Nov 2024', 'Oct 2024', 'Sep 2024'];
  statuses = ['paid', 'processed', 'pending', 'on-hold'];

  selectedEntry: PayrollEntry | null = null;
  showPayslip = false;
  showRunModal = false;
  showAddModal = false;
  runningPayroll = false;
  runSuccess = false;
  allEmployees: any[] = [];

  constructor(private hr: HrDataService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadPayrollData();
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.hr.getEmployees().subscribe({
      next: (employees: any[]) => this.allEmployees = employees,
      error: () => {}
    });
  }

  loadPayrollData(): void {
    this.loading = true;
    this.hr.getPayrollRecords().subscribe({
      next: (records: any[]) => {
        this.payrollRecords = records;
        this.transformPayrollData(records);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load payroll data.');
      }
    });
  }

  transformPayrollData(records: any[]): void {
    this.payroll = records.map(r => ({
      id: String(r.id),
      name: `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim(),
      initials: `${r.employee?.firstName?.[0] ?? ''}${r.employee?.lastName?.[0] ?? ''}`,
      dept: r.employee?.department?.name ?? '',
      position: r.employee?.jobTitle ?? '',
      gross: Number(r.grossSalary ?? r.gross_salary ?? 0),
      deductions: (r.deductions ?? []).reduce((a: number, d: any) => a + Number(d.amount), 0),
      net: Number(r.netSalary ?? r.net_salary ?? 0),
      currency: r.currency ?? 'USD',
      period: r.period ?? '',
      status: r.status ?? 'pending',
      payDate: r.payDate ?? r.pay_date ?? '',
      breakdown: (r.deductions ?? []).map((d: any) => ({
        name: d.name,
        amount: Number(d.amount),
        type: d.type ?? d.deduction_type ?? 'other',
      })),
    }));
  }

  runPayroll(): void {
    this.runningPayroll = true;
    this.hr.getPayrollRecords().subscribe({
      next: (records: any[]) => {
        this.transformPayrollData(records);
        this.runningPayroll = false;
        this.runSuccess = true;
        this.toast.success('Payroll refreshed successfully.');
        setTimeout(() => {
          this.showRunModal = false;
          this.runSuccess = false;
        }, 2000);
      },
      error: () => {
        this.runningPayroll = false;
        this.toast.error('Failed to run payroll.');
      }
    });
  }

  submitPayrollRecord(formValue: any): void {
    const payload = {
      employeeId: formValue.employeeId,
      period: formValue.period,
      grossSalary: formValue.gross,
      netSalary: formValue.net,
      currency: formValue.currency || 'USD',
      status: formValue.status || 'pending',
      payDate: formValue.payDate,
      deductions: [],
    };
    this.hr.createPayrollRecord(payload).subscribe({
      next: () => {
        this.showAddModal = false;
        this.loadPayrollData();
        this.toast.success('Payroll record created successfully.');
        if (!this.periods.includes(formValue.period)) {
          this.periods = [formValue.period, ...this.periods];
        }
        this.selectedPeriod = formValue.period;
      },
      error: () => this.toast.error('Failed to create payroll record.')
    });
  }

  /* ── Computed ── */
  get filteredPayroll(): PayrollEntry[] {
    let list = this.payroll.filter(p => p.period === this.selectedPeriod);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.dept.toLowerCase().includes(q));
    }
    if (this.filterStatus) list = list.filter(p => p.status === this.filterStatus);
    return list;
  }

  get totalGross(): number {
    return this.filteredPayroll.reduce((a, p) => a + p.gross, 0);
  }

  get totalNet(): number {
    return this.filteredPayroll.reduce((a, p) => a + p.net, 0);
  }

  get totalDeduct(): number {
    return this.filteredPayroll.reduce((a, p) => a + p.deductions, 0);
  }

  get paidCount(): number {
    return this.filteredPayroll.filter(p => p.status === 'paid' || p.status === 'processed').length;
  }

  get pendingCount(): number {
    return this.filteredPayroll.filter(p => p.status === 'pending').length;
  }

  /* ── Actions ── */
  openPayslip(entry: PayrollEntry): void {
    this.selectedEntry = entry;
    this.showPayslip = true;
  }

  closePayslip(): void {
    this.showPayslip = false;
    this.selectedEntry = null;
  }

  /* ── Helpers ── */
  statusClass(s: string): string {
    const m: Record<string, string> = {
      paid: 'badge-success',
      processed: 'badge-info',
      pending: 'badge-warning',
      'on-hold': 'badge-error',
    };
    return m[s] || 'badge-neutral';
  }

  deductionTypeLabel(t: string): string {
    return { tax: 'Tax', benefit: 'Benefit', other: 'Other' }[t] ?? t;
  }

  deductionPct(amount: number, gross: number): number {
    return gross ? Math.round(amount / gross * 100) : 0;
  }
}