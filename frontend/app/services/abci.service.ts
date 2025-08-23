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
      console.log(`Changed provider to ${providerName}`)
      return true
    } catch (error) {
      console.error(`Error changing to provider '${providerName}':`, error)
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

  async getPackageData(packagePath: string, expression: string) {
    try {
      const result = await this.provider.evaluateExpression(
        packagePath,
        expression
      )
      return result
    } catch (error) {
      console.error('Error evaluating expression:', error)
      throw error
    }
  }

  async getPackageFunctions(packagePath: string) {
    try {
      const signatures = await this.provider.getFunctionSignatures(packagePath)
      return signatures
    } catch (error) {
      console.error('Error getting function signatures:', error)
      throw error
    }
  }

  async getRender(packagePath: string, path: string) {
    try {
      const rendered = await this.provider.getRenderOutput(packagePath, path)
      return rendered
    } catch (error) {
      console.error('Error getting render output:', error)
      throw error
    }
  }

  async getPackageSource(packagePath: string) {
    try {
      const source = await this.provider.getFileContent(packagePath)
      return source
    } catch (error) {
      console.error('Error getting file content:', error)
      throw error
    }
  }

  async evaluateExpression(packagePath: string, expression: string) {
    try {
      const result = await this.provider.evaluateExpression(packagePath, expression)
      return result
    } catch (error) {
      console.error('Error evaluating expression:', error, packagePath, expression)
      throw error
    }
  }
}
