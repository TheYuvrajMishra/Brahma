import * as cron from 'node-cron';
import { CronJob } from '../models';
import { DiscordService } from './discord.service';

interface ScheduledJob {
  jobId: string;
  task: cron.ScheduledTask;
}

export class CronService {
  private static activeJobs: Map<string, ScheduledJob> = new Map();

  public static async init() {
    console.log('⏰ Initializing Cron Service...');
    try {
      const jobs = await CronJob.find({});
      let loadedCount = 0;
      for (const job of jobs) {
        if (job.status === 'ACTIVE') {
          // Check if expired on load
          if (job.expiresAt && new Date() > job.expiresAt) {
            job.status = 'EXPIRED';
            await job.save();
            continue;
          }
          this.scheduleInternal(job.jobId, job.cronExpression, job.prompt, job.name, job.expiresAt);
          loadedCount++;
        }
      }
      console.log(`⏰ Cron Service initialized. Active jobs loaded: ${loadedCount}`);
    } catch (err: any) {
      console.error('⚠️ Failed to initialize Cron Service:', err.message);
    }
  }

  private static scheduleInternal(jobId: string, cronExpression: string, prompt: string, jobName: string, expiresAt?: Date) {
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.get(jobId)?.task.stop();
      this.activeJobs.delete(jobId);
    }

    if (!cron.validate(cronExpression)) {
      console.error(`⚠️ Invalid cron expression for job ${jobId}: ${cronExpression}`);
      return;
    }

    const task = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Executing Cron Job: ${jobName} (${jobId})`);
      
      try {
        const job = await CronJob.findOne({ jobId });
        if (!job || job.status !== 'ACTIVE') {
          this.activeJobs.get(jobId)?.task.stop();
          this.activeJobs.delete(jobId);
          return;
        }

        // Check Expiration
        if (job.expiresAt && new Date() > job.expiresAt) {
          console.log(`⏱️ Cron Job ${jobName} has EXPIRED. Terminating.`);
          job.status = 'EXPIRED';
          await job.save();
          this.activeJobs.get(jobId)?.task.stop();
          this.activeJobs.delete(jobId);
          return; // Skip execution
        }

        job.lastRun = new Date();
        job.executionsCount += 1;
        await job.save();

        // Non-blocking execution (Involuntary background run)
        DiscordService.handleUserCommand(
          prompt,
          'cron-system',
          'CronScheduler',
          'cron-context'
        ).then(response => {
          console.log(`⏰ Cron Job ${jobName} Result:`, response);
        }).catch(err => {
          console.error(`⚠️ Cron Job ${jobName} failed during execution:`, err.message);
        });

      } catch (err: any) {
        console.error(`⚠️ Cron Job ${jobName} error:`, err.message);
      }
    });

    this.activeJobs.set(jobId, { jobId, task });
  }

  public static async addJob(name: string, cronExpression: string, prompt: string, durationSec?: number) {
    const jobId = `CRON-${Date.now().toString().slice(-6)}`;
    
    let expiresAt: Date | undefined;
    if (durationSec && durationSec > 0) {
      expiresAt = new Date(Date.now() + durationSec * 1000);
    }

    const newJob = new CronJob({
      jobId,
      name,
      cronExpression,
      prompt,
      status: 'ACTIVE',
      durationSec,
      expiresAt,
      executionsCount: 0
    });
    
    await newJob.save();
    this.scheduleInternal(jobId, cronExpression, prompt, name, expiresAt);
    return newJob;
  }

  public static async toggleJob(jobId: string) {
    const job = await CronJob.findOne({ jobId });
    if (!job) throw new Error(`Cron Job ${jobId} not found`);

    if (job.status === 'EXPIRED') {
      throw new Error(`Cannot toggle an expired job`);
    }

    if (job.status === 'ACTIVE') {
      job.status = 'PAUSED';
      if (this.activeJobs.has(jobId)) {
        this.activeJobs.get(jobId)?.task.stop();
        this.activeJobs.delete(jobId);
      }
    } else {
      job.status = 'ACTIVE';
      // If we unpause, do we extend expiration? For now, no. It just resumes.
      this.scheduleInternal(jobId, job.cronExpression, job.prompt, job.name, job.expiresAt);
    }
    await job.save();
    return job;
  }

  public static async deleteJob(jobId: string) {
    const job = await CronJob.findOneAndDelete({ jobId });
    if (!job) throw new Error(`Cron Job ${jobId} not found`);
    
    if (this.activeJobs.has(jobId)) {
      this.activeJobs.get(jobId)?.task.stop();
      this.activeJobs.delete(jobId);
    }
    return job;
  }

  public static async listJobs() {
    return await CronJob.find({}).sort({ createdOn: -1 });
  }
}
