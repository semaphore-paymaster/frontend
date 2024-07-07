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