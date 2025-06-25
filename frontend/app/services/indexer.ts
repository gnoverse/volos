import axios from "axios"

const txIndexerUrl = "https://indexer.test6.testnets.gno.land"

export async function queryIndexer(
  query: string, 
  operationName: string, 
  variables?: Record<string, unknown>
): Promise<unknown> {
  try {
    const response = await axios.post(`${txIndexerUrl}/graphql/query`, {
      data: {
        query,
        operationName,
        variables
      }
    })

    return response.data
  } catch (error) {
    console.error('Indexer query failed:', error)
    throw error
  }
}

// example usage, at the end of these functions we should parse them into predefined types
export async function getPoolCreationFeeEvents(): Promise<unknown> {
  const query = `
    query getEvents {
      getTransactions(
        where: {
          block_height: { gt: 100000 }
          success: { eq: true }
          response: {
            events: {
              GnoEvent: {
                type: { eq: "GNOSWAP" }
                func: { eq: "SetPoolCreationFee" }
                attrs: {
                  _and: [
                    { key: { eq: "p_fee" } }
                    { _not: { value: { eq: "0" } } }
                  ]
                }
              }
            }
          }
        }
      ) {
        block_height
        index
        messages {
          ... on TransactionMessage {
            typeUrl
            route
            value {
              ... on MsgCall {
                caller
                send
                pkg_path
                func
                args
              }
            }
          }
        }
        response {
          events {
            ... on GnoEvent {
              type
              func
              attrs {
                key
                value
              }
            }
          }
        }
      }
    }
  `
  const operationName = "getEvents"
  return queryIndexer(query, operationName)
}