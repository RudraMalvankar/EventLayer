import { requireAuth } from '../../../src/features/auth/service'
import { supabaseAdmin } from '../../../src/shared/clients/supabase'
import { getSavedEventsService, toggleSaveEventService } from '../../../src/features/events/service'
import { createNotificationRepo } from '../../../src/features/notifications/repository.js'
import { privateNoStoreHeaders } from '../../../src/shared/cache/headers.js'
import { savedPostBodySchema, savedDeleteBodySchema } from '../../../src/shared/validation/schemas.js'
import { validateBody } from '../../../src/shared/validation/validate.js'

export async function GET(request) {
  try {
    const { user } = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (eventId) {
      const { data, error } = await supabaseAdmin
        .from('saved_events')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle()
      if (error) {
        return Response.json({ data: null, error: error.message }, { status: 500, headers: privateNoStoreHeaders() })
      }
      return Response.json(
        { data: { saved: Boolean(data?.id), event_id: eventId }, error: null },
        { headers: privateNoStoreHeaders() },
      )
    }

    const { data, error } = await getSavedEventsService(user.id)
    const events = Array.isArray(data) ? data : data?.events || []
    return Response.json(
      { data: { events }, error },
      { headers: privateNoStoreHeaders() },
    )
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401, headers: privateNoStoreHeaders() })
  }
}

export async function POST(request) {
  try {
    const { user } = await requireAuth(request)
    const { data: parsed, error: validationError } = await validateBody(savedPostBodySchema, request)
    if (validationError) return validationError
    const eventId = parsed.event_id
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
    const { data: parsed, error: validationError } = await validateBody(savedDeleteBodySchema, request)
    if (validationError) return validationError
    const eventId = parsed.event_id
    const { error } = await supabaseAdmin.from('saved_events').delete().eq('user_id', user.id).eq('event_id', eventId)
    if (error) return Response.json({ data: null, error: error.message }, { status: 500 })
    return Response.json({ data: { saved: false }, error: null })
  } catch (e) {
    if (e instanceof Response) return e
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }
}
