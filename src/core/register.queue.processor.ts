import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Job } from 'bull';
import Redis from 'ioredis';

import { RegisterService } from './register.service';

@Processor('register-bull-queue') // 큐 이름
@Injectable()
export class RegisterQueueProcessor {
  constructor(
    private readonly configService: ConfigService,
    private readonly registerService: RegisterService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  @Process({ name: 'product-registration', concurrency: 1 }) // 작업 이름
  async productRegistration(job: Job) {
    const { pattern, payload } = job.data;
    const retryDelay = 60000;
    let acquired = false;
    let attemptCount = 0;
    const crawlingLockKey = `lock:${this.configService.get<string>('STORE')}:coupang:price:crawl`;

    console.log(`${payload.jobType}${payload.jobId}: 🔥${pattern} - 작업 시작 시도`);

    // 락을 획득할 때까지 무한 시도
    while (!acquired) {
      const result = await this.redis.set(crawlingLockKey, Date.now().toString(), 'NX');
      acquired = result === 'OK';

      if (!acquired) {
        attemptCount++;
        console.log(
          `${payload.jobType}${payload.jobId}: 락 획득 시도 중... (시도 횟수: ${attemptCount})`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay)); // 대기
      }
    }

    try {
      // 락 획득 성공 시 작업 처리
      console.log(
        `${payload.jobType}${payload.jobId}: 락 획득 성공 (${attemptCount}번 시도 후), 작업 처리 중`,
      );
      console.log(
        `락 획득 성공 (${attemptCount}번 시도 후), 작업 처리 중: ${payload.jobType}${payload.jobId}`,
      );

      await this.registerService.productRegistration(payload.jobId, payload.jobType, payload.data);
      // todo 여기에 실제 제품 등록 로직 구현

      // 작업 완료 후 의도적인 지연
      await this.redis.del(crawlingLockKey);
      console.log(`${payload.jobType}${payload.jobId}: 작업 완료, 의도적 지연 시작 (2분)`);
      await new Promise((resolve) => setTimeout(resolve, 120000));

      return { success: true, message: '제품 등록 완료' };
    } finally {
      await this.redis.del(crawlingLockKey);
    }
  }
}
