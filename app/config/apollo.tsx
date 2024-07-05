// import { ApolloClient, InMemoryCache, gql, HttpLink } from "@apollo/client";

// import { registerApolloClient } from "@apollo/experimental-nextjs-app-support";


// // export const client = new ApolloClient({
// //   uri: "https://api.studio.thegraph.com/query/65978/sesmaphore-paymaster/0.0.1",
// //   cache: new InMemoryCache(),
// // });



// export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
//   return new ApolloClient({
//     cache: new InMemoryCache(),
//     link: new HttpLink({
//       // this needs to be an absolute url, as relative urls cannot be used in SSR
//       uri: "https://api.studio.thegraph.com/query/65978/sesmaphore-paymaster/0.0.1",
//       // you can disable result caching here if you want to
//       // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
//       // fetchOptions: { cache: "no-store" },
//     }),
//   });
// });

import { gql } from "@apollo/client";


export const GET_GROUP_DATA = gql`
  query GroupQuery {
    group(id: 0) {
      merkleTree {
        depth
        id
        root
        size
      }
      validatedProofs {
        id
        merkleTreeDepth
        merkleTreeRoot
        message
        nullifier
        points
        scope
      }
    }
  }
`;