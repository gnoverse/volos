package indexer

const UniversalTransactionFields = `
  block_height
  index
  hash
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
`

const SupplyBorrowFields = `
  block_height
  messages {
    ... on TransactionMessage {
      value {
        ... on MsgCall {
          caller
        }
      }
    }
  }
  response {
    events {
      ... on GnoEvent {
        type
        attrs {
          key
          value
        }
      }
    }
  }
`

const MinimalTransactionFields = `
  block_height
  hash
  messages {
    ... on TransactionMessage {
      value {
        ... on MsgCall {
          caller
          func
        }
      }
    }
  }
  response {
    events {
      ... on GnoEvent {
        type
        attrs {
          key
          value
        }
      }
    }
  }
`

const MarketActivityFields = `
  block_height
  hash
  messages {
    ... on TransactionMessage {
      value {
        ... on MsgCall {
          caller
          func
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
`

const BlockFields = `
  height
  time
`
