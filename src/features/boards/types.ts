export interface Board {
  id: string;
  name: string;
  url: string;
  columns: BoardColumn[];
  isValid: boolean;
  allowedMappings: Record<string, string[]>;
  canEdit: boolean;
  fields: BoardFields;
  revision: number;
  rows: BoardRow[];
}

export interface BoardColumn {
  id: string;
  name: string;
  itemLimit?: number;
  columnType: 'incoming' | 'inProgress' | 'outgoing' | 'custom';
  stateMappings: Record<string, string[]>;
  isSplit: boolean;
  description?: string;
}

export interface BoardFields {
  columnField: FieldReference;
  doneField: FieldReference;
  rowField: FieldReference;
}

export interface BoardRow {
  id: string;
  name: string;
}

export interface FieldReference {
  referenceName: string;
  url: string;
}

export interface BoardWorkItemReference {
  id: number;
  url: string;
}

export interface BoardWorkItemsResult {
  workItems: BoardWorkItemReference[];
  url: string;
}

export interface BoardListParams {
  organization: string;
  project: string;
  team: string;
}

export interface BoardParams extends BoardListParams {
  boardName: string;
}

export interface BoardWorkItemsParams extends BoardParams {
  iterationName?: string;
  iterationPath?: string;
}
