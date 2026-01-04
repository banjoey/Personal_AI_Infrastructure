/**
 * Cloudflare Pages Inspection Tools
 *
 * Read-only operations for inspecting Cloudflare Pages projects and deployments.
 * All operations use macOS Keychain for authentication.
 * Deployments are triggered via CI/CD only - no manual deployment tools.
 */

import { cloudflareApi } from './cloudflare-client.ts';
import type {
  PagesProject,
  PagesDeployment,
  ListPagesDeploymentsParams,
  DeploymentStatus,
} from './interfaces.ts';

// =============================================================================
// PAGES PROJECT LISTING
// =============================================================================

/**
 * List all Pages projects in a Cloudflare account
 *
 * @param accountId - Cloudflare account ID
 * @returns Array of Pages projects
 *
 * @example
 * // List all Pages projects
 * const projects = await listPagesProjects('your-account-id');
 *
 * @example
 * // Check project domains
 * const projects = await listPagesProjects(accountId);
 * projects.forEach(p => {
 *   console.log(`${p.name}: ${p.subdomain}, custom: ${p.domains.join(', ')}`);
 * });
 */
export async function listPagesProjects(
  accountId: string
): Promise<PagesProject[]> {
  return await cloudflareApi<PagesProject[]>(
    `/accounts/${accountId}/pages/projects`
  );
}

// =============================================================================
// PAGES PROJECT DETAILS
// =============================================================================

/**
 * Get detailed information about a specific Pages project
 *
 * @param accountId - Cloudflare account ID
 * @param projectName - Project name (URL-safe)
 * @returns Pages project details
 *
 * @example
 * // Get project details
 * const project = await getPagesProject('account-id', 'my-project');
 *
 * @example
 * // Check production branch
 * const project = await getPagesProject(accountId, projectName);
 * console.log(`Production branch: ${project.production_branch}`);
 *
 * @example
 * // Check build configuration
 * const project = await getPagesProject(accountId, projectName);
 * console.log(`Build: ${project.build_config.build_command}`);
 * console.log(`Output: ${project.build_config.destination_dir}`);
 */
export async function getPagesProject(
  accountId: string,
  projectName: string
): Promise<PagesProject> {
  return await cloudflareApi<PagesProject>(
    `/accounts/${accountId}/pages/projects/${projectName}`
  );
}

// =============================================================================
// PAGES DEPLOYMENT LISTING
// =============================================================================

/**
 * List deployments for a Pages project with optional filtering
 *
 * @param accountId - Cloudflare account ID
 * @param projectName - Project name
 * @param options - Optional pagination and filtering parameters
 * @returns Array of deployments
 *
 * @example
 * // List all deployments
 * const deployments = await listPagesDeployments('account-id', 'my-project');
 *
 * @example
 * // List only production deployments
 * const prodDeployments = await listPagesDeployments(accountId, projectName, {
 *   env: 'production'
 * });
 *
 * @example
 * // List deployments for a specific branch
 * const branchDeployments = await listPagesDeployments(accountId, projectName, {
 *   branch: 'feature-branch'
 * });
 *
 * @example
 * // Paginated results
 * const page1 = await listPagesDeployments(accountId, projectName, {
 *   page: 1,
 *   per_page: 25
 * });
 */
export async function listPagesDeployments(
  accountId: string,
  projectName: string,
  options?: ListPagesDeploymentsParams
): Promise<PagesDeployment[]> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (options?.page) queryParams.page = options.page;
  if (options?.per_page) queryParams.per_page = options.per_page;
  if (options?.order) queryParams.order = options.order;
  if (options?.direction) queryParams.direction = options.direction;
  if (options?.env) queryParams.env = options.env;
  if (options?.branch) queryParams.branch = options.branch;

  return await cloudflareApi<PagesDeployment[]>(
    `/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    { params: queryParams }
  );
}

// =============================================================================
// PAGES DEPLOYMENT STATUS
// =============================================================================

/**
 * Get detailed status and logs for a specific Pages deployment
 *
 * @param accountId - Cloudflare account ID
 * @param projectName - Project name
 * @param deploymentId - Deployment ID (or short ID)
 * @returns Deployment details including stage status and build information
 *
 * @example
 * // Get deployment status
 * const deployment = await getPagesDeploymentStatus(
 *   'account-id',
 *   'my-project',
 *   'abc123def'
 * );
 *
 * @example
 * // Check if deployment succeeded
 * const deployment = await getPagesDeploymentStatus(accountId, projectName, deploymentId);
 * const isSuccess = deployment.latest_stage.status === 'success';
 *
 * @example
 * // Check deployment stages
 * const deployment = await getPagesDeploymentStatus(accountId, projectName, deploymentId);
 * deployment.stages.forEach(stage => {
 *   console.log(`${stage.name}: ${stage.status}`);
 *   if (stage.started_on && stage.ended_on) {
 *     const duration = new Date(stage.ended_on).getTime() - new Date(stage.started_on).getTime();
 *     console.log(`  Duration: ${duration}ms`);
 *   }
 * });
 *
 * @example
 * // Get deployment URL if successful
 * const deployment = await getPagesDeploymentStatus(accountId, projectName, deploymentId);
 * if (deployment.latest_stage.status === 'success') {
 *   console.log(`Deployed to: ${deployment.url}`);
 * }
 */
export async function getPagesDeploymentStatus(
  accountId: string,
  projectName: string,
  deploymentId: string
): Promise<PagesDeployment> {
  return await cloudflareApi<PagesDeployment>(
    `/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}`
  );
}

// =============================================================================
// CLI INTERFACE
// =============================================================================

if (import.meta.main) {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'list-projects') {
      // List projects: bun pages.ts list-projects <account-id>
      if (args.length < 2) {
        console.error('Usage: bun pages.ts list-projects <account-id>');
        process.exit(1);
      }

      const accountId = args[1];
      const projects = await listPagesProjects(accountId);
      console.log(JSON.stringify(projects, null, 2));
    } else if (command === 'get-project') {
      // Get project: bun pages.ts get-project <account-id> <project-name>
      if (args.length < 3) {
        console.error(
          'Usage: bun pages.ts get-project <account-id> <project-name>'
        );
        process.exit(1);
      }

      const accountId = args[1];
      const projectName = args[2];
      const project = await getPagesProject(accountId, projectName);
      console.log(JSON.stringify(project, null, 2));
    } else if (command === 'list-deployments') {
      // List deployments: bun pages.ts list-deployments <account-id> <project-name> [--env=production] [--branch=main]
      if (args.length < 3) {
        console.error(
          'Usage: bun pages.ts list-deployments <account-id> <project-name> [--env=production] [--branch=main]'
        );
        process.exit(1);
      }

      const accountId = args[1];
      const projectName = args[2];
      const options: ListPagesDeploymentsParams = {};

      for (let i = 3; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--env=')) {
          options.env = arg.slice('--env='.length) as 'production' | 'preview';
        } else if (arg.startsWith('--branch=')) {
          options.branch = arg.slice('--branch='.length);
        } else if (arg.startsWith('--page=')) {
          options.page = parseInt(arg.slice('--page='.length), 10);
        } else if (arg.startsWith('--per-page=')) {
          options.per_page = parseInt(arg.slice('--per-page='.length), 10);
        }
      }

      const deployments = await listPagesDeployments(
        accountId,
        projectName,
        options
      );
      console.log(JSON.stringify(deployments, null, 2));
    } else if (command === 'get-deployment') {
      // Get deployment: bun pages.ts get-deployment <account-id> <project-name> <deployment-id>
      if (args.length < 4) {
        console.error(
          'Usage: bun pages.ts get-deployment <account-id> <project-name> <deployment-id>'
        );
        process.exit(1);
      }

      const accountId = args[1];
      const projectName = args[2];
      const deploymentId = args[3];
      const deployment = await getPagesDeploymentStatus(
        accountId,
        projectName,
        deploymentId
      );
      console.log(JSON.stringify(deployment, null, 2));
    } else {
      console.error('Usage:');
      console.error('  bun pages.ts list-projects <account-id>');
      console.error(
        '  bun pages.ts get-project <account-id> <project-name>'
      );
      console.error(
        '  bun pages.ts list-deployments <account-id> <project-name> [--env=production] [--branch=main]'
      );
      console.error(
        '  bun pages.ts get-deployment <account-id> <project-name> <deployment-id>'
      );
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ error: message }));
    process.exit(1);
  }
}
