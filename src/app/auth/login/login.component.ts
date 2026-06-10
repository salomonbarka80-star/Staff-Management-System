import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../shared/models/hrms.models';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error = '';
  showPassword = false;
  returnUrl = '/app/dashboard';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['admin@enterprise.com', [Validators.required, Validators.email]],
      password: ['Password123', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false],
    });

   this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  get emailCtrl() { return this.loginForm.get('email')!; }
  get passwordCtrl() { return this.loginForm.get('password')!; }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.error = '';

    const { email, password, rememberMe } = this.loginForm.value;
    this.auth.login({ email, password, rememberMe }).subscribe({
  next: (res) => {
    this.loading = false;
    const home = this.auth.homeRouteFor(res.user.role);
    this.router.navigateByUrl(home);
  },
  error: (err) => {
    this.loading = false;
    this.error = 'Invalid email or password. Please try again.';
  },
});
  }

  loginWithSSO(provider: string): void {
    // SSO integration placeholder
    console.log('SSO login with:', provider);
  }
}

