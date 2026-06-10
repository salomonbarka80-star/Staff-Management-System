import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { HrDataService } from '../../services/hr-data.service';
import { ToastService } from '../../shared/services/toast.service';
import { Candidate, JobRequisition, ApplicationStage } from '../../shared/models/hrms.models';

interface KanbanColumn {
  stage: ApplicationStage;
  label: string;
  color: string;
  candidates: Candidate[];
}

@Component({
  selector: 'app-recruitment',
  templateUrl: './recruitment.component.html',
  styleUrls: ['./recruitment.component.scss'],
})
export class RecruitmentComponent implements OnInit {
  requisitions: JobRequisition[] = [];
  allCandidates: Candidate[] = [];
  selectedReqId = '';
  selectedCandidate: Candidate | null = null;
  activeTab: 'kanban' | 'list' | 'jobs' = 'kanban';
  loading = true;
  searchQuery = '';

  showAddReqModal = false;
  showAddCandModal = false;
  showScheduleModal = false;
  movingStage = false;

  ats_metrics = [
    { label: 'Active Requisitions', value: '0', icon: 'work',      color: 'blue'   },
    { label: 'Total Applicants',    value: '0', icon: 'people',    color: 'purple' },
    { label: 'Interviews Scheduled',value: '0', icon: 'event',     color: 'green'  },
    { label: 'Offers Extended',     value: '0', icon: 'handshake', color: 'amber'  },
  ];

  columns: KanbanColumn[] = [
    { stage: 'applied',    label: 'Applied',    color: '#94a3b8', candidates: [] },
    { stage: 'screening',  label: 'Screening',  color: '#3b82f6', candidates: [] },
    { stage: 'interview',  label: 'Interview',  color: '#8b5cf6', candidates: [] },
    { stage: 'assessment', label: 'Assessment', color: '#f59e0b', candidates: [] },
    { stage: 'offer',      label: 'Offer',      color: '#10b981', candidates: [] },
    { stage: 'hired',      label: 'Hired',      color: '#0058be', candidates: [] },
  ];

  constructor(private hr: HrDataService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadRecruitmentData();
  }

  loadRecruitmentData(): void {
    this.loading = true;
    forkJoin([
      this.hr.getRequisitions(),
      this.hr.getCandidates(),
      this.hr.getInterviews()
    ]).subscribe({
      next: ([reqs, cands, interviews]: [JobRequisition[], Candidate[], any[]]) => {
        this.requisitions = reqs;
        this.allCandidates = cands;
        this.ats_metrics[0].value = reqs.filter((r: JobRequisition) => r.status === 'open').length.toString();
        this.ats_metrics[1].value = reqs.reduce((a: number, r: JobRequisition) => a + r.applicantCount, 0).toString();
        this.ats_metrics[2].value = interviews.length.toString();
        this.ats_metrics[3].value = cands.filter((c: Candidate) => c.stage === 'offer').length.toString();
        this.buildKanban(cands);
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load recruitment data.');
        this.loading = false;
      }
    });
  }

  buildKanban(cands: Candidate[]): void {
    const filtered = this.selectedReqId
      ? cands.filter(c => c.requisitionId === this.selectedReqId)
      : cands;
    this.columns.forEach(col => {
      col.candidates = filtered.filter(c => c.stage === col.stage);
    });
  }

  onReqFilter(): void { this.buildKanban(this.allCandidates); }
  openCandidate(c: Candidate): void { this.selectedCandidate = c; }
  closeCandidate(): void { this.selectedCandidate = null; }

  submitRequisition(formValue: any): void {
    const payload = {
      title:            formValue.title,
      department:       formValue.department,
      location:         formValue.location,
      employmentType:   formValue.employmentType,
      status:           formValue.status || 'draft',
      postedDate:       new Date().toISOString().split('T')[0],
      hiringManager:    formValue.hiringManager,
    };
    this.hr.createRequisition(payload).subscribe({
      next: () => {
        this.showAddReqModal = false;
        this.toast.success('Requisition created successfully.');
        this.loadRecruitmentData();
      },
      error: () => this.toast.error('Failed to create requisition.')
    });
  }

  submitCandidate(formValue: any): void {
  if (!formValue.requisitionId) {
    this.toast.error('Please select a requisition.');
    return;
  }
  const payload = {
    firstName:     formValue.firstName,
    lastName:      formValue.lastName,
    email:         formValue.email,
    phone:         formValue.phone || '',
    position:      formValue.position,
    requisitionId: Number(formValue.requisitionId),
    stage:         'applied',
    source:        formValue.source || 'Direct',
    appliedDate:   new Date().toISOString().split('T')[0],
  };
  this.hr.createCandidate(payload).subscribe({
    next: () => {
      this.showAddCandModal = false;
      this.toast.success('Candidate added successfully.');
      this.loadRecruitmentData();
    },
    error: (err) => {
      console.log('Error:', err.error);
      this.toast.error('Failed to add candidate.');
    }
  });
  }

  submitInterview(formValue: any): void {
  if (!this.selectedCandidate) return;
  const payload = {
    candidate: this.selectedCandidate.id,
    interviewer: formValue.interviewer,
    interviewDate: formValue.interviewDate,
    interviewType: formValue.interviewType,
    location: formValue.location || '',
    notes: formValue.notes || '',
  };
  this.hr.scheduleInterview(payload).subscribe({
    next: () => {
      this.showScheduleModal = false;
      this.toast.success('Interview scheduled successfully.');
      this.loadRecruitmentData();
      this.closeCandidate();
    },
    error: (err) => {
      console.error('Interview Error:', err.error);
      this.toast.error('Failed to schedule interview.');
    }
  });
  }

  moveStage(candidate: Candidate, stage: string): void {
    if (!stage) return;
    this.hr.updateCandidateStage(candidate.id, stage as any).subscribe({
      next: (updated: any) => {
        this.allCandidates = this.allCandidates.map(c =>
          c.id === updated.id ? updated : c
        );
        this.buildKanban(this.allCandidates);
        if (this.selectedCandidate?.id === updated.id) {
          this.selectedCandidate = updated;
        }
        this.toast.success(`Moved to ${stage}.`);
      },
      error: () => this.toast.error('Failed to move candidate.')
    });
  }

  get filteredReqs(): JobRequisition[] {
    if (!this.searchQuery) return this.requisitions;
    const q = this.searchQuery.toLowerCase();
    return this.requisitions.filter(r =>
      r.title.toLowerCase().includes(q) || r.department.toLowerCase().includes(q)
    );
  }

  reqStatus(s: string): string {
    const m: Record<string, string> = {
      open: 'badge-success', closed: 'badge-neutral',
      draft: 'badge-info', 'on-hold': 'badge-warning'
    };
    return m[s] || 'badge-neutral';
  }

  stars(r?: number): number[] { return Array.from({ length: r || 0 }); }
  initials(c: Candidate | null): string { return c ? `${c.firstName[0]}${c.lastName[0]}` : ''; }
}