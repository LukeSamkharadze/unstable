interface FooterProps {
  addresses: {
    eoaWalletAddress?: `0x${string}`;
    smartWalletAddress?: `0x${string}`;
  };
}

export const Footer = ({ addresses }: FooterProps) => {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center space-y-2">
          {addresses.eoaWalletAddress && (
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">EOA Wallet:</span>{" "}
              <span className="font-mono text-blue-600">{addresses.eoaWalletAddress}</span>
            </div>
          )}
          {addresses.smartWalletAddress && (
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">Smart Wallet:</span>{" "}
              <span className="font-mono text-blue-600">{addresses.smartWalletAddress}</span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
