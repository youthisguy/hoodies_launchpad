"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseEther, formatEther, decodeEventLog } from "viem";
import { ArrowLeft, Rocket, AlertCircle, RotateCcw } from "lucide-react";
import { TOKEN_LAUNCHER_ADDRESS, TOKEN_LAUNCHER_ABI } from "@/app/lib/contracts";
import { ACTIVE_CHAIN } from "@/app/lib/chain";


export default function LaunchNewPage() {
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("1000000000"); 
  const [creatorAllocationPct, setCreatorAllocationPct] = useState(5);  

  const [maxCreatorBps, setMaxCreatorBps] = useState<number | null>(null);
  const [migrationThreshold, setMigrationThreshold] = useState<bigint>(0n);
  const [configLoading, setConfigLoading] = useState(true);

  const [txLoading, setTxLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<{ type: "error" | "pending"; msg: string } | null>(null);

  useEffect(() => {
    if (!publicClient) return;
    (async () => {
      try {
        const [maxBps, defaults] = await Promise.all([
          publicClient.readContract({
            address: TOKEN_LAUNCHER_ADDRESS,
            abi: TOKEN_LAUNCHER_ABI,
            functionName: "maxCreatorAllocationBps",
          }),
          publicClient.readContract({
            address: TOKEN_LAUNCHER_ADDRESS,
            abi: TOKEN_LAUNCHER_ABI,
            functionName: "defaults",
          }),
        ]);
        setMaxCreatorBps(Number(maxBps as any));
        setMigrationThreshold((defaults as unknown as [bigint, bigint, bigint])[2]);
      } catch (e) {
        console.error("[launch/new] config read error:", e);
      } finally {
        setConfigLoading(false);
      }
    })();
  }, [publicClient]);

  const maxCreatorPct = maxCreatorBps !== null ? maxCreatorBps / 100 : 20;  
  const creatorAllocationBps = Math.round(creatorAllocationPct * 100);

  const canSubmit =
    isConnected &&
    name.trim().length > 0 &&
    symbol.trim().length > 0 &&
    parseFloat(totalSupply) > 0 &&
    creatorAllocationBps <= (maxCreatorBps ?? 2000) &&
    !txLoading;

  const handleLaunch = async () => {
    if (!canSubmit || !publicClient) return;
    setTxLoading(true);
    setTxStatus({ type: "pending", msg: "Processing" });
    try {
      const supplyWei = parseEther(totalSupply);
      const hash = await writeContractAsync({
        address: TOKEN_LAUNCHER_ADDRESS,
        abi: TOKEN_LAUNCHER_ABI,
        functionName: "launch",
        args: [name.trim(), symbol.trim().toUpperCase(), supplyWei, creatorAllocationBps],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Pull the new token address straight off the Launched event
      let tokenAddr: string | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: TOKEN_LAUNCHER_ABI,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "Launched") {
            tokenAddr = (decoded.args as any).token;
            break;
          }
        } catch {
          // not this event, skip
        }
      }

      if (tokenAddr) {
        router.push(`/launch/${tokenAddr}`);
      } else {
        setTxStatus({ type: "error", msg: "Launched, but couldn't parse the token address from the receipt — check the transaction on Blockscout." });
        setTxLoading(false);
      }
    } catch (err: any) {
      setTxStatus({ type: "error", msg: err.shortMessage || err.message || "Launch failed" });
      setTxLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1EBDC] text-zinc-900 font-mono">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-28">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-[#7a9a0a] text-xs tracking-wider transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          All Launches
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full bg-[#CAF50E] border-2 border-zinc-900 flex items-center justify-center shrink-0">
            <Rocket size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Launch a Token</h1>
            <p className="text-zinc-600 text-sm">Deploy a bonding-curve launchpad </p>
          </div>
        </div>

        <div className="border-2 border-black rounded-2xl p-6 bg-[#FBF8EE] shadow-[4px_4px_0px_0px_#000] space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Token Name</label>
            <input
              type="text"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#CAF50E] transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Ticker</label>
            <input
              type="text"
              placeholder=" "
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              maxLength={11}
              className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#CAF50E] transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Total Supply</label>
            <input
              type="number"
              value={totalSupply}
              onChange={(e) => setTotalSupply(e.target.value)}
              className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#CAF50E] transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline">
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                Creator Allocation
              </label>
              <span className="text-xs font-bold text-black">{creatorAllocationPct}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxCreatorPct}
              step={0.5}
              value={creatorAllocationPct}
              onChange={(e) => setCreatorAllocationPct(parseFloat(e.target.value))}
              disabled={configLoading}
              className="mt-2 w-full accent-[#CAF50E]"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              {configLoading ? "Loading cap…" : `Capped at ${maxCreatorPct}% — vested for 180 days.`}
            </p>
          </div>

          {!configLoading && migrationThreshold > 0n && (
            <div className="pt-3 border-t border-black/10 text-[11px] text-zinc-600">
              Graduates to a DEX pair once the curve raises{" "}
              <span className="font-bold text-black">{formatEther(migrationThreshold)} HOODIE</span>.
            </div>
          )}

          {txStatus && (
            <div
              className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border-2
                ${txStatus.type === "error" ? "border-rose-600 bg-rose-50 text-rose-700" : "border-black bg-white text-zinc-700"}`}
            >
              <AlertCircle size={14} />
              {txStatus.msg}
            </div>
          )}

          <button
            onClick={handleLaunch}
            disabled={!canSubmit}
            className="w-full py-3.5 rounded-xl bg-[#CAF50E] hover:bg-[#B8E00D] border-2 border-black
                       text-black font-black tracking-widest uppercase text-sm transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]
                       flex items-center justify-center gap-2"
          >
            {txLoading ? (
              <><RotateCcw size={15} className="animate-spin" /> Launching…</>
            ) : !isConnected ? (
              "Connect wallet to launch"
            ) : (
              <><Rocket size={15} /> Launch {symbol || "Token"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}