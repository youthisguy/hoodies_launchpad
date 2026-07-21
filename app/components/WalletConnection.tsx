"use client";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { FaWallet } from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import { ACTIVE_CHAIN } from "../lib/chain";

export default function WalletConnection() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const wrongNetwork = isConnected && chainId !== ACTIVE_CHAIN.id;

  const buttonBaseClass =
    "group relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95 overflow-hidden";

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className={`${buttonBaseClass} border border-[#524981]/60 bg-zinc-950 hover:bg-[#3B0A82]/80 hover:border-[#524981]`}
      >
        <FaWallet style={{ color: "#524981" }} className="text-sm" />
        <span className="text-sm font-black tracking-widest uppercase" style={{ color: "#524981" }}>
          {isPending ? "Connecting..." : "Connect"}
        </span>
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: ACTIVE_CHAIN.id })}
        className={`${buttonBaseClass} border border-amber-500/50 bg-amber-500/10 text-amber-400 text-xs font-black uppercase tracking-widest`}
      >
        Switch to {ACTIVE_CHAIN.name}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 font-mono">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
      <button
        onClick={() => disconnect()}
        className={`${buttonBaseClass} border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/5`}
      >
        <MdLogout size={18} className="text-rose-500" />
      </button>
    </div>
  );
}