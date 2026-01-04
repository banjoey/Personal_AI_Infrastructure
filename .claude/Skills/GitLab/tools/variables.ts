/**
 * GitLab CI/CD Variables Operations
 *
 * Tools for managing project-level CI/CD variables:
 * - List variables (with auto-masking of sensitive values)
 * - Create new variables (with sensitivity warnings)
 * - Update existing variables
 * - Delete variables
 *
 * Security Features:
 * - Sensitive values automatically masked in list output
 * - Warnings when creating unmasked sensitive variables
 */

import { gitlabApi, encodeProjectPath, isSensitiveKey, checkSensitiveKey } from './gitlab-client.ts';
import type {
  CiVariable,
  ListVariablesParams,
  CreateVariableParams,
  UpdateVariableParams,
  DeleteVariableParams,
} from './interfaces.ts';

/**
 * Masked version of a CI/CD variable (for safe display)
 */
interface MaskedCiVariable extends Omit<CiVariable, 'value'> {
  value: string;
  value_masked: boolean;
}

/**
 * List all CI/CD variables for a project
 * Automatically masks sensitive variable values in output
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @returns Array of variables (with sensitive values replaced by "[MASKED]")
 */
export async function listVariables(
  projectPath: string | number
): Promise<MaskedCiVariable[]> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const variables = await gitlabApi<CiVariable[]>(
    `/projects/${encodedId}/variables`
  );

  // Auto-mask sensitive variable values
  return variables.map(variable => {
    const isSensitive = isSensitiveKey(variable.key);
    return {
      ...variable,
      value: isSensitive ? '[MASKED]' : variable.value,
      value_masked: isSensitive,
    };
  });
}

/**
 * Create a new CI/CD variable
 * Warns if creating a sensitive variable without masked flag
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param key - Variable key (must be unique)
 * @param value - Variable value
 * @param options - Additional options (variable_type, protected, masked, raw, environment_scope)
 * @returns Created variable with warning if sensitive
 */
export async function createVariable(
  projectPath: string | number,
  key: string,
  value: string,
  options?: {
    variable_type?: 'env_var' | 'file';
    protected?: boolean;
    masked?: boolean;
    raw?: boolean;
    environment_scope?: string;
  }
): Promise<{ variable: CiVariable; warning?: string }> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const body: Record<string, unknown> = {
    key,
    value,
  };

  if (options?.variable_type) body.variable_type = options.variable_type;
  if (options?.protected !== undefined) body.protected = options.protected;
  if (options?.masked !== undefined) body.masked = options.masked;
  if (options?.raw !== undefined) body.raw = options.raw;
  if (options?.environment_scope) body.environment_scope = options.environment_scope;

  const variable = await gitlabApi<CiVariable>(
    `/projects/${encodedId}/variables`,
    {
      method: 'POST',
      body,
    }
  );

  // Check if creating an unmasked sensitive variable
  const warning = (!options?.masked) ? checkSensitiveKey(key) : undefined;

  return {
    variable,
    warning: warning || undefined,
  };
}

/**
 * Update an existing CI/CD variable
 * Warns if updating to unmasked when key appears sensitive
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param key - Variable key to update
 * @param updates - Fields to update (value, variable_type, protected, masked, raw, environment_scope)
 * @returns Updated variable with warning if applicable
 */
export async function updateVariable(
  projectPath: string | number,
  key: string,
  updates: {
    value?: string;
    variable_type?: 'env_var' | 'file';
    protected?: boolean;
    masked?: boolean;
    raw?: boolean;
    environment_scope?: string;
  }
): Promise<{ variable: CiVariable; warning?: string }> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const body: Record<string, unknown> = {};

  if (updates.value !== undefined) body.value = updates.value;
  if (updates.variable_type !== undefined) body.variable_type = updates.variable_type;
  if (updates.protected !== undefined) body.protected = updates.protected;
  if (updates.masked !== undefined) body.masked = updates.masked;
  if (updates.raw !== undefined) body.raw = updates.raw;
  if (updates.environment_scope !== undefined) body.environment_scope = updates.environment_scope;

  const encodedKey = encodeURIComponent(key);

  const variable = await gitlabApi<CiVariable>(
    `/projects/${encodedId}/variables/${encodedKey}`,
    {
      method: 'PUT',
      body,
    }
  );

  // Check if disabling masking on a sensitive variable
  const warning = (updates.masked === false) ? checkSensitiveKey(key) : undefined;

  return {
    variable,
    warning: warning || undefined,
  };
}

/**
 * Delete a CI/CD variable
 *
 * @param projectPath - Project ID or path (e.g., "namespace/project")
 * @param key - Variable key to delete
 * @param filter - Optional environment scope filter
 * @returns Empty response (204 No Content on success)
 */
export async function deleteVariable(
  projectPath: string | number,
  key: string,
  filter?: {
    environment_scope?: string;
  }
): Promise<void> {
  const encodedId = typeof projectPath === 'string'
    ? encodeProjectPath(projectPath)
    : projectPath;

  const encodedKey = encodeURIComponent(key);

  const queryParams: Record<string, string | number | boolean> = {};
  if (filter?.environment_scope) {
    queryParams.filter = `[environment_scope]=${filter.environment_scope}`;
  }

  await gitlabApi<void>(
    `/projects/${encodedId}/variables/${encodedKey}`,
    {
      method: 'DELETE',
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    }
  );
}
