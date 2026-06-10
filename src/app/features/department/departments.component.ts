import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HrDataService } from '../../services/hr-data.service';
import { ToastService } from '../../shared/services/toast.service';

/* ── Types ─────────────────────────────────────────────────── */
export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  manager: string;
  managerInitials: string;
  headCount: number;
  openPositions: number;
  location: string;
  costCenter: string;
  budget: number;
  budgetUsed: number;
  color: string;
  isActive: boolean;
  createdAt: string;
}

const COLORS = [
  '#0058be', '#7c3aed', '#166534', '#b45309',
  '#be185d', '#0369a1', '#dc2626', '#059669',
];

@Component({
  selector: 'app-departments',
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss'],
})
export class DepartmentsComponent implements OnInit {

  /* ── State ─────────────────────────────────────────────────── */
  departments: Department[] = [];
  filteredDepartments: Department[] = [];

  searchQuery    = '';
  statusFilter   = 'all';   // all | active | inactive
  viewMode: 'cards' | 'table' = 'cards';

  showAddModal   = false;
  showEditModal  = false;
  showDeleteDialog = false;
  saving         = false;

  selectedDept: Department | null = null;
  addForm!: FormGroup;
  editForm!: FormGroup;

  /* ── Lifecycle ─────────────────────────────────────────────── */
  constructor(
    private fb: FormBuilder,
    private hr: HrDataService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.addForm = this.fb.group({
      name:        ['', [Validators.required, Validators.maxLength(100)]],
      code:        ['', [Validators.required, Validators.maxLength(10), Validators.pattern(/^[A-Z0-9_]+$/)]],
      description: [''],
      manager:     ['', Validators.required],
      location:    ['', Validators.required],
      costCenter:  [''],
      budget:      [0, [Validators.required, Validators.min(0)]],
    });

    this.editForm = this.fb.group({
      name:        ['', [Validators.required, Validators.maxLength(100)]],
      code:        ['', [Validators.required, Validators.maxLength(10)]],
      description: [''],
      manager:     ['', Validators.required],
      location:    ['', Validators.required],
      costCenter:  [''],
      budget:      [0, [Validators.required, Validators.min(0)]],
      isActive:    [true],
    });

    this.loadDepartments();
  }

  loadDepartments(): void {
    this.hr.getDepartments({ search: this.searchQuery, status: this.statusFilter === 'active' ? 'active' : this.statusFilter === 'inactive' ? 'inactive' : '' }).subscribe({
      next: (departments) => {
        this.departments = departments.map((department, index) => this.fromApiDepartment(department, index));
        this.applyFilters();
      },
      error: () => this.toast.error('Failed to load departments.'),
    });
  }

  /* ── Filtering ─────────────────────────────────────────────── */
  applyFilters(): void {
    let list = [...this.departments];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.manager.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.costCenter.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter === 'active')   list = list.filter(d => d.isActive);
    if (this.statusFilter === 'inactive') list = list.filter(d => !d.isActive);

    this.filteredDepartments = list;
  }

  onSearch(): void          { this.loadDepartments(); }
  onStatusChange(): void    { this.loadDepartments(); }

  /* ── Summary metrics ───────────────────────────────────────── */
  get totalHeadCount(): number {
    return this.departments.filter(d => d.isActive).reduce((s, d) => s + d.headCount, 0);
  }
  get totalOpenPositions(): number {
    return this.departments.filter(d => d.isActive).reduce((s, d) => s + d.openPositions, 0);
  }
  get totalBudget(): number {
    return this.departments.filter(d => d.isActive).reduce((s, d) => s + d.budget, 0);
  }
  get activeDeptCount(): number {
    return this.departments.filter(d => d.isActive).length;
  }

  /* ── Add Department ────────────────────────────────────────── */
  openAddModal(): void {
    this.addForm.reset({ budget: 0 });
    this.showAddModal = true;
  }

  submitAdd(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.saving = true;

    this.hr.createDepartment({
      name: this.addForm.value.name,
      managerName: this.addForm.value.manager,
    }).subscribe({
      next: (createdDepartment) => {
      const v = this.addForm.value;
      const newDept: Department = {
        id:             String(createdDepartment.id),
        name:           v.name,
        code:           v.code.toUpperCase(),
        description:    v.description,
        manager:        v.manager,
        managerInitials: v.manager.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        headCount:      0,
        openPositions:  0,
        location:       v.location,
        costCenter:     v.costCenter || '—',
        budget:         +v.budget,
        budgetUsed:     0,
        color:          COLORS[this.departments.length % COLORS.length],
        isActive:       true,
        createdAt:      new Date().toISOString().split('T')[0],
      };
      this.departments = [newDept, ...this.departments];
      this.applyFilters();
      this.saving = false;
      this.showAddModal = false;
      this.toast.success('Department created.');
      },
      error: () => {
        this.saving = false;
        this.toast.error('Failed to create department.');
      },
    });
  }

  /* ── Edit Department ───────────────────────────────────────── */
  openEdit(dept: Department, event: Event): void {
    event.stopPropagation();
    this.selectedDept = dept;
    this.editForm.patchValue({
      name:        dept.name,
      code:        dept.code,
      description: dept.description,
      manager:     dept.manager,
      location:    dept.location,
      costCenter:  dept.costCenter,
      budget:      dept.budget,
      isActive:    dept.isActive,
    });
    this.showEditModal = true;
  }

  submitEdit(): void {
    if (this.editForm.invalid || !this.selectedDept) { this.editForm.markAllAsTouched(); return; }
    this.saving = true;

    setTimeout(() => {
      const v = this.editForm.value;
      this.departments = this.departments.map(d =>
        d.id === this.selectedDept!.id
          ? {
              ...d,
              name:           v.name,
              code:           v.code.toUpperCase(),
              description:    v.description,
              manager:        v.manager,
              managerInitials: v.manager.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
              location:       v.location,
              costCenter:     v.costCenter || '—',
              budget:         +v.budget,
              isActive:       v.isActive,
            }
          : d
      );
      this.applyFilters();
      this.saving = false;
      this.showEditModal = false;
      this.selectedDept = null;
    }, 700);
  }

  /* ── Delete Department ─────────────────────────────────────── */
  openDelete(dept: Department, event: Event): void {
    event.stopPropagation();
    this.selectedDept = dept;
    this.showDeleteDialog = true;
  }

  confirmDelete(): void {
    if (!this.selectedDept) return;
    this.departments = this.departments.filter(d => d.id !== this.selectedDept!.id);
    this.applyFilters();
    this.showDeleteDialog = false;
    this.selectedDept = null;
  }

  /* ── Toggle active ─────────────────────────────────────────── */
  toggleActive(dept: Department, event: Event): void {
    event.stopPropagation();
    this.departments = this.departments.map(d =>
      d.id === dept.id ? { ...d, isActive: !d.isActive } : d
    );
    this.applyFilters();
  }

  /* ── Helpers ───────────────────────────────────────────────── */
  budgetUsedPct(dept: Department): number {
    return dept.budget ? Math.min(100, Math.round(dept.budgetUsed / dept.budget * 100)) : 0;
  }

  budgetColor(pct: number): string {
    if (pct >= 90) return 'var(--color-error)';
    if (pct >= 70) return 'var(--color-warning)';
    return 'var(--color-success)';
  }

  autoCode(): void {
    const name = this.addForm.get('name')?.value || '';
    const code = name.split(' ').map((w: string) => w[0] || '').join('').toUpperCase().slice(0, 6);
    this.addForm.patchValue({ code });
  }

  closeModal(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showAddModal    = false;
      this.showEditModal   = false;
      this.showDeleteDialog = false;
    }
  }

  trackById(_: number, d: Department): string { return d.id; }

  private fromApiDepartment(department: any, index: number): Department {
    const name = department.name ?? `Department ${index + 1}`;
    const manager = department.manager ?? department.managerName ?? department.manager_name ?? 'Unassigned';
    const budget = Number(department.budget ?? 0);

    return {
      id: String(department.id ?? index + 1),
      name,
      code: String(department.code ?? this.codeFromName(name)).toUpperCase().slice(0, 10),
      description: department.description ?? 'No description provided.',
      manager,
      managerInitials: this.initialsFromName(manager),
      headCount: Number(department.headCount ?? department.head_count ?? department.employeeCount ?? 0),
      openPositions: Number(department.openPositions ?? department.open_positions ?? 0),
      location: department.location ?? 'Remote',
      costCenter: department.costCenter ?? department.cost_center ?? 'N/A',
      budget,
      budgetUsed: Number(department.budgetUsed ?? department.budget_used ?? Math.round(budget * 0.65)),
      color: department.color ?? COLORS[index % COLORS.length],
      isActive: department.isActive ?? department.is_active ?? true,
      createdAt: department.createdAt ?? department.created_at ?? new Date().toISOString().split('T')[0],
    };
  }

  private codeFromName(name: string): string {
    return name
      .split(/\s+/)
      .map((word) => word[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 6) || 'DEPT';
  }

  private initialsFromName(name: string): string {
    return name
      .split(/\s+/)
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'NA';
  }

  /* ── Seed data ─────────────────────────────────────────────── */
  private seedData(): Department[] {
    return [
      {
        id: 'd1', name: 'Engineering', code: 'ENG', color: '#0058be',
        description: 'Product development, platform engineering and QA.',
        manager: 'Marcus Thompson', managerInitials: 'MT',
        headCount: 48, openPositions: 4, location: 'San Francisco, CA',
        costCenter: 'CC-001', budget: 4200000, budgetUsed: 3150000,
        isActive: true, createdAt: '2019-01-15',
      },
      {
        id: 'd2', name: 'Product', code: 'PRD', color: '#7c3aed',
        description: 'Product strategy, roadmap planning and user research.',
        manager: 'Priya Sharma', managerInitials: 'PS',
        headCount: 14, openPositions: 2, location: 'New York, NY',
        costCenter: 'CC-002', budget: 1800000, budgetUsed: 1260000,
        isActive: true, createdAt: '2019-03-20',
      },
      {
        id: 'd3', name: 'Human Resources', code: 'HR', color: '#166534',
        description: 'Talent acquisition, employee relations and L&D.',
        manager: 'Sarah Jenkins', managerInitials: 'SJ',
        headCount: 10, openPositions: 1, location: 'Chicago, IL',
        costCenter: 'CC-003', budget: 950000, budgetUsed: 712000,
        isActive: true, createdAt: '2019-01-15',
      },
      {
        id: 'd4', name: 'Finance', code: 'FIN', color: '#b45309',
        description: 'Financial reporting, budgeting, payroll and compliance.',
        manager: 'David Chen', managerInitials: 'DC',
        headCount: 12, openPositions: 0, location: 'New York, NY',
        costCenter: 'CC-004', budget: 1100000, budgetUsed: 990000,
        isActive: true, createdAt: '2019-01-15',
      },
      {
        id: 'd5', name: 'Design', code: 'DES', color: '#be185d',
        description: 'UX/UI design, brand identity and design systems.',
        manager: 'James Okafor', managerInitials: 'JO',
        headCount: 9, openPositions: 1, location: 'Austin, TX',
        costCenter: 'CC-005', budget: 820000, budgetUsed: 574000,
        isActive: true, createdAt: '2020-02-10',
      },
      {
        id: 'd6', name: 'Marketing', code: 'MKT', color: '#0369a1',
        description: 'Growth marketing, content, events and partnerships.',
        manager: 'Lucas Ferreira', managerInitials: 'LF',
        headCount: 16, openPositions: 3, location: 'Remote',
        costCenter: 'CC-006', budget: 2400000, budgetUsed: 1680000,
        isActive: true, createdAt: '2019-06-01',
      },
      {
        id: 'd7', name: 'Customer Success', code: 'CS', color: '#059669',
        description: 'Client onboarding, support and account management.',
        manager: 'Aisha Patel', managerInitials: 'AP',
        headCount: 22, openPositions: 2, location: 'London, UK',
        costCenter: 'CC-007', budget: 1600000, budgetUsed: 1280000,
        isActive: true, createdAt: '2020-09-01',
      },
      {
        id: 'd8', name: 'Legal & Compliance', code: 'LGL', color: '#dc2626',
        description: 'Corporate legal, risk management and regulatory compliance.',
        manager: 'Elena Volkov', managerInitials: 'EV',
        headCount: 5, openPositions: 0, location: 'New York, NY',
        costCenter: 'CC-008', budget: 700000, budgetUsed: 420000,
        isActive: false, createdAt: '2021-01-10',
      },
    ];
  }
}

