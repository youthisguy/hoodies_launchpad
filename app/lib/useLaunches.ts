"use client";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { formatEther, type Address } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI, TOKEN_LAUNCHER_ABI, LAUNCHPAD_ABI, ERC20_ABI } from "./contracts";
import type { LaunchMeta } from "../components/LaunchCard";
import { ACTIVE_CHAIN } from "./chain";

export function useLaunches() {
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });
  const [launches, setLaunches] = useState<LaunchMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicClient) return;
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        // ── Step 1: enumerate every launcher the factory has ever created ──
        const totalLaunchers = (await publicClient?.readContract({
          address: FACTORY_ADDRESS,
          abi: FACTORY_ABI,
          functionName: "totalLaunchers",
        })) as bigint;

        const launcherCount = Number(totalLaunchers);
        const launcherIndices = Array.from({ length: launcherCount }, (_, i) => i);

        const launcherAddrs = await Promise.all(
          launcherIndices.map((i) =>
            publicClient?.readContract({
              address: FACTORY_ADDRESS,
              abi: FACTORY_ABI,
              functionName: "allLaunchers",
              args: [BigInt(i)],
            }) as Promise<Address>
          )
        );

        // ── Step 2: for each launcher, enumerate its launches ──
        const perLauncherResults = await Promise.all(
          launcherAddrs.map(async (launcherAddr) => {
            const total = (await publicClient?.readContract({
              address: launcherAddr,
              abi: TOKEN_LAUNCHER_ABI,
              functionName: "totalLaunches",
            })) as bigint;

            const count = Number(total);
            const indices = Array.from({ length: count }, (_, i) => i);

            return Promise.all(
              indices.map(async (i) => {
                const [launchpad, token] = (await publicClient?.readContract({
                  address: launcherAddr,
                  abi: TOKEN_LAUNCHER_ABI,
                  functionName: "allLaunches",
                  args: [BigInt(i)],
                })) as [Address, Address, Address];

                const [name, symbol, totalSupply, migrationThreshold] = await Promise.all([
                  publicClient?.readContract({ address: token, abi: ERC20_ABI, functionName: "name" }),
                  publicClient?.readContract({ address: token, abi: ERC20_ABI, functionName: "symbol" }),
                  publicClient?.readContract({ address: token, abi: ERC20_ABI, functionName: "totalSupply" }),
                  publicClient?.readContract({ address: launchpad, abi: LAUNCHPAD_ABI, functionName: "migrationThreshold" }),
                ]);

                const meta: LaunchMeta = {
                  id: token as string,
                  name: name as string,
                  ticker: symbol as string,
                  launchpadId: launchpad as string,
                  tokenId: token as string,
                  softCap: Number(formatEther(migrationThreshold as bigint)),
                  liquidity: 62.5,
                  offered: `${Number(formatEther(totalSupply as bigint)).toLocaleString()} ${symbol}`,
                  icon: null,
                };
                return meta;
              })
            );
          })
        );

        const flattened = perLauncherResults.flat();

        if (!cancelled) setLaunches(flattened.reverse());
      } catch (e: any) {
        console.error("[useLaunches] error:", e);
        if (!cancelled) setError(e.message || "Failed to load launches");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [publicClient]);

  return { launches, loading, error };
}