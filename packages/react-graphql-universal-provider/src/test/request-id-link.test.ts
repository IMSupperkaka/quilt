import gql from 'graphql-tag';
import {ApolloLink, execute, Observable} from 'apollo-link';
import {Header} from '@shopify/network';

import {createRequestIdLink} from '../request-id-link';

const query = gql`
  query Test {
    foo {
      bar
    }
  }
`;

const data = {
  foo: {bar: true},
};

describe('createRequestIdLink()', () => {
  it('calls the next link with a formatted GraphQL error response when the response has an error status', () => {
    const requestId = 'request id 123';
    const requestIdLink = createRequestIdLink(requestId);

    const mockLink = new ApolloLink(operation => {
      expect(operation.getContext().headers[Header.RequestId]).toBe(requestId);
      return Observable.of({data});
    });

    const link = requestIdLink.concat(mockLink);

    execute(link, {query}).subscribe(result => {
      expect(result.data).toBe(data);
    });
  });
});
