export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-semibold">
          Leave a message they can hear 💛
        </h1>

        <p className="text-gray-500">
          Record a voice message for this gift
        </p>

        <button className="bg-black text-white px-6 py-3 rounded-xl text-lg">
          🎙️ Record message
        </button>
      </div>
    </main>
  );
}