export default function Page({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to My App</h1>
      <p className="text-lg text-gray-700">
        This is a dynamic page with ID:{" "}
        <span className="font-semibold">{params.id}</span>
      </p>
    </div>
  );
}
