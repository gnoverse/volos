include _info.mk

# Enable the linear IRM
enable-irm:
	$(info ************ Enable linear IRM ************)
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func EnableIRM \
		-args "linear" \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Test market creation with GNS and WUGNOT
market-create-gns-wugnot:
	$(info ************ Test creating market with GNS (supply/borrow) and WUGNOT (collateral) ************)
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func CreateMarket \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-args false \
		-args "linear" \
		-args 75 \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Test getting pool price for GNS-WUGNOT market
market-get-price-gns-wugnot:
	$(info ************ Test getting pool price for GNS-WUGNOT market ************)
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func GetMarketPrice \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Test getting market info for GNS-WUGNOT pair
market-get-gns-wugnot:
	$(info ************ Test getting market info for GNS-WUGNOT pair ************)
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func GetMarket \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Test supplying assets to GNS-WUGNOT market
supply-assets-gns-wugnot:
	$(info ************ Test supplying GNS assets to GNS-WUGNOT market ************)
	# APPROVE FIRST
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnoswap/v1/gns \
		-func Approve \
		-args $(ADDR_GNOLEND) \
		-args $(MAX_UINT64) \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

	# THEN SUPPLY
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func Supply \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-args 1000000 \
		-args 0 \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Test supplying shares to GNS-WUGNOT market
supply-shares-gns-wugnot:
	$(info ************ Test supplying shares to GNS-WUGNOT market ************)
	# APPROVE FIRST
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnoswap/v1/gns \
		-func Approve \
		-args $(ADDR_GNOLEND) \
		-args $(MAX_UINT64) \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

	# THEN SUPPLY
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func Supply \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-args 0 \
		-args 1000000 \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Check user position in GNS-WUGNOT market
check-position-gns-wugnot:
	$(info ************ Check user position in GNS-WUGNOT market ************)
	# Check supply shares
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func GetPositionSupplyShares \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-args "$(ADMIN)" \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

	# Check borrow shares
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func GetPositionBorrowShares \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-args "$(ADMIN)" \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

	# Check collateral
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func GetPositionCollateral \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-args "$(ADMIN)" \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Check GNS balance
check-gns-balance:
	$(info ************ Check GNS balance ************)
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnoswap/v1/gns \
		-func BalanceOf \
		-args $(ADMIN) \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Check WUGNOT balance
check-wugnot-balance:
	$(info ************ Check WUGNOT balance ************)
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/demo/wugnot \
		-func BalanceOf \
		-args $(ADMIN) \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Wrap UGNOT to WUGNOT
wrap-ugnot:
	$(info ************ Wrap UGNOT to WUGNOT ************)
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/demo/wugnot \
		-func Deposit \
		-send "1000000000ugnot" \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Test borrowing GNS tokens
borrow-gns:
	$(info ************ Test borrowing GNS tokens ************)
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func Borrow \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-args 5 \
		-args 0 \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Test supplying collateral to GNS-WUGNOT market
supply-collateral-gns-wugnot:
	$(info ************ Test supplying collateral to GNS-WUGNOT market ************)
	# APPROVE FIRST
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/demo/wugnot \
		-func Approve \
		-args $(ADDR_GNOLEND) \
		-args $(MAX_UINT64) \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

	# THEN SUPPLY COLLATERAL
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func SupplyCollateral \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-args 1000000 \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo

# Test withdrawing collateral from GNS-WUGNOT market
withdraw-collateral-gns-wugnot:
	$(info ************ Test withdrawing collateral from GNS-WUGNOT market ************)
	@echo "" | gnokey maketx call \
		-pkgpath gno.land/r/gnolend \
		-func WithdrawCollateral \
		-args "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000" \
		-args 500000 \
		-insecure-password-stdin=true \
		-remote $(GNOLAND_RPC_URL) \
		-broadcast=true \
		-chainid $(CHAINID) \
		-gas-fee 100000000ugnot \
		-gas-wanted 1000000000 \
		-memo "" \
		test1
	@echo
