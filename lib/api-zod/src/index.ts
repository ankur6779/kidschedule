export * from "./generated/api";
// Re-export only the types that are NOT already provided as Zod schemas in
// ./generated/api (those collide on name). The Zod schemas in ./generated/api
// can be inferred via `z.infer<typeof X>` when a TS type is needed.
export type {
  BehaviorLog,
  BehaviorStat,
  Child,
  DashboardSummary,
  GeneratedRoutine,
  HealthStatus,
  ListBehaviorsParams,
  ListRoutinesParams,
  Routine,
  RoutineItem,
} from "./generated/types";
