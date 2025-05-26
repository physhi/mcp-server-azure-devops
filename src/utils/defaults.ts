import {
  defaultOrg,
  defaultProject,
  defaultTeam,
  defaultRepository,
} from './environment';

/**
 * Apply default values to parameters
 */
export function applyDefaults<T extends Record<string, any>>(params: T): T {
  const result = { ...params } as any;

  // Apply organization default
  if ('organization' in result && !result.organization) {
    result.organization = defaultOrg;
  }
  if ('organizationId' in result && !result.organizationId) {
    result.organizationId = defaultOrg;
  }

  // Apply project default
  if ('project' in result && !result.project) {
    result.project = defaultProject;
  }
  if ('projectId' in result && !result.projectId) {
    result.projectId = defaultProject;
  }

  // Apply team default
  if ('team' in result && !result.team) {
    result.team = defaultTeam;
  }
  if ('teamId' in result && !result.teamId) {
    result.teamId = defaultTeam;
  }

  // Apply repository default
  if ('repository' in result && !result.repository) {
    result.repository = defaultRepository;
  }
  if ('repositoryId' in result && !result.repositoryId) {
    result.repositoryId = defaultRepository;
  }

  return result;
}

/**
 * Get organization with default fallback
 */
export function getOrganization(org?: string): string {
  return org || defaultOrg;
}

/**
 * Get project with default fallback
 */
export function getProject(project?: string): string {
  return project || defaultProject;
}

/**
 * Get team with default fallback
 */
export function getTeam(team?: string): string {
  return team || defaultTeam;
}

/**
 * Get repository with default fallback
 */
export function getRepository(repository?: string): string {
  return repository || defaultRepository;
}
