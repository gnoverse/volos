import { AdenaSDK } from '@adena-wallet/sdk';

export class AdenaService {
  private static instance: AdenaService;
  private sdk: AdenaSDK;
  private readonly WALLET_ADDRESS_KEY = 'walletAddress';
  private readonly NETWORK_KEY = 'network';
  private isLoading: boolean = false;

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
          this.updateStoredAddress(address);
        } else {
          this.clearStoredAddress();
        }
      }});

      this.sdk.onChangeNetwork({ callback: (network: string) => {
        console.log('Network changed:', network);
        this.updateStoredNetwork(network);
      }});

      const account = await this.sdk.getAccount();
      
      if (account && account.data?.address) {
        this.updateStoredAddress(account.data.address);
        
        if (account.data?.chainId) {
          this.updateStoredNetwork(account.data.chainId);
        }
        
        return account.data.address;
      }

      throw new Error('No address found after connection');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  public async disconnectWallet(): Promise<void> {
    try {
      this.setLoading(true);
      this.sdk.disconnectWallet();
      this.clearStoredAddress();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  private updateStoredAddress(address: string): void {
    localStorage.setItem(this.WALLET_ADDRESS_KEY, address);
    const event = new CustomEvent('adenaAddressChanged', {
      detail: { newAddress: address }
    });
    window.dispatchEvent(event);
  }

  private clearStoredAddress(): void {
    localStorage.removeItem(this.WALLET_ADDRESS_KEY);
    const event = new CustomEvent('adenaAddressChanged', {
      detail: { newAddress: null }
    });
    window.dispatchEvent(event);
  }

  public getStoredAddress(): string | null {
    return localStorage.getItem(this.WALLET_ADDRESS_KEY);
  }

  public getStoredNetwork(): string | null {
    return localStorage.getItem(this.NETWORK_KEY);
  }

  public isConnected(): boolean {
    return this.getStoredAddress() !== null;
  }

  public getAddress(): string {
    return this.getStoredAddress()?.replaceAll("\"", "") || '';
  }

  public getSdk(): AdenaSDK {
    return this.sdk;
  }

  public async getNetwork(): Promise<string> {
    const account = await this.sdk.getAccount();
    return account.data?.chainId || '';
  }

  public async openAdenaWebWallet(): Promise<void> {
    if(window.adena) {
      window.adena.AddEstablish("app");
    }
  }

  private updateStoredNetwork(network: string): void {
    localStorage.setItem(this.NETWORK_KEY, network);
    const event = new CustomEvent('adenaNetworkChanged', {
      detail: { newNetwork: network }
    });
    window.dispatchEvent(event);
  }
  
}
