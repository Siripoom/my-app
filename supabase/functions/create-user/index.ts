import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ✨ 1. เพิ่ม bank_account_number ในการดึงข้อมูลจาก request body
    const {
      email,
      password,
      full_name,
      role,
      position,
      description,
      skills,
      github_url,
      linkedin_url,
      bank_account_number, // <-- เพิ่มบรรทัดนี้
    } = await req.json();

    // 2. ตรวจสอบฟิลด์ที่จำเป็น (เหมือนเดิม)
    if (!email || !password || !full_name || !role || !position) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. สร้าง User ใน auth (เหมือนเดิม)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name }
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const newUserId = authData.user.id;

    // ✨ 4. เพิ่ม bank_account_number ใน object ที่จะ insert ลงตาราง teams
    const { error: profileError } = await supabaseAdmin
      .from('teams')
      .insert({
        id: newUserId,
        full_name: full_name,
        role: role,
        position: position,
        email: email,
        description: description,
        skills: skills,
        github_url: github_url,
        linkedin_url: linkedin_url,
        bank_account_number: bank_account_number, // <-- เพิ่มบรรทัดนี้
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: `Failed to create profile: ${profileError.message}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ message: 'User created successfully', userId: newUserId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});