"use client";

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { useAddresses } from './hooks/useAddresses';
import { CHAIN_CONFIG, SUPPORTED_CHAINS } from "./config";
import { useBalance } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from "react";

export default function WalletOptions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addresses = useAddresses();

  // const [destinationAddress, setDestinationAddress] = useState(() => {
  //   return searchParams.get('destinationAddress') || "";
  // });

  const destinationAddress = useMemo(() => addresses.smartWalletAddress, [addresses]);

  const [transferAmount, setTransferAmount] = useState("");
  const [originChain, setOriginChain] = useState<number | undefined>(() => {
    const chainParam = searchParams.get('chain');
    return chainParam ? Number(chainParam) : undefined;
  });
  const [destinationChain, setDestinationChain] = useState<number | undefined>(() => {
    const chainParam = searchParams.get('destinationChain');
    return chainParam ? Number(chainParam) : undefined;
  });
  const [isTransferring, setIsTransferring] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const usdcBalance = useBalance({
    address: addresses.smartWalletAddress,
    token: CHAIN_CONFIG[originChain ?? sepolia.id]?.usdcAddress,
    chainId: originChain,
  });

  const destinationUsdcBalance = useBalance({
    address: destinationAddress as `0x${string}`,
    token: CHAIN_CONFIG[destinationChain ?? sepolia.id]?.usdcAddress,
    chainId: destinationChain,
  });

  const destinationEthBalance = useBalance({
    address: addresses.eoaWalletAddress,
    chainId: destinationChain,
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      // Reset countdown when it reaches 0
      setCountdown(null);
      setIsTransferring(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // UseBalance has also support for subscriptions
  useEffect(() => {
    const interval = setInterval(() => {
      if (addresses.smartWalletAddress && originChain) {
        usdcBalance.refetch();
      }
      if (destinationAddress?.match(/^0x[a-fA-F0-9]{40}$/) && destinationChain) {
        destinationUsdcBalance.refetch();
      }
      if (addresses.eoaWalletAddress && destinationChain) {
        destinationEthBalance.refetch();
      }
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [addresses, originChain, destinationChain, destinationAddress, usdcBalance, destinationUsdcBalance, destinationEthBalance]);

  const handleTransfer = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); // Clear any previous errors
    setSuccessMessage(null);

    if (!addresses.smartWalletAddress) return;
    if (!transferAmount || !destinationChain || !destinationAddress) return;

    const amount = Number.parseFloat(transferAmount);
    const balance = Number.parseFloat(usdcBalance.data?.formatted || '0');

    if (amount > balance) {
      setErrorMessage('Insufficient balance');
      return;
    }

    setIsTransferring(true);
    setCountdown(180); // Start 3-minute countdown

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originChainId: originChain,
          destinationChainId: destinationChain,
          destinationAddress,
          amount: transferAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Transfer failed');
      }

      const result = await response.json();
      console.log('Transfer successful:', result);

      // Set success message
      setSuccessMessage('Transfer completed successfully!');

      // Reset countdown and transfer state on success
      setCountdown(null);
      setIsTransferring(false);

      // Optionally clear form
      setTransferAmount('');
    } catch (error) {
      console.error('Transfer error:', error);
      setErrorMessage('Something went wrong');
      // Reset countdown and transfer state on error
      setCountdown(null);
      setIsTransferring(false);
    }
  };

  const updateURLParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    // biome-ignore lint/complexity/noForEach: <explanation>
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`?${params.toString()}`);
  };

  const handleOriginChainChange = (chainId: number) => {
    setOriginChain(chainId);
    // Clear destination chain if it matches the new origin chain
    if (destinationChain === chainId) {
      setDestinationChain(undefined);
      updateURLParams({
        chain: chainId.toString(),
        destinationChain: undefined
      });
    } else {
      updateURLParams({
        chain: chainId.toString()
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 text-center">USDC Bridge via ERC-4337</h1>

          {/* Origin Chain Selection */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-gray-100 transition-all duration-200 hover:shadow-xl">
            <label htmlFor="origin-chain" className="block text-lg font-semibold text-gray-900 mb-3">
              Select Origin Chain
            </label>
            <select
              id="origin-chain"
              value={originChain}
              onChange={(e) => handleOriginChainChange(Number(e.target.value))}
              className="w-full p-3 border border-gray-200 rounded-lg bg-white/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="">Select a chain</option>
              {SUPPORTED_CHAINS.map((chainInfo) => (
                <option key={chainInfo.chain.id} value={chainInfo.chain.id}>
                  {chainInfo.name}
                </option>
              ))}
            </select>
          </div>

          {Boolean(originChain) && (
            <div className="space-y-5">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-5">
                {/* USDC Balance Card */}
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-gray-100 transition-all duration-200 hover:shadow-xl">
                  <h2 className="text-lg font-semibold mb-2 text-gray-900">Origin USDC Smart Wallet Balance</h2>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {usdcBalance.data
                      ? `${Number(usdcBalance.data?.formatted).toFixed(4)} USDC`
                      : "Loading..."}
                  </p>
                </div>
              </div>
              {/* Transfer Form */}
              {addresses.eoaWalletAddress && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100 transition-all duration-200 hover:shadow-xl">
                  <h2 className="text-xl font-semibold mb-6 text-gray-900">Transfer USDC</h2>

                  <form onSubmit={handleTransfer} className="space-y-6">
                    <div className="mb-4">
                      <label
                        htmlFor="destination-chain"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Destination Chain
                      </label>
                      <select
                        id="destination-chain"
                        value={destinationChain ?? ""}
                        onChange={(e) => {
                          setDestinationChain(e.target.value ? Number(e.target.value) : undefined);
                          updateURLParams({
                            destinationChain: e.target.value || undefined
                          });
                        }}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Chain</option>
                        {SUPPORTED_CHAINS.filter(chainInfo => chainInfo.chain.id !== originChain).map((chainInfo) => (
                          <option key={chainInfo.chain.id} value={chainInfo.chain.id}>
                            {chainInfo.name}
                          </option>
                        ))}
                      </select>
                      {destinationChain && addresses.eoaWalletAddress && (
                        <div className="mt-2 text-sm text-gray-600">
                          Destination EOA ETH Balance: {destinationEthBalance.data
                            ? `${Number(destinationEthBalance.data?.formatted).toFixed(4)} ETH`
                            : "Loading..."}
                        </div>
                      )}
                      {destinationEthBalance.data && Number(destinationEthBalance.data?.formatted) === 0 && (
                        <div className="text-red-500 text-sm mt-1">
                          Needs ETH for gas fees
                        </div>
                      )}
                    </div>

                    {destinationChain && (
                      <>
                        <div className="mb-4">
                          <label
                            htmlFor="destinationAddress"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Destination Address (Transfer to different address is  disabled for now)
                          </label>
                          <input
                            disabled
                            type="text"
                            id="destinationAddress"
                            value={destinationAddress}
                            onChange={(e) => {
                              // setDestinationAddress(e.target.value);
                              updateURLParams({
                                destinationAddress: e.target.value || undefined
                              });
                            }}
                            placeholder="0x..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            pattern="^0x[a-fA-F0-9]{40}$"
                            required
                          />
                          {destinationAddress?.match(/^0x[a-fA-F0-9]{40}$/) && (
                            <div className="mt-2 text-sm text-gray-600">
                              Destination USDC Balance: {destinationUsdcBalance.data
                                ? `${Number(destinationUsdcBalance.data?.formatted).toFixed(4)} USDC`
                                : "Loading..."}
                            </div>
                          )}
                        </div>
                        <div className="mb-4">
                          <label
                            htmlFor="amount"
                            className="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Amount to Transfer
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              id="amount"
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              max={usdcBalance.data?.formatted || undefined}
                              step="0.001"
                              required
                            />
                            <span className="absolute right-3 top-2 text-gray-500">
                              USDC
                            </span>
                          </div>
                          {transferAmount && usdcBalance.data && Number.parseFloat(transferAmount) > Number.parseFloat(usdcBalance.data?.formatted) && (
                            <div className="text-red-500 text-sm mt-1">
                              Amount exceeds available balance ({usdcBalance.data.formatted} USDC)
                            </div>
                          )}
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          disabled={
                            !transferAmount ||
                            usdcBalance.isLoading ||
                            isTransferring ||
                            (destinationEthBalance.data && Number(destinationEthBalance.data?.formatted) === 0) ||
                            Number.parseFloat(transferAmount) > Number.parseFloat(usdcBalance.data?.formatted || '0')
                          }
                        >
                          {isTransferring ? (
                            <span className="flex items-center justify-center">
                              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Transferring
                              {countdown !== null && (
                                <span className="ml-2">
                                  ({Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')})
                                </span>
                              )}
                            </span>
                          ) : (
                            `Transfer to ${CHAIN_CONFIG[destinationChain].name}`
                          )}
                        </button>
                        {errorMessage && (
                          <div className="text-red-500 text-sm text-center mt-2">
                            {errorMessage}
                          </div>
                        )}
                        {successMessage && (
                          <div className="text-green-500 text-sm text-center mt-2">
                            {successMessage}
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mb-4 text-center">
                          Average transfer time: 3 minutes
                        </p>
                      </>
                    )}
                  </form>
                </div>
              )}

              {!addresses.eoaWalletAddress && (
                <div className="text-center text-gray-600 bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100">
                  Please connect your wallet to view transfer options
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer addresses={addresses} />
    </div>
  );
}

