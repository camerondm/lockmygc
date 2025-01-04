import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Send } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const openTelegramBot = () => {
    window.open("https://t.me/lockmygc_bot", "_blank");
  };

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
        <div className="flex space-x-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={openTelegramBot}
              className="bg-[#0088cc] hover:bg-[#0077b5] text-white font-mono flex items-center rounded-[5px] text-base py-1 px-2"
            >
              <Send className="mr-2 h-4 w-4" />
              Open Bot
            </button>
          </motion.div>
          <Link
            href="https://dexscreener.com/solana/BcH93P52gwmAAEvVVevoS4m4rCVFQDVNqrApN9fSpump?1735949954874"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <button className="bg-purple-700 hover:bg-purple-600 text-purple-50 py-1 px-2 rounded-[5px]">
              Buy $LOCKMYGC
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
