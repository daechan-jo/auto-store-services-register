import { ProductRegistrationReqDto } from '@daechanjo/models';
import { RabbitMQService } from '@daechanjo/rabbitmq';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobCounts, JobStatus, Queue } from 'bull';

@Injectable()
export class RegisterService {
  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly configService: ConfigService,
    @InjectQueue('register-bull-queue') private readonly registerBullQueue: Queue,
  ) {}

  async productRegistration(cronId: string, type: string, data: ProductRegistrationReqDto) {
    const store = this.configService.get<string>('STORE');
    await this.rabbitmqService.send('onch-queue', 'productRegistration', {
      cronId,
      type,
      store,
      data,
    });
  }

  /**
   * 큐의 상태 정보를 가져오는 메서드
   */
  async getQueueStatus(): Promise<{ name: string; counts: JobCounts }> {
    const counts = await this.registerBullQueue.getJobCounts();
    return {
      name: this.registerBullQueue.name,
      counts,
    };
  }

  /**
   * 대기 중인 작업 목록 조회
   */
  async getWaitingJobs(limit = 10): Promise<any[]> {
    const jobs = await this.registerBullQueue.getJobs(['waiting'], 0, limit);
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
    }));
  }

  /**
   * 활성(진행 중인) 작업 목록 조회
   */
  async getActiveJobs(): Promise<any[]> {
    const jobs = await this.registerBullQueue.getJobs(['active']);
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
    }));
  }

  /**
   * 완료된 작업 목록 조회 (최근 n개)
   */
  async getCompletedJobs(limit = 10): Promise<any[]> {
    const jobs = await this.registerBullQueue.getJobs(['completed'], 0, limit);
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
      returnvalue: job.returnvalue,
    }));
  }

  /**
   * 실패한 작업 목록 조회
   */
  async getFailedJobs(limit = 10): Promise<any[]> {
    const jobs = await this.registerBullQueue.getJobs(['failed'], 0, limit);
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    }));
  }

  /**
   * 지연된 작업 목록 조회
   */
  async getDelayedJobs(limit = 10): Promise<any[]> {
    const jobs = await this.registerBullQueue.getJobs(['delayed'], 0, limit);
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
      delay: job.opts.delay,
      delayUntil: new Date(job.timestamp + job.opts.delay),
    }));
  }

  /**
   * 모든 작업 상태 조회
   */
  async getAllJobStatus(limit = 10): Promise<{ [key in JobStatus]?: any[] }> {
    return {
      waiting: await this.getWaitingJobs(limit),
      active: await this.getActiveJobs(),
      completed: await this.getCompletedJobs(limit),
      failed: await this.getFailedJobs(limit),
      delayed: await this.getDelayedJobs(limit),
    };
  }

  /**
   * 작업 제거 메서드
   */
  async removeJob(jobId: string): Promise<void> {
    const job = await this.registerBullQueue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  // /**
  //  * 작업 추가 메서드 (테스트용)
  //  */
  // async addJob(name: string, data: any, opts?: any): Promise<any> {
  //   return this.registerBullQueue.add(name, data, opts);
  // }
  //
  // /**
  //  * 작업 재시도 메서드
  //  */
  // async retryJob(jobId: string): Promise<void> {
  //   const job = await this.registerBullQueue.getJob(jobId);
  //   if (job) {
  //     await job.retry();
  //   }
  // }
}
