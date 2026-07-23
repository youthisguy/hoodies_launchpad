"use client";

import { useEffect, useState, useCallback } from "react";
import { usePublicClient, useAccount } from "wagmi";
import type { Address } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI, TOKEN_LAUNCHER_ABI } from "./contracts";
import { ACTIVE_CHAIN } from "./chain";

export interface LauncherInfo {
  address: Address;
  feeBps: number;
  feeRecipient: Address;
  maxCreatorAllocationBps: number;
  creatorVestingDuration: number;
  virtualTokenReserveBuffer: bigint;
  virtualHoodieReserves: bigint;
  migrationThreshold: bigint;
  totalLaunches: number;
}

export function useMyLaunchers() {
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient({ chainId: ACTIVE_CHAIN.id });
  const [launchers, setLaunchers] = useState<LauncherInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!publicClient || !connectedAddress) {
      setLaunchers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const addrs = (await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "getLaunchersByOperator",
        args: [connectedAddress],
      })) as Address[];

      const results = await Promise.all(
        addrs.map(async (launcherAddr) => {
          const [feeBps, feeRecipient, maxCreatorBps, vestDuration, defaults, total] = await Promise.all([
            publicClient.readContract({ address: launcherAddr, abi: TOKEN_LAUNCHER_ABI, functionName: "feeBps" }),
            publicClient.readContract({ address: launcherAddr, abi: TOKEN_LAUNCHER_ABI, functionName: "feeRecipient" }),
            publicClient.readContract({ address: launcherAddr, abi: TOKEN_LAUNCHER_ABI, functionName: "maxCreatorAllocationBps" }),
            publicClient.readContract({ address: launcherAddr, abi: TOKEN_LAUNCHER_ABI, functionName: "creatorVestingDuration" }),
            publicClient.readContract({ address: launcherAddr, abi: TOKEN_LAUNCHER_ABI, functionName: "defaults" }),
            publicClient.readContract({ address: launcherAddr, abi: TOKEN_LAUNCHER_ABI, functionName: "totalLaunches" }),
          ]);
          const [virtualTokenReserveBuffer, virtualHoodieReserves, migrationThreshold] = defaults as [bigint, bigint, bigint];
          return {
            address: launcherAddr,
            feeBps: Number(feeBps as number),
            feeRecipient: feeRecipient as Address,
            maxCreatorAllocationBps: Number(maxCreatorBps as number),
            creatorVestingDuration: Number(vestDuration as bigint),
            virtualTokenReserveBuffer,
            virtualHoodieReserves,
            migrationThreshold,
            totalLaunches: Number(total as bigint),
          } as LauncherInfo;
        })
      );

      setLaunchers(results.reverse()); // newest first
    } catch (e) {
      console.error("[useMyLaunchers] error:", e);
      setLaunchers([]);
    } finally {
      setLoading(false);
    }
  }, [publicClient, connectedAddress]);

  useEffect(() => { load(); }, [load]);

  return { launchers, loading, refetch: load };
}