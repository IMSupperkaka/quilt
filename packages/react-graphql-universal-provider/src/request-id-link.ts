import {setContext} from 'apollo-link-context';
import {Header} from '@shopify/network';

export function createRequestIdLink(requestId: string) {
  return setContext((_, {headers}) => ({
    headers: {
      ...headers,
      [Header.RequestId]: requestId,
    },
  }));
}
