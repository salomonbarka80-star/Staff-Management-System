import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Employee, Candidate, AttendanceRecord,
  LeaveRequest, DashboardMetrics, JobRequisition,
} from '../shared/models/hrms.models';

/** Generic paginated response from Django */
export interface PagedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface EmployeeFilters {
  search?:          string;
  status?:          string;
  employment_type?: string;
  department?:      string;
  location?:        string;
  page?:            number;
  pageSize?:        number;
  ordering?:        string;
}

export interface LeaveFilters {
  status?:   string;
  employee?: string;
  page?:     number;
}

@Injectable({ providedIn: 'root' })
export class HrDataService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Dashboard ────────────────────────────────────────────────
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(
      `${this.api}/dashboard/metrics/`
    );
  }

  // ── Employees ────────────────────────────────────────────────
   getEmployees(filters: EmployeeFilters = {}): Observable<Employee[]> {
  const params = this.buildParams(filters);
  return this.http.get<any>(`${this.api}/employees/`, { params }).pipe(
    map(r => Array.isArray(r) ? r : r.data ?? [])
  );
}

  getEmployeesPaged(filters: EmployeeFilters = {}): Observable<PagedResponse<Employee>> {
    const params = this.buildParams(filters);
    return this.http.get<PagedResponse<Employee>>(`${this.api}/employees/`, { params });
  }

  getEmployee(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.api}/employees/${id}/`);
  }

  createEmployee(data: Partial<Employee>): Observable<Employee> {
    return this.http.post<Employee>(`${this.api}/employees/`, data);
  }

  updateEmployee(id: string, data: Partial<Employee>): Observable<Employee> {
    return this.http.patch<Employee>(`${this.api}/employees/${id}/`, data);
  }

  deleteEmployee(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/employees/${id}/`);
  }

  // ── Departments ──────────────────────────────────────────────
getDepartments(filters: { search?: string; status?: string } = {}): Observable<any[]> {
  const params = this.buildParams(filters);
  return this.http.get<any>(`${this.api}/departments/`, { params }).pipe(
    map(r => Array.isArray(r) ? r : r.data ?? [])
  );
}

createDepartment(data: any): Observable<any> {
  return this.http.post<any>(`${this.api}/departments/`, data);
}

updateDepartment(id: string, data: any): Observable<any> {
  return this.http.patch<any>(`${this.api}/departments/${id}/`, data);
}

deleteDepartment(id: string): Observable<void> {
  return this.http.delete<void>(`${this.api}/departments/${id}/`);
}
  // ── Recruitment ──────────────────────────────────────────────
 createRequisition(data: any): Observable<any> {
  return this.http.post<any>(`${this.api}/recruitment/requisitions/`, data);
}

createCandidate(data: any): Observable<any> {
  return this.http.post<any>(`${this.api}/recruitment/candidates/`, data);
}

deleteRequisition(id: string): Observable<void> {
  return this.http.delete<void>(`${this.api}/recruitment/requisitions/${id}/`);
}
 
  getRequisitions(): Observable<JobRequisition[]> {
  return this.http.get<any>(`${this.api}/recruitment/requisitions/`).pipe(
    map(r => {
      const list = Array.isArray(r) ? r : r.data ?? [];
      return list.map((req: any) => ({ ...req, type: req.type ?? req.employment_type }));
    })
  );
}

getCandidates(requisitionId?: string): Observable<Candidate[]> {
  const params = requisitionId
    ? new HttpParams().set('requisitionId', requisitionId)
    : undefined;
  return this.http.get<any>(`${this.api}/recruitment/candidates/`, { params }).pipe(
    map(r => Array.isArray(r) ? r : r.data ?? [])
  );
}
  updateCandidateStage(id: string, stage: Candidate['stage']): Observable<Candidate> {
    return this.http.patch<Candidate>(
      `${this.api}/recruitment/candidates/${id}/move-stage/`, { stage }
    );
  }

  getInterviews(): Observable<any[]> {
    return this.http.get<any>(`${this.api}/recruitment/interviews/`).pipe(
      map(r => Array.isArray(r) ? r : r.data ?? [])
    );
  }

  scheduleInterview(data: any): Observable<any> {
    return this.http.post<any>(`${this.api}/recruitment/interviews/`, data);
  }

  getRecruitmentPipeline(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.api}/recruitment/requisitions/pipeline-summary/`
    );
  }

  // ── Attendance ───────────────────────────────────────────────
getAttendance(date?: string): Observable<AttendanceRecord[]> {
  const params = date ? new HttpParams().set('date', date) : undefined;
  return this.http.get<any>(`${this.api}/attendance/`, { params }).pipe(
    map(r => Array.isArray(r) ? r : r.data ?? [])
  );
}

markAttendance(data: {
  employeeId: number;
  status: string;
  date?: string;
  checkIn?: string;
  checkOut?: string;
  shiftStart?: string;
  shiftEnd?: string;
}): Observable<AttendanceRecord> {
  return this.http.post<AttendanceRecord>(`${this.api}/attendance/`, data);
}

  getTodayAttendanceSummary(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(
      `${this.api}/attendance/records/today-summary/`
    );
  }

  // ── Leave Requests ───────────────────────────────────────────
 getLeaveRequests(filters: LeaveFilters = {}): Observable<LeaveRequest[]> {
  const params = this.buildParams(filters);
  return this.http.get<any>(`${this.api}/attendance/leave-requests/`, { params }).pipe(
    map(r => Array.isArray(r) ? r : r.data ?? [])
  );
}

  createLeaveRequest(data: Partial<LeaveRequest>): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(`${this.api}/attendance/leave-requests/`, data);
  }

  updateLeaveStatus(id: string, status: 'approved' | 'rejected', notes = ''): Observable<LeaveRequest> {
    return this.http.patch<LeaveRequest>(
      `${this.api}/attendance/leave-requests/${id}/review/`, { status, notes }
    );
  }

  getLeaveBalances(employeeId?: string): Observable<any[]> {
    const params = employeeId ? new HttpParams().set('employee', employeeId) : undefined;
    return this.http
      .get<PagedResponse<any>>(`${this.api}/attendance/leave-balances/`, { params })
      .pipe(map(r => r.data));
  }

  // ── Payroll ──────────────────────────────────────────────────
 getPayrollRecords(period?: string): Observable<any[]> {
  const params = period ? new HttpParams().set('period', period) : undefined;
  return this.http.get<any>(`${this.api}/payroll/records/`, { params }).pipe(
    map(r => Array.isArray(r) ? r : r.data ?? [])
  );
}

createPayrollRecord(record: any): Observable<any> {
  return this.http.post<any>(`${this.api}/payroll/records/`, record);
}

  runPayroll(periodId: string): Observable<any> {
    return this.http.post<any>(`${this.api}/payroll/periods/${periodId}/run/`, {});
  }

  getPayslip(recordId: string): Observable<any> {
    return this.http.get<any>(`${this.api}/payroll/records/${recordId}/payslip/`);
  }

  getPayrollPeriods(): Observable<any[]> {
    return this.http
      .get<PagedResponse<any>>(`${this.api}/payroll/periods/`)
      .pipe(map(r => r.data));
  }

  // ── Notifications ─────────────────────────────────────────────
  getNotifications(): Observable<any[]> {
    return this.http
      .get<PagedResponse<any>>(`${this.api}/notifications/`)
      .pipe(map(r => r.data));
  }

  markNotificationRead(id: string): Observable<any> {
    return this.http.patch<any>(`${this.api}/notifications/${id}/mark-read/`, {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.post<any>(`${this.api}/notifications/mark-all-read/`, {});
  }

  // ── Helper ────────────────────────────────────────────────────
  private buildParams(filters: Record<string, any>): HttpParams {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
