export interface PublishResult {
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
}

// ─── FACEBOOK ───────────────────────────────────────────────
export async function publishToFacebook(params: {
  accessToken: string
  pageId: string
  message: string
  imageUrl?: string
}): Promise<PublishResult> {
  try {
    const { accessToken, pageId, message, imageUrl } = params

    if (imageUrl) {
      // Post con imagen
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imageUrl,
            caption: message,
            access_token: accessToken,
          }),
        }
      )
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return {
        success: true,
        postId: data.id,
        postUrl: `https://facebook.com/${data.id}`,
      }
    }

    // Post solo texto
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: accessToken }),
      }
    )
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return { success: true, postId: data.id }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ─── INSTAGRAM ──────────────────────────────────────────────
export async function publishToInstagram(params: {
  accessToken: string
  igAccountId: string
  caption: string
  imageUrl?: string
  videoUrl?: string
}): Promise<PublishResult> {
  try {
    const { accessToken, igAccountId, caption, imageUrl, videoUrl } = params
    const base = `https://graph.facebook.com/v21.0/${igAccountId}`

    // Paso 1: crear container
    const mediaBody: Record<string, string> = { caption, access_token: accessToken }
    if (videoUrl) {
      mediaBody.media_type = 'REELS'
      mediaBody.video_url = videoUrl
    } else if (imageUrl) {
      mediaBody.image_url = imageUrl
    } else {
      throw new Error('Se requiere imageUrl o videoUrl para Instagram')
    }

    const containerRes = await fetch(`${base}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mediaBody),
    })
    const container = await containerRes.json()
    if (container.error) throw new Error(container.error.message)

    // Paso 2: publicar container
    const publishRes = await fetch(`${base}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: accessToken,
      }),
    })
    const published = await publishRes.json()
    if (published.error) throw new Error(published.error.message)

    return {
      success: true,
      postId: published.id,
      postUrl: `https://instagram.com/p/${published.id}`,
    }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ─── TIKTOK ─────────────────────────────────────────────────
export async function publishToTikTok(params: {
  accessToken: string
  videoUrl: string
  title: string
  description: string
}): Promise<PublishResult> {
  try {
    const { accessToken, videoUrl, title, description } = params

    const res = await fetch(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({
          post_info: {
            title: `${title} ${description}`.slice(0, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: videoUrl,
          },
        }),
      }
    )
    const data = await res.json()
    if (data.error?.code !== 'ok') {
      throw new Error(data.error?.message || 'Error TikTok API')
    }

    return { success: true, postId: data.data?.publish_id }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
