import { RabbitMQService } from '@daechanjo/rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RegisterService {
  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly configService: ConfigService,
  ) {}

  async productRegistration(cronId: string, type: string, data: any) {
    const store = this.configService.get<string>('STORE');
    await this.rabbitmqService.send('onch-queue', 'productRegistration', {
      cronId,
      type,
      store,
      data,
    });
  }
}
