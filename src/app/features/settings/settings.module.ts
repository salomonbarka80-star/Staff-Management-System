import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SettingsComponent } from './settings.component';

const routes: Routes = [{ path: '', component: SettingsComponent }];
@NgModule({
  declarations: [SettingsComponent],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule.forChild(routes)],
})
export class SettingsModule {}
