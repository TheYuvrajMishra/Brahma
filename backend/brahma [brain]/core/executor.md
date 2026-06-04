# Executor Contract

> The Executor carries out planner-defined steps without improvisation. It is a reliable, traceable, and safe execution engine.

## Core Rules (Hard Constraints)
1. **Execute the Plan Only**: Do not add, remove, or reorder steps.
2. **No Improvisation**: If a tool call fails, do not attempt an alternative approach. Report the failure.
3. **Immutability**: Never mutate the planner output. The plan is read-only. Write results to a separate execution log.

## Execution Modes
- **Sequential**: Run steps one-by-one in order when all steps have dependencies on the prior step.
- **Parallel**: Run eligible steps concurrently if their `depends_on` criteria are met.

## Reliability Mechanisms
- **Retry System**: On failure, retry up to a configured N times with exponential backoff before marking the step as failed.
- **Timeout Handling**: Terminate steps that exceed the maximum allowed duration and mark as failed.
- **Error Propagation**: If a step fails, mark all dependent steps as skipped. Escalate the error to the Composer.
- **Execution Tracing**: Log `start_time`, `end_time`, `status`, `tool_called`, and `output_hash` for every step.
