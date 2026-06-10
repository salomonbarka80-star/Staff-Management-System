import { Pipe, PipeTransform } from '@angular/core';
// This pipe filters leave records based on status
import { LeaveRequest } from '../models/hrms.models';

@Pipe({ name: 'leaveFilter' })
export class LeaveFilterPipe implements PipeTransform {
  transform(requests: LeaveRequest[], status: string): LeaveRequest[] {
    return requests.filter(r => r.status === status);
  }
}
