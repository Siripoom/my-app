import { supabase } from "@/config/supabase";

export interface Project {
  id?: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: "todo" | "in_progress" | "completed" | "cancelled";
  team_members?: string[]; // Array of team member UUIDs
  created_at?: string;
  updated_at?: string;
  budget?: number; // Optional budget field
  attachment_url?: string; // 
}

export interface ProjectFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  userId?: string; // ✨ เพิ่มฟิลด์นี้เข้าไป
}

export interface ProjectStats {
  totalProjects: number;
  todoProjects: number;
  inProgressProjects: number;
  completedProjects: number;
  cancelledProjects: number;
}

// ใน projectService.ts
export interface ProjectWithTeamDetails extends Project {
  team_details?: Array<{
    id: string;
    full_name: string; // ✨ เปลี่ยนจาก name เป็น full_name
    role: string;      // ✨ เปลี่ยนจาก position เป็น role (หรือตามชื่อคอลัมน์ใน teams)
    avatar_url?: string;
  }>;
}

function sanitizeFileName(fileName: string): string {
  const name = fileName.split('.').slice(0, -1).join('.');
  const extension = fileName.split('.').pop() || '';

  // แทนที่ตัวอักษรที่ไม่ใช่ภาษาอังกฤษ/ตัวเลข ด้วยขีดกลาง (-)
  // และแปลงเป็นตัวพิมพ์เล็กทั้งหมด
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // แทนที่อักขระที่ไม่ต้องการ
    .replace(/-+/g, '-'); // ลดขีดกลางที่ติดกันให้เหลือตัวเดียว

  return `${sanitizedName}-${Date.now()}.${extension}`;
}

export const uploadProjectAttachment = async (file: File, projectId: string) => {
  // ✨✨✨ แก้ไขส่วนนี้ ✨✨✨
  const sanitizedName = sanitizeFileName(file.name);
  const filePath = `public/${projectId}/${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from("project-attachments")
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from("project-attachments")
    .getPublicUrl(data.path);

  return publicUrl;
};

/**
 * ลบไฟล์แนบของโปรเจกต์
 */
export const deleteProjectAttachment = async (attachmentUrl: string) => {
  try {
    const filePath = attachmentUrl.split('/project-attachments/')[1];
    if (!filePath) return;
    await supabase.storage.from("project-attachments").remove([filePath]);
  } catch (error) {
    console.error("Error deleting attachment:", error);
  }
};

// ✨✨✨ ดึงข้อมูล Projects (แก้ไขแล้วให้รองรับทั้ง Admin และ User) ✨✨✨
export const getProjects = async (filters: ProjectFilters = {}) => {
  try {
    // ดึง filter ทั้งหมดออกมา รวมถึง userId
    const { search, status, page = 1, limit = 10, userId } = filters;

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

    // ✨✨✨ ส่วนที่เพิ่มเข้ามา ✨✨✨
    // ถ้ามีการส่ง userId มา (จากหน้า Home ของ User) ให้กรองเฉพาะโปรเจคของ User นั้น
    if (userId) {
      query = query.contains('team_members', [userId]);
    }
    // ถ้าไม่มีการส่ง userId มา (จากหน้า Admin) ก็จะไม่ทำอะไร ซึ่งจะดึงมาทั้งหมด (ถูกต้องแล้ว)


    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: projects, error, count } = await query;

    if (error) throw error;

    // ✨✨✨ ส่วนนี้ยังคงใช้โครงสร้างเดิมที่ทำงานได้ดีอยู่แล้ว ✨✨✨
    // ดึงข้อมูล team details มา join เอง
    const projectsWithTeamDetails = await Promise.all(
      (projects || []).map(async (project) => {
        if (project.team_members && project.team_members.length > 0) {
          try {
            // สำคัญ: ต้อง select ฟิลด์ให้ครบถ้วนตามที่หน้าบ้านต้องการ
            const { data: teamData, error: teamError } = await supabase
              .from("teams")
              .select("id, full_name, role, avatar_url") // ดึง avatar_url ด้วย
              .in("id", project.team_members);

            if (!teamError && teamData) {
              return {
                ...project,
                team_details: teamData,
              };
            }
          } catch (teamError) {
            console.error("Error fetching team details for project:", project.id, teamError);
          }
        }

        return {
          ...project,
          team_details: [],
        };
      })
    );

    return {
      data: projectsWithTeamDetails || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};


// ✨✨✨ ดึงข้อมูล Project ตาม ID (ฉบับแก้ไขให้สมบูรณ์) ✨✨✨
export const getProjectById = async (
  id: string
): Promise<ProjectWithTeamDetails | null> => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*, team_details:teams(*)") // ใช้ Relation Query ที่นี่ได้เลยเพราะเป็นการดึงข้อมูลเดียว
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

// เพิ่มสมาชิกทีมในโปรเจค
export const addTeamMemberToProject = async (
  projectId: string,
  memberId: string
) => {
  try {
    // Get current project
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("team_members")
      .eq("id", projectId)
      .single();

    if (fetchError) throw fetchError;

    const currentMembers = project.team_members || [];

    // Check if member already exists
    if (currentMembers.includes(memberId)) {
      throw new Error("สมาชิกนี้ได้ถูกเพิ่มในโปรเจคแล้ว");
    }

    // Add new member
    const updatedMembers = [...currentMembers, memberId];

    const { data, error } = await supabase
      .from("projects")
      .update({ team_members: updatedMembers })
      .eq("id", projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding team member to project:", error);
    throw error;
  }
};

// ลบสมาชิกทีมออกจากโปรเจค
export const removeTeamMemberFromProject = async (
  projectId: string,
  memberId: string
) => {
  try {
    // Get current project
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("team_members")
      .eq("id", projectId)
      .single();

    if (fetchError) throw fetchError;

    const currentMembers = project.team_members || [];

    // Remove member
    const updatedMembers = currentMembers.filter((id) => id !== memberId);

    const { data, error } = await supabase
      .from("projects")
      .update({ team_members: updatedMembers })
      .eq("id", projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error removing team member from project:", error);
    throw error;
  }
};

// อัพเดทสมาชิกทีมทั้งหมดในโปรเจค
export const updateProjectTeamMembers = async (
  projectId: string,
  memberIds: string[]
) => {
  try {
    const { data, error } = await supabase
      .from("projects")
      .update({ team_members: memberIds })
      .eq("id", projectId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating project team members:", error);
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
