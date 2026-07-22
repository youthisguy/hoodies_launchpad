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
    "group relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95 overflow-hidden " +
    "border-2 border-zinc-900 shadow-[3px_3px_0_0_rgba(24,24,27,1)] " +
    "hover:shadow-[4px_4px_0_0_rgba(24,24,27,1)] hover:-translate-y-0.5 " +
    "active:shadow-[1px_1px_0_0_rgba(24,24,27,1)] active:translate-y-0";

  if (!isConnected) {
    return (
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className={`${buttonBaseClass} bg-[#CAF50E] hover:bg-[#B8E00D] disabled:opacity-60 disabled:shadow-[3px_3px_0_0_rgba(24,24,27,1)] disabled:translate-y-0`}
      >
        <FaWallet className="text-sm text-zinc-900" />
        <span className="text-sm font-black tracking-widest uppercase text-zinc-900">
          {isPending ? "Connecting" : "Connect"}
        </span>
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: ACTIVE_CHAIN.id })}
        className={`${buttonBaseClass} bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-widest border-amber-700`}
      >
        Switch to {ACTIVE_CHAIN.name}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${buttonBaseClass} bg-[#FBF8EE] cursor-default hover:shadow-[3px_3px_0_0_rgba(24,24,27,1)] hover:-translate-y-0`}
      >
        <span className="h-2 w-2 rounded-full bg-[#7a9a0a] shrink-0" />
        <span className="text-sm text-zinc-900 font-mono font-bold">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>
      <button
        onClick={() => disconnect()}
        className={`${buttonBaseClass} bg-[#FBF8EE] hover:bg-rose-50 !px-2.5`}
      >
        <MdLogout size={18} className="text-rose-600" />
      </button>
    </div>
  );
}
