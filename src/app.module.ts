import { PlaywrightModule } from '@daechanjo/playwright';
import { RabbitMQModule } from '@daechanjo/rabbitmq';
import { UtilModule } from '@daechanjo/util';
import { BullModule } from '@nestjs/bull';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRedis, RedisModule } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

import { RegisterMessageController } from './api/register.message.controller';
import { redisConfig } from './config/redis.config';
import { TypeormConfig } from './config/typeorm.config';
import { RegisterQueueProcessor } from './core/register.queue.processor';
import { RegisterService } from './core/register.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '/Users/daechanjo/codes/project/auto-store/.env',
    }),
    TypeOrmModule.forRootAsync(TypeormConfig),
    TypeOrmModule.forFeature([]),
    RedisModule.forRootAsync({
      useFactory: () => redisConfig,
    }),
    BullModule.registerQueueAsync({
      name: 'register-bull-queue',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
        prefix: '{bull}',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
          backoff: 30000,
        },
        limiter: {
          max: 1,
          duration: 1000,
        },
      }),
      inject: [ConfigService],
    }),
    UtilModule,
    PlaywrightModule,
    RabbitMQModule,
  ],
  controllers: [RegisterMessageController],
  providers: [RegisterService, RegisterQueueProcessor],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly registerService: RegisterService,
  ) {}

  async onApplicationBootstrap() {
    setTimeout(async () => {
      // const result = await this.registerService.getWaitingJobs();
      // console.log(JSON.stringify(result, null, 2));
    }, 100);
  }
}
