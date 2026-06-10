import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { User } from '../../shared/models/hrms.models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  activeSection: 'profile' | 'organization' | 'security' | 'notifications' | 'integrations' = 'profile';

  profileForm!: FormGroup;
  currentUser: User | null = null;
  private destroy$ = new Subject<void>();

  sections = [
    { id: 'profile',       label: 'My Profile',       icon: 'person' },
    { id: 'organization',  label: 'Organization',     icon: 'business' },
    { id: 'security',      label: 'Security & Access', icon: 'security' },
    { id: 'notifications', label: 'Notifications',    icon: 'notifications' },
    { id: 'integrations',  label: 'Integrations',     icon: 'extension' },
  ];

  integrations = [
    { name: 'Google Workspace', desc: 'Sync calendar, contacts, and SSO', icon: 'mail', connected: true, color: '#4285f4' },
    { name: 'Microsoft 365', desc: 'Teams, Outlook, and Azure AD integration', icon: 'window', connected: true, color: '#0078d4' },
    { name: 'Slack', desc: 'Send HR alerts and notifications to Slack', icon: 'chat', connected: false, color: '#4a154b' },
    { name: 'Workday', desc: 'Bi-directional payroll data sync', icon: 'sync', connected: false, color: '#f5ab00' },
    { name: 'DocuSign', desc: 'eSignature for contracts and onboarding docs', icon: 'draw', connected: true, color: '#255b9b' },
    { name: 'Greenhouse', desc: 'ATS data import and candidate sync', icon: 'work', connected: false, color: '#24b47e' },
  ];

  notifSettings = [
    { label: 'Leave Request Submitted', email: true, inApp: true, key: 'leave_submitted' },
    { label: 'Leave Request Approved/Rejected', email: true, inApp: true, key: 'leave_reviewed' },
    { label: 'New Candidate Applied', email: false, inApp: true, key: 'candidate_applied' },
    { label: 'Offer Letter Accepted', email: true, inApp: true, key: 'offer_accepted' },
    { label: 'Payroll Processed', email: true, inApp: false, key: 'payroll_processed' },
    { label: 'Employee Anniversary', email: false, inApp: true, key: 'anniversary' },
  ];

  saving = false;
  savedSuccess = false;
  selectedFile: File | null = null;
  avatarPreview: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: [''],
      department: [''],
      phoneNumber: ['']
    });
  }

private loadUserData(): void {
  this.authService.auth$.pipe(
    takeUntil(this.destroy$)
  ).subscribe(authState => {
    this.currentUser = authState.user;
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: (this.currentUser as any).first_name ?? (this.currentUser as any).firstName ?? '',
        lastName: (this.currentUser as any).last_name ?? (this.currentUser as any).lastName ?? '',
        email: this.currentUser.email,
        jobTitle: (this.currentUser as any).job_title ?? (this.currentUser as any).jobTitle ?? '',
        department: (this.currentUser as any).department ?? '',
        phoneNumber: (this.currentUser as any).phone ?? '',
      });
      this.avatarPreview = this.currentUser.avatarUrl || null;
    }
  });
}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.toast.error('File size exceeds 2MB limit.');
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  save(): void {
  if (this.profileForm.invalid) {
    this.markFormGroupTouched();
    return;
  }

  this.saving = true;
  const formValue = this.profileForm.value;
  const formData = new FormData();
  
  formData.append('first_name', formValue.firstName);
  formData.append('last_name', formValue.lastName);
  formData.append('phone', formValue.phoneNumber);
  formData.append('job_title', formValue.jobTitle);
  
  if (this.selectedFile) {
    formData.append('avatar', this.selectedFile);
  }

  this.authService.updateProfile(formData).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: () => {
      this.saving = false;
      this.selectedFile = null;
      this.toast.success('Profile saved successfully.');
    },
    error: () => {
      this.saving = false;
      this.toast.error('Failed to save profile.');
    }
  });
}
  
  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    this.loadUserData(); // Reset form to current user data
  }

  toggleIntegration(idx: number): void {
    this.integrations[idx].connected = !this.integrations[idx].connected;
  }
}

