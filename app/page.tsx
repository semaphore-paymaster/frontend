"use client";

import { useState } from "react";
import { ToastContainer } from "react-toastify";
import cn from "classnames";
import AccountManager from "./components/AccountManager";
import CrystalAnimationWrapper from "./components/CrystalAnimationWrapper";

export default function Home() {
  const [showCrystalAnimation, setShowCrystalAnimation] = useState(true);

  return (
    <main className="flex flex-col md:flex-row min-h-screen">
      {showCrystalAnimation && (
        <div className="hidden md:flex md:flex-1 relative overflow-hidden">
          <CrystalAnimationWrapper />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/20 pointer-events-none" />
        </div>
      )}
      
      <div className={cn(
        "w-full flex items-center justify-center px-8 py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        {
          "md:flex-1": showCrystalAnimation
        }
      )}>
        <div className={cn(
          "w-full",
          {
            "max-w-md": showCrystalAnimation
          }
        )}>
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
              Semaphore
            </h1>
            <h2 className="text-2xl font-light text-blue-400 mb-2">
              Paymaster
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Privacy-preserving authentication with zero-knowledge proofs
            </p>
          </div>
          
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl max-w-2xl mx-auto">
            <AccountManager onVotingStateChange={setShowCrystalAnimation} />
          </div>
          
          <div className="text-center mt-8">
            <p className="text-xs text-slate-500">
              Powered by Semaphore Protocol
            </p>
          </div>
        </div>
      </div>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </main>
  );
}
