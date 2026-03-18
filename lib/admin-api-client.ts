export interface PublishPostResult {
  ok: boolean
  data: {
    success?: boolean
    error?: string
    [key: string]: unknown
  }
}

export async function publishPostById(postId: string): Promise<PublishPostResult> {
  const res = await fetch('/api/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId }),
  })

  const data = await res.json()
  return {
    ok: res.ok && Boolean(data.success),
    data,
  }
}
