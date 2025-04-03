import { JobType, RabbitmqMessage } from '@daechanjo/models';
import { InjectQueue } from '@nestjs/bull';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Queue } from 'bull';

import { RegisterService } from '../core/register.service';

@Controller()
export class RegisterMessageController {
  constructor(
    private readonly registerService: RegisterService,
    @InjectQueue('register-bull-queue') private readonly registerBullQueue: Queue,
  ) {}

  @MessagePattern('register-queue')
  async handleRegisterMessage(message: RabbitmqMessage) {
    const { pattern, payload } = message;
    console.log(`${payload.jobType}${payload.jobId}: 📥${pattern}`);

    switch (pattern) {
      case 'productRegistration':
        await this.registerBullQueue.add('product-registration', message);
        break;

      default:
        console.error(
          `${JobType.ERROR}${payload.jobType}${payload.jobId}: 📥알 수 없는 패턴 유형 ${pattern}`,
        );
        return { status: 'error', message: `알 수 없는 패턴 유형: ${pattern}` };
    }
  }
}
