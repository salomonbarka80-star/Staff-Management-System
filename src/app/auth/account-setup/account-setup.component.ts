import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-account-setup',
  templateUrl: './account-setup.component.html',
  styleUrls: ['./account-setup.component.scss'],
})
export class AccountSetupComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      mfa: [false],
    });
  }

  get passwordCtrl() { return this.form.get('password')!; }
  get passwordVal(): string { return this.passwordCtrl.value || ''; }

  get passwordStrength(): number {
    const p = this.passwordVal;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }
  get strengthLabel(): string { return ['','Weak','Fair','Good','Strong'][this.passwordStrength]; }
  get strengthColor(): string { return ['','#ba1a1a','#b45309','#1a7a4a','#0058be'][this.passwordStrength]; }
  hasMinLength(): boolean { return this.passwordVal.length >= 8; }
  hasUppercase(): boolean { return /[A-Z]/.test(this.passwordVal); }
  hasNumber(): boolean { return /[0-9]/.test(this.passwordVal); }
  hasSpecial(): boolean { return /[^A-Za-z0-9]/.test(this.passwordVal); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.toast.error('Passwords do not match.');
      return;
    }

    this.loading = true;
    this.auth.register({
     first_name: 'HRMS',
        last_name: 'Admin',
        email: 'admin@enterprise.com',
        role: 'admin',
        password: this.form.value.password,
      }).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/app/dashboard']);
        },
        error: () => {
          this.loading = false;
          this.toast.error('Account setup failed. Please try again.');
        },
      });
  }
}

