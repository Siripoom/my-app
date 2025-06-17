"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";

export default function LoadingPage() {
  const router = useRouter();

  useEffect(() => {
    // หน่วงเวลา 2 วินาที แล้วเปลี่ยนไปหน้า home
    const timer = setTimeout(() => {
      router.push("/home");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center bg-white p-12 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Welcome to My App
        </h1>
        <Spin size="large" className="mb-4" />
        <p className="text-lg text-gray-600">กำลังโหลด...</p>
        <div className="mt-6 w-64 bg-gray-200 rounded-full h-1">
          <div
            className="bg-blue-500 h-1 rounded-full animate-pulse"
            style={{ width: "60%" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
