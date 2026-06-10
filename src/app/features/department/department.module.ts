import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DepartmentsComponent } from './departments.component';

const routes: Routes = [
  { path: '', component: DepartmentsComponent }
];

@NgModule({
  declarations: [DepartmentsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class DepartmentModule { }
