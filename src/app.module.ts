import { CronType } from '@daechanjo/models';
import { PlaywrightModule } from '@daechanjo/playwright';
import { RabbitMQModule } from '@daechanjo/rabbitmq';
import { UtilModule } from '@daechanjo/util';
import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectRedis, RedisModule } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

import { redisConfig } from './config/redis.config';
import { TypeormConfig } from './config/typeorm.config';

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
    UtilModule,
    PlaywrightModule,
    RabbitMQModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    // private readonly priceService: PriceService,
    // private readonly priceCoupangService: PriceCoupangService,
    // private readonly priceRepository: PriceRepository,
  ) {}

  async onApplicationBootstrap() {
    setTimeout(async () => {
      // await this.redis.del(`lock:${this.configService.get<string>('STORE')}:coupang:price`);
      // await this.redis.del(`lock:${this.configService.get<string>('STORE')}:naver:price`);
      // await this.priceCoupangService.calculateMarginAndAdjustPrices('test', CronType.PRICE);
      // await this.priceService.initCoupangPriceControl();
    }, 100);
  }
}
