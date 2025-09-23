import { toastError, toastInfo } from '@/components/ui/toast'
import { GnoJSONRPCProvider } from '@gnolang/gno-js-client'

export class GnoService {
  private provider: GnoJSONRPCProvider
  private currentRpcUrl: string
  private static instance: GnoService | null = null
  
  private constructor(rpcUrl: string) {
    this.currentRpcUrl = rpcUrl
    this.provider = new GnoJSONRPCProvider(rpcUrl)
  }

  public static getInstance(rpcUrl?: string): GnoService {
    if (!GnoService.instance) {
      const initial = rpcUrl || process.env.LOCAL_RPC_URL || 'http://localhost:26657/'
      GnoService.instance = new GnoService(initial)
    }
    return GnoService.instance
  }

  changeProviderUrl(rpcUrl: string): boolean {
    try {
      this.provider = new GnoJSONRPCProvider(rpcUrl)
      this.currentRpcUrl = rpcUrl
      toastInfo(`Changed provider`, rpcUrl)
      return true
    } catch (error) {
      toastError(`Error changing provider`, String(error))
      return false
    }
  }

  getCurrentProvider() {
    return {
      url: this.currentRpcUrl
    }
  }

  async getPackageSource(packagePath: string) {
    return await this.provider.getFileContent(packagePath)
  }

  async evaluateExpression(packagePath: string, expression: string) {
    return await this.provider.evaluateExpression(packagePath, expression)
  }
}
