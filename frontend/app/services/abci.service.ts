import { GnoJSONRPCProvider } from '@gnolang/gno-js-client'

export class GnoService {
  private provider: GnoJSONRPCProvider
  private providers: Record<string, GnoJSONRPCProvider>
  private static instance: GnoService | null = null
  private static defaultRpcUrls: Record<string, string> = {
    'local': 'http://localhost:26657/',
    'portal-loop': 'https://rpc.gno.land:443/',
    'test5': 'https://rpc.test5.gno.land/'
  }

  private constructor(rpcUrls: Record<string, string> = GnoService.defaultRpcUrls) {
    this.providers = {}
    for (const [name, url] of Object.entries(rpcUrls)) {
      this.providers[name] = new GnoJSONRPCProvider(url)
    }
    this.provider = this.providers['local'] || Object.values(this.providers)[0]
  }

  public static getInstance(rpcUrls?: Record<string, string>): GnoService {
    if (!GnoService.instance) {
      GnoService.instance = new GnoService(rpcUrls)
    }
    return GnoService.instance
  }

  changeProvider(providerName: string): boolean {
    if (this.providers[providerName]) {
      this.provider = this.providers[providerName]
      console.log(`Changed provider to ${providerName}`)
      return true
    } else {
      console.error(`Error: No such provider '${providerName}'`)
      return false
    }
  }

  registerRpcUrl(name: string, url: string): boolean {
    try {
      if (this.providers[name]) {
        console.error(`Error: Provider with name '${name}' already exists.`)
        return false
      }
      this.providers[name] = new GnoJSONRPCProvider(url)
      return true
    } catch (error) {
      console.error('Error registering RPC URL:', error)
      return false
    }
  }

  getCurrentProvider() {
    return this.provider.toString()
  }

  getProviders() {
    return Object.entries(this.providers).map(([name, provider]) => ({
      name,
      url: provider.toString()
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
      console.error('Error evaluating expression:', error)
      throw error
    }
  }
}
