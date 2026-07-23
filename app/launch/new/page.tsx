"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseEther, formatEther, decodeEventLog, type Address } from "viem";
import { ArrowLeft, Rocket, AlertCircle, RotateCcw, ChevronDown, PlusCircle, CheckCircle2 } from "lucide-react";
import { FACTORY_ADDRESS, FACTORY_ABI, TOKEN_LAUNCHER_ABI } from "@/app/lib/contracts";
import { ACTIVE_CHAIN } from "@/app/lib/chain";
import { useMyLaunchers, type LauncherInfo } from "@/app/lib/useMyLaunchers";
import { useLauncherFeesEarned } from "@/app/lib/useLauncherFeesEarned";

function fmtBps(bps: number) {
  return `${(bps / 100).toFixed(2)}%`;
}
function fmtDuration(seconds: number) {
  const days = Math.round(seconds / 86400);
  return `${days}d`;
}
function fmtAddr(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}
function LauncherRow({
  launcher,
  selected,
  onSelect,
}: {
  launcher: LauncherInfo;
  selected: boolean;
  onSelect: () => void;
}) {
  const { totalFeesHoodie } = useLauncherFeesEarned(launcher.address);

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3.5 rounded-xl border-2 transition-colors
        ${selected ? "border-[#CAF50E] bg-[#CAF50E]/10" : "border-black/15 bg-white hover:border-black/40"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-black font-mono">{fmtAddr(launcher.address)}</span>
        {selected && <CheckCircle2 size={14} className="text-[#7a9a0a]" />}
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1 text-[10px] text-zinc-600">
        <span>Fee: <b className="text-black">{fmtBps(launcher.feeBps)}</b></span>
        <span>Vesting: <b className="text-black">{fmtDuration(launcher.creatorVestingDuration)}</b></span>
        <span>Migration @ <b className="text-black">{formatEther(launcher.migrationThreshold)} HOODIE</b></span>
        <span>Total launches: <b className="text-black">{launcher.totalLaunches}</b></span>
        <span>Fees earned: <b className="text-black">{totalFeesHoodie} HOODIE</b></span>
      </div>
    </button>
  );
}

export default function LaunchNewPage() {
  const router = useRouter();
  const { address: connectedAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });
  const { launchers, loading: launchersLoading, refetch } = useMyLaunchers();

  const [selectedLauncher, setSelectedLauncher] = useState<Address | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);

  // ── global caps, for validating a new launcher ──
  const [globalMaxFeeBps, setGlobalMaxFeeBps] = useState<number>(1000);
  const [globalMaxCreatorBps, setGlobalMaxCreatorBps] = useState<number>(2000);

  useEffect(() => {
    if (!publicClient) return;
    (async () => {
      try {
        const [maxFee, maxCreator] = await Promise.all([
          publicClient.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "globalMaxFeeBps" }),
          publicClient.readContract({ address: FACTORY_ADDRESS, abi: FACTORY_ABI, functionName: "globalMaxCreatorAllocationBps" }),
        ]);
        setGlobalMaxFeeBps(Number(maxFee as number));
        setGlobalMaxCreatorBps(Number(maxCreator as number));
      } catch (e) {
        console.error("[launch/new] global caps read error:", e);
      }
    })();
  }, [publicClient]);

  // ── new-launcher form state ──
  const [newFeeBps, setNewFeeBps] = useState(100); // 1%
  const [newMaxCreatorBps, setNewMaxCreatorBps] = useState(2000); // 20%
  const [newVestingDays, setNewVestingDays] = useState(180);
  const [newVirtualTokenBuffer, setNewVirtualTokenBuffer] = useState("250000000"); // whole tokens
  const [newVirtualHoodie, setNewVirtualHoodie] = useState("153061224");
  const [newMigrationThreshold, setNewMigrationThreshold] = useState("1020408163");
  const [createLoading, setCreateLoading] = useState(false);
  const [createStatus, setCreateStatus] = useState<{ type: "error" | "pending"; msg: string } | null>(null);

  const handleCreateLauncher = async () => {
    if (!connectedAddress || !publicClient) return;
    if (newFeeBps > globalMaxFeeBps || newMaxCreatorBps > globalMaxCreatorBps) return;
    setCreateLoading(true);
    setCreateStatus({ type: "pending", msg: "Creating launcher…" });
    try {
      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "createLauncher",
        args: [
          connectedAddress, // feeRecipient — defaults to yourself, editable below if you add a field
          newFeeBps,
          newMaxCreatorBps,
          BigInt(newVestingDays * 86400),
          [
            parseEther(newVirtualTokenBuffer),
            parseEther(newVirtualHoodie),
            parseEther(newMigrationThreshold),
          ],
        ],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      let newLauncherAddr: Address | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: FACTORY_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === "LauncherCreated") {
            newLauncherAddr = (decoded.args as any).launcher;
            break;
          }
        } catch {}
      }

      await refetch();
      if (newLauncherAddr) {
        setSelectedLauncher(newLauncherAddr);
        setCreatingNew(false);
      }
      setCreateStatus(null);
    } catch (err: any) {
      setCreateStatus({ type: "error", msg: err.shortMessage || err.message || "Failed to create launcher" });
    } finally {
      setCreateLoading(false);
    }
  };

  // ── token launch form state (unchanged from before, just scoped to selectedLauncher) ──
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("1000000000");
  const [creatorAllocationPct, setCreatorAllocationPct] = useState(5);
  const [txLoading, setTxLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<{ type: "error" | "pending"; msg: string } | null>(null);

  const activeLauncher = launchers.find((l) => l.address === selectedLauncher) || null;
  const maxCreatorPct = activeLauncher ? activeLauncher.maxCreatorAllocationBps / 100 : 20;
  const creatorAllocationBps = Math.round(creatorAllocationPct * 100);

  const canSubmit =
    isConnected &&
    !!selectedLauncher &&
    name.trim().length > 0 &&
    symbol.trim().length > 0 &&
    parseFloat(totalSupply) > 0 &&
    creatorAllocationBps <= (activeLauncher?.maxCreatorAllocationBps ?? 2000) &&
    !txLoading;

  const handleLaunch = async () => {
    if (!canSubmit || !publicClient || !selectedLauncher) return;
    setTxLoading(true);
    setTxStatus({ type: "pending", msg: "Broadcasting launch…" });
    try {
      const supplyWei = parseEther(totalSupply);
      const hash = await writeContractAsync({
        address: selectedLauncher,
        abi: TOKEN_LAUNCHER_ABI,
        functionName: "launch",
        args: [name.trim(), symbol.trim().toUpperCase(), supplyWei, creatorAllocationBps],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      let tokenAddr: string | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: TOKEN_LAUNCHER_ABI, data: log.data, topics: log.topics });
          if (decoded.eventName === "Launched") {
            tokenAddr = (decoded.args as any).token;
            break;
          }
        } catch {}
      }

      if (tokenAddr) {
        router.push(`/launch/${tokenAddr}`);
      } else {
        setTxStatus({ type: "error", msg: "Launched, but couldn't parse the token address — check Blockscout." });
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
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 hover:text-[#7a9a0a] text-xs tracking-wider transition-colors mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          All Launches
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-full bg-[#CAF50E] border-2 border-zinc-900 flex items-center justify-center shrink-0">
            <Rocket size={20} className="text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Launch a Token</h1>
            <p className="text-zinc-600 text-sm">Select a launcher to launch token or create a new launcher</p>
          </div>
        </div>

        {/* ── Step 1: launcher selection ── */}
        <div className="border-2 border-black rounded-2xl p-6 bg-[#FBF8EE] shadow-[4px_4px_0px_0px_#000] space-y-4 mb-6">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Your Launchers</p>

          {!isConnected ? (
            <p className="text-sm text-zinc-500">Connect your wallet to create launchers.</p>
          ) : launchersLoading ? (
            <div className="h-16 rounded-xl bg-zinc-200 animate-pulse" />
          ) : launchers.length === 0 && !creatingNew ? (
            <p className="text-sm text-zinc-500">You don't have a launcher yet.</p>
          ) : (
            <div className="space-y-2">
            {launchers.map((l) => (
              <LauncherRow
                key={l.address}
                launcher={l}
                selected={selectedLauncher === l.address}
                onSelect={() => { setSelectedLauncher(l.address); setCreatingNew(false); }}
              />
            ))}
          </div>
          )}

          {isConnected && (
            <button
              onClick={() => { setCreatingNew(!creatingNew); setSelectedLauncher(null); }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-black/30 text-xs font-bold text-zinc-600 hover:border-black/60 hover:text-black transition-colors"
            >
              <PlusCircle size={13} /> Create a new launcher
              <ChevronDown size={13} className={`transition-transform ${creatingNew ? "rotate-180" : ""}`} />
            </button>
          )}

          {creatingNew && (
            <div className="space-y-4 pt-2 border-t border-black/10">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    Fee ({fmtBps(newFeeBps)}, cap {fmtBps(globalMaxFeeBps)})
                  </label>
                  <input type="range" min={0} max={globalMaxFeeBps} value={newFeeBps}
                    onChange={(e) => setNewFeeBps(parseInt(e.target.value))}
                    className="mt-1.5 w-full accent-[#CAF50E]" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    Max creator alloc ({fmtBps(newMaxCreatorBps)}, cap {fmtBps(globalMaxCreatorBps)})
                  </label>
                  <input type="range" min={0} max={globalMaxCreatorBps} value={newMaxCreatorBps}
                    onChange={(e) => setNewMaxCreatorBps(parseInt(e.target.value))}
                    className="mt-1.5 w-full accent-[#CAF50E]" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Creator vesting (days)</label>
                <input type="number" value={newVestingDays} onChange={(e) => setNewVestingDays(parseInt(e.target.value) || 0)}
                  className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-[#CAF50E]" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* <div>
                  <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Virtual token buffer</label>
                  <input type="number" value={newVirtualTokenBuffer} onChange={(e) => setNewVirtualTokenBuffer(e.target.value)}
                    className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#CAF50E]" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Virtual HOODIE reserves</label>
                  <input type="number" value={newVirtualHoodie} onChange={(e) => setNewVirtualHoodie(e.target.value)}
                    className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#CAF50E]" />
                </div> */}
                <div>
                  <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Migration threshold</label>
                  <input type="number" value={newMigrationThreshold} onChange={(e) => setNewMigrationThreshold(e.target.value)}
                    className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#CAF50E]" />
                </div>
              </div>

              {createStatus && (
                <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border-2
                  ${createStatus.type === "error" ? "border-rose-600 bg-rose-50 text-rose-700" : "border-black bg-white text-zinc-700"}`}>
                  <AlertCircle size={14} />
                  {createStatus.msg}
                </div>
              )}

              <button
                onClick={handleCreateLauncher}
                disabled={createLoading || newFeeBps > globalMaxFeeBps || newMaxCreatorBps > globalMaxCreatorBps}
                className="w-full py-3 rounded-xl bg-black hover:bg-zinc-800 text-[#CAF50E] font-black tracking-widest uppercase text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {createLoading ? (<><RotateCcw size={14} className="animate-spin" /> Creating…</>) : "Create Launcher"}
              </button>
            </div>
          )}
        </div>

        {/* ── Step 2: token launch form, only once a launcher is picked ── */}
        {activeLauncher && (
          <div className="border-2 border-black rounded-2xl p-6 bg-[#FBF8EE] shadow-[4px_4px_0px_0px_#000] space-y-5">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              Launching via {fmtAddr(activeLauncher.address)}
            </p>

            <div>
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Token Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#CAF50E]" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Ticker</label>
              <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} maxLength={11}
                className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#CAF50E]" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Total Supply</label>
              <input type="number" value={totalSupply} onChange={(e) => setTotalSupply(e.target.value)}
                className="mt-1.5 w-full bg-white border-2 border-black rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#CAF50E]" />
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Creator Allocation</label>
                <span className="text-xs font-bold text-black">{creatorAllocationPct}%</span>
              </div>
              <input type="range" min={0} max={maxCreatorPct} step={0.5} value={creatorAllocationPct}
                onChange={(e) => setCreatorAllocationPct(parseFloat(e.target.value))}
                className="mt-2 w-full accent-[#CAF50E]" />
              <p className="text-[10px] text-zinc-500 mt-1">
                Capped at {maxCreatorPct}% by this launcher, vests over {fmtDuration(activeLauncher.creatorVestingDuration)}.
              </p>
            </div>

            <div className="pt-3 border-t border-black/10 text-[11px] text-zinc-600">
              Graduates to a DEX pair once the curve raises{" "}
              <span className="font-bold text-black">{formatEther(activeLauncher.migrationThreshold)} HOODIE</span>.
              This launcher charges <span className="font-bold text-black">{fmtBps(activeLauncher.feeBps)}</span> per trade.
            </div>

            {txStatus && (
              <div className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border-2
                ${txStatus.type === "error" ? "border-rose-600 bg-rose-50 text-rose-700" : "border-black bg-white text-zinc-700"}`}>
                <AlertCircle size={14} />
                {txStatus.msg}
              </div>
            )}

            <button
              onClick={handleLaunch}
              disabled={!canSubmit}
              className="w-full py-3.5 rounded-xl bg-[#CAF50E] hover:bg-[#B8E00D] border-2 border-black text-black font-black tracking-widest uppercase text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {txLoading ? (<><RotateCcw size={15} className="animate-spin" /> Launching…</>) : (<><Rocket size={15} /> Launch {symbol || "Token"}</>)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}