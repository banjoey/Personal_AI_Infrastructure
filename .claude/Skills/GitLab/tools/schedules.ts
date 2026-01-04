/**
 * GitLab Pipeline Schedule Operations
 *
 * Tools for managing GitLab pipeline schedules:
 * - List pipeline schedules
 * - Create new schedules with cron expressions
 * - Update existing schedules
 * - Delete schedules
 * - Trigger schedules immediately (run now)
 */

import { gitlabApi, encodeProjectPath } from './gitlab-client.ts';
import type {
  PipelineSchedule,
  ListSchedulesParams,
  CreateScheduleParams,
  UpdateScheduleParams,
  DeleteScheduleParams,
  Pipeline,
} from './interfaces.ts';

/**
 * List all pipeline schedules for a project
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param options - Pagination options (page, per_page)
 * @returns Array of pipeline schedules
 */
export async function listSchedules(
  projectPath: string | number,
  options?: Omit<ListSchedulesParams, 'project_id'>
): Promise<PipelineSchedule[]> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const queryParams: Record<string, string | number | boolean> = {};

  if (options?.page) queryParams.page = options.page;
  if (options?.per_page) queryParams.per_page = options.per_page;

  return await gitlabApi<PipelineSchedule[]>(
    `/projects/${encodedId}/pipeline_schedules`,
    {
      params: queryParams,
    }
  );
}

/**
 * Create a new pipeline schedule
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param description - Schedule description
 * @param ref - Branch or tag to run pipeline on
 * @param cron - Cron expression (e.g., "0 2 * * *" for daily at 2am)
 * @param options - Additional options (cron_timezone, active)
 * @returns Created pipeline schedule
 */
export async function createSchedule(
  projectPath: string | number,
  description: string,
  ref: string,
  cron: string,
  options?: {
    cron_timezone?: string;
    active?: boolean;
  }
): Promise<PipelineSchedule> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const body: Record<string, unknown> = {
    description,
    ref,
    cron,
  };

  if (options?.cron_timezone) body.cron_timezone = options.cron_timezone;
  if (options?.active !== undefined) body.active = options.active;

  return await gitlabApi<PipelineSchedule>(
    `/projects/${encodedId}/pipeline_schedules`,
    {
      method: 'POST',
      body,
    }
  );
}

/**
 * Update an existing pipeline schedule
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param scheduleId - Schedule ID to update
 * @param updates - Fields to update (description, ref, cron, cron_timezone, active)
 * @returns Updated pipeline schedule
 */
export async function updateSchedule(
  projectPath: string | number,
  scheduleId: number,
  updates: {
    description?: string;
    ref?: string;
    cron?: string;
    cron_timezone?: string;
    active?: boolean;
  }
): Promise<PipelineSchedule> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const body: Record<string, unknown> = {};

  if (updates.description !== undefined) body.description = updates.description;
  if (updates.ref !== undefined) body.ref = updates.ref;
  if (updates.cron !== undefined) body.cron = updates.cron;
  if (updates.cron_timezone !== undefined) body.cron_timezone = updates.cron_timezone;
  if (updates.active !== undefined) body.active = updates.active;

  return await gitlabApi<PipelineSchedule>(
    `/projects/${encodedId}/pipeline_schedules/${scheduleId}`,
    {
      method: 'PUT',
      body,
    }
  );
}

/**
 * Delete a pipeline schedule
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param scheduleId - Schedule ID to delete
 * @returns Empty response (204 No Content on success)
 */
export async function deleteSchedule(
  projectPath: string | number,
  scheduleId: number
): Promise<void> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  await gitlabApi<void>(
    `/projects/${encodedId}/pipeline_schedules/${scheduleId}`,
    {
      method: 'DELETE',
    }
  );
}

/**
 * Trigger a pipeline schedule immediately (run now)
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param scheduleId - Schedule ID to run
 * @returns Triggered pipeline details
 */
export async function runSchedule(
  projectPath: string | number,
  scheduleId: number
): Promise<Pipeline> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  return await gitlabApi<Pipeline>(
    `/projects/${encodedId}/pipeline_schedules/${scheduleId}/play`,
    {
      method: 'POST',
    }
  );
}
