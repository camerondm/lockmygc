import Link from "next/link";
import { Button } from "@/app/components/ui/button";

export function Navbar() {
  return (
    <nav className="bg-purple-900/30 backdrop-blur-md border-b border-purple-500/30 py-4 z-[1000]">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex space-x-4">
          <Link
            href="https://twitter.com/lockmygc"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="ghost"
              className="text-purple-100 hover:text-purple-200"
            >
              Twitter
            </Button>
          </Link>
          {/* <Link
            href="https://t.me/lockmygc"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="ghost"
              className="text-purple-100 hover:text-purple-200"
            >
              Telegram
            </Button>
          </Link> */}
        </div>
        <Link
          href="https://dexscreener.com/solana/BcH93P52gwmAAEvVVevoS4m4rCVFQDVNqrApN9fSpump?1735949954874"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="bg-purple-700 hover:bg-purple-600 text-purple-50">
            Buy $LOCKMYGC
          </Button>
        </Link>
      </div>
    </nav>
  );
}
