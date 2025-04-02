import React, { useState, useEffect } from 'react';
import { Search, Copy, CheckCircle, Clock, AlertCircle, Coffee, ArrowRight, PiggyBank, Trash2 } from 'lucide-react';
import { createPublicClient, http, formatEther } from 'viem';

interface Transaction {
  hash: string;
  status: 'Pending' | 'Confirmed' | 'Finalized';
  timestamp: string;
  rollup: string;
  chainId: number;
  blockNumber: number;
  gasPrice?: string;
  gasUsed?: string;
  value?: string;
  espressoStatus: {
    state: string;
    proofHash: string;
    confirmationTime: string;
    finalityLevel: number;
  };
  events: Array<{
    type: string;
    timestamp: string;
    data: string;
  }>;
}

interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  currency: string;
  explorer: string;
}

const defaultChains: ChainConfig[] = [
  {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    currency: 'ETH',
    explorer: 'https://optimistic.etherscan.io',
  },
  {
    name: 'Arbitrum One',
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    currency: 'ETH',
    explorer: 'https://arbiscan.io',
  },
  {
    name: 'Base',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    currency: 'ETH',
    explorer: 'https://basescan.org',
  },
];

function App() {
  const [txid, setTxid] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [chains, setChains] = useState<ChainConfig[]>(() => {
    const saved = localStorage.getItem('chains');
    return saved ? JSON.parse(saved) : defaultChains;
  });
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(chains[0]);
  const [newChain, setNewChain] = useState<ChainConfig>({
    name: '',
    chainId: 0,
    rpcUrl: '',
    currency: 'ETH',
    explorer: '',
  });
  const [showAddChain, setShowAddChain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('chains', JSON.stringify(chains));
  }, [chains]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const client = createPublicClient({
        transport: http(selectedChain.rpcUrl),
      });

      const [tx, block] = await Promise.all([
        client.getTransaction({ hash: txid as `0x${string}` }),
        client.getBlock({ blockHash: txid as `0x${string}` }),
      ]);

      if (!tx) {
        throw new Error('Transaction not found');
      }

      setTransaction({
        hash: tx.hash,
        status: 'Confirmed',
        timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
        rollup: selectedChain.name,
        chainId: selectedChain.chainId,
        blockNumber: Number(tx.blockNumber),
        gasPrice: formatEther(tx.gasPrice || 0n),
        gasUsed: tx.gas.toString(),
        value: formatEther(tx.value),
        espressoStatus: {
          state: 'Proof submitted',
          proofHash: '0xabcd...efgh',
          confirmationTime: '2 minutes ago',
          finalityLevel: 80,
        },
        events: [
          {
            type: 'Included in batch',
            timestamp: '2 minutes ago',
            data: 'Batch #123456',
          },
          {
            type: 'Proof submitted',
            timestamp: '1 minute ago',
            data: 'Proof hash: 0xabcd...efgh',
          },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transaction');
      console.error('Error fetching transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleAddChain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChain.name || !newChain.chainId || !newChain.rpcUrl) {
      setError('Please fill in all required fields');
      return;
    }
    setChains([...chains, newChain]);
    setNewChain({
      name: '',
      chainId: 0,
      rpcUrl: '',
      currency: 'ETH',
      explorer: '',
    });
    setShowAddChain(false);
  };

  const handleRemoveChain = (chainId: number) => {
    const updatedChains = chains.filter(chain => chain.chainId !== chainId);
    setChains(updatedChains);
    if (selectedChain.chainId === chainId) {
      setSelectedChain(updatedChains[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center mb-8">
          <Coffee className="w-12 h-12 text-brown-400 mr-4" />
          <h1 className="text-4xl font-bold">RollCall</h1>
        </div>
        <p className="text-center text-xl text-gray-400 mb-12">Universal Rollup TX Tracker</p>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Transaction Search</h2>
              <button
                onClick={() => setShowAddChain(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <PiggyBank className="w-4 h-4 mr-2" />
                Add New Chain
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">Select Chain</label>
                <select
                  value={selectedChain.chainId}
                  onChange={(e) => setSelectedChain(chains.find(c => c.chainId === parseInt(e.target.value)) || chains[0])}
                  className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {chains.map((chain) => (
                    <option key={chain.chainId} value={chain.chainId}>
                      {chain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  placeholder="Enter TXID to track..."
                  className="w-full px-6 py-4 bg-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 p-2 rounded-md hover:bg-blue-600 transition-colors"
                  disabled={loading}
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
              {error && (
                <div className="mt-4 text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}
            </form>
          </div>

          <div className="bg-gray-800 rounded-lg p-8">
            <h3 className="text-xl font-semibold mb-4">Saved Chains</h3>
            <div className="space-y-4">
              {chains.map((chain) => (
                <div key={chain.chainId} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium">{chain.name}</h4>
                    {chains.length > 1 && (
                      <button
                        onClick={() => handleRemoveChain(chain.chainId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400">RPC URL</label>
                      <div className="flex items-center">
                        <code className="text-sm text-blue-400">{chain.rpcUrl}</code>
                        <button
                          onClick={() => copyToClipboard(chain.rpcUrl)}
                          className="ml-2 text-gray-400 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-400">Chain ID</label>
                      <p>{chain.chainId}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="text-gray-400">Block Explorer</label>
                    <a
                      href={chain.explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      {chain.explorer}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Chain Modal */}
          {showAddChain && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-semibold mb-4">Add New Chain</h3>
                <form onSubmit={handleAddChain} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 mb-2">Chain Name</label>
                    <input
                      type="text"
                      value={newChain.name}
                      onChange={(e) => setNewChain({ ...newChain, name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Chain ID</label>
                    <input
                      type="number"
                      value={newChain.chainId || ''}
                      onChange={(e) => setNewChain({ ...newChain, chainId: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">RPC URL</label>
                    <input
                      type="url"
                      value={newChain.rpcUrl}
                      onChange={(e) => setNewChain({ ...newChain, rpcUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Currency Symbol</label>
                    <input
                      type="text"
                      value={newChain.currency}
                      onChange={(e) => setNewChain({ ...newChain, currency: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">Block Explorer URL</label>
                    <input
                      type="url"
                      value={newChain.explorer}
                      onChange={(e) => setNewChain({ ...newChain, explorer: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                    />
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddChain(false)}
                      className="px-4 py-2 bg-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 rounded-lg"
                    >
                      Add Chain
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {transaction && (
          <div className="max-w-4xl mx-auto mt-8">
            {/* Transaction Overview */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Transaction Details</h2>
                <div className="flex items-center">
                  {transaction.status === 'Confirmed' && (
                    <span className="flex items-center text-green-400">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirmed
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400">Transaction Hash</label>
                    <div className="flex items-center">
                      <code className="text-blue-400">{transaction.hash}</code>
                      <button
                        onClick={() => copyToClipboard(transaction.hash)}
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400">Timestamp</label>
                    <p>{new Date(transaction.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Value</label>
                    <p>{transaction.value} {selectedChain.currency}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400">Rollup</label>
                    <p>{transaction.rollup} (Chain ID: {transaction.chainId})</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Block Number</label>
                    <p>{transaction.blockNumber}</p>
                  </div>
                  <div>
                    <label className="text-gray-400">Gas</label>
                    <p>Price: {transaction.gasPrice} {selectedChain.currency} | Used: {transaction.gasUsed}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Espresso Confirmation Section */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-6">Espresso Confirmation</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400">Status</p>
                      <p className="text-lg">{transaction.espressoStatus.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400">Confirmation Time</p>
                      <p>{transaction.espressoStatus.confirmationTime}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2"
                        style={{ width: `${transaction.espressoStatus.finalityLevel}%` }}
                      />
                    </div>
                    <p className="text-right text-sm text-gray-400 mt-1">
                      {transaction.espressoStatus.finalityLevel}% Complete
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-6">Event Timeline</h2>
              
              <div className="space-y-4">
                {transaction.events.map((event, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-gray-700 rounded-full p-2 mr-4">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{event.type}</p>
                      <p className="text-gray-400 text-sm">{event.timestamp}</p>
                      <p className="text-sm mt-1">{event.data}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;