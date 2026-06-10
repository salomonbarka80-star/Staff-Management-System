import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PayrollComponent } from './payroll.component';

const routes: Routes = [{ path: '', component: PayrollComponent }];

@NgModule({
  declarations: [PayrollComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class PayrollModule {}
