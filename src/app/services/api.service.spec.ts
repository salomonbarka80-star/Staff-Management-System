import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch employees', () => {
    const mockEmployees = [{ id: '1', firstName: 'John', lastName: 'Doe' }];

    service.getEmployees().subscribe((employees) => {
      expect(employees.length).toBe(1);
      expect(employees).toEqual(mockEmployees as any);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/employees/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEmployees);
  });

  it('should create an employee', () => {
    // No 'department' field — toEmployeePayload() deletes it and adds departmentId
    const newEmployee = { firstName: 'Jane', lastName: 'Smith' };
    const mockResponse = { id: '2', ...newEmployee, departmentId: null };

    service.createEmployee(newEmployee as any).subscribe((employee) => {
      expect(employee).toEqual(mockResponse as any);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/employees/`);
    expect(req.request.method).toBe('POST');
    // toEmployeePayload strips 'department' (absent here) and sets departmentId: null
    expect(req.request.body).toEqual({ ...newEmployee, departmentId: null });
    req.flush(mockResponse);
  });

  it('should fetch dashboard metrics', () => {
    const mockMetrics = { totalEmployees: 10, activeLeaves: 2 };

    service.getDashboardMetrics().subscribe((metrics) => {
      expect(metrics).toEqual(mockMetrics as any);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/dashboard/metrics/`);
    expect(req.request.method).toBe('GET');
    req.flush(mockMetrics);
  });
});