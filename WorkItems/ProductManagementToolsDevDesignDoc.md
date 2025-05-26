# Product Management Tools Development Design Document

## 1. Introduction

This document outlines the technical design for implementing the product management tools in Azure DevOps as specified in the requirements specification. The design follows the established architecture patterns in the codebase, particularly the approach used in the board management refactoring, which uses the WebApi connection directly instead of creating custom clients.

## 2. Architecture Overview

### 2.1 Design Principles

- **Modularity**: Each tool will be implemented as a separate module with its own schema, feature, and index files
- **Direct API Integration**: Use the WebApi connection directly instead of creating custom clients
- **Consistency**: Follow the patterns established in the board management refactoring
- **Error Handling**: Implement proper error handling for resource not found cases
- **Performance**: Optimize for performance with caching and batch processing where appropriate

### 2.2 High-Level Architecture

The product management tools will integrate with multiple Azure DevOps REST APIs:

- **Work Item Tracking API**: For managing epics, features, and user stories
- **Work API**: For managing iterations, team settings, and process configurations
- **Backlogs API**: For managing portfolio backlogs
- **Analytics API**: For metrics and reporting data

### 2.3 Directory Structure

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
└── metrics/          # New metrics and reporting features
    ├── get-portfolio-progress/
    │   ├── schema.ts
    │   ├── feature.ts
    │   └── index.ts
    └── ...
```

## 3. API Integration

### 3.1 Azure DevOps REST APIs

#### 3.1.1 Work Item Tracking API

The Work Item Tracking API will be used for managing work items such as epics, features, and user stories. Key endpoints include:

- `GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}`: Get a specific work item
- `POST https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/${type}`: Create a work item
- `PATCH https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}`: Update a work item
- `POST https://dev.azure.com/{organization}/{project}/_apis/wit/wiql`: Query work items using WIQL

Example WIQL query for retrieving work item hierarchy:

```sql
SELECT [System.Id], [System.Title], [System.State]
FROM WorkItemLinks
WHERE [Source].[System.TeamProject] = @project
AND [Source].[System.WorkItemType] = 'Epic'
AND [Target].[System.WorkItemType] = 'Feature'
AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
MODE (Recursive)
```

#### 3.1.2 Work API

The Work API will be used for managing iterations, team settings, and process configurations. Key endpoints include:

- `GET https://dev.azure.com/{organization}/{project}/_apis/work/teamsettings/iterations`: Get team iterations
- `GET https://dev.azure.com/{organization}/{project}/_apis/work/teamsettings/iterations/{iterationId}`: Get a specific iteration
- `GET https://dev.azure.com/{organization}/{project}/_apis/work/teamsettings/iterations/{iterationId}/workitems`: Get work items for an iteration

#### 3.1.3 Backlogs API

The Backlogs API will be used for managing portfolio backlogs. Key endpoints include:

- `GET https://dev.azure.com/{organization}/{project}/_apis/work/backlogs`: Get all backlog levels
- `GET https://dev.azure.com/{organization}/{project}/_apis/work/backlogs/{backlogId}`: Get a specific backlog
- `GET https://dev.azure.com/{organization}/{project}/_apis/work/backlogs/{backlogId}/workItems`: Get work items for a backlog

#### 3.1.4 Analytics API

The Analytics API will be used for metrics and reporting data. Key endpoints include:

- `GET https://analytics.dev.azure.com/{organization}/{project}/_odata/v3.0-preview/WorkItems`: Query work items with OData
- `GET https://analytics.dev.azure.com/{organization}/{project}/_odata/v3.0-preview/WorkItemSnapshot`: Query work item history for burndown/burnup charts
- `GET https://analytics.dev.azure.com/{organization}/{project}/_odata/v3.0-preview/Iterations`: Query iterations for velocity metrics

### 3.2 Authentication and Error Handling

- **Authentication**: We'll use the existing WebApi connection that's passed to the request handler
- **Error Handling**: We'll implement proper error handling for API errors and resource not found cases
- **Rate Limiting**: We'll handle API throttling with retry logic and exponential backoff
- **Caching**: We'll implement caching for frequently accessed data to improve performance

## 4. Data Models and Schemas

### 4.1 Core Data Models

#### 4.1.1 Epic Schema

```typescript
export const epicSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  state: z.string(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  businessValue: z.number().optional(),
  valueArea: z.enum(['Business', 'Architectural']).optional(),
  tags: z.string().optional(),
  url: z.string().url(),
});

export type Epic = z.infer<typeof epicSchema>;
```

#### 4.1.2 Feature Schema

```typescript
export const featureSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  state: z.string(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  effort: z.number().optional(),
  valueArea: z.enum(['Business', 'Architectural']).optional(),
  tags: z.string().optional(),
  url: z.string().url(),
});

export type Feature = z.infer<typeof featureSchema>;
```

#### 4.1.3 User Story Schema

```typescript
export const userStorySchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().optional(),
  acceptanceCriteria: z.string().optional(),
  state: z.string(),
  storyPoints: z.number().optional(),
  valueArea: z.enum(['Business', 'Architectural']).optional(),
  iterationPath: z.string().optional(),
  tags: z.string().optional(),
  url: z.string().url(),
});

export type UserStory = z.infer<typeof userStorySchema>;
```

#### 4.1.4 Iteration Schema

```typescript
export const iterationSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string().optional(),
  finishDate: z.string().optional(),
  timeFrame: z.enum(['past', 'current', 'future']).optional(),
  url: z.string().url(),
});

export type Iteration = z.infer<typeof iterationSchema>;
```

#### 4.1.5 Portfolio Schema

```typescript
export const portfolioSchema = z.object({
  id: z.string(),
  name: z.string(),
  rank: z.number(),
  workItemTypes: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
  })),
  url: z.string().url(),
});

export type Portfolio = z.infer<typeof portfolioSchema>;
```

### 4.2 Request Parameter Schemas

For each tool, we'll define request parameter schemas using Zod. For example:

```typescript
export const getWorkItemHierarchyParamsSchema = z.object({
  organization: z.string().describe(`The ID or name of the organization (Default: ${defaultOrg})`),
  project: z.string().describe(`The ID or name of the project (Default: ${defaultProject})`),
  workItemId: z.number().describe('The ID of the root work item'),
  hierarchyType: z.enum(['children', 'parents', 'both']).default('children')
    .describe('The type of hierarchy to retrieve'),
  depth: z.number().min(1).max(10).default(1)
    .describe('The depth of the hierarchy to retrieve'),
});

export type GetWorkItemHierarchyParams = z.infer<typeof getWorkItemHierarchyParamsSchema>;
```

### 4.3 Response Schemas

For each tool, we'll define response schemas using Zod. For example:

```typescript
export const workItemHierarchyResponseSchema = z.object({
  workItem: epicSchema.or(featureSchema).or(userStorySchema),
  children: z.array(z.lazy(() => workItemHierarchyResponseSchema)).optional(),
  parents: z.array(z.lazy(() => workItemHierarchyResponseSchema)).optional(),
});

export type WorkItemHierarchyResponse = z.infer<typeof workItemHierarchyResponseSchema>;
```

## 5. Tool Implementation Details

### 5.1 Work Item Hierarchy Management Tools

#### 5.1.1 get_work_item_hierarchy

**Purpose**: Retrieve work items with their parent-child relationships

**Implementation**:
- Use WIQL to query for work items and their relationships
- Support different hierarchy types (children, parents, both)
- Support configurable depth for the hierarchy
- Return a hierarchical structure of work items

**API Endpoints**:
- `POST https://dev.azure.com/{organization}/{project}/_apis/wit/wiql`: Query work items using WIQL
- `GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{ids}`: Get work items by IDs

#### 5.1.2 create_epic, update_epic

**Purpose**: Create and update epics at the portfolio level

**Implementation**:
- Use the Work Item Tracking API to create and update epics
- Handle the specific fields required for epics
- Validate input parameters using the epicSchema

**API Endpoints**:
- `POST https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/$Epic`: Create an epic
- `PATCH https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}`: Update an epic

#### 5.1.3 create_feature, update_feature

**Purpose**: Create and update features at the program level

**Implementation**:
- Use the Work Item Tracking API to create and update features
- Handle the specific fields required for features
- Validate input parameters using the featureSchema

**API Endpoints**:
- `POST https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/$Feature`: Create a feature
- `PATCH https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}`: Update a feature

#### 5.1.4 link_work_items

**Purpose**: Create relationships between work items

**Implementation**:
- Use the Work Item Tracking API to create relationships between work items
- Support different relationship types (parent-child, dependency)
- Validate input parameters using a custom schema

**API Endpoints**:
- `PATCH https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}`: Update a work item to add a link

### 5.2 Portfolio Management Tools

#### 5.2.1 list_portfolios

**Purpose**: List all portfolio backlogs

**Implementation**:
- Use the Backlogs API to retrieve all portfolio backlogs
- Filter by portfolio type if specified
- Validate input parameters using a custom schema

**API Endpoints**:
- `GET https://dev.azure.com/{organization}/{project}/_apis/work/backlogs`: Get all backlog levels

#### 5.2.2 get_portfolio_items

**Purpose**: Get items in a specific portfolio

**Implementation**:
- Use the Backlogs API to retrieve items in a specific portfolio
- Support filtering by various criteria
- Validate input parameters using a custom schema

**API Endpoints**:
- `GET https://dev.azure.com/{organization}/{project}/_apis/work/backlogs/{backlogId}/workItems`: Get work items for a backlog

### 5.3 Roadmap and Planning Tools

#### 5.3.1 get_roadmap_view

**Purpose**: Get a timeline view of features and epics

**Implementation**:
- Use the Work Item Tracking API to retrieve epics and features with their timeline information
- Query for work items with specific fields like start date and target date
- Organize the results in a timeline view
- Validate input parameters using a custom schema

**API Endpoints**:
- `POST https://dev.azure.com/{organization}/{project}/_apis/wit/wiql`: Query work items using WIQL
- `GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{ids}`: Get work items by IDs

#### 5.3.2 get_program_increment

**Purpose**: Get details about a program increment

**Implementation**:
- Use the Iterations API to retrieve details about a program increment
- Get work items associated with the program increment
- Calculate progress metrics for the program increment
- Validate input parameters using a custom schema

**API Endpoints**:
- `GET https://dev.azure.com/{organization}/{project}/_apis/work/teamsettings/iterations/{iterationId}`: Get a specific iteration
- `GET https://dev.azure.com/{organization}/{project}/_apis/work/teamsettings/iterations/{iterationId}/workitems`: Get work items for an iteration

### 5.4 Metrics and Reporting Tools

#### 5.4.1 get_portfolio_progress

**Purpose**: Track progress across a portfolio

**Implementation**:
- Use the Analytics API to track progress across a portfolio
- Calculate burndown/burnup data for the portfolio
- Support different time periods and granularity
- Validate input parameters using a custom schema

**API Endpoints**:
- `GET https://analytics.dev.azure.com/{organization}/{project}/_odata/v3.0-preview/WorkItems`: Query work items with OData
- `GET https://analytics.dev.azure.com/{organization}/{project}/_odata/v3.0-preview/WorkItemSnapshot`: Query work item history for burndown/burnup charts

#### 5.4.2 get_team_velocity

**Purpose**: Get velocity metrics for teams

**Implementation**:
- Use the Analytics API to retrieve velocity metrics for teams across iterations
- Calculate average velocity and trend
- Support different metrics (story points, work item count)
- Validate input parameters using a custom schema

**API Endpoints**:
- `GET https://analytics.dev.azure.com/{organization}/{project}/_odata/v3.0-preview/WorkItems`: Query work items with OData
- `GET https://analytics.dev.azure.com/{organization}/{project}/_odata/v3.0-preview/Iterations`: Query iterations for velocity metrics

## 6. Performance Considerations

### 6.1 Query Optimization

- Optimize WIQL queries to retrieve only the necessary data and fields
- Use field filtering to reduce the amount of data returned
- Use efficient query patterns to minimize the number of API calls

### 6.2 Batch Processing

- Use batch APIs where available to reduce the number of API calls
- Group related operations to minimize network overhead
- Implement parallel processing for independent operations

### 6.3 Caching

- Implement caching for frequently accessed data
- Use memory caching for short-lived data
- Implement cache invalidation strategies for data that changes frequently

### 6.4 Pagination

- Implement pagination for endpoints that return large amounts of data
- Use continuation tokens for efficient pagination
- Provide clear pagination controls in the API responses

## 7. Testing Approach

### 7.1 Unit Tests

- Write unit tests for each tool function
- Use mocks to simulate API responses
- Test error handling and edge cases
- Ensure high code coverage

### 7.2 Integration Tests

- Write integration tests to ensure the tools work correctly with the Azure DevOps APIs
- Test with real data in a test environment
- Verify that the tools handle API responses correctly

### 7.3 End-to-End Tests

- Write end-to-end tests to ensure the tools work correctly in the context of the full application
- Test common user scenarios
- Verify that the tools meet the requirements specification

## 8. Phased Implementation Plan

### 8.1 Phase 1: Core Work Item Management Tools

- get_work_item_hierarchy
- create_epic, update_epic
- create_feature, update_feature
- link_work_items

### 8.2 Phase 2: Portfolio Management Tools

- list_portfolios
- get_portfolio_items
- assign_to_team
- get_cross_team_view

### 8.3 Phase 3: Roadmap and Planning Tools

- get_roadmap_view
- get_program_increment
- forecast_delivery
- get_milestone_status

### 8.4 Phase 4: Metrics and Reporting Tools

- get_portfolio_progress
- get_feature_progress
- get_team_velocity
- get_dependency_status

### 8.5 Phase 5: SAFe Implementation Support

- Additional customizations for SAFe methodology
- Support for Agile Release Trains (ARTs)
- Support for Program Increments (PIs)
- Support for Value Streams

## 9. Conclusion

This development design document provides a comprehensive plan for implementing the product management tools outlined in the requirements specification. The design follows the established architecture patterns in the codebase, particularly the approach used in the board management refactoring, which uses the WebApi connection directly instead of creating custom clients.

The implementation will be phased, starting with core work item management tools and building up to more advanced capabilities. The tools will provide comprehensive product management capabilities, from strategic roadmapping to tactical execution, and will support enterprise-scale product management, including SAFe methodology.

The design ensures that the tools are robust, performant, and maintainable, with proper error handling, performance optimization, and comprehensive testing.
