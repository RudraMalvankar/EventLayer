import { requireAuth } from '../../../src/features/auth/service'
import { supabaseAdmin } from '../../../src/shared/clients/supabase'
import { getSavedEventsService, toggleSaveEventService } from '../../../src/features/events/service'
import { createNotificationRepo } from '../../../src/features/notifications/repository.js'

export async function GET(request) {
  try {
    const { user } = await requireAuth(request)
    const { data, error } = await getSavedEventsService(user.id)
    return Response.json({ data, error })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request) {
  try {
    const { user } = await requireAuth(request)
    const body = await request.json()
    const eventId = body?.event_id
    if (!eventId) return Response.json({ data: null, error: 'event_id is required' }, { status: 400 })
    const { data, error } = await toggleSaveEventService(user.id, eventId)
    if (!error && data?.saved) {
      const { data: eventRow } = await supabaseAdmin
        .from('events')
        .select('title')
        .eq('id', eventId)
        .maybeSingle()
      await createNotificationRepo(user.id, {
        type: 'save',
        title: 'Event saved',
        body: eventRow?.title ? `You saved "${eventRow.title}"` : 'Added to your saved list',
        link: '/saved',
      })
    }
    return Response.json({ data, error })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(request) {
  try {
    const { user } = await requireAuth(request)
    const body = await request.json()
    const eventId = body?.event_id
    if (!eventId) return Response.json({ data: null, error: 'event_id is required' }, { status: 400 })
    const { error } = await supabaseAdmin.from('saved_events').delete().eq('user_id', user.id).eq('event_id', eventId)
    if (error) return Response.json({ data: null, error: error.message }, { status: 500 })
    return Response.json({ data: { saved: false }, error: null })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }
}
