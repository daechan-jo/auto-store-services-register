// import { CronType } from '@daechanjo/models';
// import { Process, Processor } from '@nestjs/bull';
// import { Injectable } from '@nestjs/common';
// import { Job } from 'bull';


// @Processor('register-bull-queue') // 큐 이름
// @Injectable()
// export class MessageQueueProcessor {
// 	constructor(
// 		// private readonly coupangCrawlerService: CoupangCrawlerService
// 	) {}
//
// 	@Process('register-message') // 작업 이름
// 	async processMessage(job: Job) {
// 		const { pattern, payload } = job.data;
//
// 		console.log(`${payload.type}${payload.cronId}: 🔥${pattern}`);
//
// 		try {
// 			switch (pattern) {
// 				// case 'orderStatusUpdate':
// 				// 	await this.coupangCrawlerService.orderStatusUpdate(payload.cronId, payload.type);
// 				// 	break;
// 				//
//
// 				default:
// 					console.warn(
// 						`${CronType.ERROR}${payload.type}${payload.cronId}: 알 수 없는 패턴 ${pattern}`,
// 					);
// 			}
// 		} catch (error: any) {
// 			console.error(
// 				`${CronType.ERROR}${payload.type}${payload.cronId}: 🔥${pattern}\n`,
// 				error.response?.data || error.message,
// 			);
// 		}
// 	}
// }
