export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f6f2ec]">
      <div className="text-center p-8 bg-white rounded-2xl shadow">
        <h1 className="text-3xl font-semibold mb-4">
          Order successful 🎉
        </h1>
        <p className="mb-6">
          Your EchoNote stickers are on the way.
        </p>

        <a
          href="/create"
          className="px-6 py-3 bg-black text-white rounded-lg"
        >
          Create your first EchoNote
        </a>
      </div>
    </main>
  );
}