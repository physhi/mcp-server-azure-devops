# Azure DevOps Sprint Management Tools - Design Review

## Overview

This document outlines the implementation plan for enhancing our Azure DevOps integration with sprint management capabilities. The goal is to provide comprehensive tools for sprint planning, daily scrums, and project management while removing less useful functionality.

## Current State Assessment

We currently have the following board management tools:

- ✅ `list_boards` - Keep (useful for discovering available boards)
- ✅ `get_board` - Keep (useful for getting board details)
- ✅ `move_work_item` - Keep (essential for updating work item status)
- ❌ `get_board_columns` - Remove (limited utility for sprint management)
- ❌ `create_board_row` - Remove (row operations aren't central to sprint planning)
- ❌ `update_board_row` - Remove (row operations aren't central to sprint planning)
- ❌ `delete_board_row` - Remove (row operations aren't central to sprint planning)
- ❌ `get_board_work_items` - Replace (doesn't provide enough iteration information)

## Implementation Plan

### Phase 1: Iteration Management Tools

These tools form the foundation of sprint management and should be implemented first.

| Tool | Description | Priority | Status |
|------|-------------|----------|--------|
| `list_iterations` | Get all iterations/sprints for a team | High | Completed |
| `get_iteration_details` | Get comprehensive details about a specific iteration | High | Completed |
| `get_team_current_iteration` | Get the team's current active sprint | High | Completed |

### Phase 2: Enhanced Work Item Management Tools

These tools provide more comprehensive work item tracking in the context of sprints.

| Tool | Description | Priority | Status |
|------|-------------|----------|--------|
| `get_work_items_by_iteration` | Get all work items in a specific iteration with complete details | High | Completed |
| `get_work_item_details` | Get detailed information about a specific work item | Medium | Completed |
| `update_work_item` | Update work item fields (status, effort, etc.) | Medium | Completed |
| `get_work_item_history` | Track changes to work items over time | Low | Completed |

### Phase 3: Sprint Metrics Tools

These tools provide insights into sprint progress and team performance.

| Tool | Description | Priority | Status |
|------|-------------|----------|--------|
| `get_sprint_burndown` | Get burndown chart data for a sprint | Medium | Completed |
| `get_team_velocity` | Get velocity data across iterations | Medium | Completed |

### Phase 4: Team Capacity Tools
These tools help with capacity planning and management.

| Tool | Description | Priority | Status |
|------|-------------|----------|--------|
| `get_team_capacity` | Get capacity information for the team | Low | To Do |
| `get_team_days_off` | Get information about days off | Low | To Do |

### Phase 5: Project Management Tools

These tools support broader project management scenarios beyond sprint planning.

| Tool | Description | Priority | Status |
|------|-------------|----------|--------|
| `get_project_timeline` | Get project timeline with key milestones | Medium | To Do |
| `list_area_paths` | Get hierarchical area paths for organizing work | Medium | To Do |
| `get_work_item_query_results` | Run saved queries for project tracking | High | To Do |
| `get_work_item_dependencies` | Get dependencies between work items | Medium | To Do |
| `get_team_dashboard` | Get team dashboard configuration and widgets | Low | To Do |

## Technical Implementation Details

### Architecture Pattern
All new tools will follow the established architecture pattern:
- Use the WebApi connection directly (no custom clients)
- Follow the modular structure with schema.ts, feature.ts, and index.ts files
- Proper error handling for resource not found cases

### Directory Structure
```
src/features/
├── boards/           # Existing board management features
├── teams/            # Existing team management features
├── work-items/       # New work item management features
│   ├── get-work-item-hierarchy/
│   │   ├── schema.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   ├── create-epic/
│   │   ├── schema.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   └── ...
├── portfolios/       # New portfolio management features
│   ├── list-portfolios/
│   │   ├── schema.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   └── ...
├── roadmaps/         # New roadmap and planning features
│   ├── get-roadmap-view/
│   │   ├── schema.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   └── ...
├── metrics/          # New metrics and reporting features
│   ├── get-portfolio-progress/
│   │   ├── schema.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   └── ...
└── iterations/       # New iteration management features
    ├── list-iterations/
    │   ├── schema.ts
    │   ├── feature.ts
    │   └── index.ts
    └── ...
```

### Data Structures

New types will need to be defined for:

- **Epic**: Top-level work item representing major initiatives
  - ID, Name, Description, Start Date, Target Date, Status, Business Value, etc.

- **Feature**: Mid-level work item representing specific capabilities
  - ID, Name, Description, Start Date, Target Date, Status, Priority, etc.

- **User Story**: Detailed work item representing user-facing functionality
  - ID, Name, Description, Acceptance Criteria, Story Points, Status, etc.

- **Iteration**: Time-boxed period for planning and delivery
  - ID, Name, Start Date, End Date, Capacity, etc.

- **Team**: Group responsible for delivering work items
  - ID, Name, Members, Capacity, etc.

- **Portfolio**: Collection of related work items at a strategic level
  - ID, Name, Description, etc.

- **Relationship Structures**:
  - Parent-Child: Hierarchical relationships between work items
  - Dependency: Work items that block or are blocked by others
  - Assignment: Relationship between work items and teams/individuals
  - Timeline: Placement of work items on a temporal scale

### API Integration
We'll need to use the following Azure DevOps API endpoints:
- Work Item Tracking API for work item operations
- Work API for iterations and team settings
- Analytics API for metrics and reporting

## Testing Strategy
- Unit tests for each feature
- Integration tests for API interactions
- End-to-end tests for complete workflows

## Rollout Plan
1. Remove deprecated board tools
2. Implement Phase 1 tools
3. Implement Phase 2 tools
4. Implement Phase 3 tools
5. Implement Phase 4 tools
6. Implement Phase 5 tools

## Project Management Integration
The project management tools will integrate with the sprint management tools to provide a comprehensive solution for managing product development:

- **Work Breakdown Structure**: Area paths will help organize work items hierarchically
- **Cross-Sprint Dependencies**: Track dependencies between work items across different sprints
- **Portfolio Management**: Support for epics and features that span multiple sprints
- **Reporting & Dashboards**: Provide data for executive dashboards and reporting
- **Query-Based Tracking**: Enable custom work item queries for specialized tracking needs

These tools will follow the same architectural patterns as the sprint management tools but will focus on longer-term planning and cross-team coordination.

## Known Bugs

| Bug | Description | Status | Priority |
|-----|-------------|--------|----------|
| `list_iterations_timeframe_filtering` | The `list_iterations` tool doesn't properly filter iterations by 'past' and 'future' timeframes. Only 'current' and 'all' timeframes work correctly. According to the Azure DevOps API documentation, only 'Current' is directly supported by the API, but our manual filtering for 'past' and 'future' is not working as expected. | Open | Medium |

## Open Questions
- Do we need to support custom fields for work items?
- Should we implement batch operations for work items?
- How should we handle authentication for the Analytics API?