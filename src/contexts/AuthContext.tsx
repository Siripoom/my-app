// src/contexts/AuthContext.tsx
"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/config/supabase';
import type { User } from '@supabase/supabase-js';

// 1. กำหนดหน้าตาของข้อมูลที่จะเก็บ
interface AuthContextType {
  user: User | null; // ข้อมูล user จาก Supabase
  role: 'admin' | 'user' | null; // role ที่เราดึงมาจาก teams
  loading: boolean; // สถานะการโหลดข้อมูล (สำคัญมาก)
}

// 2. สร้าง Context ขึ้นมา
const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true, // เริ่มต้นให้เป็น true เพราะเราต้องไปเช็ค session ก่อน
});

// 3. สร้าง "ผู้ให้บริการข้อมูล" (Provider)
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้และ role ตอนเริ่มต้น
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('teams')
            .select('role')
            .eq('id', session.user.id)
            .single();
          setRole(profile?.role || null);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setRole(null);
        }
      }
      setLoading(false); // โหลดเสร็จแล้ว
    };

    getInitialSession();

    // ตั้งค่า "ผู้ฟัง" คอยดูการเปลี่ยนแปลงสถานะการล็อกอิน
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // เมื่อมีการ login/logout, ให้อัปเดตข้อมูลใหม่ทั้งหมด
        getInitialSession();
      }
    );

    // Cleanup function: หยุด "ผู้ฟัง" เมื่อ Component ถูกทำลาย
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = { user, role, loading };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. สร้าง "ทางลัด" (Custom Hook) เพื่อให้เรียกใช้ข้อมูลได้ง่าย
export const useAuth = () => {
  return useContext(AuthContext);
};