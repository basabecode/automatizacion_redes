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
  contentType?: string
  imageUrl?: string
  videoUrl?: string
  mediaUrls?: string[]
}): Promise<PublishResult> {
  try {
    const { accessToken, pageId, message, contentType, imageUrl, videoUrl, mediaUrls } = params
    const base = `https://graph.facebook.com/v21.0/${pageId}`

    // VIDEO
    if (contentType === 'VIDEO' && videoUrl) {
      const res = await fetch(`${base}/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_url: videoUrl, description: message, access_token: accessToken }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return { success: true, postId: data.id, postUrl: `https://facebook.com/${data.id}` }
    }

    // STORY
    if (contentType === 'STORY' && imageUrl) {
      const res = await fetch(`${base}/photo_stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, access_token: accessToken }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return { success: true, postId: data.id }
    }

    // CAROUSEL (álbum multi-foto)
    if (contentType === 'CAROUSEL' && mediaUrls && mediaUrls.length > 1) {
      const photoIds: string[] = []
      for (const url of mediaUrls) {
        const photoRes = await fetch(`${base}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, published: false, access_token: accessToken }),
        })
        const photo = await photoRes.json()
        if (photo.error) throw new Error(photo.error.message)
        photoIds.push(photo.id)
      }
      const feedRes = await fetch(`${base}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          attached_media: photoIds.map(id => ({ media_fbid: id })),
          access_token: accessToken,
        }),
      })
      const feed = await feedRes.json()
      if (feed.error) throw new Error(feed.error.message)
      return { success: true, postId: feed.id, postUrl: `https://facebook.com/${feed.id}` }
    }

    // IMAGE
    if (imageUrl) {
      const res = await fetch(`${base}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, caption: message, access_token: accessToken }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return { success: true, postId: data.id, postUrl: `https://facebook.com/${data.id}` }
    }

    // Solo texto
    const res = await fetch(`${base}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: accessToken }),
    })
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
  contentType?: string
  imageUrl?: string
  mediaUrls?: string[]
  videoUrl?: string
}): Promise<PublishResult> {
  try {
    const { accessToken, igAccountId, caption, contentType, imageUrl, mediaUrls, videoUrl } = params
    const base = `https://graph.facebook.com/v21.0/${igAccountId}`

    let creationId: string

    if (mediaUrls && mediaUrls.length > 1) {
      // CAROUSEL: crear container por cada slide
      const childIds: string[] = []
      for (const url of mediaUrls) {
        const itemRes = await fetch(`${base}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: accessToken }),
        })
        const item = await itemRes.json()
        if (item.error) throw new Error(item.error.message)
        childIds.push(item.id)
      }
      const carouselRes = await fetch(`${base}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_type: 'CAROUSEL', children: childIds.join(','), caption, access_token: accessToken }),
      })
      const carousel = await carouselRes.json()
      if (carousel.error) throw new Error(carousel.error.message)
      creationId = carousel.id

    } else if (contentType === 'STORY') {
      // STORY
      const mediaBody: Record<string, string> = { media_type: 'STORIES', access_token: accessToken }
      if (videoUrl) {
        mediaBody.video_url = videoUrl
      } else if (imageUrl) {
        mediaBody.image_url = imageUrl
      } else {
        throw new Error('Se requiere imageUrl o videoUrl para Instagram Story')
      }
      const containerRes = await fetch(`${base}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaBody),
      })
      const container = await containerRes.json()
      if (container.error) throw new Error(container.error.message)
      creationId = container.id

    } else {
      // IMAGE o VIDEO (REELS)
      const mediaBody: Record<string, string> = { caption, access_token: accessToken }
      if (videoUrl) {
        mediaBody.media_type = 'REELS'
        mediaBody.video_url = videoUrl
      } else if (imageUrl) {
        mediaBody.image_url = imageUrl
      } else {
        throw new Error('Se requiere imageUrl, videoUrl o mediaUrls para Instagram')
      }
      const containerRes = await fetch(`${base}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaBody),
      })
      const container = await containerRes.json()
      if (container.error) throw new Error(container.error.message)
      creationId = container.id
    }

    // Publicar container
    const publishRes = await fetch(`${base}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creationId, access_token: accessToken }),
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
