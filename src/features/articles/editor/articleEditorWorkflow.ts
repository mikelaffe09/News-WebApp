import { ArticleStatus, WorkflowComment } from '../../../types';
import { STATUS_LABELS } from '../articleConstants';

export type WorkflowTransitionId = ArticleStatus | 'rejected';

export const WORKFLOW_STATUS_LABELS: Record<WorkflowTransitionId, string> = {
  ...STATUS_LABELS,
  rejected: 'Rejected',
};

export const WORKFLOW_ACTION_LABELS: Record<WorkflowTransitionId, string> = {
  draft: 'Save as draft',
  in_review: 'Submit for review',
  approved: 'Mark approved',
  scheduled: 'Schedule',
  published: 'Publish now',
  archived: 'Archive',
  retracted: 'Retract',
  rejected: 'Reject to draft',
};

export const WORKFLOW_ACTION_COLORS: Record<WorkflowTransitionId, string> = {
  draft: 'bg-slate-600 hover:bg-slate-700',
  in_review: 'bg-amber-600 hover:bg-amber-700',
  approved: 'bg-blue-600 hover:bg-blue-700',
  scheduled: 'bg-purple-600 hover:bg-purple-700',
  published: 'bg-green-700 hover:bg-green-800',
  archived: 'bg-slate-600 hover:bg-slate-700',
  retracted: 'bg-red-600 hover:bg-red-700',
  rejected: 'bg-red-600 hover:bg-red-700',
};

export const ALLOWED_WORKFLOW_TRANSITIONS: Record<ArticleStatus, WorkflowTransitionId[]> = {
  draft: ['in_review', 'published'],
  in_review: ['draft', 'approved', 'rejected'],
  approved: ['scheduled', 'published', 'draft'],
  scheduled: ['published', 'draft'],
  published: ['archived', 'draft'],
  archived: ['draft'],
  retracted: ['draft'],
};

export function getTargetStatus(transition: WorkflowTransitionId): ArticleStatus {
  return transition === 'rejected' ? 'draft' : transition;
}

export function getWorkflowAction(transition: WorkflowTransitionId): WorkflowComment['action'] {
  if (transition === 'in_review') return 'submitted';
  if (transition === 'published') return 'published';
  if (transition === 'scheduled') return 'scheduled';
  if (transition === 'approved') return 'approved';
  if (transition === 'archived') return 'archived';
  if (transition === 'rejected') return 'rejected';
  return 'commented';
}
