"use client"

import { GnoService } from "@/app/services/abci.service"
import {
  apiListMarkets,
} from "@/app/services/query-funcs/query"
import { useEffect, useState } from "react"

export default function TestQueriesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renderOutput,] = useState<string>("")
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    currentProvider: { name: string, url: string },
    providers: { name: string, url: string }[]
  }>({
    currentProvider: { name: '', url: '' },
    providers: []
  })
  const gnoService = GnoService.getInstance()

  useEffect(() => {
    async function testQueries() {
      try {
        console.log("Testing query functions...")
        
        // Diagnostic information
        const currentProvider = gnoService.getCurrentProvider()
        const providers = gnoService.getProviders()
        console.log("Current provider:", currentProvider)
        console.log("Available providers:", providers)
        
        setDiagnosticInfo({
          currentProvider,
          providers
        })
        
        // Try each provider until one works
        for (let i = 0; i < providers.length; i++) {
          try {
            console.log(`Trying provider ${i}: ${providers[i].name} (${providers[i].url})`);
            
            // Change to provider by name, not index
            gnoService.changeProvider(providers[i].name)
            
            // Test if we can access package source
            const files = await gnoService.getPackageSource("gno.land/r/matijamarjanovic/home");
            console.log(`Provider ${i} can access package source: ${files}`);
            
            // Continue with other tests...
            // Use apiListMarkets instead of getMarketList
            const marketsJson = await apiListMarkets()
            console.log("Markets JSON:", marketsJson)
                        // If we get here, the provider works
            console.log(`All tests completed successfully with provider ${providers[i].name}`);
            
            // Update diagnostic info with current provider after successful tests
            setDiagnosticInfo({
              currentProvider: gnoService.getCurrentProvider(),
              providers
            });
            
            return;
          } catch (error) {
            console.error(`Provider ${i} failed:`, error);
            // Continue to next provider
          }
        }
        
        throw new Error("All providers failed");
      } catch (error) {
        console.error("Error testing queries:", error);
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setLoading(false)
      }
    }
    
    testQueries()
  }, [gnoService])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Query Testing Page</h1>
      
      <div className="mb-6 p-4 bg-blue-100 text-blue-800 rounded-md">
        <h2 className="font-bold mb-2">Diagnostic Info:</h2>
        <div className="font-mono text-sm">
          {diagnosticInfo.currentProvider && (
            <p>Current Provider: {diagnosticInfo.currentProvider.name} ({diagnosticInfo.currentProvider.url})</p>
          )}
          <p>Available Providers:</p>
          <ul className="list-disc pl-6">
            {diagnosticInfo.providers && diagnosticInfo.providers.map((provider : {name: string, url: string}, index: number) => (
              <li key={index}>{provider.name}: {provider.url}</li>
            ))}
          </ul>
        </div>
      </div>
      
      {loading ? (
        <p>Loading... Check the console for results.</p>
      ) : error ? (
        <div className="p-4 bg-red-100 text-red-800 rounded-md">
          <h2 className="font-bold">Error:</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="p-4 bg-green-100 text-green-800 rounded-md">
          <p>Queries completed! Check the console for results.</p>
        </div>
      )}
      
      {renderOutput && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2">Render Output:</h2>
          <div className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap font-mono text-sm">
            {renderOutput}
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">How to test:</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Open your browser&apos;s developer console (F12 or right-click → Inspect → Console)</li>
          <li>Refresh this page to run the queries again</li>
          <li>Check the console logs to see the results of each query</li>
        </ol>
      </div>
    </div>
  )
} 