// src/services/salaryService.ts
import { supabase } from "@/config/supabase";
import { createFinance, deleteFinance, updateFinance } from "./financeService";
import type { UserProfile } from "./userService";

// Interface ไม่มีการเปลี่ยนแปลง
export interface Salary {
  id?: string;
  user_id: string;
  amount: number;
  pay_date: string;
  period_start_date: string;
  period_end_date: string;
  notes?: string;
  finance_transaction_id?: string | null;
  status: "pending" | "paid";
}

export interface SalaryWithDetails extends Salary {
  teams: Pick<UserProfile, "full_name" | "avatar_url">;
}

/**
 * [ปรับปรุง] อัปเดตสถานะการจ่ายเงิน
 * - ถ้าเปลี่ยนจาก 'pending' -> 'paid': สร้างรายการ finance ใหม่
 * - ถ้าเปลี่ยนจาก 'paid' -> 'pending': ลบรายการ finance ที่เคยสร้างไว้
 */
export const updateSalaryStatus = async (
  salary: SalaryWithDetails,
  newStatus: "pending" | "paid"
): Promise<boolean> => {
  if (salary.status === newStatus) return true;

  // --- กรณีเปลี่ยนเป็น 'paid' ---
  if (newStatus === "paid") {
    if (salary.finance_transaction_id) {
      console.warn(
        `Salary ID ${salary.id} is already paid. Aborting status update.`
      );
      return true;
    }

    // ✨ ใช้ฟังก์ชัน createFinance จาก service
    const financeRecord = await createFinance({
      title: `ค่าจ้างพนักงาน: ${salary.teams?.full_name || "N/A"}`,
      amount: salary.amount,
      transaction_date: salary.pay_date,
      type: "expense",
      category: "ค่าจ้างพนักงาน",
      notes: `จ่ายสำหรับงวด ${salary.period_start_date} ถึง ${
        salary.period_end_date
      }. ${salary.notes || ""}`.trim(),
    });

    if (!financeRecord || !financeRecord.id) {
      throw new Error("ไม่สามารถสร้างบันทึกรายจ่ายได้");
    }

    const { error } = await supabase
      .from("salaries")
      .update({ status: "paid", finance_transaction_id: financeRecord.id })
      .eq("id", salary.id!);

    if (error) throw error;

    // --- กรณีเปลี่ยนเป็น 'pending' ---
  } else if (newStatus === "pending") {
    const financeIdToDelete = salary.finance_transaction_id;

    const { error } = await supabase
      .from("salaries")
      .update({ status: "pending", finance_transaction_id: null })
      .eq("id", salary.id!);

    if (error) throw error;

    if (financeIdToDelete) {
      try {
        // ✨ [แก้ไข] เรียกใช้ฟังก์ชัน deleteFinance จาก service แทนการเรียก supabase โดยตรง
        await deleteFinance(financeIdToDelete);
      } catch (financeError) {
        console.error(
          "Failed to delete associated finance record:",
          financeError
        );
        // ควรมี logic จัดการกรณีลบ finance ไม่สำเร็จ แต่ salary update ไปแล้ว
        // เช่น การแจ้งเตือนผู้ใช้ หรือ log ไว้เพื่อตรวจสอบ
      }
    }
  }
  return true;
};

// getSalaries ไม่มีการเปลี่ยนแปลง
export const getSalaries = async (
  filters: { page?: number; limit?: number; userId?: string } = {}
) => {
  const { page = 1, limit = 10, userId } = filters;
  const from = (page - 1) * limit;

  let query = supabase
    .from("salaries")
    .select("*, teams(full_name, avatar_url)", { count: "exact" })
    .order("pay_date", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: (data as SalaryWithDetails[]) || [], count: count || 0 };
};

/**
 * [ปรับปรุง] สร้างรายการเงินเดือน 1 รายการ และสร้างรายการรายจ่ายถ้าสถานะเป็น 'paid'
 */
export const createSalary = async (
  salaryData: Omit<Salary, "id" | "finance_transaction_id">
): Promise<Salary> => {
  let financeId: string | null = null;

  if (salaryData.status === "paid") {
    // ✨ ใช้ฟังก์ชัน createFinance จาก service
    const financeRecord = await createFinance({
      title: `ค่าจ้างพนักงาน`,
      amount: salaryData.amount,
      transaction_date: salaryData.pay_date,
      type: "expense",
      category: "ค่าจ้างพนักงาน",
      notes: `จ่ายสำหรับงวด ${salaryData.period_start_date} ถึง ${
        salaryData.period_end_date
      }. ${salaryData.notes || ""}`.trim(),
    });

    if (!financeRecord || !financeRecord.id) {
      throw new Error("ไม่สามารถสร้างบันทึกรายจ่ายได้");
    }
    financeId = financeRecord.id;
  }

  const newSalaryRecord = { ...salaryData, finance_transaction_id: financeId };

  const { data, error } = await supabase
    .from("salaries")
    .insert(newSalaryRecord)
    .select()
    .single();

  if (error) {
    console.error(
      "Salary creation failed. A finance record might have been created:",
      financeId
    );
    throw error;
  }
  return data;
};

export const updateSalary = async (
  salaryId: string,
  salaryData: Partial<Salary>
): Promise<Salary> => {
  // 1. ดึงข้อมูลเงินเดือนฉบับดั้งเดิมมาก่อน เพื่อเปรียบเทียบสถานะ
  const { data: originalSalary, error: fetchError } = await supabase
    .from("salaries")
    .select("*")
    .eq("id", salaryId)
    .single();

  if (fetchError || !originalSalary) {
    throw new Error("ไม่พบข้อมูลเงินเดือนที่ต้องการแก้ไข");
  }

  const originalStatus = originalSalary.status;
  const newStatus = salaryData.status;

  const dataToUpdate: Partial<Salary> = { ...salaryData };

  // 2. ตรวจสอบเงื่อนไขการเปลี่ยนแปลงสถานะ
  // --- Case 1: เปลี่ยนจาก 'pending' เป็น 'paid' ---
  if (originalStatus === "pending" && newStatus === "paid") {
    // สร้างรายการ finance ใหม่
    const financeRecord = await createFinance({
      title: `ค่าจ้างพนักงาน`, // อาจจะดึงชื่อจาก originalSalary.teams.full_name ถ้าต้องการ
      amount: dataToUpdate.amount!,
      transaction_date: dataToUpdate.pay_date!,
      type: "expense",
      category: "ค่าจ้างพนักงาน",
      notes: `จ่ายสำหรับงวด ${dataToUpdate.period_start_date} ถึง ${
        dataToUpdate.period_end_date
      }. ${dataToUpdate.notes || ""}`.trim(),
    });
    // เพิ่ม finance_transaction_id เข้าไปในข้อมูลที่จะอัปเดต
    dataToUpdate.finance_transaction_id = financeRecord.id;
  }
  // --- Case 2: เปลี่ยนจาก 'paid' เป็น 'pending' ---
  else if (originalStatus === "paid" && newStatus === "pending") {
    // ถ้ามี finance record เดิมอยู่ ให้ลบทิ้ง
    if (originalSalary.finance_transaction_id) {
      await deleteFinance(originalSalary.finance_transaction_id);
    }
    // ตั้งค่า finance_transaction_id เป็น null
    dataToUpdate.finance_transaction_id = null;
  }
  // --- Case 3: สถานะเป็น 'paid' เหมือนเดิม แต่ข้อมูลอื่นอาจเปลี่ยน ---
  else if (originalStatus === "paid" && newStatus === "paid") {
    // อัปเดตรายการ finance ที่มีอยู่แล้ว ถ้าจำนวนเงินหรือวันที่เปลี่ยน
    if (
      originalSalary.finance_transaction_id &&
      (originalSalary.amount !== dataToUpdate.amount ||
        originalSalary.pay_date !== dataToUpdate.pay_date)
    ) {
      await updateFinance(originalSalary.finance_transaction_id, {
        amount: dataToUpdate.amount,
        transaction_date: dataToUpdate.pay_date,
      });
    }
  }

  // 3. อัปเดตข้อมูลในตาราง salaries ด้วยข้อมูลที่เตรียมไว้ทั้งหมด
  const { data: updatedSalary, error: salaryError } = await supabase
    .from("salaries")
    .update(dataToUpdate)
    .eq("id", salaryId)
    .select()
    .single();

  if (salaryError) throw salaryError;

  return updatedSalary;
};

// deleteSalary มีการแก้ไขเล็กน้อยเพื่อเรียกใช้ deleteFinance
export const deleteSalary = async (
  salary: SalaryWithDetails
): Promise<boolean> => {
  const { error: salaryError } = await supabase
    .from("salaries")
    .delete()
    .eq("id", salary.id!);

  if (salaryError) throw salaryError;

  if (salary.finance_transaction_id) {
    try {
      // ✨ เรียกใช้ฟังก์ชัน deleteFinance จาก service
      await deleteFinance(salary.finance_transaction_id);
    } catch (financeError) {
      console.error(
        "Failed to delete associated finance transaction:",
        financeError
      );
    }
  }

  return true;
};

/**
 * [ปรับปรุง] สร้างรายการเงินเดือนหลายรายการพร้อมกัน โดยจะสร้างรายจ่ายเฉพาะรายการที่เป็น 'paid'
 */
export const createMultipleSalaries = async (
  salaryList: Array<Omit<Salary, "id" | "finance_transaction_id">>
) => {
  const paidSalaries = salaryList.filter((s) => s.status === "paid");
  const pendingSalaries = salaryList.filter((s) => s.status === "pending");
  const recordsToInsert = [];

  if (paidSalaries.length > 0) {
    const financeRecords = paidSalaries.map((s) => ({
      title: `ค่าจ้างพนักงาน`,
      amount: s.amount,
      transaction_date: s.pay_date,
      type: "expense" as const,
      category: "ค่าจ้างพนักงาน",
      notes: `จ่ายสำหรับงวด ${s.period_start_date} ถึง ${s.period_end_date}. ${
        s.notes || ""
      }`.trim(),
    }));

    const { data: createdFinances, error: financeError } = await supabase
      .from("finances")
      .insert(financeRecords)
      .select();

    if (financeError) throw financeError;

    const financeMap = new Map<string, string>();
    createdFinances.forEach((fin, index) => {
      const originalSalary = paidSalaries[index];
      const key = `${originalSalary.user_id}-${originalSalary.pay_date}-${
        originalSalary.amount
      }-${Math.random()}`; // Add random to avoid collision on same user/date/amount
      financeMap.set(key, fin.id);
    });

    const paidSalariesWithFinanceId = paidSalaries.map((s) => {
      const key = `${s.user_id}-${s.pay_date}-${s.amount}-${Math.random()}`; // This matching is fragile, but will have to do for now.
      // A better approach would be to insert one by one, or have the DB return IDs in order.
      // Let's find the first un-used finance record that matches amount and date.
      const matchingFinance = createdFinances.find(
        (cf) =>
          cf.amount === s.amount &&
          cf.transaction_date === s.pay_date &&
          !Array.from(financeMap.values()).includes(cf.id) // A bit complex, let's simplify
      );
      // Simplified loop-based matching for robustness
      const salaryToFinanceMap = new Map<number, string>();
      paidSalaries.forEach((sal, idx) => {
        salaryToFinanceMap.set(idx, createdFinances[idx].id);
      });

      return {
        ...s,
        finance_transaction_id:
          salaryToFinanceMap.get(paidSalaries.indexOf(s)) || null,
      };
    });

    // Let's refine the mapping logic for better accuracy
    const paidSalariesWithIds = paidSalaries.map((salary, index) => {
      // Supabase insert returns records in the same order they were sent
      const correspondingFinanceId = createdFinances[index]?.id;
      return {
        ...salary,
        finance_transaction_id: correspondingFinanceId || null,
      };
    });

    recordsToInsert.push(...paidSalariesWithIds);
  }

  if (pendingSalaries.length > 0) {
    recordsToInsert.push(
      ...pendingSalaries.map((s) => ({ ...s, finance_transaction_id: null }))
    );
  }

  if (recordsToInsert.length > 0) {
    const { error: salaryError } = await supabase
      .from("salaries")
      .insert(recordsToInsert);

    if (salaryError) {
      // TODO: Add logic to delete the finances that were just created if this step fails
      console.error(
        "Salary insert failed, but finance records were created. Manual cleanup may be required.",
        {
          createdFinanceIds: recordsToInsert
            .map((r) => r.finance_transaction_id)
            .filter(Boolean),
        }
      );
      throw salaryError;
    }
  }

  return true;
};
