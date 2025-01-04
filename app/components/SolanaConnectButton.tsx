import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function SolanaConnectButton() {
  return (
    <div className="flex flex-col items-center">
      <p className="text-purple-50 font-mono">Solana</p>
      <WalletMultiButton />
    </div>
  );
}
