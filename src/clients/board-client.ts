import axios from 'axios';
import {
  AzureDevOpsError,
  AzureDevOpsResourceNotFoundError,
  AzureDevOpsValidationError,
  AzureDevOpsPermissionError,
} from '../shared/errors';
import { getAuthorizationHeader } from './azure-devops';
import { Board, BoardWorkItemsResult } from '../features/boards/types';

interface BoardClientOptions {
  organizationId?: string;
}

export class BoardClient {
  private baseUrl: string;
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.baseUrl = `https://dev.azure.com/${this.organizationId}`;
  }

  /**
   * Get a list of boards
   * @param project - Project ID or name
   * @param team - Team ID or name
   * @returns List of boards
   */
  async getBoardList(project: string, team: string): Promise<Board[]> {
    try {
      const url = `${this.baseUrl}/${project}/${team}/_apis/work/boards`;
      const response = await axios.get(url, {
        headers: await this.getHeaders(),
        params: {
          'api-version': '7.1',
        },
      });
      return response.data.value;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Get board details
   * @param project - Project ID or name
   * @param team - Team ID or name
   * @param boardId - Board ID
   * @returns Board details
   */
  async getBoard(
    project: string,
    team: string,
    boardId: string,
  ): Promise<Board> {
    try {
      const url = `${this.baseUrl}/${project}/${team}/_apis/work/boards/${boardId}`;
      const response = await axios.get(url, {
        headers: await this.getHeaders(),
        params: {
          'api-version': '7.1',
        },
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Get work items for a board
   * @param project - Project ID or name
   * @param team - Team ID or name
   * @param boardId - Board ID
   * @param options - Optional parameters
   * @returns Work items for the board
   */
  async getBoardWorkItems(
    project: string,
    team: string,
    boardId: string,
    options: { iterationId?: string; iterationPath?: string } = {},
  ): Promise<BoardWorkItemsResult> {
    try {
      const url = `${this.baseUrl}/${project}/${team}/_apis/work/boards/${boardId}/workitems`;

      const params: Record<string, string> = {
        'api-version': '7.1',
      };

      if (options.iterationId) {
        params.iterationId = options.iterationId;
      } else if (options.iterationPath) {
        params.iterationPath = options.iterationPath;
      }

      const response = await axios.get(url, {
        headers: await this.getHeaders(),
        params,
      });

      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Get the HTTP headers for API requests
   * @returns Headers object with authorization
   */
  private async getHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: await getAuthorizationHeader(),
    };
  }

  /**
   * Handle API errors
   * @param error - The error object
   * @throws Appropriate AzureDevOpsError
   */
  private handleError(error: unknown): never {
    // AxiosError shape check
    if (typeof error === 'object' && error !== null) {
      const err = error as any;
      if (err.response) {
        const { status, data } = err.response;
        const message =
          data && typeof data === 'object' && 'message' in data
            ? data.message
            : err.message;
        switch (status) {
          case 400:
            throw new AzureDevOpsValidationError(message, data);
          case 401:
          case 403:
            throw new AzureDevOpsPermissionError(message, data);
          case 404:
            throw new AzureDevOpsResourceNotFoundError(message, data);
          default:
            throw new AzureDevOpsError(
              `Azure DevOps API error: ${message}`,
              status,
            );
        }
      } else if (err.request) {
        throw new AzureDevOpsError('No response from Azure DevOps API');
      } else if (err.message) {
        throw new AzureDevOpsError(`Error setting up request: ${err.message}`);
      }
    }
    throw new AzureDevOpsError('Unknown error occurred');
  }

  /**
   * Create a swim lane (row) for a board
   */
  async createBoardRow(
    project: string,
    team: string,
    boardId: string,
    rowName: string,
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/${project}/${team}/_apis/work/boards/${boardId}/rows?api-version=7.1`;
      const response = await axios.post(
        url,
        { name: rowName },
        { headers: await this.getHeaders() },
      );
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Update a swim lane (row) for a board
   */
  async updateBoardRow(
    project: string,
    team: string,
    boardId: string,
    rowId: string,
    newName: string,
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/${project}/${team}/_apis/work/boards/${boardId}/rows/${rowId}?api-version=7.1`;
      const response = await axios.patch(
        url,
        { name: newName },
        { headers: await this.getHeaders() },
      );
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a swim lane (row) for a board
   */
  async deleteBoardRow(
    project: string,
    team: string,
    boardId: string,
    rowId: string,
  ): Promise<void> {
    try {
      const url = `${this.baseUrl}/${project}/${team}/_apis/work/boards/${boardId}/rows/${rowId}?api-version=7.1`;
      await axios.delete(url, { headers: await this.getHeaders() });
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  /**
   * Move a work item to a different column and/or swim lane (row)
   * @param workItemId - The ID of the work item
   * @param project - Project ID or name
   * @param updates - Object with field changes (e.g. column, row)
   */
  async moveWorkItemToColumnRow(
    workItemId: number,
    project: string,
    updates: Record<string, any>,
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/${project}/_apis/wit/workitems/${workItemId}?api-version=7.1`;
      // Azure DevOps requires PATCH with a specific format for updates
      const patchOps = Object.entries(updates).map(([field, value]) => ({
        op: 'add',
        path: `/fields/${field}`,
        value,
      }));
      const response = await axios.patch(url, patchOps, {
        headers: {
          ...(await this.getHeaders()),
          'Content-Type': 'application/json-patch+json',
        },
      });
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }
}

/**
 * Creates a Board client for Azure DevOps operations
 * @param options - Options for creating the client
 * @returns A Board client instance
 */
export function getBoardClient(options: BoardClientOptions = {}): BoardClient {
  const { organizationId } = options;
  return new BoardClient(organizationId || '');
}
