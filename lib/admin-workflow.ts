export type WorkflowPostStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'READY'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'

export type WorkflowCalendarStatus =
  | 'PENDING'
  | 'GENERATING'
  | 'READY'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'NEEDS_EDIT'

export interface WorkflowPostLike {
  status: WorkflowPostStatus
}

export interface EntryPublishSummary {
  totalPosts: number
  publishedPosts: number
  readyPosts: number
  failedPosts: number
  publishingPosts: number
  isFullyPublished: boolean
}

export function summarizeEntryPosts(posts: WorkflowPostLike[]): EntryPublishSummary {
  const summary = posts.reduce<EntryPublishSummary>((acc, post) => {
    acc.totalPosts += 1
    if (post.status === 'PUBLISHED') acc.publishedPosts += 1
    if (post.status === 'READY') acc.readyPosts += 1
    if (post.status === 'FAILED') acc.failedPosts += 1
    if (post.status === 'PUBLISHING') acc.publishingPosts += 1
    return acc
  }, {
    totalPosts: 0,
    publishedPosts: 0,
    readyPosts: 0,
    failedPosts: 0,
    publishingPosts: 0,
    isFullyPublished: false,
  })

  summary.isFullyPublished = summary.totalPosts > 0 && summary.publishedPosts === summary.totalPosts
  return summary
}

export function deriveCalendarStatus(
  currentStatus: WorkflowCalendarStatus,
  posts: WorkflowPostLike[],
): WorkflowCalendarStatus {
  const summary = summarizeEntryPosts(posts)

  if (currentStatus === 'GENERATING') return 'GENERATING'
  if (summary.totalPosts === 0) return 'PENDING'
  if (summary.failedPosts > 0) return 'NEEDS_EDIT'
  if (summary.isFullyPublished) return 'PUBLISHED'
  if (currentStatus === 'APPROVED') return 'APPROVED'
  if (currentStatus === 'NEEDS_EDIT') return 'NEEDS_EDIT'
  return 'READY'
}

export function canRegenerateEntry(
  currentStatus: WorkflowCalendarStatus,
  posts: WorkflowPostLike[],
) {
  const summary = summarizeEntryPosts(posts)
  if (currentStatus === 'GENERATING') return false
  if (summary.publishingPosts > 0) return false
  if (summary.publishedPosts > 0) return false
  return true
}
