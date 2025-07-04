// services/userService.ts

import { supabase } from "@/config/supabase";

// --- Interfaces ---

// Interface สำหรับข้อมูล Profile ของผู้ใช้
export interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  position?: string;
  avatar_url?: string;
  created_at?: string;
  description?: string;
  bank_account_number?: string;
  skills?: string[];
  email?: string;
  github_url?: string;
  linkedin_url?: string;
}

// Interface สำหรับเงื่อนไขการกรองข้อมูลผู้ใช้
export interface UserFilters {
  search?: string;
  position?: string;
  page?: number;
  limit?: number;
}

// --- CRUD & Utility Functions ---

/**
 * 1. ดึงข้อมูลผู้ใช้ทั้งหมดพร้อม Filter และ Pagination
 * @param filters - เงื่อนไขการกรอง (ค้นหา, role) และการแบ่งหน้า
 * @returns อ็อบเจกต์ที่มีข้อมูลผู้ใช้ (data) และจำนวนทั้งหมด (count)
 */
export const getUsers = async (filters: UserFilters = {}) => {
  try {
    const { search, role, position, page = 1, limit = 10 } = filters;

    let query = supabase.from("teams").select("*", { count: "exact" }).order("created_at", { ascending: false });

    if (search) {
      query = query.ilike('full_name', `%${search}%`);
    }
    // เพิ่มเงื่อนไขการกรอง
    if (role) {
      query = query.eq("role", role);
    }
    if (position) {
      query = query.eq("position", position);
    }

    // ... ส่วน Pagination เหมือนเดิม ...
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data as UserProfile[]) || [], count: count || 0 };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};
/**
 * 2. อัปเดตข้อมูล Profile ของผู้ใช้
 * @param id - User ID
 * @param profile - ข้อมูลที่ต้องการอัปเดต (เช่น full_name, role)
 */
export const updateUserProfile = async (id: string, profile: Partial<UserProfile>) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .update(profile)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * 3. ดึง Role ที่ไม่ซ้ำกันทั้งหมดจากตาราง teams
 * ใช้สำหรับสร้าง Dropdown Filter ในหน้า Admin
 */
export const getUniqueRoles = async (): Promise<string[]> => {
  try {
    // แนะนำให้สร้าง Function ใน SQL Editor ของ Supabase เพื่อประสิทธิภาพที่ดีกว่า
    // CREATE OR REPLACE FUNCTION get_unique_roles_from_teams()
    // RETURNS TABLE(role text) AS $$
    // BEGIN
    //   RETURN QUERY SELECT DISTINCT p.role FROM public.teams p WHERE p.role IS NOT NULL ORDER BY role;
    // END;
    // $$ LANGUAGE plpgsql;
    const { data, error } = await supabase.rpc('get_unique_roles_from_teams');

    if (error) throw error;
    return data.map((item: any) => item.role);
  } catch (error) {
    console.error("Error fetching unique roles:", error);
    // Fallback ในกรณีที่ RPC ไม่มี หรือเกิดข้อผิดพลาด
    return ["admin", "user"];
  }
};

// --- Avatar Management ---

/**
 * 4. อัปโหลดรูป Avatar ไปยัง Supabase Storage
 * @param file - ไฟล์รูปภาพ
 * @param userId - User ID เพื่อสร้าง Path ที่ไม่ซ้ำกัน
 */
export const uploadAvatar = async (file: File, userId: string) => {
  const filePath = `avatars/${userId}/${Date.now()}`;
  const { data, error } = await supabase.storage.from("avatars").upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(data.path);
  return publicUrl;
};

/**
 * 5. ลบรูป Avatar เก่าออกจาก Supabase Storage
 * @param avatarUrl - URL ของรูปภาพที่ต้องการลบ
 */
export const deleteAvatar = async (avatarUrl: string) => {
  try {
    // แยก path ของไฟล์ออกจาก URL เต็ม
    const filePath = avatarUrl.split("/avatars/")[1];
    if (!filePath) return;

    await supabase.storage.from("avatars").remove([filePath]);
  } catch (error) {
    console.error("Error deleting avatar:", error);
    // ไม่ต้อง throw error ออกไป เพราะการลบรูปไม่สำเร็จไม่ควรหยุดการทำงานหลัก
  }
};


// --- Edge Function Calls (สำหรับ Admin Actions) ---

/**
 * 6. เรียก Edge Function 'create-user' เพื่อสร้างผู้ใช้ใหม่ในระบบ
 * @param userData - อ็อบเจกต์ที่มี email, password, full_name, role
 */
export const createUser = async (userData: Partial<UserProfile> & { password?: string }) => {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: userData,
  });

  if (error) throw error;
  return data;
};

/**
 * 7. เรียก Edge Function 'delete-user' เพื่อลบผู้ใช้ออกจากระบบอย่างถาวร
 * @param userId - User ID ที่ต้องการลบ
 */
export const deleteUser = async (userId: string) => {
  const { error } = await supabase.functions.invoke('delete-user', {
    body: { userId },
  });

  if (error) throw error;
  return true;
};

/**
 * ดึงตำแหน่งที่ไม่ซ้ำกัน (ใช้วิธีดึงข้อมูลทั้งหมดแล้วกรองใน Client)
 */
export const getUniquePositions = async (): Promise<string[]> => {
  try {
    // 1. ดึงคอลัมน์ "position" ของ *ทุกแถว* ในตาราง teams
    const { data, error } = await supabase
      .from("teams")
      .select("position")
      .not("position", "is", null); // ไม่เอาแถวที่ position เป็นค่าว่าง

    if (error) throw error;

    // 2. ใช้ JavaScript เพื่อสร้าง Array ใหม่และกรองค่าที่ซ้ำกันออก
    // `new Set` จะสร้างอ็อบเจกต์ที่มีแต่ค่าที่ไม่ซ้ำกัน
    // `...` (Spread operator) จะแปลง Set กลับมาเป็น Array
    const positions = [...new Set(data.map((item) => item.position))];

    // กรองค่าที่เป็น null หรือ string ว่างๆ ออกไปอีกทีเพื่อความชัวร์
    return positions.filter(Boolean) as string[];
  } catch (error) {
    console.error("Error fetching unique positions:", error);
    return []; // ถ้า error ให้คืนค่าเป็น array ว่าง
  }
};