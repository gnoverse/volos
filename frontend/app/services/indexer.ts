import axios from "axios"

// start tx indexer for gnodev on port 3100:
// /build/tx-indexer start --remote http://localhost:26657 --db-path indexer-db --listen-address localhost:3100

// const txIndexerUrl = "https://indexer.test6.testnets.gno.land"
const txIndexerUrl = "http://localhost:3100"

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
export async function getBorrowEvents(): Promise<unknown> {
  const query = `
    query getBorrowEvents {
      getTransactions(
        where: {
          block_height: { gt: 100000 }
          success: { eq: true }
          response: {
            events: {
              GnoEvent: {
                type: { eq: "Borrow" }
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
  const operationName = "getBorrowEvents"
  return queryIndexer(query, operationName)
}