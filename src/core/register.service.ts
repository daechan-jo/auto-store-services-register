import {
  JobType,
  ProductRegistrationReqDto,
  ProductRegistrationReqResDto,
  ProductRegistrationResult,
} from '@daechanjo/models';
import { RabbitMQService } from '@daechanjo/rabbitmq';
import { UtilService } from '@daechanjo/util';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RegisterService {
  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
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
}
