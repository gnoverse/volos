import { GnoJSONRPCProvider } from '@gnolang/gno-js-client'

export class GnoService {
  private provider: GnoJSONRPCProvider
  private providers: GnoJSONRPCProvider[]
  private static instance: GnoService | null = null
  private static defaultRpcUrls = [
    'http://localhost:26657/',
    'https://rpc.gno.land:443/',
    'https://rpc.test5.gno.land/'
  ]

  private constructor(rpcUrls: string[] = GnoService.defaultRpcUrls) {
    this.providers = rpcUrls.map(url => new GnoJSONRPCProvider(url))
    this.provider = this.providers[0]
  }

  public static getInstance(rpcUrls?: string[]): GnoService {
    if (!GnoService.instance) {
      GnoService.instance = new GnoService(rpcUrls)
    }
    return GnoService.instance
  }

  changeProvider(providerName: string): boolean {
    switch (providerName) {
      case 'portal-loop':
        this.provider = this.providers[1]
        console.log(`Changed provider to portal-loop`)
        return true
      case 'local':
        this.provider = this.providers[0]
        console.log(`Changed provider to local`)
        return true
      case 'test5':
        this.provider = this.providers[2]
        console.log(`Changed provider to test5`)
        return true
      default:
        console.error(`Error: No such provider '${providerName}'`)
        return false
    }
  }

  getCurrentProvider() {
    return this.provider.toString()
  }

  getProviders() {
    return this.providers.map(provider => provider.toString())
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
