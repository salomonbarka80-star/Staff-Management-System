import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AttendanceComponent } from './attendance.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [{ path: '', component: AttendanceComponent }];

@NgModule({
  declarations: [AttendanceComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class AttendanceModule {}
