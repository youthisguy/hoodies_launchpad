"use client";
import { useEffect, useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem, type Address } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI, ERC20_ABI } from "./contracts";
import { ACTIVE_CHAIN } from "./chain";
import type { LaunchMeta } from "../components/LaunchCard";

const LAUNCHED_EVENT = parseAbiItem(
  "event Launched(address indexed creator, address indexed launchpad, address indexed token, string name, string symbol, uint256 curveSupply, uint256 creatorAllocation, address vestingWallet)"
);
// will hit RPC log-range limits on most providers as the chain grows.
const FACTORY_DEPLOY_BLOCK = 15600000n;

export function useLaunchByToken(tokenAddress: Address | undefined) {
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });
  const [launch, setLaunch] = useState<LaunchMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!publicClient || !tokenAddress) return;
    setLoading(true);
    setNotFound(false);
    try {
      // Step 1: every launcher the factory has ever created
      const totalLaunchers = (await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "totalLaunchers",
      })) as bigint;

      const launcherIndices = Array.from({ length: Number(totalLaunchers) }, (_, i) => i);
      const launcherAddrs = await Promise.all(
        launcherIndices.map((i) =>
          publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: "allLaunchers",
            args: [BigInt(i)],
          }) as Promise<Address>
        )
      );

      if (launcherAddrs.length === 0) {
        setNotFound(true);
        return;
      }

      // Step 2: search Launched logs across all of them in one call, filtered
      // by the indexed `token` arg — works regardless of which launcher emitted it.
      const logs = await publicClient.getLogs({
        address: launcherAddrs,
        event: LAUNCHED_EVENT,
        args: { token: tokenAddress },
        fromBlock: FACTORY_DEPLOY_BLOCK,
        toBlock: "latest",
      });

      if (logs.length === 0) {
        setNotFound(true);
        return;
      }

      const { launchpad, token, name, symbol, curveSupply } = logs[0].args as any;

      const totalSupply = await publicClient
        .readContract({ address: token, abi: ERC20_ABI, functionName: "totalSupply" })
        .catch(() => curveSupply);

      setLaunch({
        id: token,
        name: name as string,
        ticker: symbol as string,
        launchpadId: launchpad as string,
        tokenId: token as string,
        softCap: 0,
        liquidity: 62.5,
        offered: `${(Number(totalSupply) / 1e18).toLocaleString()} ${symbol}`,
        icon: null,
      });
    } catch (e) {
      console.error("[useLaunchByToken] error:", e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [publicClient, tokenAddress]);

  useEffect(() => { load(); }, [load]);

  return { launch, loading, notFound };
}