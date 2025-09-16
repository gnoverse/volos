import { GnoJSONRPCProvider } from '@gnolang/gno-js-client'

export class GnoService {
  private provider: GnoJSONRPCProvider
  private rpcUrls: Record<string, string>
  private currentProviderName: string
  private static instance: GnoService | null = null
  private static defaultRpcUrls: Record<string, string> = {
    'local': process.env.LOCAL_RPC_URL || 'http://localhost:26657/',
    'portal-loop': 'https://rpc.gno.land:443/',
    'test5': 'https://rpc.test5.gno.land/'
  }

  private constructor(rpcUrls: Record<string, string> = GnoService.defaultRpcUrls) {
    this.rpcUrls = rpcUrls
    this.currentProviderName = 'local'
    this.provider = new GnoJSONRPCProvider(rpcUrls['local'])
  }

  public static getInstance(rpcUrls?: Record<string, string>): GnoService {
    if (!GnoService.instance) {
      GnoService.instance = new GnoService(rpcUrls)
    }
    return GnoService.instance
  }

  changeProvider(providerName: string): boolean {
    try {
      if (!this.rpcUrls[providerName]) {
        console.error(`Error: No such provider URL for '${providerName}'`)
        return false
      }
      
      this.provider = new GnoJSONRPCProvider(this.rpcUrls[providerName])
      this.currentProviderName = providerName
      console.log(`Changed provider to ${providerName}`) //make this a toast
      return true
    } catch (error) {
      console.error(`Error changing to provider '${providerName}':`, error) //make this a toast
      return false
    }
  }

  getCurrentProvider() {
    return {
      name: this.currentProviderName,
      url: this.rpcUrls[this.currentProviderName]
    }
  }

  getProviders() {
    return Object.entries(this.rpcUrls).map(([name, url]) => ({
      name,
      url
    }))
  }

  async getPackageSource(packagePath: string) {
    return await this.provider.getFileContent(packagePath)
  }

  async evaluateExpression(packagePath: string, expression: string) {
    return await this.provider.evaluateExpression(packagePath, expression)
  }
}
