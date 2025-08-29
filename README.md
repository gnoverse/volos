# Volos (ex GnoLend)

Volos is the first lending protocol built using Gnolang, implementing financial primitives for decentralized lending and borrowing. The protocol features lending markets with configurable parameters, variable interest rate models, collateralized borrowing with health monitoring, and liquidation mechanisms for undercollateralized positions. It employs a shares-based accounting system to track user positions, calculates interest based on utilization metrics, and maintains system solvency through real-time risk assessment.

For price determination, Volos integrates with [Gnoswap](https://github.com/gnoswap-labs/gnoswap)'s liquidity pools, using them as price oracles in the absence of dedicated oracle infrastructure. This approach enables the protocol to obtain reliable price data directly from on-chain sources without requiring external oracle networks, demonstrating how essential financial primitives can be implemented within the current gno.land ecosystem.

The system calculates borrowing capacity based on collateral values derived from Gnoswap pool prices. This integration creates a self-contained lending solution that maintains the security guarantees of the underlying blockchain while providing the necessary infrastructure for expanding DeFi capabilities on gno.land.

> **Warning:** This project is work in progress. The protocol is under active development and contains incomplete features and known issues.

## Prerequisites

- GNU Make 3.81 or higher
- Latest version of [gno.land](https://github.com/gnolang/gno)
- Go 1.21 or higher

## Setup

Clone the repository and set up environment files:
```bash
# Clone the Volos repository and navigate to the project directory
git clone https://github.com/gnoverse/volos && cd volos

# Copy example environment files to create your local configuration
# These files contain necessary environment variables for the backend and frontend
mv backend/.env.example backend/.env && mv frontend/.env.example frontend/.env
```

Start the development environment using Docker Compose:
```bash
# Launch all services (gno.land node, tx-indexer, backend, frontend) in detached mode
docker compose up -d -w
```

## Run tests

Execute the complete test suite to verify the protocol functionality:
```bash
# Navigate to the test directory containing Volos protocol tests
cd tests/volos

# Run the full test workflow using the custom makefile
# This includes unit tests, integration tests, and end-to-end scenarios
# covering lending, borrowing, liquidation, and interest rate calculations
make -f test.mk full-workflow
```

The test suite will:
- Deploy all necessary contracts to the local gno.land node
- Initialize lending markets with test tokens
- Execute various lending and borrowing scenarios
- Validate interest rate calculations and health factor monitoring
- Test liquidation mechanisms and edge cases
