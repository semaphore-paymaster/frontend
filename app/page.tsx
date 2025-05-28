"use client";

import { useState } from "react";
import { ToastContainer, type TypeOptions } from "react-toastify";
import cn from "classnames";
import AccountManager from "./features/account/AccountManager";
import CrystalAnimationWrapper from "./components/animations/CrystalAnimationWrapper";

export default function Home() {
  const [showCrystalAnimation, setShowCrystalAnimation] = useState(true);

  return (
    <main className="flex flex-col md:flex-row min-h-screen">
      {showCrystalAnimation && (
        <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
          <CrystalAnimationWrapper />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/20 pointer-events-none" />
        </div>
      )}
      
      <div className={cn(
        "w-full flex items-center justify-center px-4 py-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
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
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img src="/logo.png" alt="Semaphore Logo" className="h-48 w-auto" />
            </div>
            <p className={cn(
          "text-slate-400 text-sm leading-relaxed",
          {
            "hidden": !showCrystalAnimation
          }
        )} >
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
        toastClassName={
          "relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer " +
          "bg-slate-700/50 backdrop-blur-md border border-slate-600/50 shadow-lg " +
          "my-2 mx-2 sm:mx-0"
        }
        bodyClassName="text-sm font-medium text-slate-100 block p-3"
        progressClassName={(context?: { type?: TypeOptions; defaultClassName?: string; }) => {
          const colorMapping: { [key in TypeOptions | 'default']: string } = {
            success: "from-green-500 to-green-400",
            error: "from-red-500 to-red-400",
            info: "from-blue-500 to-blue-400",
            warning: "from-yellow-500 to-yellow-400",
            default: "from-pink-500 to-purple-500",
          };
          const type = context?.type || "default";
          const bgColor = colorMapping[type] || colorMapping.default;
          return `h-1 bg-gradient-to-r ${bgColor} rounded-b-md`;
        }}
      />
    </main>
  );
}
