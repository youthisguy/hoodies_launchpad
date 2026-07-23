"use client";
import { useEffect, useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem, formatEther, type Address } from "viem";
import { TOKEN_LAUNCHER_ABI } from "./contracts";
import { ACTIVE_CHAIN } from "./chain";

const BUY_EVENT = parseAbiItem(
  "event Buy(address indexed buyer, uint256 hoodieIn, uint256 tokensOut, uint256 feePaid)"
);
const SELL_EVENT = parseAbiItem(
  "event Sell(address indexed seller, uint256 tokensIn, uint256 hoodieOut, uint256 feePaid)"
);
const FACTORY_DEPLOY_BLOCK = 15600000n; // same caveat as elsewhere: will hit RPC log-range limits as the chain grows

export function useLauncherFeesEarned(launcherAddress: Address | undefined) {
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });
  const [totalFeesHoodie, setTotalFeesHoodie] = useState<string>("0");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!publicClient || !launcherAddress) return;
    setLoading(true);
    try {
      // Step 1: every launchpad this launcher has ever created
      const total = (await publicClient.readContract({
        address: launcherAddress,
        abi: TOKEN_LAUNCHER_ABI,
        functionName: "totalLaunches",
      })) as bigint;

      const indices = Array.from({ length: Number(total) }, (_, i) => i);
      const launchpadAddrs = await Promise.all(
        indices.map(async (i) => {
          const [launchpad] = (await publicClient.readContract({
            address: launcherAddress,
            abi: TOKEN_LAUNCHER_ABI,
            functionName: "allLaunches",
            args: [BigInt(i)],
          })) as [Address, Address, Address];
          return launchpad;
        })
      );

      if (launchpadAddrs.length === 0) {
        setTotalFeesHoodie("0");
        return;
      }

      // Step 2: sum feePaid from every Buy + Sell event across all of them
      const [buyLogs, sellLogs] = await Promise.all([
        publicClient.getLogs({
          address: launchpadAddrs,
          event: BUY_EVENT,
          fromBlock: FACTORY_DEPLOY_BLOCK,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: launchpadAddrs,
          event: SELL_EVENT,
          fromBlock: FACTORY_DEPLOY_BLOCK,
          toBlock: "latest",
        }),
      ]);

      const sum = [...buyLogs, ...sellLogs].reduce((acc, log) => {
        const feePaid = (log.args as any).feePaid as bigint;
        return acc + feePaid;
      }, 0n);

      setTotalFeesHoodie(formatEther(sum));
    } catch (e) {
      console.error("[useLauncherFeesEarned] error:", e);
      setTotalFeesHoodie("0");
    } finally {
      setLoading(false);
    }
  }, [publicClient, launcherAddress]);

  useEffect(() => { load(); }, [load]);

  return { totalFeesHoodie, loading, refetch: load };
}