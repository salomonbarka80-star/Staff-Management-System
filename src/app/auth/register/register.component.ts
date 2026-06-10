import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

function mustMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { mustMatch: true };
}

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value || '';
  if (!/[A-Z]/.test(value)) return { weakUppercase: true };
  if (!/\d/.test(value)) return { weakDigit: true };
  return null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  step = 1;
  totalSteps = 3;
  loading = false;
  showPassword = false;
  submitted = false;

  step1Form!: FormGroup;
  step2Form!: FormGroup;
  step3Form!: FormGroup;

  steps = [
    { label: 'Account Details', icon: 'person' },
    { label: 'Organization', icon: 'business' },
    { label: 'Security', icon: 'lock' },
  ];

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    this.step1Form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: ['', Validators.required],
    });

    this.step2Form = this.fb.group({
      companyName: ['', Validators.required],
      companySize: ['', Validators.required],
      industry: ['', Validators.required],
      country: ['', Validators.required],
    });

    this.step3Form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, Validators.requiredTrue],
    }, { validators: mustMatch });
  }

  get currentForm(): FormGroup {
    return [this.step1Form, this.step2Form, this.step3Form][this.step - 1];
  }

  fieldError(form: FormGroup, field: string): string {
    const ctrl = form.get(field);
    const errors = ctrl?.errors || (field === 'confirmPassword' ? form.errors : null);
    
    if (!ctrl || (!ctrl.touched && !this.submitted)) return '';
    if (errors?.['required']) return 'This field is required.';
    if (errors?.['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters required.`;
    if (errors?.['email']) return 'Enter a valid email address.';
    if (errors?.['mustMatch']) return 'Passwords do not match.';
    if (errors?.['weakUppercase']) return 'Must include at least one uppercase letter.';
    if (errors?.['weakDigit']) return 'Must include at least one digit.';
    if (errors?.['requiredTrue']) return 'You must agree to the terms.';
    return '';
  }

  get passwordStrength(): number {
    const p = this.step3Form.get('password')?.value || '';
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  }

  get strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.passwordStrength];
  }

  get strengthClass(): string {
    return ['', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'][this.passwordStrength];
  }

  next(): void {
    if (this.currentForm.invalid) {
      this.currentForm.markAllAsTouched();
      return;
    }
    if (this.step < this.totalSteps) this.step++;
  }

  prev(): void {
    if (this.step > 1) this.step--;
  }

  onSubmit(): void {
    this.submitted = true;

    // Validate all forms before submitting
    if (this.step1Form.invalid || this.step2Form.invalid || this.step3Form.invalid) {
      this.step1Form.markAllAsTouched();
      this.step2Form.markAllAsTouched();
      this.step3Form.markAllAsTouched();
      this.toast.error('Please complete all steps correctly.');
      return;
    }

    this.loading = true;
    const payload = {
      first_name: this.step1Form.value.firstName,
      last_name: this.step1Form.value.lastName,
      email: this.step1Form.value.email,
      job_title: this.step1Form.value.jobTitle,
      password: this.step3Form.value.password,
      role: 'employee',
    };
    this.auth.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Account created successfully!');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.email?.[0] || err?.error?.detail || 'Registration failed. Please try again.';
        this.toast.error(msg);
      },
    });
  }
}

