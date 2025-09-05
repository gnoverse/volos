import { BroadcastType, TransactionBuilder, makeMsgCallMessage } from "@adena-wallet/sdk";
import { AdenaService } from './adena.service';

const GAS_WANTED = 50000000;

export const VOLOS_PKG_PATH = 'gno.land/r/volos/core';
export const STAKER_PKG_PATH = 'gno.land/r/volos/gov/staker';
export const VLS_PKG_PATH = 'gno.land/r/volos/gov/vls';
export const GOVERNANCE_PKG_PATH = 'gno.land/r/volos/gov/governance';

export const VOLOS_ADDRESS = 'g1aaqgmqg85mksser0c5q8mez3nc3ssd93rme8f3';
export const STAKER_ADDRESS = 'g1xgaa5n8qtgl6z97aug8nvrtvm0l9ahvtghru5l';
export const VLS_ADDRESS = 'g1z43vp9lqf6uqfpkrjy578uvnhc3gsjxhcvq0sk';
export const GOVERNANCE_ADDRESS = 'g1kp52puf7vuqptdg2kdqjmy45v70sh2s6g984f8';

export class TxService {
  private static instance: TxService;
  private constructor() {}

  public static getInstance(): TxService {
    if (!TxService.instance) {
      TxService.instance = new TxService();
    }
    return TxService.instance;
  }

  public async supply(marketId: string, assets: number, shares: number = 0) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "1000000ugnot",
            pkg_path: VOLOS_PKG_PATH,
            func: "Supply",
            args: [marketId, assets.toString(), shares.toString()],
            max_deposit: ""
          })
        )
        .fee(100000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error supplying to market:", error);
      throw error;
    }
  }

  public async withdraw(marketId: string, assets: number, shares: number = 0) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "Withdraw",
            args: [marketId, assets.toString(), shares.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error withdrawing from market:", error);
      throw error;
    }
  }

  public async borrow(marketId: string, assets: number, shares: number = 0) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "Borrow",
            args: [marketId, assets.toString(), shares.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error borrowing from market:", error);
      throw error;
    }
  }

  public async repay(marketId: string, assets: number, shares: number = 0) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "Repay",
            args: [marketId, assets.toString(), shares.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error repaying to market:", error);
      throw error;
    }
  }

  public async supplyCollateral(marketId: string, amount: number) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "SupplyCollateral",
            args: [marketId, amount.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error supplying collateral to market:", error);
      throw error;
    }
  }

  public async withdrawCollateral(marketId: string, amount: number) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "WithdrawCollateral",
            args: [marketId, amount.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error withdrawing collateral from market:", error);
      throw error;
    }
  }

  public async liquidate(marketId: string, borrower: string, seizedAssets: number = 0, repaidShares: number = 0) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "Liquidate",
            args: [marketId, borrower, seizedAssets.toString(), repaidShares.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error liquidating position:", error);
      throw error;
    }
  }

  public async accrueInterest(marketId: string) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "AccrueInterest",
            args: [marketId],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error accruing interest for market:", error);
      throw error;
    }
  }

  public async createMarket(poolPath: string, isToken0Loan: boolean, irm: string, lltv: number) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "CreateMarket",
            args: [poolPath, isToken0Loan.toString(), irm, lltv.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error creating market:", error);
      throw error;
    }
  }

  public async enableIRM(irm: string) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "EnableIRM",
            args: [irm],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error enabling IRM:", error);
      throw error;
    }
  }

  public async enableLLTV(lltv: string) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "EnableLLTV",
            args: [lltv],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error enabling LLTV:", error);
      throw error;
    }
  }

  public async setFeeRecipient(address: string) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VOLOS_PKG_PATH,
            func: "SetFeeRecipient",
            args: [address],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error setting fee recipient:", error);
      throw error;
    }
  }

  public async approveToken(tokenPath: string, amount: number, spenderAddress: string) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: tokenPath,
            func: "Approve",
            args: [spenderAddress, amount.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error approving token:", error);
      throw error;
    }
  }

  /**
   * Approve VLS tokens for spending by calling the VLS contract directly
   * @param spender Address that will be approved to spend tokens
   * @param amount Amount of VLS tokens to approve
   */
  public async approveVLS(spender: string, amount: number) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VLS_PKG_PATH,
            func: "Approve",
            args: [spender, amount.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error approving VLS:", error);
      throw error;
    }
  }

   /**
   * Approve VLS tokens for spending by calling the VLS contract directly.
   * @param spender Pkg path, that will be derived to address and approved to spend tokens
   * @param amount Amount of VLS tokens to approve
   */
   public async approveRealmVLS(spender: string, amount: number) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: VLS_PKG_PATH,
            func: "ApproveRealm",
            args: [spender, amount.toString()],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error approving VLS:", error);
      throw error;
    }
  }

  /**
   * Stake VLS tokens to mint xVLS for a delegatee
   * @param amount Amount of VLS tokens to stake
   * @param delegatee Address to delegate voting power to (receives xVLS)
   */
  public async stakeVLS(amount: number, delegatee: string) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: STAKER_PKG_PATH,
            func: "Stake",
            args: [amount.toString(), delegatee],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error staking VLS:", error);
      throw error;
    }
  }

  public async beginUnstakeVLS(amount: number, delegatee: string) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: STAKER_PKG_PATH,
            func: "BeginUnstake",
            args: [amount.toString(), delegatee],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error beginning unstake VLS:", error);
      throw error;
    }
  }

  /**
   * Withdraw matured VLS unstakes from the staker contract
   * This completes the unstaking process after the cooldown period
   */
  public async withdrawUnstakedVLS() {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: STAKER_PKG_PATH,
            func: "WithdrawUnstaked",
            args: [],
            max_deposit: ""
          })
        )
        .fee(1000000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Error withdrawing unstaked VLS:", error);
      throw error;
    }
  }

  // Voting functions for governance
  public async voteOnProposal(proposalId: string, choice: 'YES' | 'NO' | 'ABSTAIN', reason: string = '') {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: GOVERNANCE_PKG_PATH,
            func: "Vote",
            args: [proposalId, choice, reason],
            max_deposit: ""
          })
        )
        .fee(100000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Vote transaction failed:", error);
      throw error;
    }
  }

  /**
   * Execute a proposal by ID
   * Calls the governance Execute function to enact the proposal if it has passed
   */
  public async executeProposal(proposalId: string) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgCallMessage({
            caller: adenaService.getAddress(),
            send: "",
            pkg_path: GOVERNANCE_PKG_PATH,
            func: "Execute",
            args: [proposalId],
            max_deposit: ""
          })
        )
        .fee(100000, 'ugnot')
        .gasWanted(GAS_WANTED)
        .memo("")
        .build();

      const transactionRequest = {
        tx,
        broadcastType: BroadcastType.COMMIT
      };

      const response = await adenaService.getSdk().broadcastTransaction(transactionRequest);
      return response;
    } catch (error) {
      console.error("Execute proposal transaction failed:", error);
      throw error;
    }
  }

  
}
