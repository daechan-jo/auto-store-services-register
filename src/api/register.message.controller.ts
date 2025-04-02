import { CronType } from '@daechanjo/models';
import { InjectQueue } from '@nestjs/bull';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Queue } from 'bull';

import { RegisterService } from '../core/register.service';

@Controller()
export class OrderController {
  constructor(
    private readonly registerService: RegisterService,
    @InjectQueue('register-bull-queue') private readonly registerBullQueue: Queue,
  ) {}

  @MessagePattern('register-queue')
  async handlePriceMessage(message: any) {
    const { pattern, payload } = message;
    console.log(`${payload.type}${payload.cronId}: 📥${pattern}`);

    switch (pattern) {
      case 'productRegistration':
        await this.registerBullQueue.add('product-registration', message);
        break;

      default:
        console.error(
          `${CronType.ERROR}${payload.type}${payload.cronId}: 📥알 수 없는 패턴 유형 ${pattern}`,
        );
        return { status: 'error', message: `알 수 없는 패턴 유형: ${pattern}` };
    }
  }
}
