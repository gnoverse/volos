import { toastError } from '@/components/ui/toast';
import { AdenaSDK } from '@adena-wallet/sdk';

export class AdenaService {
  private static instance: AdenaService;
  private sdk: AdenaSDK;
  private currentNetwork: string | null = null;
  private isLoading: boolean = false;
  private currentAddress: string | null = null;
  private connected: boolean = false;

  private constructor() {
    this.sdk = AdenaSDK.createAdenaWallet();
  }

  public static getInstance(): AdenaService {
    if (!AdenaService.instance) {
      AdenaService.instance = new AdenaService();
    }
    return AdenaService.instance;
  }

  private setLoading(loading: boolean) {
    this.isLoading = loading;
    const event = new CustomEvent('adenaLoadingChanged', {
      detail: { isLoading: loading }
    });
    window.dispatchEvent(event);
  }

  public async connectWallet(): Promise<string> {
    try {
      this.setLoading(true);
      await this.sdk.connectWallet();
      
      this.sdk.onChangeAccount({ callback: (address: string) => {
        if (address) {
          this.setConnection(address, true);
        } else {
          this.setConnection(null, false);
        }
      }});

      this.sdk.onChangeNetwork({ callback: (network: string) => {
        this.setCurrentNetwork(network);
      }});

      const account = await this.sdk.getAccount();
      const address = account?.data?.address;
      if (!address) {
        throw new Error('No address found after connection');
      }

      this.setConnection(address, true);
      
      if (account.data?.chainId) {
        this.setCurrentNetwork(account.data.chainId);
      }
      
      return address;
    } catch (error) {
      toastError(`Error connecting wallet`, String(error))
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  public async disconnectWallet(): Promise<void> {
    try {
      this.setLoading(true);
      this.sdk.disconnectWallet();
      this.setConnection(null, false);
    } catch (error) {
      toastError(`Error disconnecting wallet`, String(error))
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  private setConnection(address: string | null, isConnected: boolean): void {
    this.currentAddress = address ? address.replaceAll('"', '') : null;
    this.connected = isConnected && !!this.currentAddress;
    const event = new CustomEvent('adenaAddressChanged', {
      detail: { newAddress: this.currentAddress }
    });
    window.dispatchEvent(event);
  }

  public getStoredNetwork(): string | null {
    return this.currentNetwork;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getAddress(): string {
    return this.currentAddress || '';
  }

  public getSdk(): AdenaSDK {
    return this.sdk;
  }

  public async getNetwork(): Promise<string> {
    if (this.currentNetwork) return this.currentNetwork;
    const account = await this.sdk.getAccount();
    this.currentNetwork = account.data?.chainId || '';
    return this.currentNetwork;
  }

  public async openAdenaWebWallet(): Promise<void> {
    if(window.adena) {
      window.adena.AddEstablish("app");
    }
  }

  private setCurrentNetwork(network: string): void {
    this.currentNetwork = network;
    const event = new CustomEvent('adenaNetworkChanged', {
      detail: { newNetwork: network }
    });
    window.dispatchEvent(event);
  }
  
}
