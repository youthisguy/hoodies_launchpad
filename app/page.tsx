"use client";
import { useState } from "react";
import LaunchGrid from "./components/LaunchGrid";
import { PlusCircle } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [showToast, setShowToast] = useState(false);

  const handleAddProject = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };



const topRow = {
  x: [18, 80, 145, 220, 285, 355, 410, 480, 545, 615, 672, 748, 805, 872, 935, 1005, 1062, 1130],
  y: [8, 30, 5, 22, 10, 30, 6, 18, 4, 25, 8, 20, 5, 28, 10, 22, 6, 18],
  s: [22, 16, 28, 14, 20, 12, 24, 16, 20, 14, 26, 12, 22, 16, 18, 14, 24, 20],
};

const midRow = {
  x: [40, 108, 175, 248, 318, 390, 450, 520, 592, 648, 718, 790, 858, 925, 992, 1048, 1115, 1165],
  y: [75, 65, 80, 60, 78, 62, 80, 65, 78, 60, 75, 62, 78, 60, 75, 65, 78, 60],
  s: [14, 20, 12, 18, 22, 14, 16, 20, 12, 18, 24, 14, 16, 20, 12, 18, 22, 14],
};

const bottomRow = {
  x: [25, 95, 158, 230, 300, 368, 438, 505, 572, 638, 705, 775, 840, 912, 978, 1042, 1108, 1162],
  y: [140, 128, 145, 132, 148, 130, 145, 128, 142, 130, 148, 132, 145, 128, 142, 130, 145, 132],
  s: [18, 12, 20, 14, 16, 22, 12, 18, 14, 20, 16, 12, 24, 14, 18, 20, 12, 16],
};

const VIEW_W = 1200;
const VIEW_H = 180;

function MascotScatter({ row, prefix }: any) {
  return (
    <>
      {row.x.map((x: number, i: string | number) => {
        const size = row.s[i];
        return (
          <div
            key={`${prefix}${i}`}
            className="absolute rounded-full overflow-hidden border border-zinc-900/40 bg-white/40"
            style={{
              left: `${(x / VIEW_W) * 100}%`,
              top: `${(row.y[i] / VIEW_H) * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
            }}
          >
            <Image
              src="/mascotgreen.png"
              alt=""
              width={size}
              height={size}
              className="h-full w-full object-cover"
            />
          </div>
        );
      })}
    </>
  );
}


  return (
    <div className="min-h-screen bg-[#F1EBDC] text-zinc-200 font-mono">
      {/* Toast */}
      {showToast && (
        <div
          className="fixed top-5 right-5 z-50 bg-zinc-800 border border-zinc-700 
          text-zinc-200 text-sm font-mono px-4 py-3 rounded-xl shadow-lg
          animate-fade-in flex items-center gap-2"
        >
          🚧 Project submissions coming soon
        </div>
      )}

<div
  className="w-full relative overflow-hidden border-t-2 border-b-2 border-zinc-900"
  style={{ background: "#ECE3CD" }}
>
  <section className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-20 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-5">
      <div className="shrink-0 h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-2 border-zinc-900 shadow-[3px_3px_0_0_rgba(24,24,27,1)] bg-white">
        <Image
          src="/mascotgreen.png"
          alt="Hoodie mascot"
          width={96}
          height={96}
          className="h-full w-full object-cover"
          priority
        />
      </div>

      <div>
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
          Hoodie <span className="text-[#7a9a0a]">Launchpad</span>
        </h1>
        <p className="text-zinc-600 mt-2 text-sm">
          Launch, Discover and Participate in new token launches on Hoodie
          Launchpad Launcher.
        </p>
      </div>
    </div>

    <button
      onClick={handleAddProject}
      className="px-4 py-2.5 md:px-5 md:py-3 rounded-xl bg-[#FBF8EE] hover:bg-white
        border-2 border-zinc-900 shadow-[3px_3px_0_0_rgba(24,24,27,1)]
        text-zinc-900 font-bold text-xs md:text-sm tracking-wider
        transition-all flex items-center gap-1.5 md:gap-2 whitespace-nowrap w-fit cursor-not-allowed"
    >
      <PlusCircle size={13} className="md:hidden" />
      <PlusCircle size={15} className="hidden md:block" />
      Add Project
    </button>
  </section>
</div>
      <LaunchGrid />
    </div>
  );
}
