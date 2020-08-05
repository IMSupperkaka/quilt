import React from 'react';
import ApolloClient, {ApolloClientOptions} from 'apollo-client';
import {ApolloLink} from 'apollo-link';
import {useSerialized} from '@shopify/react-html';
import {ApolloProvider, createSsrExtractableLink} from '@shopify/react-graphql';
import {useLazyRef} from '@shopify/react-hooks';
import {InMemoryCache, NormalizedCacheObject} from 'apollo-cache-inmemory';
import {useRequestHeader} from '@shopify/react-network';
import {Header} from '@shopify/network';

import {csrfLink} from './csrf-link';
import {createRequestIdLink} from './request-id-link';

interface Props<TCacheShape extends NormalizedCacheObject> {
  children?: React.ReactNode;
  server?: boolean;
  createClientOptions(): Partial<ApolloClientOptions<TCacheShape>>;
}

export function GraphQLUniversalProvider<
  TCacheShape extends NormalizedCacheObject
>({children, server, createClientOptions}: Props<TCacheShape>) {
  const [initialData, Serialize] = useSerialized<TCacheShape | undefined>(
    'apollo',
  );

  const requestId = useRequestHeader(Header.RequestId);

  const [client, ssrLink] = useLazyRef<
    [
      import('apollo-client').ApolloClient<any>,
      ReturnType<typeof createSsrExtractableLink>,
    ]
  >(() => {
    const defaultClientOptions: Partial<ApolloClientOptions<TCacheShape>> = {
      ssrMode: server,
      ssrForceFetchDelay: 100,
      connectToDevTools: !server,
    };

    const clientOptions = createClientOptions();
    const ssrLink = createSsrExtractableLink();

    // only pass request id if the GraphQL request is part of server side render
    const requestIdLink =
      requestId && server ? createRequestIdLink(requestId) : undefined;
    const finalLink = clientOptions.link ? clientOptions.link : undefined;

    const link = ApolloLink.from([
      ssrLink,
      csrfLink,
      ...(requestIdLink ? [requestIdLink] : []),
      ...(finalLink ? [finalLink] : []),
    ]);

    const cache = clientOptions.cache
      ? clientOptions.cache
      : new InMemoryCache();

    const apolloClient = new ApolloClient({
      ...defaultClientOptions,
      ...clientOptions,
      link,
      cache: initialData ? cache.restore(initialData) : cache,
    });

    return [apolloClient, ssrLink];
  }).current;

  return (
    <>
      <ApolloProvider client={client}>{children}</ApolloProvider>
      <Serialize data={() => ssrLink.resolveAll(() => client.extract())} />
    </>
  );
}
