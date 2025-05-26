/**
 * Types for the iterations feature
 */

/**
 * Represents an iteration in Azure DevOps
 */
export interface Iteration {
  id: string;
  name: string;
  path: string;
  attributes: {
    startDate?: string;
    finishDate?: string;
    timeFrame: 'past' | 'current' | 'future';
  };
  url: string;
}

/**
 * Represents detailed information about an iteration
 */
export interface IterationDetails extends Iteration {
  workItemCount?: number;
  teamCapacity?: number;
  remainingWorkItems?: number;
  completedWorkItems?: number;
}

/**
 * Represents a team's current iteration
 */
export interface TeamCurrentIteration extends Iteration {
  isCurrentIteration: boolean;
  remainingDays?: number;
  totalDays?: number;
  progressPercentage?: number;
}

/**
 * Represents a data point in a burndown chart
 */
export interface BurndownDataPoint {
  date: string;
  remainingWork: number;
  completedWork: number;
  totalWork: number;
  idealRemainingWork?: number;
}

/**
 * Represents burndown chart data for a sprint
 */
export interface SprintBurndown {
  iterationId: string;
  iterationName: string;
  startDate: string;
  endDate: string;
  dataPoints: BurndownDataPoint[];
  totalWorkItems: number;
  completedWorkItems: number;
  remainingWorkItems: number;
  progressPercentage: number;
}

/**
 * Represents velocity data for a single iteration
 */
export interface IterationVelocity {
  iterationId: string;
  iterationName: string;
  startDate: string;
  endDate: string;
  plannedWork: number;
  completedWork: number;
  velocity: number;
  workItemCount: number;
  completedWorkItemCount: number;
}

/**
 * Represents team velocity data across multiple iterations
 */
export interface TeamVelocity {
  teamName: string;
  iterations: IterationVelocity[];
  averageVelocity: number;
  velocityTrend: 'increasing' | 'decreasing' | 'stable';
  totalIterations: number;
}
