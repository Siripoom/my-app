import { supabase } from "@/config/supabase";

/**
 * Interface สำหรับข้อมูลที่ใช้ในการล็อกอิน
 */
export interface LoginCredentials {
  email: string;
  password: string;
}


/**
 * Interface สำหรับข้อมูลผลลัพธ์หลังการล็อกอินสำเร็จ
 */
export interface LoginSuccessResult {
  userId: string;
  email: string | undefined;
  role: string;
  redirectPath: string;
}

/**
 * จัดการการล็อกอิน ยืนยันตัวตน และตรวจสอบ Role ของผู้ใช้
 * 
 * ฟังก์ชันนี้จะทำ 3 อย่าง:
 * 1. ยืนยันตัวตนผู้ใช้กับ Supabase Auth
 * 2. ดึงข้อมูล role จากตาราง 'teams'
 * 3. คืนค่า redirect path ตาม role
 * 
 * @param credentials - อ็อบเจกต์ที่มี email และ password
 * @returns อ็อบเจกต์ผลลัพธ์ที่มีข้อมูลผู้ใช้และ path สำหรับ redirect
 * @throws {Error} หากการล็อกอินหรือการดึงข้อมูลล้มเหลว
 */
// วางโค้ดนี้กลับเข้าไปในไฟล์ authService.ts

export const login = async (credentials: LoginCredentials): Promise<LoginSuccessResult> => {
  try {
    // 1. ล็อกอินเพื่อยืนยันตัวตน (Request ครั้งที่ 1)
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    // ถ้าล็อกอินไม่สำเร็จ ให้ throw error ที่ได้รับจาก Supabase
    if (loginError) {
      throw loginError;
    }

    if (!loginData.user) {
      // เคสนี้ไม่น่าเกิดขึ้น แต่เป็นการป้องกันไว้ก่อน
      throw new Error("ไม่พบข้อมูลผู้ใช้หลังจากยืนยันตัวตนสำเร็จ");
    }

    const user = loginData.user;

    // 2. ดึงข้อมูล Role จากตาราง 'teams' (Request ครั้งที่ 2)
    const { data: profileData, error: profileError } = await supabase
      .from('teams')
      .select('role') // ดึงแค่ role ก็พอ
      .eq('id', user.id)
      .single();

    if (profileError) {
      // ถ้าหาโปรไฟล์ไม่เจอหรือมีปัญหา ให้ sign out ผู้ใช้ออกทันทีเพื่อความปลอดภัย
      // แล้ว throw error ที่ชัดเจน
      await supabase.auth.signOut();
      console.error("Profile fetch error:", profileError); // เพิ่ม log เพื่อดู error จริงๆ
      throw new Error("ไม่สามารถดึงข้อมูลโปรไฟล์ผู้ใช้ได้ กรุณาติดต่อผู้ดูแลระบบ");
    }

    if (!profileData) {
      // เคสที่หาเจอแต่ข้อมูลเป็น null
      await supabase.auth.signOut();
      throw new Error("ไม่พบข้อมูลโปรไฟล์สำหรับผู้ใช้นี้");
    }

    const role = profileData.role;

    // 3. ตรวจสอบ Role แล้วกำหนด Redirect Path
    const redirectPath = role === 'admin' ? '/admin' : '/home';

    // คืนค่าผลลัพธ์เมื่อสำเร็จ
    return {
      userId: user.id,
      email: user.email,
      role: role,
      redirectPath: redirectPath,
    };

  } catch (error) {
    // ส่งต่อ error ที่เกิดขึ้นทั้งหมดไปยังส่วนที่เรียกใช้
    console.error("Login Service Error:", error instanceof Error ? error.message : error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`, // ลิงก์ที่ผู้ใช้จะถูกส่งไปหลังคลิกในอีเมล
  });

  if (error) throw error;
};


/**
 * ฟังก์ชันสำหรับอัปเดตรหัสผ่านใหม่ของผู้ใช้
 */
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
};

/**
 * ฟังก์ชันสำหรับ Sign Out
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Sign Out Service Error:", error);
    throw error;
  }
}



// คุณสามารถเพิ่มฟังก์ชันอื่นๆ ที่เกี่ยวข้องกับ auth ได้ที่นี่
// เช่น register, sendPasswordResetEmail etc.