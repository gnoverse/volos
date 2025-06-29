// NOTE: "type" field on GnoEvent has to always be present, otherwise the query will not parse properly
// Different fields are used for different queries to maximize performance (to use GraphQL to full extent).
// This could maybe be improved by making a builder similar to the WhereClauseBuilder in query-builder.ts

export const UNIVERSAL_TRANSACTION_FIELDS = `
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

export const SUPPLY_BORROW_FIELDS = `
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

export const MINIMAL_TRANSACTION_FIELDS = `
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

export const MARKET_ACTIVITY_FIELDS = `
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
