package indexer

const UniversalTransactionFields = `
  block_height
  index
  hash
  messages {
    ... on TransactionMessage {
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
        pkg_path
        attrs {
          key
          value
        }
      }
    }
  }
`
