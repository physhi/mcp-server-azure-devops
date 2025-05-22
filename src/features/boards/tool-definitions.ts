import { ToolDefinition } from '@/types/tool-definition';

export const boardTools: ToolDefinition[] = [
  {
    name: 'list_boards',
    description: 'Get a list of boards for a team',
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'The name of the Azure DevOps organization',
        },
        project: {
          type: 'string',
          description: 'The name or ID of the project',
        },
        team: {
          type: 'string',
          description: 'The name or ID of the team',
        },
      },
      required: ['organization', 'project', 'team'],
    },
  },
  {
    name: 'get_board',
    description: 'Get details of a specific board',
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'The name of the Azure DevOps organization',
        },
        project: {
          type: 'string',
          description: 'The name or ID of the project',
        },
        team: {
          type: 'string',
          description: 'The name or ID of the team',
        },
        boardId: {
          type: 'string',
          description: 'The ID of the board',
        },
      },
      required: ['organization', 'project', 'team', 'boardId'],
    },
  },
  {
    name: 'get_board_columns',
    description: 'Get columns for a specific board',
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'The name of the Azure DevOps organization',
        },
        project: {
          type: 'string',
          description: 'The name or ID of the project',
        },
        team: {
          type: 'string',
          description: 'The name or ID of the team',
        },
        boardId: {
          type: 'string',
          description: 'The ID of the board',
        },
      },
      required: ['organization', 'project', 'team', 'boardId'],
    },
  },
  {
    name: 'get_board_work_items',
    description: 'Get work items for a specific board',
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'The name of the Azure DevOps organization',
        },
        project: {
          type: 'string',
          description: 'The name or ID of the project',
        },
        team: {
          type: 'string',
          description: 'The name or ID of the team',
        },
        boardId: {
          type: 'string',
          description: 'The ID of the board',
        },
        iterationId: {
          type: 'string',
          description: 'Optional. The ID of the iteration to filter work items',
        },
        iterationPath: {
          type: 'string',
          description:
            'Optional. The path of the iteration to filter work items',
        },
      },
      required: ['organization', 'project', 'team', 'boardId'],
    },
  },
  {
    name: 'create_board_row',
    description: 'Create a new swim lane (row) on a board',
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'Azure DevOps organization',
        },
        project: { type: 'string', description: 'Project name or ID' },
        team: { type: 'string', description: 'Team name or ID' },
        boardId: { type: 'string', description: 'Board ID' },
        rowName: { type: 'string', description: 'Name of the new row' },
      },
      required: ['organization', 'project', 'team', 'boardId', 'rowName'],
    },
  },
  {
    name: 'update_board_row',
    description: 'Update the name of a swim lane (row) on a board',
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'Azure DevOps organization',
        },
        project: { type: 'string', description: 'Project name or ID' },
        team: { type: 'string', description: 'Team name or ID' },
        boardId: { type: 'string', description: 'Board ID' },
        rowId: { type: 'string', description: 'Row ID' },
        newName: { type: 'string', description: 'New name for the row' },
      },
      required: [
        'organization',
        'project',
        'team',
        'boardId',
        'rowId',
        'newName',
      ],
    },
  },
  {
    name: 'delete_board_row',
    description: 'Delete a swim lane (row) from a board',
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'Azure DevOps organization',
        },
        project: { type: 'string', description: 'Project name or ID' },
        team: { type: 'string', description: 'Team name or ID' },
        boardId: { type: 'string', description: 'Board ID' },
        rowId: { type: 'string', description: 'Row ID' },
      },
      required: ['organization', 'project', 'team', 'boardId', 'rowId'],
    },
  },
  {
    name: 'move_work_item',
    description: 'Move a work item to a different column or swim lane (row)',
    parameters: {
      type: 'object',
      properties: {
        organization: {
          type: 'string',
          description: 'Azure DevOps organization',
        },
        project: { type: 'string', description: 'Project name or ID' },
        workItemId: { type: 'number', description: 'Work item ID' },
        updates: {
          type: 'object',
          description: 'Field updates for the work item',
        },
      },
      required: ['organization', 'project', 'workItemId', 'updates'],
    },
  },
];
