import { PlaywrightModule } from '@daechanjo/playwright';
import { RabbitMQModule } from '@daechanjo/rabbitmq';
import { UtilModule } from '@daechanjo/util';
import { InjectQueue } from '@nestjs/bull';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRedis, RedisModule } from '@nestjs-modules/ioredis';
import { Queue } from 'bull';
import Redis from 'ioredis';

import { RegisterMessageController } from './api/register.message.controller';
import { redisConfig } from './config/redis.config';
import { TypeormConfig } from './config/typeorm.config';
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
    // BullModule.registerQueueAsync({
    //   name: 'register-bull-queue',
    //   useFactory: async (configService: ConfigService) => ({
    //     redis: {
    //       host: configService.get<string>('REDIS_HOST'),
    //       port: configService.get<number>('REDIS_PORT'),
    //     },
    //     prefix: '{bull}',
    //     defaultJobOptions: {
    //       removeOnComplete: {
    //         // 완료된 작업은 하루 후 삭제
    //         // age: 24 * 60 * 60 * 1000,
    //         age: 7 * 24 * 60 * 60 * 1000,
    //         count: 1000,
    //       },
    //       removeOnFail: {
    //         age: 7 * 24 * 60 * 60 * 1000, // 실패한 작업은 일주일 후 삭제
    //         count: 1000,
    //       },
    //       attempts: 100,
    //       backoff: {
    //         type: 'fixed',
    //         delay: 5000,
    //       },
    //     },
    //     limiter: {
    //       max: 1,
    //       duration: 1000,
    //     },
    //     settings: {
    //       stalledInterval: 10000, // stalled 작업 체크 간격을 10초로 설정
    //       maxStalledCount: 2, // stalled로 간주되기 전 체크 횟수
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
    UtilModule,
    PlaywrightModule,
    RabbitMQModule,
  ],
  controllers: [RegisterMessageController],
  providers: [RegisterService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly registerService: RegisterService,
  ) {}

  async onApplicationBootstrap() {
    setTimeout(async () => {});
  }
}
