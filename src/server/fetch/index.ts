import { logError } from '#/server/utils/logger';
import tanstack from '@tanstack/react-start/server-entry';
import { env } from 'cloudflare:workers';
import { z } from 'zod';

export const FETCH_ERROR = 'Error Processing Fetch';

const handler: ExportedHandler<Env>['fetch'] = async (request) => {
  try {
    const response = await tanstack.fetch(request);
    const headers = new Headers(response.headers);
    headers.delete('X-Frame-Options');
    headers.set('Content-Security-Policy', z.string().parse(env.DISCORD_FRAME_ANCESTORS));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    logError(FETCH_ERROR, { error, request });
    return new Response(FETCH_ERROR, { status: 500 });
  }
};

export default handler;
