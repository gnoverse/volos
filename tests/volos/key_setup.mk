# This file contains key setup and reset targets for the test suite.

# Set keys used during the tests
set-keys:
	$(info ************ Setup keys ************)
	@echo "" | mkdir -p ~/.config/gno/data/
	@echo "" | [ -e ~/.config/gno/data/keys.db ] && mv ~/.config/gno/data/keys.db ~/.config/gno/data/keys.db.bak || true
	@echo "" | cp -r ../../contract/keys.db ~/.config/gno/data
	@echo

# Reset local keys
reset-keys:
	$(info ************ Reset keys ************)
	@echo "" | rm -rf ~/.config/gno/data/keys.db
	@echo "" | [ -e ~/.config/gno/data/keys.db.bak ] && mv ~/.config/gno/data/keys.db.bak ~/.config/gno/data/keys.db || true
	@echo
