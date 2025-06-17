import { supabase } from "@/config/supabase";

export interface Team {
  id?: string;
  name: string;
  position: string;
  description?: string;
  skills: string[];
  avatar_url?: string;
  github_url?: string;
  linkedin_url?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamFilters {
  search?: string;
  position?: string;
  page?: number;
  limit?: number;
}

// ดึงข้อมูล Teams ทั้งหมดพร้อม Filter
export const getTeams = async (filters: TeamFilters = {}) => {
  try {
    const { search, position, page = 1, limit = 10 } = filters;
    let query = supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by search (name or description)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filter by position
    if (position) {
      query = query.eq("position", position);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching teams:", error);
    throw error;
  }
};

// ดึงข้อมูล Team ตาม ID
export const getTeamById = async (id: string): Promise<Team | null> => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching team:", error);
    throw error;
  }
};

// สร้าง Team ใหม่
export const createTeam = async (
  team: Omit<Team, "id" | "created_at" | "updated_at">
) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .insert([team])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
};

// อัพเดท Team
export const updateTeam = async (id: string, team: Partial<Team>) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .update(team)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating team:", error);
    throw error;
  }
};

// ลบ Team
export const deleteTeam = async (id: string) => {
  try {
    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting team:", error);
    throw error;
  }
};

// ดึงตำแหน่งที่ไม่ซ้ำกัน
export const getUniquePositions = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("position")
      .not("position", "is", null);

    if (error) throw error;

    const positions = [...new Set(data?.map((item) => item.position) || [])];
    return positions.filter(Boolean);
  } catch (error) {
    console.error("Error fetching positions:", error);
    throw error;
  }
};

// อัพโหลดรูปภาพ Avatar
export const uploadAvatar = async (file: File, teamId: string) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${teamId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // อัพโหลดไฟล์
    const { error: uploadError } = await supabase.storage
      .from("team-avatars")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // ดึง Public URL
    const { data } = supabase.storage
      .from("team-avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

// ลบรูปภาพ Avatar
export const deleteAvatar = async (avatarUrl: string) => {
  try {
    // Extract file path from URL
    const path = avatarUrl.split("/").pop();
    if (!path) return;

    const { error } = await supabase.storage
      .from("team-avatars")
      .remove([`avatars/${path}`]);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting avatar:", error);
    // Don't throw error for avatar deletion as it's not critical
  }
};
