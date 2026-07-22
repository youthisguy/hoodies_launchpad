"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { formatEther, parseEther, type Address } from "viem";
import {
  ArrowLeft,
  Copy,
  CheckCheck,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Zap,
  X,
  CheckCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLaunchByToken } from "@/app/lib/useLaunchByToken";
import { LAUNCHPAD_ABI, ERC20_ABI } from "@/app/lib/contracts";
import { ACTIVE_CHAIN } from "@/app/lib/chain";

function fmtHoodie(wei: bigint | number): string {
  return Number(formatEther(BigInt(wei))).toFixed(2);
}
function pct(funded: bigint, target: bigint): number {
  if (target === 0n) return 0;
  return Math.min(100, Number((funded * 100n) / target));
}
function fmtAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const explorerBase = ACTIVE_CHAIN.blockExplorers?.default.url;

const STATUS_CFG: Record<
  number,
  { label: string; badge: string; heading: string }
> = {
  0: {
    label: "LIVE",
    badge: "text-[#7a9a0a] border-[#CAF50E]/40 bg-[#CAF50E]/10",
    heading: "Bonding Curve Live",
  },
  1: {
    label: "MIGRATED",
    badge: "text-zinc-900 border-zinc-900 bg-[#CAF50E]",
    heading: "Migrated to AMM",
  },
};

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-zinc-600 hover:text-violet-400 transition-colors ml-1 shrink-0"
    >
      {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex justify-between py-3 border-b border-zinc-800/50">
      <div className="h-3 w-28 rounded bg-zinc-800 animate-pulse" />
      <div className="h-3 w-36 rounded bg-zinc-800 animate-pulse" />
    </div>
  );
}

function TimelineStep({
  title,
  desc,
  active,
  done,
}: {
  title: string;
  desc: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full mt-0.5 shrink-0 border-2 transition-colors
        ${
          done
            ? "bg-[#7a9a0a] border-[#7a9a0a]"
            : active
            ? "bg-[#CAF50E] border-[#CAF50E]"
            : "bg-zinc-200 border-zinc-300"
        }`}
        />
        <div className="w-px flex-1 bg-zinc-900/15 mt-1" />
      </div>
      <div className="pb-5">
        <p
          className={`text-xs font-bold ${
            active ? "text-zinc-900" : done ? "text-zinc-700" : "text-zinc-400"
          }`}
        >
          {title}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function LaunchDetailPage() {
  const params = useParams();
  const tokenAddress = params?.id as string as Address;
  const {
    launch,
    loading: metaLoading,
    notFound: metaNotFound,
  } = useLaunchByToken(tokenAddress);

  const { address: connectedAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });

  const launchpadAddr = launch?.launchpadId as Address;
  const tokenAddr = launch?.tokenId as Address;

  // chain state
  const [state, setState] = useState<number | null>(null);
  const [funded, setFunded] = useState<bigint>(0n);
  const [target, setTarget] = useState<bigint>(0n);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [hoodieBalance, setHoodieBalance] = useState<bigint>(0n);
  const [hoodieAddr, setHoodieAddr] = useState<Address | null>(null);
  const [chainLoading, setChainLoading] = useState(true);

  // ui state
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<{
    type: "success" | "error" | "pending";
    msg: string;
    hash?: string;
  } | null>(null);

  const readChain = useCallback(async () => {
    if (!publicClient || !launch) return;
    try {
      setChainLoading(true);

      const [isMigrated, realHoodie, threshold, hoodieTokenAddr] =
        await Promise.all([
          publicClient.readContract({
            address: launchpadAddr,
            abi: LAUNCHPAD_ABI,
            functionName: "migrated",
          }),
          publicClient.readContract({
            address: launchpadAddr,
            abi: LAUNCHPAD_ABI,
            functionName: "realHoodieReserves",
          }),
          publicClient.readContract({
            address: launchpadAddr,
            abi: LAUNCHPAD_ABI,
            functionName: "migrationThreshold",
          }),
          publicClient.readContract({
            address: launchpadAddr,
            abi: LAUNCHPAD_ABI,
            functionName: "hoodie",
          }),
        ]);

      setState(isMigrated ? 1 : 0);
      setFunded(BigInt(realHoodie as bigint));
      setTarget(BigInt(threshold as bigint));
      setHoodieAddr(hoodieTokenAddr as Address);

      if (connectedAddress) {
        const [rawTokenBal, rawHoodieBal] = await Promise.all([
          publicClient.readContract({
            address: tokenAddr,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [connectedAddress],
          }),
          publicClient.readContract({
            address: hoodieTokenAddr as Address,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [connectedAddress],
          }),
        ]);
        setTokenBalance(BigInt(rawTokenBal as bigint));
        setHoodieBalance(BigInt(rawHoodieBal as bigint));
      }
    } catch (e) {
      console.error("[detail] readChain error:", e);
    } finally {
      setChainLoading(false);
    }
  }, [connectedAddress, launchpadAddr, tokenAddr, publicClient, launch]);

  useEffect(() => {
    readChain();
  }, [readChain]);

  useEffect(() => {
    if (txStatus && txStatus.type !== "pending") {
      const t = setTimeout(() => setTxStatus(null), 10000);
      return () => clearTimeout(t);
    }
  }, [txStatus]);

  async function ensureAllowance(erc20: Address, amount: bigint) {
    const allowance = (await publicClient!.readContract({
      address: erc20,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [connectedAddress!, launchpadAddr],
    })) as bigint;
    if (allowance < amount) {
      const approveHash = await writeContractAsync({
        address: erc20,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [launchpadAddr, amount],
      });
      await publicClient!.waitForTransactionReceipt({ hash: approveHash });
    }
  }

  const handleBuy = async () => {
    if (
      !buyAmount ||
      parseFloat(buyAmount) <= 0 ||
      !hoodieAddr ||
      !connectedAddress
    )
      return;
    setTxLoading(true);
    setTxStatus({ type: "pending", msg: "Approve buy" });
    try {
      const amount = parseEther(buyAmount);
      await ensureAllowance(hoodieAddr, amount);
      const hash = await writeContractAsync({
        address: launchpadAddr,
        abi: LAUNCHPAD_ABI,
        functionName: "buy",
        args: [amount, 0n], // TODO: replace 0n with a real slippage-adjusted minTokensOut before mainnet
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      setTxStatus({ type: "success", msg: "Buy confirmed!", hash });
      setBuyAmount("");
      await readChain();
    } catch (err: any) {
      setTxStatus({
        type: "error",
        msg: err.shortMessage || err.message || "Buy failed",
      });
    } finally {
      setTxLoading(false);
    }
  };

  const handleSell = async () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0 || !connectedAddress) return;
    setTxLoading(true);
    setTxStatus({ type: "pending", msg: "Processing" });
    try {
      const amount = parseEther(sellAmount);
      await ensureAllowance(tokenAddr, amount);
      const hash = await writeContractAsync({
        address: launchpadAddr,
        abi: LAUNCHPAD_ABI,
        functionName: "sell",
        args: [amount, 0n], // TODO: same slippage caveat as buy
      });
      await publicClient!.waitForTransactionReceipt({ hash });
      setTxStatus({ type: "success", msg: "Sell confirmed!", hash });
      setSellAmount("");
      await readChain();
    } catch (err: any) {
      setTxStatus({
        type: "error",
        msg: err.shortMessage || err.message || "Sell failed",
      });
    } finally {
      setTxLoading(false);
    }
  };

  if (metaNotFound) return notFound();
  if (metaLoading || !launch) {
    return (
      <div className="min-h-screen bg-[#F1EBDC] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
      </div>
    );
  }

  const progress = pct(funded, target);
  const fundedHoodie = fmtHoodie(funded);
  const targetHoodie = target > 0n ? fmtHoodie(target) : String(launch.softCap);
  const myTokens = fmtHoodie(tokenBalance);
  const myHoodie = fmtHoodie(hoodieBalance);

  const offeredNum = parseFloat(launch.offered.split(" ")[0].replace(/,/g, ""));
  const rate =
    target > 0n && offeredNum > 0
      ? (Number(formatEther(target)) / offeredNum).toFixed(6)
      : "—";

  const canBuy = state === 0 && isConnected;
  const canSell = state === 0 && tokenBalance > 0n && isConnected;

  const cfg = STATUS_CFG[state ?? 0];

  const hue =
    launch.ticker
      .split("")
      .reduce((acc: any, c: string) => acc + c.charCodeAt(0), 0) % 360;

  const metaRows = [
    {
      label: "Launchpad Address",
      value: launch.launchpadId,
      copyable: true,
      link: `${explorerBase}/address/${launch.launchpadId}`,
    },
    { label: "Token Name", value: launch.name },
    { label: "Token Symbol", value: launch.ticker },
    {
      label: "Token Address",
      value: launch.tokenId,
      copyable: true,
      link: `${explorerBase}/address/${launch.tokenId}`,
    },
    { label: "Total Supply", value: launch.offered },
    { label: "Migration Threshold", value: `${targetHoodie} HOODIE` },
    { label: "Exchange Rate", value: `1 ${launch.ticker} = ${rate} HOODIE` },
    { label: "Network", value: ACTIVE_CHAIN.name },
 
  ];

  return (
    <div className="min-h-screen bg-[#F1EBDC] text-zinc-900 font-mono">
      <div className="relative max-w-6xl mx-auto px-4 py-8 pb-28">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-600 hover:text-[#7a9a0a] text-xs tracking-wider transition-colors mb-8 group"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          All Launches
        </Link>

        <div className="flex items-center gap-4 mb-8">
          {launch.icon ? (
            <img
              src={launch.icon}
              alt={launch.ticker}
              className="w-14 h-14 rounded-full border-2 border-zinc-900 object-cover"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-black text-white border-2 border-zinc-900 shrink-0"
              style={{ background: `hsl(${hue},55%,25%)` }}
            >
              {launch.ticker.slice(0, 2)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                {launch.ticker} Fairlaunch
              </h1>
              {state !== null && !chainLoading && (
                <span
                  className={`text-[10px] font-bold px-3 py-1 rounded-full border tracking-widest ${cfg.badge}`}
                >
                  {cfg.label}
                </span>
              )}
            </div>
            <p className="text-zinc-600 text-sm mt-0.5">{launch.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
          {/* LEFT: metadata */}
          <div className="border-2 border-zinc-900 rounded-2xl overflow-hidden bg-[#FBF8EE] shadow-[4px_4px_0_0_rgba(24,24,27,1)]">
            <div className="px-6 py-4 border-b-2 border-zinc-900">
              <h2 className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">
                Token Info
              </h2>
            </div>
            <div className="divide-y divide-zinc-900/10">
              {chainLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="px-6">
                      <SkeletonRow />
                    </div>
                  ))
                : metaRows.map(({ label, value, copyable, link }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-6 py-3 hover:bg-zinc-900/[0.03] transition-colors gap-4"
                    >
                      <span className="text-xs text-zinc-500 shrink-0">
                        {label}
                      </span>
                      <div className="flex items-center gap-1 text-right">
                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#7a9a0a] hover:text-[#5a7a0a] font-mono transition-colors flex items-center gap-1"
                          >
                            {value.length > 20
                              ? fmtAddr(value as string)
                              : value}
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-800 font-mono">
                            {value}
                          </span>
                        )}
                        {copyable && <CopyBtn value={value as string} />}
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* RIGHT: actions */}
          <div className="space-y-4">
            <div className="border-2 border-zinc-900 rounded-2xl p-5 bg-[#FBF8EE] shadow-[4px_4px_0_0_rgba(24,24,27,1)] space-y-4">
              <h2 className="text-sm font-black text-zinc-900">
                {chainLoading ? (
                  <div className="h-4 w-24 rounded bg-zinc-200 animate-pulse" />
                ) : (
                  cfg.heading
                )}
              </h2>
              {chainLoading ? (
                <div className="h-8 w-40 rounded bg-zinc-200 animate-pulse" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-zinc-900 tabular-nums">
                    {fundedHoodie}
                  </span>
                  <span className="text-zinc-500 text-sm">
                    / {targetHoodie} HOODIE
                  </span>
                </div>
              )}
              <div className="space-y-1.5">
                <div className="h-2 bg-zinc-200 rounded-full overflow-hidden border border-zinc-900/10">
                  {chainLoading ? (
                    <div className="h-full w-1/4 bg-zinc-300 animate-pulse rounded-full" />
                  ) : (
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#7a9a0a] to-[#CAF50E]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  )}
                </div>
                <p className="text-[11px] text-[#7a9a0a] font-bold">
                  {chainLoading ? "" : `${progress.toFixed(2)}%`}
                </p>
              </div>
              {isConnected && (
                <div className="pt-2 border-t border-zinc-900/10 space-y-1">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                    Your holdings
                  </p>
                  <div className="flex items-center justify-between bg-[#CAF50E]/10 border border-zinc-900/10 rounded-xl px-4 py-2.5">
                    <span className="text-sm font-bold text-zinc-900">
                      {myTokens} {launch.ticker}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {myHoodie} HOODIE
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Buy */}
            {canBuy && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-2 border-zinc-900 rounded-2xl p-5 space-y-4 bg-[#FBF8EE] shadow-[4px_4px_0_0_rgba(24,24,27,1)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap size={13} className="text-[#7a9a0a]" /> Buy
                  </p>
                  <span className="text-[10px] text-zinc-500">
                    Balance:{" "}
                    <span className="text-zinc-700">{myHoodie} HOODIE</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="w-full bg-white border-2 border-zinc-900 rounded-xl px-4 py-3 text-lg font-bold text-zinc-900 outline-none focus:border-[#7a9a0a] transition-colors pr-14"
                    />
                    <button
                      onClick={() => setBuyAmount(myHoodie)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#7a9a0a] hover:text-[#5a7a0a] tracking-wider"
                    >
                      MAX
                    </button>
                  </div>
                  <span className="flex items-center text-zinc-500 text-sm font-bold px-1">
                    HOODIE
                  </span>
                </div>
                <button
                  onClick={handleBuy}
                  disabled={
                    txLoading ||
                    !buyAmount ||
                    parseFloat(buyAmount) <= 0 ||
                    parseFloat(buyAmount) > parseFloat(myHoodie)
                  }
                  className="w-full py-3.5 rounded-xl bg-[#CAF50E] hover:bg-[#B8E00D] text-zinc-900 border-2 border-zinc-900 font-black tracking-widest uppercase text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {txLoading ? (
                    <>
                      <RotateCcw size={15} className="animate-spin" />{" "}
                      Approving
                    </>
                  ) : parseFloat(buyAmount || "0") > parseFloat(myHoodie) ? (
                    <>
                      <AlertCircle size={15} /> Insufficient Balance
                    </>
                  ) : (
                    <>Buy {launch.ticker}</>
                  )}
                </button>
              </motion.div>
            )}

            {/* Sell */}
            {canSell && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-2 border-zinc-900 rounded-2xl p-5 space-y-4 bg-[#FBF8EE] shadow-[4px_4px_0_0_rgba(24,24,27,1)]"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-zinc-700 uppercase tracking-widest">
                    Sell
                  </p>
                  <span className="text-[10px] text-zinc-500">
                    Balance:{" "}
                    <span className="text-zinc-700">
                      {myTokens} {launch.ticker}
                    </span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      className="w-full bg-white border-2 border-zinc-900 rounded-xl px-4 py-3 text-lg font-bold text-zinc-900 outline-none focus:border-[#7a9a0a] transition-colors pr-14"
                    />
                    <button
                      onClick={() => setSellAmount(myTokens)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#7a9a0a] hover:text-[#5a7a0a] tracking-wider"
                    >
                      MAX
                    </button>
                  </div>
                  <span className="flex items-center text-zinc-500 text-sm font-bold px-1">
                    {launch.ticker}
                  </span>
                </div>
                <button
                  onClick={handleSell}
                  disabled={
                    txLoading ||
                    !sellAmount ||
                    parseFloat(sellAmount) <= 0 ||
                    parseFloat(sellAmount) > parseFloat(myTokens)
                  }
                  className="w-full py-3.5 rounded-xl border-2 border-zinc-900 hover:bg-zinc-900/5 text-zinc-900 font-black tracking-widest uppercase text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {txLoading ? (
                    <>
                      <RotateCcw size={15} className="animate-spin" />{" "}
                      Approving
                    </>
                  ) : (
                    <>Sell {launch.ticker}</>
                  )}
                </button>
              </motion.div>
            )}

            {!isConnected && state === 0 && (
              <div className="border-2 border-dashed border-zinc-900/30 rounded-2xl p-6 text-center space-y-2">
                <p className="text-zinc-600 text-sm">
                  Connect your wallet to participate
                </p>
              </div>
            )}

            {/* Timeline — collapsed to 2 real phases */}
            <div className="border-2 border-zinc-900 rounded-2xl p-5 bg-[#FBF8EE] shadow-[4px_4px_0_0_rgba(24,24,27,1)]">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-5">
                Curve Timeline
              </p>
              <div>
                <TimelineStep
                  title="Bonding curve live"
                  desc="Buy/sell against the curve"
                  active={state === 0}
                  done={(state ?? -1) >= 0}
                />
                <TimelineStep
                  title="Migration"
                  desc={
                    state === 1
                      ? "Liquidity migrated to AMM pair"
                      : "Triggers automatically at migration threshold"
                  }
                  active={state === 1}
                  done={state === 1}
                />
              </div>
            </div>

            <div className="border-2 border-zinc-900/20 rounded-2xl p-5 space-y-3 bg-[#FBF8EE]/60">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Contracts
              </p>
              {[
                { label: "Launchpad", addr: launch.launchpadId },
                { label: "Token", addr: launch.tokenId },
              ].map(({ label, addr }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {label}
                  </span>
                  <a
                    href={`${explorerBase}/address/${addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-zinc-600 hover:text-[#7a9a0a] transition-colors flex items-center gap-1"
                  >
                    {fmtAddr(addr)}
                    <ExternalLink size={10} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {txStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed bottom-28 left-1/2 -translate-x-1/2 w-full max-w-sm mx-4 p-4 rounded-2xl flex items-center justify-between gap-4 border-2 border-zinc-900 z-50 shadow-[4px_4px_0_0_rgba(24,24,27,1)]
          ${
            txStatus.type === "success"
              ? "bg-[#E8F5C4] text-[#4a6a00]"
              : txStatus.type === "error"
              ? "bg-rose-100 text-rose-700"
              : "bg-[#FBF8EE] text-zinc-900"
          }`}
          >
            <div className="flex items-center gap-3 font-bold text-sm">
              <AlertCircle size={15} />
              <span className="text-xs">{txStatus.msg}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {txStatus.hash && (
                <a
                  href={`${explorerBase}/tx/${txStatus.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-zinc-900/10 rounded-lg transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              )}
              <button
                onClick={() => setTxStatus(null)}
                className="p-1.5 hover:bg-zinc-900/10 rounded-lg transition-colors text-zinc-500"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
