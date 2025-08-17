import { BroadcastType, TransactionBuilder, makeMsgCallMessage, makeMsgRunMessage } from "@adena-wallet/sdk";
import { AdenaService } from './adena.service';

const GAS_WANTED = 50000000;

export const VOLOS_PKG_PATH = 'gno.land/r/volos';
export const STAKER_PKG_PATH = 'gno.land/r/volos/gov/staker';

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
            args: [marketId, assets.toString(), shares.toString()]
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
            args: [marketId, assets.toString(), shares.toString()]
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
            args: [marketId, assets.toString(), shares.toString()]
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
            args: [marketId, assets.toString(), shares.toString()]
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
            args: [marketId, amount.toString()]
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
            args: [marketId, amount.toString()]
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
            args: [marketId, borrower, seizedAssets.toString(), repaidShares.toString()]
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
            args: [marketId]
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
            args: [poolPath, isToken0Loan.toString(), irm, lltv.toString()]
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
            args: [irm]
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
            args: [lltv]
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
            args: [address]
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

  public async approveToken(tokenPath: string, amount: number, pkgPath: string) {
    const adenaService = AdenaService.getInstance();
    
    if (!adenaService.isConnected()) {
      throw new Error("Wallet not connected");
    }

    const gnoPackage = {
      name: "main",
      path: "",
      files: [
        {
          name: "main.gno",
          body: `package main

import (
    "std"
    "gno.land/r/demo/grc20reg"
)

func main() {
    addr := std.DerivePkgAddr("${pkgPath}")
    token := grc20reg.MustGet("${tokenPath}")
    teller := token.CallerTeller()
    teller.Approve(addr, ${amount})
}`
        }
      ]
    };

    try {
      const tx = TransactionBuilder.create()
        .messages(
          makeMsgRunMessage({
            caller: adenaService.getAddress(),
            send: "",
            package: gnoPackage
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
            args: [amount.toString(), delegatee]
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
}
