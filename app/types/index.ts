export interface Addresses {
  eoaWalletAddress?: `0x${string}`;
  smartWalletAddress?: `0x${string}`;
}

export interface TransferFormData {
  originChainId: number;
  destinationChainId: number;
  destinationAddress: string;
  amount: string;
}
