import { ToastContainer } from "react-toastify";
import AccountCreationForm from "./components/AccountCreationForm";
import CrystalAnimationWrapper from "./components/CrystalAnimationWrapper";

export default function Home() {
  return (
    <main className="flex min-h-screen">
      {/* Left Side - 3D Animation */}
      <div className="flex-1 relative overflow-hidden">
        <CrystalAnimationWrapper />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/20 pointer-events-none" />
      </div>
      
      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-full max-w-md">
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
          
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <AccountCreationForm />
          </div>
          
          <div className="text-center mt-8">
            <p className="text-xs text-slate-500">
              Powered by Semaphore Protocol & ZeroDev
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
