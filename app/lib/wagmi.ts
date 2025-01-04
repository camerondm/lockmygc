import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is not set");
}

export const config = getDefaultConfig({
  appName: "LockMyGC",
  projectId,
  chains: [base],
  ssr: true,
});
