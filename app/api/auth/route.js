import { supabase } from '../../../src/shared/clients/supabase'

export async function POST(request) {
  try {
    const { email, password, action } = await request.json()
    if (!email || !password || !['login', 'signup'].includes(action)) {
      return Response.json({ data: null, error: 'Invalid payload' }, { status: 400 })
    }
    const result =
      action === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    if (result.error) return Response.json({ data: null, error: result.error.message }, { status: 400 })
    return Response.json({ data: { user: result.data.user, session: result.data.session }, error: null })
  } catch {
    return Response.json({ data: null, error: 'Invalid request' }, { status: 400 })
  }
}
