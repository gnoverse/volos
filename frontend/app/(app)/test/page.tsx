
import React from 'react';
import { Coins, TrendingUp, TrendingDown, DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const App = () => {
  const markets = [
    {
      id: 1,
      asset: 'ETH',
      symbol: 'Ξ',
      color: 'bg-purple-100 text-purple-600',
      totalSupplied: '$1.2B',
      supplyApy: '3.25%',
      totalBorrowed: '$850M',
      borrowApy: '5.75%',
      liquidity: '$350M',
      utilization: '70%'
    },
    {
      id: 2,
      asset: 'USDC',
      symbol: '$',
      color: 'bg-blue-100 text-blue-600',
      totalSupplied: '$2.8B',
      supplyApy: '2.10%',
      totalBorrowed: '$1.9B',
      borrowApy: '3.45%',
      liquidity: '$900M',
      utilization: '68%'
    },
    {
      id: 3,
      asset: 'DAI',
      symbol: 'D',
      color: 'bg-green-100 text-green-600',
      totalSupplied: '$950M',
      supplyApy: '1.85%',
      totalBorrowed: '$620M',
      borrowApy: '3.10%',
      liquidity: '$330M',
      utilization: '65%'
    },
    {
      id: 4,
      asset: 'WBTC',
      symbol: '₿',
      color: 'bg-amber-100 text-amber-600',
      totalSupplied: '$420M',
      supplyApy: '2.75%',
      totalBorrowed: '$280M',
      borrowApy: '4.90%',
      liquidity: '$140M',
      utilization: '67%'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Coins className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Lendify Protocol
            </h1>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-indigo-600 font-medium flex items-center">
              <TrendingUp className="mr-2" size={18} />
              Markets
            </a>
            <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Borrow</a>
            <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Supply</a>
            <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Analytics</a>
          </nav>
          
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-md">
            Connect Wallet
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">
            Earn Yield on Your Crypto Assets
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Supply assets to earn passive income or borrow against your holdings with industry-leading security
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-all transform hover:scale-[1.03] shadow-lg flex items-center justify-center">
              <ArrowUpCircle className="mr-2" size={20} />
              Supply Now
            </button>
            <button className="bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-medium py-3 px-8 rounded-xl transition-all transform hover:scale-[1.03] shadow-md flex items-center justify-center">
              <ArrowDownCircle className="mr-2" size={20} />
              Borrow Now
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <DollarSign className="text-indigo-600" size={20} />
              </div>
              <p className="text-gray-500">Total Value Locked</p>
            </div>
            <p className="text-2xl font-bold">$5.37B</p>
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 w-3/4"></div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <p className="text-gray-500">Avg. Supply APY</p>
            </div>
            <p className="text-2xl font-bold text-green-600">2.49%</p>
            <p className="text-sm text-gray-500 mt-1">+0.21% from last week</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="bg-amber-100 p-2 rounded-lg mr-3">
                <TrendingDown className="text-amber-600" size={20} />
              </div>
              <p className="text-gray-500">Avg. Borrow APY</p>
            </div>
            <p className="text-2xl font-bold text-red-600">4.08%</p>
            <p className="text-sm text-gray-500 mt-1">-0.15% from last week</p>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-3">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <Coins className="text-purple-600" size={20} />
              </div>
              <p className="text-gray-500">Active Markets</p>
            </div>
            <p className="text-2xl font-bold">18</p>
            <p className="text-sm text-gray-500 mt-1">4 new assets added</p>
          </div>
        </div>

        {/* Markets Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-800">Available Markets</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm font-medium">
                  <th className="text-left pl-6 py-4">Asset</th>
                  <th className="text-right py-4">Total Supplied</th>
                  <th className="text-right py-4">Supply APY</th>
                  <th className="text-right py-4">Total Borrowed</th>
                  <th className="text-right py-4">Borrow APY</th>
                  <th className="text-right py-4 pr-6">Liquidity</th>
                </tr>
              </thead>
              
              <tbody>
                {markets.map((market) => (
                  <tr 
                    key={market.id} 
                    className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="pl-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${market.color} font-bold mr-3`}>
                          {market.symbol}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{market.asset}</p>
                          <div className="flex items-center mt-1">
                            <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full" 
                                style={{ width: market.utilization }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-500">{market.utilization} utilized</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="text-right py-4 font-medium text-gray-800">{market.totalSupplied}</td>
                    
                    <td className="text-right py-4">
                      <span className="text-green-600 font-medium">{market.supplyApy}</span>
                    </td>
                    
                    <td className="text-right py-4 font-medium text-gray-800">{market.totalBorrowed}</td>
                    
                    <td className="text-right py-4">
                      <span className="text-red-600 font-medium">{market.borrowApy}</span>
                    </td>
                    
                    <td className="pr-6 py-4 text-right font-medium text-gray-800">{market.liquidity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <p className="text-gray-500 text-sm">Showing 4 of 18 available markets</p>
            <button className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
              View All Markets <TrendingUp className="ml-1" size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-indigo-600 p-2 rounded-xl mr-2">
                  <Coins className="text-white" size={20} />
                </div>
                <h3 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Lendify
                </h3>
              </div>
              <p className="text-gray-500 max-w-xs">
                The next-generation decentralized lending protocol built for security, efficiency, and user experience.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Protocol</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Markets</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Borrow</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Supply</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Analytics</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Community</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors">Disclaimers</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 mt-8 pt-6 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Lendify Protocol. All rights reserved. Decentralized finance made accessible.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
