import { supabase } from "@/config/supabase";

export interface Project {
  id?: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: "todo" | "in_progress" | "completed" | "cancelled";
  created_at?: string;
  updated_at?: string;
}

export interface ProjectFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ProjectStats {
  totalProjects: number;
  todoProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  cancelledProjects: number;
}

// ดึงข้อมูล Projects ทั้งหมดพร้อม Filter
export const getProjects = async (filters: ProjectFilters = {}) => {
  try {
    const { search, status, page = 1, limit = 10 } = filters;
    let query = supabase
      .from("projects")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Filter by search (name or description)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
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
    console.error("Error fetching projects:", error);
    throw error;
  }
};

// ดึงข้อมูล Project ตาม ID
export const getProjectById = async (id: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};

// สร้าง Project ใหม่
export const createProject = async (
  project: Omit<Project, "id" | "created_at" | "updated_at">
) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

// อัพเดท Project
export const updateProject = async (id: string, project: Partial<Project>) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .update(project)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

// ลบ Project
export const deleteProject = async (id: string) => {
  try {
    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// ดึงสถิติ Projects
export const getProjectStats = async (): Promise<ProjectStats> => {
  try {
    const { data, error } = await supabase.from("projects").select("status");

    if (error) throw error;

    const stats: ProjectStats = {
      totalProjects: data?.length || 0,
      todoProjects: data?.filter((p) => p.status === "todo").length || 0,
      inProgressProjects:
        data?.filter((p) => p.status === "in_progress").length || 0,
      completedProjects:
        data?.filter((p) => p.status === "completed").length || 0,
      cancelledProjects:
        data?.filter((p) => p.status === "cancelled").length || 0,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching project stats:", error);
    throw error;
  }
};

// ดึงสถานะที่ไม่ซ้ำกัน
export const getUniqueStatuses = (): string[] => {
  return ["todo", "in_progress", "completed", "cancelled"];
};

// ดึงข้อมูล Projects ที่มี deadline ใกล้เคียง
export const getUpcomingDeadlines = async (days: number = 7) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .not("end_date", "is", null)
      .gte("end_date", today.toISOString().split("T")[0])
      .lte("end_date", futureDate.toISOString().split("T")[0])
      .in("status", ["todo", "in_progress"])
      .order("end_date", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching upcoming deadlines:", error);
    return [];
  }
};
