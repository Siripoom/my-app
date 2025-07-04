import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // หรือ 'http://localhost:3000, https://your-prod-domain.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // จัดการ CORS Preflight (ถ้าคุณยังเรียกจาก Client)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId } = await req.json();
    if (!userId) throw new Error('User ID is required.');

    // 1. ดึงข้อมูลที่จำเป็น (เช่น avatar_url) ก่อนทำการลบ
    const { data: teamData } = await supabaseAdmin
      .from('teams')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();

    // 2. ตามไปลบข้อมูลในตาราง salaries ที่เกี่ยวข้องทั้งหมดก่อน
    await supabaseAdmin.from('salaries').delete().eq('user_id', userId);

    // 3. ตามไปลบ User คนนี้ออกจากทุกโปรเจกต์
    const { data: projectsToUpdate } = await supabaseAdmin.from('projects').select('id, team_members').contains('team_members', [userId]);
    if (projectsToUpdate && projectsToUpdate.length > 0) {
      const updatePromises = projectsToUpdate.map(p =>
        supabaseAdmin.from('projects').update({ team_members: p.team_members.filter((id: string) => id !== userId) }).eq('id', p.id)
      );
      await Promise.all(updatePromises);
    }

    // 4. ลบข้อมูลโปรไฟล์จากตาราง 'teams'
    await supabaseAdmin.from('teams').delete().eq('id', userId);

    // 5. ลบ User ในระบบ auth (เป้าหมายหลัก)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw new Error(`Failed to delete auth user: ${authError.message}`);

    // 6. ถ้าเคยมี avatar, ให้ไปลบไฟล์ใน Storage
    if (teamData?.avatar_url) {
      const filePath = teamData.avatar_url.split('/avatars/')[1];
      if (filePath) await supabaseAdmin.storage.from('avatars').remove([filePath]);
    }

    return new Response(JSON.stringify({ message: 'User and all related data deleted successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('Error in delete-user function:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, // ใช้ 500 สำหรับ Internal Server Error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});