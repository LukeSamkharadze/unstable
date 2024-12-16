import { NextResponse } from "next/server";
import { toSafeSmartAccount } from "permissionless/accounts";
import {
	type Hex,
	createPublicClient,
	createWalletClient,
	http,
	keccak256,
	toBytes,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { createSmartAccountClient } from "permissionless";
import { CHAIN_CONFIG, USDC_DECIMALS } from "../config";
import tokenMessengerAbi from "../token-messenger-abi.json";
import usdcAbi from "../usdc-abi.json";
import messageTransmitterAbi from "../message-transmitter-abi.json";
import { getTransactionReceipt } from "viem/actions";
import { decodeAbiParameters } from "viem";

if (!process.env.PIMLICO_API_KEY || !process.env.EOA_PRIVATE_KEY) {
	throw new Error("Missing required environment variables");
}

export const maxDuration = 300; // 5 minutes

const eoaAccount = privateKeyToAccount(process.env.EOA_PRIVATE_KEY as Hex);

async function createSmartAccountClientForChain(chainId: number) {
	const pimlicoUrl = `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${process.env.PIMLICO_API_KEY}`;

	const publicClient = createPublicClient({
		chain: CHAIN_CONFIG[chainId].chain,
		transport: http(),
	});

	const pimlicoClient = createPimlicoClient({
		transport: http(pimlicoUrl),
		entryPoint: {
			address: entryPoint07Address,
			version: "0.7",
		},
	});

	const account = await toSafeSmartAccount({
		client: publicClient,
		owners: [eoaAccount],
		entryPoint: {
			address: entryPoint07Address,
			version: "0.7",
		},
		version: "1.4.1",
	});

	const smartAccountClient = createSmartAccountClient({
		account,
		chain: CHAIN_CONFIG[chainId].chain,
		bundlerTransport: http(pimlicoUrl),
		paymaster: pimlicoClient,
		userOperation: {
			estimateFeesPerGas: async () => {
				return (await pimlicoClient.getUserOperationGasPrice()).fast;
			},
		},
	});

	return [smartAccountClient, publicClient] as const;
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { originChainId, destinationChainId, amount } = body;

		const [originSmartAccountClient, originPublicClient] =
			await createSmartAccountClientForChain(originChainId);

		const destinationAddress = originSmartAccountClient.account.address;

		const originChainInfo = CHAIN_CONFIG[originChainId];
		const destinationChainInfo = CHAIN_CONFIG[destinationChainId];

		if (!originChainInfo || !destinationChainInfo) {
			throw new Error("Invalid chain configuration");
		}

		// First approve USDC spending
		await originSmartAccountClient.writeContract({
			abi: usdcAbi,
			address: originChainInfo.usdcAddress,
			functionName: "approve",
			args: [
				originChainInfo.usdcMessengerAddress,
				BigInt(Math.floor(+amount * 10 ** USDC_DECIMALS)),
			],
		});

		// Sleep for a few seconds to allow the approval to be mined
		await new Promise((resolve) => setTimeout(resolve, 5000));

		// Then execute the bridge transfer
		const txHash = await originSmartAccountClient.writeContract({
			abi: tokenMessengerAbi,
			address: originChainInfo.usdcMessengerAddress,
			functionName: "depositForBurn",
			args: [
				BigInt(Math.floor(+amount * 10 ** USDC_DECIMALS)),
				destinationChainInfo.domainId,
				`0x${"00".repeat(12)}${destinationAddress.slice(2)}`,
				originChainInfo.usdcAddress,
			],
		});

		const transactionReceipt = await getTransactionReceipt(originPublicClient, {
			hash: txHash,
		});
		const log = transactionReceipt.logs.find(
			(l) => l.topics[0] === keccak256(toBytes("MessageSent(bytes)")),
		);
		if (!log) {
			throw new Error("MessageSent event not found");
		}
		const messageBytes = decodeAbiParameters(
			[{ name: "x", type: "bytes" }],
			log.data,
		)[0];
		const messageHash = keccak256(messageBytes);

		let attestationResponse = { status: "pending", attestation: "" };
		while (attestationResponse.status !== "complete") {
			const response = await fetch(
				`https://iris-api-sandbox.circle.com/attestations/${messageHash}`,
			);
			attestationResponse = await response.json();
			console.log("Attestation response:", attestationResponse);
			await new Promise((r) => setTimeout(r, 5000));
		}

		console.log("Attestation response:", attestationResponse);

		const destinationWalletClient = await createWalletClient({
			chain: CHAIN_CONFIG[destinationChainId].chain,
			transport: http(),
		});

		await destinationWalletClient.writeContract({
			account: eoaAccount,
			address: CHAIN_CONFIG[destinationChainId].usdcMessageTransmitterAddress,
			abi: messageTransmitterAbi,
			functionName: "receiveMessage",
			args: [messageBytes, attestationResponse.attestation],
		});

		return NextResponse.json({
			success: true,
			txHash,
		});
	} catch (error) {
		console.error("API Error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 500 },
		);
	}
}

export async function GET() {
	const [smartAccountClient] = await createSmartAccountClientForChain(
		sepolia.id,
	);

	return NextResponse.json({
		eoaWalletAddress: eoaAccount.address,
		smartWalletAddress: smartAccountClient.account.address,
	});
}
