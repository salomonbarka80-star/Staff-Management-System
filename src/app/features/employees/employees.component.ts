import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HrDataService } from '../../services/hr-data.service';
import { ToastService } from '../../shared/services/toast.service';
import { Department as HrDepartment, Employee, EmployeeStatus, EmploymentType } from '../../shared/models/hrms.models';

@Component({
  selector: 'app-employees',
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
})
export class EmployeesComponent implements OnInit {
  allEmployees: Employee[] = [];
  employees: Employee[] = [];
  loading = true;
  viewMode: 'list' | 'grid' = 'list';
  searchQuery = '';
  filterStatus = '';
  filterDept = '';
  filterType = '';
  sortField = 'firstName';
  sortDir: 'asc' | 'desc' = 'asc';
  showAddModal = false;
  selectedEmployee: Employee | null = null;

  showEditModal = false;
  selectedEmployeeForEdit: Employee | null = null;

  departments: string[] = [];
  private departmentOptions: HrDepartment[] = [];
  statuses: EmployeeStatus[] = ['active', 'on-leave', 'probation', 'terminated'];
  types: EmploymentType[] = ['full-time', 'part-time', 'contractor', 'intern'];

  constructor(private hr: HrDataService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadEmployeeData();
  }

  loadEmployeeData(): void {
    this.loading = true;
    
    forkJoin({
      employees: this.hr.getEmployees(),
      departments: this.hr.getDepartments(),
    }).subscribe({
      next: ({ employees, departments }: { employees: Employee[]; departments: HrDepartment[] }) => {
        const names = new Set<string>();
        this.departmentOptions = departments;
        departments.forEach((department) => names.add(department.name));
        employees.forEach((employee) => {
          if (employee.department?.name) names.add(employee.department.name);
        });

        const list = employees.map((employee) => this.normalizeEmployee(employee));

        this.allEmployees = list;
        this.departments = [...names].sort();
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        this.toast.error('Failed to load employees.');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allEmployees];
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.department.name.toLowerCase().includes(q)
      );
    }
    if (this.filterStatus) filtered = filtered.filter(e => e.status === this.filterStatus);
    if (this.filterDept)   filtered = filtered.filter(e => e.department.name === this.filterDept);
    if (this.filterType)   filtered = filtered.filter(e => e.employmentType === this.filterType);

    filtered.sort((a, b) => {
      const va = (a as any)[this.sortField] || '';
      const vb = (b as any)[this.sortField] || '';
      return this.sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    this.employees = filtered;
  }

  onSearch(): void  { this.applyFilters(); }
  onFilter(): void  { this.applyFilters(); }
  clearFilters(): void {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterDept = '';
    this.filterType = '';
    this.applyFilters();
  }

  sort(field: string): void {
    if (this.sortField === field) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    else { this.sortField = field; this.sortDir = 'asc'; }
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.filterStatus || this.filterDept || this.filterType);
  }

  openDetail(e: Employee): void  { this.selectedEmployee = e; }
  closeDetail(): void { this.selectedEmployee = null; }

  addEmployee(formValue: any): void {
    this.loading = true;
    const employee: Omit<Employee, 'id'> = {
      employeeId: this.nextEmployeeId(),
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      jobTitle: formValue.jobTitle,
      department: this.departmentForName(formValue.departmentName),
      employmentType: formValue.employmentType,
      status: formValue.status || 'active',
      startDate: formValue.startDate,
      location: formValue.location,
      manager: formValue.manager || '',
    };
    this.hr.createEmployee(employee).subscribe({
      next: (newEmp: Employee) => {
        this.allEmployees.push(this.normalizeEmployee(newEmp));
        this.applyFilters();
        this.showAddModal = false;
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
      }
    });
  }

  openEdit(e: Employee): void {
    this.selectedEmployeeForEdit = { ...e };
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.selectedEmployeeForEdit = null;
    this.showEditModal = false;
  }

  updateEmployee(formValue: any): void {
    if (!this.selectedEmployeeForEdit) return;
    this.loading = true;
    const updates: Partial<Employee> = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      jobTitle: formValue.jobTitle,
      department: this.departmentForName(formValue.departmentName),
      employmentType: formValue.employmentType,
      status: formValue.status,
      startDate: formValue.startDate,
      location: formValue.location,
      manager: formValue.manager,
    };
    this.hr.updateEmployee(this.selectedEmployeeForEdit.id, updates).subscribe({
      next: (updatedEmp: Employee) => {
        const normalizedEmployee = this.normalizeEmployee(updatedEmp);
        const idx = this.allEmployees.findIndex(e => e.id === normalizedEmployee.id);
        if (idx > -1) {
          this.allEmployees[idx] = normalizedEmployee;
          this.applyFilters();
        }
        this.closeEdit();
        if (this.selectedEmployee && this.selectedEmployee.id === normalizedEmployee.id) {
          this.selectedEmployee = normalizedEmployee;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
      }
    });
}
    deleteEmployee(e: Employee): void {
      if (!confirm(`Delete ${e.firstName} ${e.lastName}? This cannot be undone.`)) return;
      this.hr.deleteEmployee(e.id).subscribe({
        next: () => {
          this.allEmployees = this.allEmployees.filter((emp: Employee) => emp.id !== e.id);
          this.applyFilters();
          if (this.selectedEmployee?.id === e.id) this.closeDetail();
          this.toast.success('Employee deleted.');
        },
        error: () => this.toast.error('Failed to delete employee.')
      });
    }
  statusClass(s: string): string {
    const m: Record<string, string> = { active:'badge-success', 'on-leave':'badge-warning', probation:'badge-info', terminated:'badge-error' };
    return m[s] || 'badge-neutral';
  }
  typeClass(t: string): string {
    const m: Record<string, string> = { 'full-time':'badge-primary', 'part-time':'badge-info', contractor:'badge-neutral', intern:'badge-neutral' };
    return m[t] || 'badge-neutral';
  }
  initials(e: Employee): string { return `${e.firstName[0]}${e.lastName[0]}`; }
  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  }

  private departmentForName(name: string): HrDepartment {
    if (!name || name === 'Unassigned') {
      return { id: '', name: 'Unassigned', headCount: 0 };
    }

    return (
      this.departmentOptions.find((department) => department.name === name) ??
      { id: '', name, headCount: 0 }
    );
  }

  private normalizeEmployee(employee: Employee): Employee {
    return {
      ...employee,
      department: employee.department ?? { id: '', name: 'Unassigned', headCount: 0 },
    };
  }

  private nextEmployeeId(): string {
    const largestId = this.allEmployees.reduce((largest, employee) => {
      const match = employee.employeeId?.match(/EMP-(\d+)/);
      return match ? Math.max(largest, Number(match[1])) : largest;
    }, 1000);

    return `EMP-${largestId + 1}`;
  }
}

