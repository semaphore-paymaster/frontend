import { ToastContainer } from "react-toastify";
import AccountCreationForm from "./components/AccountCreationForm";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-xl">
        <h1 className="text-4xl font-semibold text-center mb-12">
          Semaphore Paymaster
        </h1>
        <AccountCreationForm />
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
