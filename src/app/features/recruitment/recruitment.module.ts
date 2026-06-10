import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecruitmentComponent } from './recruitment.component';

const routes: Routes = [{ path: '', component: RecruitmentComponent }];

@NgModule({
  declarations: [RecruitmentComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)],
})
export class RecruitmentModule {}
