"use client";
import { useState, useMemo } from "react";
import LaunchCard, { type LaunchMeta } from "./LaunchCard";
import LaunchFilters, { type FilterStatus, type SortKey } from "./LaunchFilters";
import { useLaunches } from "../lib/useLaunches";
 
export default function LaunchGrid() {
  const { launches, loading, error } = useLaunches();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [chainStates, setChainStates] = useState<Record<string, number>>({});

  const handleChainState = (id: string, state: number) => {
    setChainStates((prev) => (prev[id] === state ? prev : { ...prev, [id]: state }));
  };

  const filtered = useMemo(() => {
    let list = [...launches];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q) || l.ticker.toLowerCase().includes(q));
    }
    if (status !== "all") {
      const stateMap: Record<FilterStatus, number> = { all: -1, live: 0, success: 1, ended: 2 };
      const target = stateMap[status];
      list = list.filter((l) => {
        const s = chainStates[l.id];
        if (s === undefined) return true;
        return s === target;
      });
    }
    if (sort === "progress") {
      list.sort((a, b) => (chainStates[a.id] ?? 0) - (chainStates[b.id] ?? 0));
    } else if (sort === "cap_asc") {
      list.sort((a, b) => a.softCap - b.softCap);
    } else if (sort === "cap_desc") {
      list.sort((a, b) => b.softCap - a.softCap);
    }
    return list;
  }, [search, status, sort, chainStates, launches]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-zinc-900/30 border border-zinc-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 pb-24 text-center text-rose-400 text-sm py-16">
        Failed to load launches: {error}
      </div>
    );
  }

  return (
    <>
      <LaunchFilters search={search} onSearch={setSearch} status={status} onStatus={setStatus} sort={sort} onSort={setSort} total={launches.length} />
      <div className="max-w-5xl mx-auto px-4 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <p className="text-zinc-500 text-sm">
              {search ? `No launches match "${search}"` : "No launches yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((launch) => (
              <LaunchCard key={launch.id} launch={launch} onChainState={(state) => handleChainState(launch.id, state)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}