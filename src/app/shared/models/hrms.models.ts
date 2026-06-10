

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  jobTitle?: string;
  department?: string;
  isActive: boolean;
}

export type UserRole = 'admin' | 'hr' | 'hr_manager' | 'manager' | 'employee';

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  jobTitle: string;
  department: Department;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  startDate: string;
  manager?: string;
  location: string;
  salary?: number;
  currency?: string;
}

export type EmploymentType = 'full-time' | 'part-time' | 'contractor' | 'intern';
export type EmployeeStatus = 'active' | 'on-leave' | 'terminated' | 'probation';

export interface Department {
  id: string;
  name: string;
  headCount: number;
  managerId?: string;
}

export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: EmploymentType;
  status: RequisitionStatus;
  postedDate: string;
  closingDate?: string;
  applicantCount: number;
  hiringManager: string;
  salary?: { min: number; max: number; currency: string };
}

export type RequisitionStatus = 'draft' | 'open' | 'closed' | 'on-hold';

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  position: string;
  requisitionId: string;
  stage: ApplicationStage;
  source: string;
  appliedDate: string;
  rating?: number;
  tags?: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
}

export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'interview'
  | 'assessment'
  | 'offer'
  | 'hired'
  | 'rejected';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'avatarUrl' | 'department'>;
  date: string;
  checkIn?: string;
  checkOut?: string;
  totalHours?: number;
  status: AttendanceStatus;
  shiftStart: string;
  shiftEnd: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day' | 'holiday' | 'remote';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: LeaveStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type LeaveType = 'annual' | 'sick' | 'parental' | 'unpaid' | 'bereavement' | 'study';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employee: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'department' | 'jobTitle'>;
  period: string;
  grossSalary: number;
  netSalary: number;
  deductions: PayrollDeduction[];
  currency: string;
  status: PayrollStatus;
  payDate: string;
}

export interface PayrollDeduction {
  name: string;
  amount: number;
  type: 'tax' | 'benefit' | 'other';
}

export type PayrollStatus = 'pending' | 'processed' | 'paid' | 'on-hold';

export interface DashboardMetrics {
  totalEmployees: number;
  activeToday: number;
  openPositions: number;
  pendingLeaves: number;
  newHiresThisMonth: number;
  attritionRate: number;
  averageTenure: number;
  departmentBreakdown: { name: string; count: number; color: string }[];
  monthlyHeadcount: { month: string; count: number }[];
  attendanceRate: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}
