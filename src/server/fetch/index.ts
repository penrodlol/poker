import { logError } from '#/server/utils/logger';
import tanstack from '@tanstack/react-start/server-entry';

export const FETCH_ERROR = 'Error Processing Fetch';

const handler: ExportedHandler<Env>['fetch'] = async (request) => {
  try {
    return tanstack.fetch(request);
  } catch (error) {
    logError(FETCH_ERROR, { error, request });
    return new Response(FETCH_ERROR, { status: 500 });
  }
};

export default handler;
