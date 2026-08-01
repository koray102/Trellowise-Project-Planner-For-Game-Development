import type { Project } from '../../shared/types';

/** Map DB row to frontend Project model */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProject(dbRow: any): Project {
  return {
    id: dbRow.id,
    name: dbRow.name,
    createdAt: dbRow.created_at,
  };
}

/** Map frontend Project model to DB insert payload */
export function toDbProjectInsert(project: Project) {
  return {
    id: project.id,
    name: project.name,
    created_at: project.createdAt,
  };
}
