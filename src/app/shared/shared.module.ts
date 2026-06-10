import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveFilterPipe } from './pipes/leave-filter.pipe';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@NgModule({
  declarations: [LeaveFilterPipe, ToastContainerComponent],
  imports: [CommonModule, FormsModule],
  exports: [LeaveFilterPipe, ToastContainerComponent, FormsModule, CommonModule],
})
export class SharedModule {}
