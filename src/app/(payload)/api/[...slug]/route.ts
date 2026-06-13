/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

const originalGet = REST_GET(config)

export const GET = originalGet

export const HEAD = async (request: Request, context: any) => {
  const getRequest = new Request(request.url, {
    method: 'GET',
    headers: request.headers,
    cache: request.cache,
    credentials: request.credentials,
    mode: request.mode,
    redirect: request.redirect,
    referrer: request.referrer,
  })
  return originalGet(getRequest, context)
}
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
