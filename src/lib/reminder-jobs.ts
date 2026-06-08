export type JobStatus = {
  total: number;
  sent: number;
  skipped: number;
  status: "running" | "done" | "error";
  error?: string;
};

const jobs = new Map<string, JobStatus>();

export function createJob(id: string, total: number): void {
  jobs.set(id, { total, sent: 0, skipped: 0, status: "running" });
}

export function updateJob(id: string, patch: Partial<JobStatus>): void {
  const current = jobs.get(id);
  if (current) jobs.set(id, { ...current, ...patch });
}

export function getJob(id: string): JobStatus | undefined {
  return jobs.get(id);
}
