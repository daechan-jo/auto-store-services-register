import { JobType, RabbitmqMessage } from '@daechanjo/models';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { RegisterService } from '../core/register.service';

@Controller()
export class RegisterMessageController {
  constructor(private readonly registerService: RegisterService) {}

  @MessagePattern('register-queue')
  async handleRegisterMessage(message: RabbitmqMessage) {
    const { pattern, payload } = message;
    console.log(`${payload.jobType || 'API-Gateway'}${payload.jobId || ''}: 📥${pattern}`);

    switch (pattern) {
      case 'productRegistration':
        await this.registerService.productRegistration(payload.data);
        break;

      case 'getStatus':
        const status = await this.registerService.getQueueStatus();
        return { status: 'success', data: status };

      case 'getWaitingJobs':
        const waitingJobs = await this.registerService.getWaitingJobs();
        return { status: 'success', data: waitingJobs };

      case 'getActiveJobs':
        const activeJobs = await this.registerService.getActiveJobs();
        return { status: 'success', data: activeJobs };

      case 'getCompletedJobs':
        const completedJobs = await this.registerService.getCompletedJobs();
        return { status: 'success', data: completedJobs };

      case 'getFailedJobs':
        const failedJobs = await this.registerService.getFailedJobs();
        return { status: 'success', data: failedJobs };

      case 'getDelayedJobs':
        const delayedJobs = await this.registerService.getDelayedJobs();
        return { status: 'success', data: delayedJobs };

      case 'getAllJobs':
        const allJobs = await this.registerService.getAllJobStatus();
        return { status: 'success', data: allJobs };

      case 'deleteJob':
        await this.registerService.removeJob(payload.data);
        return { status: 'success' };

      // todo 사용할일이 있을까..?
      // @Post('add')
      // async addJob(@Body() body: { name: string; data: any; opts?: any }) {
      // 	return this.queueInspectorService.addJob(body.name, body.data, body.opts);
      // }
      //
      // @Delete(':id')
      // async removeJob(@Param('id') id: string) {
      // 	await this.queueInspectorService.removeJob(id);
      // 	return { success: true };
      // }
      //
      // @Post(':id/retry')
      // async retryJob(@Param('id') id: string) {
      // 	await this.queueInspectorService.retryJob(id);
      // 	return { success: true };
      // }

      default:
        console.error(
          `${JobType.ERROR}${payload.jobType}${payload.jobId}: 📥알 수 없는 패턴 유형 ${pattern}`,
        );
        return { status: 'error', message: `알 수 없는 패턴 유형: ${pattern}` };
    }
  }
}
