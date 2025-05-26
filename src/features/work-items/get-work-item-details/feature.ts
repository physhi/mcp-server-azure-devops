import { WebApi } from 'azure-devops-node-api';
import { WorkItem } from '../types';
import { GetWorkItemDetailsArgs } from './schema';
import { getWorkItem } from '../get-work-item';

/**
 * Gets detailed information about a specific work item.
 * This is an alias for the getWorkItem function with a more descriptive name.
 *
 * @param connection The Azure DevOps WebApi connection.
 * @param args The arguments for getting work item details.
 * @returns A promise that resolves to the work item details.
 */
export async function getWorkItemDetails(
  connection: WebApi,
  args: GetWorkItemDetailsArgs,
): Promise<WorkItem> {
  // Simply call the existing getWorkItem function
  return getWorkItem(connection, args.workItemId, args.expand);
}
