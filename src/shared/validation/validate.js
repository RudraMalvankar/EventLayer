/**
 * Validates data against a Zod schema.
 * Returns { data, error } — data is the parsed result on success,
 * error is a 400 Response on failure.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { data: result.data, error: null };
  }
  const issues = result.error.issues.map((i) => {
    const path = i.path.join(".");
    return path ? `${path}: ${i.message}` : i.message;
  });
  return {
    data: null,
    error: Response.json(
      { data: null, error: "Invalid input", issues },
      { status: 400 },
    ),
  };
}

/**
 * Validates searchParams from a request URL against a schema.
 */
export function validateSearchParams(schema, request) {
  const { searchParams } = new URL(request.url);
  const raw = Object.fromEntries(searchParams.entries());
  return validate(schema, raw);
}

/**
 * Validates a JSON request body against a schema.
 */
export async function validateBody(schema, request) {
  try {
    const body = await request.json();
    return validate(schema, body);
  } catch {
    return {
      data: null,
      error: Response.json(
        { data: null, error: "Invalid JSON body" },
        { status: 400 },
      ),
    };
  }
}

/**
 * Validates route params against a schema.
 */
export function validateParams(schema, params) {
  return validate(schema, params);
}