import { type Chain, http } from "viem";
import { createConfig as createConfigWagmi, injected } from "wagmi";
import { QueryClient } from "@tanstack/react-query";
import { metaMask, safe } from "wagmi/connectors";
import {
	arbitrumSepolia,
	avalancheFuji,
	base,
	baseSepolia,
	mainnet,
	polygonAmoy,
	sepolia,
} from "wagmi/chains";

export const queryClient = new QueryClient();

export const wagmiConfig = createConfigWagmi({
	chains: [
		mainnet,
		base,
		sepolia,
		avalancheFuji,
		arbitrumSepolia,
		baseSepolia,
		polygonAmoy,
	],
	connectors: [injected(), metaMask(), safe()],
	transports: {
		[mainnet.id]: http(),
		[base.id]: http(),
		[sepolia.id]: http(),
		[avalancheFuji.id]: http(),
		[arbitrumSepolia.id]: http(),
		[baseSepolia.id]: http(),
		[polygonAmoy.id]: http(),
	},
});

export const USDC_DECIMALS = 6;

export type ChainInfo = {
	name: string;
	domainId: number;
	usdcMessengerAddress: `0x${string}`;
	usdcMessageTransmitterAddress: `0x${string}`;
	usdcAddress: `0x${string}`;
	chain: Chain;
};

export const CHAIN_CONFIG: Record<number, ChainInfo> = {
	[sepolia.id]: {
		name: "Ethereum Sepolia",
		domainId: 0,
		usdcMessengerAddress: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
		usdcMessageTransmitterAddress: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
		usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
		chain: sepolia,
	},
	[avalancheFuji.id]: {
		name: "Avalanche Fuji",
		domainId: 1,
		usdcMessengerAddress: "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
		usdcMessageTransmitterAddress: "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79",
		usdcAddress: "0x5425890298aed601595a70ab815c96711a31bc65",
		chain: avalancheFuji,
	},
	[arbitrumSepolia.id]: {
		name: "Arbitrum Sepolia",
		domainId: 3,
		usdcMessengerAddress: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
		usdcMessageTransmitterAddress: "0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872",
		usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
		chain: arbitrumSepolia,
	},
	[baseSepolia.id]: {
		name: "Base Sepolia",
		domainId: 6,
		usdcMessengerAddress: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
		usdcMessageTransmitterAddress: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
		usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
		chain: baseSepolia,
	},
	[polygonAmoy.id]: {
		name: "Polygon PoS Amoy",
		domainId: 7,
		usdcMessengerAddress: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
		usdcMessageTransmitterAddress: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
		usdcAddress: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
		chain: polygonAmoy,
	},
};

export const SUPPORTED_CHAINS = Object.values(CHAIN_CONFIG);
