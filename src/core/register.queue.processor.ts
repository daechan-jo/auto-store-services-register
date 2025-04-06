// import { Process, Processor } from '@nestjs/bull';
// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { InjectRedis } from '@nestjs-modules/ioredis';
// import { Job } from 'bull';
// import Redis from 'ioredis';
//
// import { RegisterService } from './register.service';
//
// @Processor('register-bull-queue') // 큐 이름
// @Injectable()
// export class RegisterQueueProcessor {
//   constructor(
//     private readonly configService: ConfigService,
//     private readonly registerService: RegisterService,
//     @InjectRedis() private readonly redis: Redis,
//   ) {}
//
//   @Process({ name: 'product-registration', concurrency: 1 }) // 작업 이름
//   async productRegistration(job: Job) {
//     const { pattern, payload } = job.data;
//     const crawlingLockKey = `lock:${this.configService.get<string>('STORE')}:coupang:price:crawl`;
//
//     console.log(`${payload.jobType}${payload.jobId}: 🔥${pattern} - 작업 시작 시도`);
//
//     try {
//       console.log(`${payload.jobType}${payload.jobId}: 락 획득 성공, 작업 처리 중`);
//
//       await this.registerService.productRegistration(payload.jobId, payload.jobType, payload.data);
//     } catch (error: any) {
//       console.error(`${payload.jobType}${payload.jobId}: 작업 처리 중 오류 발생`, error);
//       throw error;
//     } finally {
//       await this.redis.del(crawlingLockKey);
//     }
//   }
// }
