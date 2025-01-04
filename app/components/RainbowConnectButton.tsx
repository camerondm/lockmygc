import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function RainbowConnectButton() {
  return (
    <div className="flex flex-col items-center">
      <p className="text-purple-50 font-mono">Base</p>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If your app doesn't use authentication, you
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="bg-blue-500 text-purple-50 font-normal rounded-[5px] p-3 flex items-center hover:bg-blue-600 transition-all duration-300"
                    >
                      Connect Base Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="bg-blue-500 text-purple-50 font-normal rounded-[5px] p-3 flex items-center"
                    >
                      Wrong network
                    </button>
                  );
                }

                return (
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="bg-blue-500 text-purple-50 font-normal rounded-[5px] p-3 flex items-center"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 24,
                          height: 24,
                          borderRadius: 999,
                          overflow: "hidden",
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            style={{ width: 24, height: 24 }}
                          />
                        )}
                      </div>
                    )}
                    {account.displayName}
                  </button>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
