

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."admin" AS ENUM (
    'admin'
);


ALTER TYPE "public"."admin" OWNER TO "postgres";


CREATE TYPE "public"."user" AS ENUM (
    'user'
);


ALTER TYPE "public"."user" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
  claims jsonb;
  user_role text;
  target_user_id uuid := (event->>'user_id')::uuid;
begin
  -- พิมพ์ Log เพื่อดูว่าฟังก์ชันเริ่มทำงานให้ user id ไหน
  raise notice 'Auth Hook: DEBUG - Step 1: Function started for user_id: %', target_user_id;

  -- ดึงข้อมูล role จากตาราง profiles
  select role into user_role from public.teams where id = target_user_id;

  -- พิมพ์ Log เพื่อดูว่าหลังจากค้นหาแล้ว ได้ค่า role เป็นอะไร (นี่คือ Log ที่สำคัญที่สุด!)
  raise notice 'Auth Hook: DEBUG - Step 2: After select, user_role is: %', user_role;

  -- ตรวจสอบว่าหา role เจอหรือไม่
  if user_role is not null then
    raise notice 'Auth Hook: DEBUG - Step 3A: Role found! Adding to claims.';
    claims := event->'claims';
    claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role));
    claims := jsonb_set(claims, '{user_metadata, role}', to_jsonb(user_role));
    return jsonb_set(event, '{claims}', claims);
  else
    raise notice 'Auth Hook: DEBUG - Step 3B: Role is NULL. Returning original event.';
    return event;
  end if;
end;$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."finances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying NOT NULL,
    "amount" numeric NOT NULL,
    "transaction_date" "date" NOT NULL,
    "notes" "text",
    "type" character varying DEFAULT 'expense'::character varying,
    "category" character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "finances_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "finances_type_check" CHECK ((("type")::"text" = ANY (ARRAY[('income'::character varying)::"text", ('expense'::character varying)::"text"])))
);


ALTER TABLE "public"."finances" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."finance_summary" AS
 SELECT "to_char"(("transaction_date")::timestamp with time zone, 'YYYY-MM'::"text") AS "month",
    "sum"(
        CASE
            WHEN (("type")::"text" = 'income'::"text") THEN "amount"
            ELSE (0)::numeric
        END) AS "total_income",
    "sum"(
        CASE
            WHEN (("type")::"text" = 'expense'::"text") THEN "amount"
            ELSE (0)::numeric
        END) AS "total_expense",
    "sum"(
        CASE
            WHEN (("type")::"text" = 'income'::"text") THEN "amount"
            ELSE (- "amount")
        END) AS "net_amount",
    "count"(*) AS "total_transactions"
   FROM "public"."finances"
  GROUP BY ("to_char"(("transaction_date")::timestamp with time zone, 'YYYY-MM'::"text"))
  ORDER BY ("to_char"(("transaction_date")::timestamp with time zone, 'YYYY-MM'::"text"));


ALTER VIEW "public"."finance_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "start_date" "date",
    "end_date" "date",
    "status" character varying DEFAULT 'todo'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "team_members" "uuid"[] DEFAULT '{}'::"uuid"[],
    "budget" numeric,
    "attachment_url" "text",
    CONSTRAINT "projects_status_check" CHECK ((("status")::"text" = ANY (ARRAY[('todo'::character varying)::"text", ('in_progress'::character varying)::"text", ('completed'::character varying)::"text", ('cancelled'::character varying)::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."salaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "pay_date" "date" NOT NULL,
    "period_start_date" "date" NOT NULL,
    "period_end_date" "date" NOT NULL,
    "notes" "text",
    "finance_transaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'paid'::"text" NOT NULL
);


ALTER TABLE "public"."salaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "avatar_url" "text",
    "description" "text",
    "skills" "text"[],
    "email" "text",
    "github_url" "text",
    "linkedin_url" "text",
    "position" "text",
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "bank_account_number" "text"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE ONLY "public"."finances"
    ADD CONSTRAINT "finances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."salaries"
    ADD CONSTRAINT "salaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."salaries"
    ADD CONSTRAINT "salaries_finance_transaction_id_fkey" FOREIGN KEY ("finance_transaction_id") REFERENCES "public"."finances"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."salaries"
    ADD CONSTRAINT "salaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";

























































































































































REVOKE ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "supabase_auth_admin";


















GRANT ALL ON TABLE "public"."finances" TO "anon";
GRANT ALL ON TABLE "public"."finances" TO "authenticated";
GRANT ALL ON TABLE "public"."finances" TO "service_role";



GRANT ALL ON TABLE "public"."finance_summary" TO "anon";
GRANT ALL ON TABLE "public"."finance_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."finance_summary" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."salaries" TO "anon";
GRANT ALL ON TABLE "public"."salaries" TO "authenticated";
GRANT ALL ON TABLE "public"."salaries" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
