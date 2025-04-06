import {
  JobType,
  ProductRegistrationReqDto,
  ProductRegistrationReqResDto,
  ProductRegistrationResult,
} from '@daechanjo/models';
import { RabbitMQService } from '@daechanjo/rabbitmq';
import { UtilService } from '@daechanjo/util';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobCounts, JobStatus, Queue } from 'bull';

@Injectable()
export class RegisterService {
  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
    @InjectQueue('register-bull-queue') private readonly registerBullQueue: Queue,
  ) {}

  async productRegistration(data: ProductRegistrationReqDto) {
    const jobId = this.utilService.generateCronId();
    const jobType = JobType.REGISTER;
    const store = this.configService.get<string>('STORE');
    try {
      const results: { status: string; data: ProductRegistrationResult[] } =
        await this.rabbitmqService.send('onch-queue', 'productRegistration', {
          jobId,
          jobType,
          store,
          data,
        });
      const summary: ProductRegistrationReqResDto = {
        successCount: 0,
        failCount: 0,
        alreadyRegisteredCount: 0,
        duplicateNameCount: 0,
        totalProcessed: 0,
      };

      // 각 결과에서 카운트 추출 및 합산
      results.data.forEach((result) => {
        if (result.success && result.alertMessage) {
          const counts: ProductRegistrationReqResDto = this.extractRegistrationCounts(
            result.alertMessage,
          );

          summary.successCount += counts.successCount;
          summary.failCount += counts.failCount;
          summary.alreadyRegisteredCount += counts.alreadyRegisteredCount;
          summary.duplicateNameCount += counts.duplicateNameCount;
          summary.totalProcessed += counts.totalProcessed;
        }
      });

      // await this.rabbitmqService.emit('mail-queue', 'sendProductRegistrationResult', {
      //   jobId,
      //   jobType,
      //   summary,
      // });
      console.log(summary);
    } catch (error: any) {
      console.error(
        `${JobType.ERROR}${jobType}${jobId}: productRegistration 전송중 에러 발생`,
        error,
      );
    }
  }

  private extractRegistrationCounts(alertMessage: string) {
    // 정규표현식으로 카운트 숫자 추출
    const successMatch = alertMessage.match(/성공 : (\d+)/);
    const failMatch = alertMessage.match(/실패 : (\d+)/);
    const alreadyRegisteredMatch = alertMessage.match(/이미 등록된 상품 : (\d+)/);
    const duplicateNameMatch = alertMessage.match(/동일한 상품명 : (\d+)/);

    // 추출된 숫자 변환, 없으면 0으로 설정
    const successCount = successMatch ? parseInt(successMatch[1], 10) : 0;
    const failCount = failMatch ? parseInt(failMatch[1], 10) : 0;
    const alreadyRegisteredCount = alreadyRegisteredMatch
      ? parseInt(alreadyRegisteredMatch[1], 10)
      : 0;
    const duplicateNameCount = duplicateNameMatch ? parseInt(duplicateNameMatch[1], 10) : 0;

    // 총 처리된 상품 수 계산
    const totalProcessed = successCount + failCount + alreadyRegisteredCount + duplicateNameCount;

    return {
      successCount,
      failCount,
      alreadyRegisteredCount,
      duplicateNameCount,
      totalProcessed,
    };
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

  async productRegistration2(data: ProductRegistrationReqDto) {}
}
