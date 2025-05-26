import { zodToJsonSchema } from 'zod-to-json-schema';
import { ToolDefinition } from '../../shared/types/tool-definition';
import {
  ListWorkItemsSchema,
  CreateWorkItemSchema,
  UpdateWorkItemSchema,
  ManageWorkItemLinkSchema,
  GetWorkItemSchema,
} from './schemas';
import { GetWorkItemsByIterationSchema } from './get-work-items-by-iteration';
import { GetWorkItemDetailsSchema } from './get-work-item-details';
import { GetWorkItemHistorySchema } from './get-work-item-history';

/**
 * List of work items tools
 */
export const workItemsTools: ToolDefinition[] = [
  {
    name: 'list_work_items',
    description: 'List work items in a project',
    inputSchema: zodToJsonSchema(ListWorkItemsSchema),
  },
  {
    name: 'get_work_item',
    description: 'Get details of a specific work item',
    inputSchema: zodToJsonSchema(GetWorkItemSchema),
  },
  {
    name: 'get_work_item_details',
    description: 'Get detailed information about a specific work item',
    inputSchema: zodToJsonSchema(GetWorkItemDetailsSchema),
  },
  {
    name: 'get_work_items_by_iteration',
    description:
      'Get all work items in a specific iteration with complete details',
    inputSchema: zodToJsonSchema(GetWorkItemsByIterationSchema),
  },
  {
    name: 'create_work_item',
    description: 'Create a new work item',
    inputSchema: zodToJsonSchema(CreateWorkItemSchema),
  },
  {
    name: 'update_work_item',
    description: 'Update an existing work item',
    inputSchema: zodToJsonSchema(UpdateWorkItemSchema),
  },
  {
    name: 'manage_work_item_link',
    description: 'Add or remove links between work items',
    inputSchema: zodToJsonSchema(ManageWorkItemLinkSchema),
  },
  {
    name: 'get_work_item_history',
    description: 'Track changes to work items over time',
    inputSchema: zodToJsonSchema(GetWorkItemHistorySchema),
  },
];
