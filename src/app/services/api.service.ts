import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Employee,
  Candidate,
  AttendanceRecord,
  LeaveRequest,
  PayrollRecord,
  DashboardMetrics,
  JobRequisition,
} from '../shared/models/hrms.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTestConnection(): Observable<{ status: string; message: string }> {
    return this.http.get<{ status: string; message: string }>(
      `${this.apiBase}/employees/test-connection/`
    );
  }

  getEmployees(status?: string): Observable<Employee[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Employee[]>(`${this.apiBase}/employees/`, { params });
  }

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/departments/`);
  }

  createDepartment(department: { name: string; managerName?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiBase}/departments/`, department);
  }

  updateDepartment(id: string, department: { name?: string; managerName?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiBase}/departments/${id}/`, department);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/departments/${id}/`);
  }

  getEmployee(id: string): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiBase}/employees/${id}/`);
  }

  createEmployee(employee: Omit<Employee, 'id'>): Observable<Employee> {
    return this.http.post<Employee>(
      `${this.apiBase}/employees/`,
      this.toEmployeePayload(employee)
    );
  }

  updateEmployee(id: string, employee: Partial<Employee>): Observable<Employee> {
    return this.http.patch<Employee>(
      `${this.apiBase}/employees/${id}/`,
      this.toEmployeePayload(employee)
    );
  }

  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiBase}/dashboard/metrics/`);
  }

  getAttendance(date?: string): Observable<AttendanceRecord[]> {
    const params = date ? new HttpParams().set('date', date) : undefined;
    return this.http.get<AttendanceRecord[]>(`${this.apiBase}/attendance/`, { params });
  }

  getLeaveRequests(status?: string): Observable<LeaveRequest[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<any[]>(`${this.apiBase}/attendance/leaves/`, { params }).pipe(
      map((requests) => requests.map((request) => this.normalizeLeaveRequest(request)))
    );
  }

  updateLeaveStatus(
    id: string,
    status: 'approved' | 'rejected'
  ): Observable<LeaveRequest> {
    return this.http.patch<any>(
      `${this.apiBase}/attendance/leaves/${id}/`,
      { status }
    ).pipe(map((request) => this.normalizeLeaveRequest(request)));
  }

  getRequisitions(): Observable<JobRequisition[]> {
    return this.http.get<any[]>(`${this.apiBase}/recruitment/requisitions/`).pipe(
      map((requisitions) =>
        requisitions.map((requisition) => ({
          ...requisition,
          type: requisition.type ?? requisition.employment_type,
        }))
      )
    );
  }

  getCandidates(requisitionId?: string): Observable<Candidate[]> {
    const params = requisitionId
      ? new HttpParams().set('requisitionId', requisitionId)
      : undefined;
    return this.http.get<Candidate[]>(`${this.apiBase}/recruitment/candidates/`, {
      params,
    });
  }

  updateCandidateStage(
    id: string,
    stage: Candidate['stage']
  ): Observable<Candidate> {
    return this.http.patch<Candidate>(
      `${this.apiBase}/recruitment/candidates/${id}/`,
      { stage }
    );
  }

  createPayrollRecord(record: PayrollRecord): Observable<PayrollRecord> {
    return this.http.post<PayrollRecord>(
      `${this.apiBase}/payroll/records/`,
      record
    );
  }

  private normalizeLeaveRequest(request: any): LeaveRequest {
    return {
      ...request,
      type: request.type ?? request.leave_type,
    };
  }

  private toEmployeePayload(employee: Partial<Employee>): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...employee };
    const departmentId = employee.department?.id || null;

    delete payload['department'];
    payload['departmentId'] = departmentId;

    return payload;
  }
}
