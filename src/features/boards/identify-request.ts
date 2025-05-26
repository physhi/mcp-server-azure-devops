import { IncomingMessage } from 'http';
import { z } from 'zod';
import {
  boardListParamsSchema,
  boardParamsSchema,
  boardWorkItemsParamsSchema,
} from '@/features/boards/schemas';

const BOARD_PATH_REGEX =
  /\/([^/]+)\/([^/]+)\/([^/]+)\/_apis\/work\/boards(?:\/([^/]+))?(?:\/([^/]+))?/i;

export function identifyRequest(request: IncomingMessage): unknown | null {
  if (!request.url) return null;
  let url: URL;
  try {
    url = new URL(request.url, 'http://localhost'); // base required for relative URLs
  } catch {
    return null;
  }
  const match = url.pathname.match(BOARD_PATH_REGEX);
  if (!match) return null;

  const [, organization, project, team, boardNameOrId, subPath] = match;
  const params = { organization, project, team };

  // Handle different board endpoints
  if (boardNameOrId) {
    if (subPath === 'workitems') {
      const result = boardWorkItemsParamsSchema.safeParse({
        ...params,
        boardName: boardNameOrId,
        ...(url.searchParams.get('iterationId') && {
          iterationName: url.searchParams.get('iterationId'),
        }),
        ...(url.searchParams.get('iterationPath') && {
          iterationPath: url.searchParams.get('iterationPath'),
        }),
      });
      return result.success ? result.data : null;
    } else if (subPath === 'columns') {
      const result = boardParamsSchema.safeParse({
        ...params,
        boardName: boardNameOrId,
      });
      return result.success ? { ...result.data, subPath: 'columns' } : null;
    } else {
      const result = boardParamsSchema.safeParse({
        ...params,
        boardName: boardNameOrId,
      });
      return result.success ? result.data : null;
    }
  }

  // Handle list boards
  const result = boardListParamsSchema.safeParse(params);
  return result.success ? result.data : null;
}

// Type guard functions
export function isBoardListParams(
  params: unknown,
): params is z.infer<typeof boardListParamsSchema> {
  return boardListParamsSchema.safeParse(params).success;
}

export function isBoardParams(
  params: unknown,
): params is z.infer<typeof boardParamsSchema> {
  return boardParamsSchema.safeParse(params).success;
}

export function isBoardWorkItemsParams(
  params: unknown,
): params is z.infer<typeof boardWorkItemsParamsSchema> {
  return boardWorkItemsParamsSchema.safeParse(params).success;
}
