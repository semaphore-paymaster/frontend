import AccountCreationForm from "./components/AccountCreationForm";

export default function Home() {
  return (
    <>
      <main className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-6xl">
          <h1 className="text-4xl font-semibold text-center mb-12">
            Semaphore Paymaster
          </h1>
          <AccountCreationForm />
        </div>
      </main>
    </>
  );
}
