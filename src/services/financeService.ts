import { supabase } from "@/config/supabase";

export interface Finance {
  id?: string;
  title: string;
  amount: number;
  transaction_date: string;
  notes?: string;
  type: "income" | "expense";
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FinanceFilters {
  search?: string;
  type?: "income" | "expense";
  category?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface FinanceStats {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  totalTransactions: number;
  monthlyData: MonthlyFinanceData[];
}

export interface MonthlyFinanceData {
  month: string;
  total_income: number;
  total_expense: number;
  net_amount: number;
  total_transactions: number;
}

// ดึงข้อมูล Finances ทั้งหมดพร้อม Filter
export const getFinances = async (filters: FinanceFilters = {}) => {
  try {
    const {
      search,
      type,
      category,
      start_date,
      end_date,
      page = 1,
      limit = 10,
    } = filters;
    let query = supabase
      .from("finances")
      .select("*", { count: "exact" })
      .order("transaction_date", { ascending: false });

    // Filter by search (title or notes)
    if (search) {
      query = query.or(`title.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    // Filter by type
    if (type) {
      query = query.eq("type", type);
    }

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by date range
    if (start_date) {
      query = query.gte("transaction_date", start_date);
    }
    if (end_date) {
      query = query.lte("transaction_date", end_date);
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
    console.error("Error fetching finances:", error);
    throw error;
  }
};

// ดึงข้อมูล Finance ตาม ID
export const getFinanceById = async (id: string): Promise<Finance | null> => {
  try {
    const { data, error } = await supabase
      .from("finances")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching finance:", error);
    throw error;
  }
};

// สร้าง Finance ใหม่
export const createFinance = async (
  finance: Omit<Finance, "id" | "created_at" | "updated_at">
) => {
  try {
    const { data, error } = await supabase
      .from("finances")
      .insert([finance])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating finance:", error);
    throw error;
  }
};

// อัพเดท Finance
export const updateFinance = async (id: string, finance: Partial<Finance>) => {
  try {
    const { data, error } = await supabase
      .from("finances")
      .update(finance)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating finance:", error);
    throw error;
  }
};

// ลบ Finance
export const deleteFinance = async (id: string) => {
  try {
    const { error } = await supabase.from("finances").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting finance:", error);
    throw error;
  }
};

// ดึงสถิติ Finances
// ✨✨✨ ส่วนที่แก้ไข: getFinanceStats ✨✨✨
/**
 * ดึงสถิติ Finances ตามช่วงเวลาที่กำหนด
 * @param startDate - วันที่เริ่มต้น (YYYY-MM-DD)
 * @param endDate - วันที่สิ้นสุด (YYYY-MM-DD)
 */
export const getFinanceStats = async (startDate?: string, endDate?: string): Promise<FinanceStats> => {
  try {
    // 1. สร้าง query เริ่มต้น
    let query = supabase.from("finances").select("amount, type, transaction_date");

    // 2. เพิ่มเงื่อนไขการกรองตามช่วงวันที่ ถ้ามีการส่งค่ามา
    if (startDate) {
      query = query.gte("transaction_date", startDate);
    }
    if (endDate) {
      query = query.lte("transaction_date", endDate);
    }

    // 3. ดึงข้อมูลที่กรองแล้ว
    const { data: filteredData, error: filteredError } = await query;
    if (filteredError) throw filteredError;

    // 4. ดึงข้อมูลรายเดือน (ส่วนนี้ยังคงดึงข้อมูลสรุปทั้งหมด 12 เดือนล่าสุดจาก View)
    const { data: monthlyData, error: monthlyError } = await supabase
      .from("finance_summary")
      .select("*")
      .order("month", { ascending: false })
      .limit(12);
    if (monthlyError) throw monthlyError;

    // 5. คำนวณสถิติจากข้อมูลที่กรองแล้ว (filteredData)
    const totalIncome =
      filteredData
        ?.filter((f) => f.type === "income")
        .reduce((sum, f) => sum + f.amount, 0) || 0;
    const totalExpense =
      filteredData
        ?.filter((f) => f.type === "expense")
        .reduce((sum, f) => sum + f.amount, 0) || 0;

    const stats: FinanceStats = {
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
      totalTransactions: filteredData?.length || 0,
      monthlyData: monthlyData || [],
    };

    return stats;
  } catch (error) {
    console.error("Error fetching finance stats:", error);
    // คืนค่า default ถ้าเกิด error
    return {
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      totalTransactions: 0,
      monthlyData: [],
    };
  }
};

// ดึงประเภท (Types) ที่ไม่ซ้ำกัน
export const getFinanceTypes = (): string[] => {
  return ["income", "expense"];
};

// ดึงหมวดหมู่ (Categories) ที่ไม่ซ้ำกัน
export const getUniqueCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("finances")
      .select("category")
      .not("category", "is", null);

    if (error) throw error;

    const categories = [...new Set(data?.map((item) => item.category) || [])];
    return categories.filter(Boolean);
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

// ดึงข้อมูลการเงินรายเดือน
export const getMonthlyFinanceData = async (months: number = 6) => {
  try {
    const { data, error } = await supabase
      .from("finance_summary")
      .select("*")
      .order("month", { ascending: false })
      .limit(months);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching monthly finance data:", error);
    throw error;
  }
};

// ดึงข้อมูลการเงินตามหมวดหมู่
export const getFinanceByCategory = async (type?: "income" | "expense") => {
  try {
    let query = supabase.from("finances").select("category, amount, type");

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) throw error;

    // จัดกลุ่มตามหมวดหมู่
    const categoryData = data?.reduce((acc: any, item) => {
      const category = item.category || "อื่นๆ";
      if (!acc[category]) {
        acc[category] = {
          category,
          income: 0,
          expense: 0,
          total: 0,
        };
      }

      if (item.type === "income") {
        acc[category].income += item.amount;
      } else {
        acc[category].expense += item.amount;
      }

      acc[category].total = acc[category].income - acc[category].expense;

      return acc;
    }, {});

    return Object.values(categoryData || {});
  } catch (error) {
    console.error("Error fetching finance by category:", error);
    throw error;
  }
};
