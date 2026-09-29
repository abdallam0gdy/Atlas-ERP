--
-- PostgreSQL database dump
--

\restrict WSFD6qkqLqe15zivlL7g2uVSB8vPH81PqWrJ8yo4Zb4reml2wUoJ5UzgUcfR4EG

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: attendance_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendance_status_enum AS ENUM (
    'present',
    'absent',
    'late',
    'excused'
);


ALTER TYPE public.attendance_status_enum OWNER TO postgres;

--
-- Name: barcode_item_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.barcode_item_status_enum AS ENUM (
    'unassigned',
    'assigned',
    'damaged'
);


ALTER TYPE public.barcode_item_status_enum OWNER TO postgres;

--
-- Name: batch_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.batch_status_enum AS ENUM (
    'pending',
    'generated',
    'partially_assigned',
    'fully_assigned'
);


ALTER TYPE public.batch_status_enum OWNER TO postgres;

--
-- Name: billing_model_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.billing_model_enum AS ENUM (
    'PACKAGE_BUNDLE',
    'PER_SUBJECT'
);


ALTER TYPE public.billing_model_enum OWNER TO postgres;

--
-- Name: day_of_week_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.day_of_week_enum AS ENUM (
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
);


ALTER TYPE public.day_of_week_enum OWNER TO postgres;

--
-- Name: group_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.group_status_enum AS ENUM (
    'active',
    'inactive',
    'archived'
);


ALTER TYPE public.group_status_enum OWNER TO postgres;

--
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'paid',
    'pending',
    'free'
);


ALTER TYPE public.payment_status_enum OWNER TO postgres;

--
-- Name: subscription_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.subscription_status_enum AS ENUM (
    'active',
    'expired',
    'suspended'
);


ALTER TYPE public.subscription_status_enum OWNER TO postgres;

--
-- Name: trigger_set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_grades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_ar character varying(100) NOT NULL,
    name_en character varying(100),
    grade_order smallint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.academic_grades OWNER TO postgres;

--
-- Name: attendance_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    group_id uuid NOT NULL,
    session_date date DEFAULT CURRENT_DATE NOT NULL,
    scan_timestamp timestamp with time zone DEFAULT now() NOT NULL,
    status public.attendance_status_enum DEFAULT 'present'::public.attendance_status_enum NOT NULL,
    billing_type public.billing_model_enum,
    payment_status public.payment_status_enum DEFAULT 'pending'::public.payment_status_enum NOT NULL,
    subscription_id uuid,
    scanned_by_user_id uuid,
    notes text,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    remote_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.attendance_logs OWNER TO postgres;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action character varying(50) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id uuid,
    old_data jsonb,
    new_data jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: barcode_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barcode_batches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_name character varying(100) NOT NULL,
    prefix character varying(20) DEFAULT 'ATL'::character varying NOT NULL,
    grade_id uuid,
    start_sequence integer NOT NULL,
    end_sequence integer NOT NULL,
    total_count integer GENERATED ALWAYS AS (((end_sequence - start_sequence) + 1)) STORED,
    assigned_count integer DEFAULT 0 NOT NULL,
    status public.batch_status_enum DEFAULT 'pending'::public.batch_status_enum NOT NULL,
    generated_by uuid,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    use_center_sequence boolean DEFAULT true
);


ALTER TABLE public.barcode_batches OWNER TO postgres;

--
-- Name: barcode_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.barcode_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    batch_id uuid NOT NULL,
    barcode_value character varying(30) NOT NULL,
    status public.barcode_item_status_enum DEFAULT 'unassigned'::public.barcode_item_status_enum NOT NULL,
    assigned_to uuid,
    assigned_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.barcode_items OWNER TO postgres;

--
-- Name: booklet_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booklet_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.booklet_groups OWNER TO postgres;

--
-- Name: booklet_reservation_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.booklet_reservation_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.booklet_reservation_seq OWNER TO postgres;

--
-- Name: booklet_reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booklet_reservations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reservation_number character varying(30) NOT NULL,
    student_id uuid NOT NULL,
    item_id uuid NOT NULL,
    group_id uuid,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    payment_status character varying(20) DEFAULT 'unpaid'::character varying NOT NULL,
    delivery_status character varying(20) DEFAULT 'reserved'::character varying NOT NULL,
    reserved_at timestamp with time zone DEFAULT now() NOT NULL,
    delivered_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT booklet_reservations_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.booklet_reservations OWNER TO postgres;

--
-- Name: cancelled_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cancelled_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    session_date date NOT NULL,
    start_time character varying(10),
    end_time character varying(10),
    reason text DEFAULT 'اعتذار المدرس'::text NOT NULL,
    cancelled_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cancelled_sessions OWNER TO postgres;

--
-- Name: classrooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classrooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    name_ar character varying(100),
    capacity integer DEFAULT 9999,
    floor smallint DEFAULT 0,
    is_active boolean DEFAULT true NOT NULL,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.classrooms OWNER TO postgres;

--
-- Name: daily_settlements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_settlements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    settlement_date date DEFAULT CURRENT_DATE NOT NULL,
    user_id uuid NOT NULL,
    opening_balance numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_subscriptions numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_pos_sales numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_deposits numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_expenses numeric(10,2) DEFAULT 0.00 NOT NULL,
    expected_cash numeric(10,2) NOT NULL,
    actual_cash numeric(10,2) NOT NULL,
    difference numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'closed'::character varying NOT NULL,
    notes text,
    closed_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_settlements OWNER TO postgres;

--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    expense_category character varying(50) NOT NULL,
    amount numeric(10,2) NOT NULL,
    recipient_name character varying(100),
    notes text NOT NULL,
    voucher_no character varying(30),
    recorded_by uuid NOT NULL,
    expense_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT expenses_amount_check CHECK ((amount > (0)::numeric))
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: grade_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade_packages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    grade_id uuid NOT NULL,
    education_type character varying(20) DEFAULT 'PUBLIC'::character varying NOT NULL,
    package_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    single_subject_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.grade_packages OWNER TO postgres;

--
-- Name: group_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    group_id uuid NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enrollment_type character varying(20) DEFAULT 'PACKAGE'::character varying NOT NULL,
    discount_type character varying(10) DEFAULT 'FIXED'::character varying NOT NULL,
    discount_value numeric(10,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE public.group_enrollments OWNER TO postgres;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    name_ar character varying(100),
    teacher_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    grade_id uuid NOT NULL,
    classroom_id uuid,
    schedule jsonb DEFAULT '[]'::jsonb NOT NULL,
    price_per_month numeric(10,2) DEFAULT 0.00,
    price_per_session numeric(10,2) DEFAULT 0.00,
    max_students integer DEFAULT 9999,
    status public.group_status_enum DEFAULT 'active'::public.group_status_enum NOT NULL,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    remote_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    package_teacher_ratio numeric(5,2) DEFAULT 0.00 NOT NULL,
    package_center_ratio numeric(5,2) DEFAULT 100.00 NOT NULL,
    private_teacher_ratio numeric(5,2) DEFAULT 75.00 NOT NULL,
    private_center_ratio numeric(5,2) DEFAULT 25.00 NOT NULL
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(150) NOT NULL,
    category character varying(50) DEFAULT 'booklet'::character varying NOT NULL,
    barcode character varying(50),
    subject_id uuid,
    grade_id uuid,
    cost_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    selling_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    current_stock integer DEFAULT 0 NOT NULL,
    min_stock_alert integer DEFAULT 5 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    teacher_id uuid
);


ALTER TABLE public.inventory_items OWNER TO postgres;

--
-- Name: package_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.package_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    package_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.package_groups OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    module character varying(50) NOT NULL,
    label_ar character varying(150),
    label_en character varying(150),
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: pos_sale_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pos_sale_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id uuid NOT NULL,
    item_id uuid NOT NULL,
    item_name character varying(150) NOT NULL,
    quantity integer NOT NULL,
    unit_cost numeric(10,2) DEFAULT 0.00 NOT NULL,
    unit_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    CONSTRAINT pos_sale_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.pos_sale_items OWNER TO postgres;

--
-- Name: pos_sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pos_sales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    invoice_number character varying(30) NOT NULL,
    cashier_id uuid NOT NULL,
    student_id uuid,
    subtotal numeric(10,2) DEFAULT 0.00 NOT NULL,
    discount numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    change_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    payment_method character varying(20) DEFAULT 'cash'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pos_sales OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    label_ar character varying(100),
    label_en character varying(100),
    description text,
    is_system boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    allowed_pages jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: student_code_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_code_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_code_seq OWNER TO postgres;

--
-- Name: student_package_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_package_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    package_id uuid NOT NULL,
    selected_group_ids uuid[] NOT NULL,
    total_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    enrolled_at timestamp with time zone DEFAULT now(),
    notes text
);


ALTER TABLE public.student_package_enrollments OWNER TO postgres;

--
-- Name: student_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_ar character varying(100) NOT NULL,
    name_en character varying(100),
    discount_percent numeric(5,2) DEFAULT 0.00 NOT NULL,
    color character varying(7) DEFAULT '#0C3C82'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_statuses OWNER TO postgres;

--
-- Name: student_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    group_id uuid,
    total_sessions smallint DEFAULT 0 NOT NULL,
    used_sessions smallint DEFAULT 0 NOT NULL,
    remaining_sessions smallint GENERATED ALWAYS AS ((total_sessions - used_sessions)) STORED,
    amount_paid numeric(10,2) DEFAULT 0.00,
    amount_due numeric(10,2) DEFAULT 0.00,
    billing_month character varying(7) NOT NULL,
    status public.subscription_status_enum DEFAULT 'active'::public.subscription_status_enum NOT NULL,
    starts_at date,
    expires_at date,
    notes text,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    enrollment_type character varying(20) DEFAULT 'PACKAGE'::character varying NOT NULL,
    discount_type character varying(10) DEFAULT 'FIXED'::character varying NOT NULL,
    discount_value numeric(10,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE public.student_subscriptions OWNER TO postgres;

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    barcode_id character varying(30) NOT NULL,
    full_name character varying(150) NOT NULL,
    full_name_ar character varying(150),
    phone character varying(20),
    parent_phone character varying(20),
    parent_name character varying(150),
    grade_id uuid NOT NULL,
    status_id uuid,
    billing_model public.billing_model_enum DEFAULT 'PACKAGE_BUNDLE'::public.billing_model_enum NOT NULL,
    photo_url character varying(500),
    address text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    remote_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    student_code integer DEFAULT nextval('public.student_code_seq'::regclass),
    education_type character varying(20) DEFAULT 'PUBLIC'::character varying NOT NULL,
    enrollment_type character varying(20) DEFAULT 'PACKAGE'::character varying NOT NULL,
    father_phone character varying(20),
    mother_phone character varying(20),
    gender character varying(10) DEFAULT 'male'::character varying,
    national_id character varying(20),
    date_of_birth date
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_ar character varying(100) NOT NULL,
    name_en character varying(100),
    code character varying(20),
    color character varying(7) DEFAULT '#0C3C82'::character varying,
    is_active boolean DEFAULT true NOT NULL,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    education_type character varying(20) DEFAULT 'general'::character varying
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(100) NOT NULL,
    value text,
    value_type character varying(20) DEFAULT 'string'::character varying,
    category character varying(50) DEFAULT 'general'::character varying,
    label_ar character varying(150),
    label_en character varying(150),
    is_public boolean DEFAULT false,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: teachers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teachers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name character varying(150) NOT NULL,
    full_name_ar character varying(150),
    phone character varying(20),
    email character varying(100),
    specialization character varying(100),
    revenue_split_percent numeric(5,2) DEFAULT 0.00,
    revenue_split_type character varying(20) DEFAULT 'percentage'::character varying,
    fixed_rate_per_student numeric(10,2) DEFAULT 0.00,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    remote_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    subject_id uuid,
    subject_ids uuid[] DEFAULT '{}'::uuid[],
    aka character varying(100),
    gender character varying(10) DEFAULT 'male'::character varying,
    national_id character varying(20),
    bio text,
    social_links jsonb DEFAULT '{}'::jsonb,
    secretary_name character varying(150),
    secretary_phone character varying(20),
    photo_url character varying(500),
    logo_url character varying(500),
    date_of_birth date
);


ALTER TABLE public.teachers OWNER TO postgres;

--
-- Name: treasury_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.treasury_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_type character varying(30) NOT NULL,
    amount numeric(10,2) NOT NULL,
    reference_id uuid,
    notes text,
    recorded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.treasury_transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(150) NOT NULL,
    full_name_ar character varying(150),
    phone character varying(20),
    email character varying(100),
    role_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    sync_status character varying(20) DEFAULT 'local'::character varying,
    remote_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    photo_url character varying(500)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: academic_grades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_grades (id, name_ar, name_en, grade_order, is_active, sync_status, created_at, updated_at) FROM stdin;
911c3cb2-c7f1-4a04-8ad7-82d62096a205	الصف الأول الابتدائي	Grade 1	1	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
80738b37-47bd-4ced-9ef9-805c6c6dc06c	الصف الثاني الابتدائي	Grade 2	2	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
23a6b0ab-07a5-4d0e-9b52-e58493982829	الصف الثالث الابتدائي	Grade 3	3	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
9833561e-f6fb-43b9-b9d4-152b41863bc5	الصف الرابع الابتدائي	Grade 4	4	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
5426bcc0-f8fb-4700-8022-d2b3fbed22ee	الصف الخامس الابتدائي	Grade 5	5	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
59141280-1c86-41bc-a284-6d05d555f457	الصف السادس الابتدائي	Grade 6	6	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
eab6184a-f010-48ea-9eee-a75a44ee9f7e	الصف الأول الإعدادي	Grade 7	7	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
79842e52-6787-4773-b13f-5d8abf4c5043	الصف الثاني الإعدادي	Grade 8	8	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	الصف الثالث الإعدادي	Grade 9	9	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
afb79da5-7db2-4b1b-b5d5-78694d100743	الصف الأول الثانوي	Grade 10	10	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
c206e817-623a-495c-9a9a-a07eb25c401e	الصف الثاني الثانوي	Grade 11	11	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
5d478a7c-0e54-4992-a27e-4ff1677b7679	الصف الثالث الثانوي	Grade 12	12	t	local	2026-09-15 14:29:44.458066+03	2026-09-15 14:29:44.458066+03
\.


--
-- Data for Name: attendance_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_logs (id, student_id, group_id, session_date, scan_timestamp, status, billing_type, payment_status, subscription_id, scanned_by_user_id, notes, sync_status, remote_id, created_at) FROM stdin;
22b610c6-fba0-4abb-8c9c-82673ac70c21	d3cd5019-1818-478d-9e61-264a62b043bc	cb4a589d-470f-40a0-af41-c4885f97016f	2026-09-15	2026-09-15 17:36:12.124724+03	present	PACKAGE_BUNDLE	pending	\N	6c49cae8-988b-4bed-9f78-c069486f9f68	\N	local	\N	2026-09-15 17:36:12.124724+03
01e95780-b256-466d-bca4-f6a4ab18ed75	d3cd5019-1818-478d-9e61-264a62b043bc	cb4a589d-470f-40a0-af41-c4885f97016f	2026-09-17	2026-09-17 21:46:30.207005+03	present	PACKAGE_BUNDLE	paid	c3f3110e-9044-4bb3-8bd8-7e1cfd4f8bd0	6c49cae8-988b-4bed-9f78-c069486f9f68	\N	local	\N	2026-09-17 21:46:30.207005+03
a605c357-0972-4542-99e5-95da8dd2f8e2	0b4d0dc9-6fb4-42a5-a108-5e17a126b786	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-18	2026-09-18 09:35:38.717876+03	present	PACKAGE_BUNDLE	paid	7f7b099f-e9a5-43be-951c-25af7f3de10f	9cb28fe8-6c18-466e-a098-f7f862b22a26	\N	local	\N	2026-09-18 09:35:38.717876+03
c9e98aff-3875-4769-aa9a-780340b295f7	3c888942-2f9e-4532-8935-399b985322ca	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-18	2026-09-18 09:36:03.535806+03	present	PACKAGE_BUNDLE	paid	505f12aa-aa28-4c2c-8ab3-f5716df5607d	9cb28fe8-6c18-466e-a098-f7f862b22a26	\N	local	\N	2026-09-18 09:36:03.535806+03
0e27ca51-7fb4-490d-ae28-192c41b4ad87	c5675508-afec-437c-b700-299df9b42c33	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-18	2026-09-18 09:36:23.41149+03	present	PACKAGE_BUNDLE	paid	2596386d-cde8-4a01-a8ef-fdc151ddaca0	9cb28fe8-6c18-466e-a098-f7f862b22a26	\N	local	\N	2026-09-18 09:36:23.41149+03
c56770c4-902a-4762-bc34-3981e672dad1	b2b7ccb0-0320-4770-b3ee-b1e9a27fec3e	9af26238-d54e-4ad4-980e-03f578cb4b4c	2026-09-24	2026-09-24 05:17:51.949701+03	present	PACKAGE_BUNDLE	pending	\N	9cb28fe8-6c18-466e-a098-f7f862b22a26	\N	local	\N	2026-09-24 05:17:51.949701+03
9eb2efb2-0228-4e10-aefa-5f78563868b1	d3cd5019-1818-478d-9e61-264a62b043bc	81f6ecfc-bb49-4a9c-a1f3-645835a4b407	2026-09-26	2026-09-26 20:32:55.771723+03	absent	PACKAGE_BUNDLE	paid	f14cd50d-52a8-47a8-9ac2-f702989e5bf9	\N	غياب عن موعد الحصة المجدولة (تم احتساب الحصة وخصمها من الرصيد)	local	\N	2026-09-26 20:32:55.771723+03
88049543-0352-4aae-a5d9-71c575b987a2	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	1b82140c-89ed-493c-b169-0b32f30a7414	2026-09-28	2026-09-28 01:51:08.932546+03	present	PACKAGE_BUNDLE	paid	4525a7f4-f5bc-4f60-86ff-01b63f80e932	6c49cae8-988b-4bed-9f78-c069486f9f68	\N	local	\N	2026-09-28 01:51:08.932546+03
548a9213-098c-499e-900a-91e540f2b383	9594ff1a-7933-4178-b32e-6c95776c80a8	521ca9ea-fb0e-4750-8eda-992e40f01879	2026-09-28	2026-09-28 01:51:26.052227+03	present	PACKAGE_BUNDLE	paid	5b7ec639-4217-404d-bb29-c37bf8db3cc8	6c49cae8-988b-4bed-9f78-c069486f9f68	\N	local	\N	2026-09-28 01:51:26.052227+03
f46dd051-d427-4e1d-a333-be71fd9e9fc2	d3cd5019-1818-478d-9e61-264a62b043bc	003325da-d578-4e6a-be6e-1a90e877d9c5	2026-09-28	2026-09-28 17:04:31.705247+03	absent	PACKAGE_BUNDLE	paid	6d83ed88-f621-4e8d-b301-b9ae66892221	\N	غياب عن موعد الحصة المجدولة (تم احتساب الحصة وخصمها من الرصيد)	local	\N	2026-09-28 17:04:31.705247+03
b6ae8221-471f-4419-a785-a1018084971f	d3cd5019-1818-478d-9e61-264a62b043bc	3419633f-3643-4571-82fb-a3cb7a93ee11	2026-09-28	2026-09-28 18:31:09.53886+03	absent	PACKAGE_BUNDLE	paid	4fd19cd8-509f-4c82-bbd1-d16cca2bedd6	\N	غياب عن موعد الحصة المجدولة (تم احتساب الحصة وخصمها من الرصيد)	local	\N	2026-09-28 18:31:09.53886+03
6c93abf4-02f5-4f0b-b202-989f3ebb2759	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	21d8e2e6-4f6c-427e-96ee-a1e118f29fc7	2026-09-29	2026-09-29 21:55:40.479038+03	absent	PACKAGE_BUNDLE	paid	b5a7aac2-969d-47cd-af22-f96f018214d8	\N	غياب عن موعد الحصة المجدولة (تم احتساب الحصة وخصمها من الرصيد)	local	\N	2026-09-29 21:55:40.479038+03
8a623c60-a9ad-418e-8bc4-a02a2bd7ba6a	d3cd5019-1818-478d-9e61-264a62b043bc	98f53257-b216-4351-805d-4ea6dd989766	2026-09-29	2026-09-29 21:55:40.531381+03	absent	PACKAGE_BUNDLE	paid	8914b339-813b-40fb-8c00-fa01faa83ef5	\N	غياب عن موعد الحصة المجدولة (تم احتساب الحصة وخصمها من الرصيد)	local	\N	2026-09-29 21:55:40.531381+03
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;
8081880d-4e1b-4618-9748-6761268ea967	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	\N	{"id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "notes": "", "phone": "01224385098", "address": null, "grade_id": "afb79da5-7db2-4b1b-b5d5-78694d100743", "full_name": "عبدالله اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "0348f3ab-58c7-4b36-81e2-85b7849b481f", "barcode_id": "ATL-G10-1004", "created_at": "2026-09-16T01:03:41.703Z", "updated_at": "2026-09-16T01:03:41.703Z", "parent_name": "محمد علي محمد", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385090", "student_code": 1004, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-16 04:03:41.70366+03
22532c14-8e6a-4fc3-9224-c162c2189f7b	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	group	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	\N	{"id": "cb448ecc-b250-4b48-b3e1-76dbf3efcc1a", "name": "Test Group Alpha", "status": "active", "name_ar": "مجموعة أ للتجربة", "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "schedule": [{"day": "saturday", "end_time": "12:00", "start_time": "10:00"}], "remote_id": null, "created_at": "2026-09-16T11:09:04.405Z", "subject_id": "af504fc9-7db3-4e00-9b78-5eb2a73f32c8", "teacher_id": "0f1a658d-9533-4ebb-a08d-9c26a84fd6e4", "updated_at": "2026-09-16T11:09:04.405Z", "sync_status": "local", "classroom_id": "1cffaeb7-9631-4c64-bc55-492268b5c077", "max_students": 30, "price_per_month": "350.00", "price_per_session": "90.00"}	\N	\N	2026-09-16 14:09:04.411361+03
fe16a220-8e27-4ea8-8781-7731f664a6ef	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	{"id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "notes": "", "phone": "01224385098", "address": null, "grade_id": "afb79da5-7db2-4b1b-b5d5-78694d100743", "full_name": "عبدالله اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "0348f3ab-58c7-4b36-81e2-85b7849b481f", "barcode_id": "ATL-G10-1004", "created_at": "2026-09-16T01:03:41.703Z", "updated_at": "2026-09-16T01:03:41.703Z", "parent_name": "محمد علي محمد", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385090", "student_code": 1004, "billing_model": "PACKAGE_BUNDLE"}	{"id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "notes": "", "phone": "01224385098", "address": null, "grade_id": "afb79da5-7db2-4b1b-b5d5-78694d100743", "full_name": "عبدالله اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "0348f3ab-58c7-4b36-81e2-85b7849b481f", "barcode_id": "ATL-G10-1004", "created_at": "2026-09-16T01:03:41.703Z", "updated_at": "2026-09-16T12:10:42.190Z", "parent_name": "محمد علي محمد", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385090", "student_code": 1004, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-16 15:10:42.190098+03
9361839c-ff23-4daa-ad7e-a87eea137c10	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	{"id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "notes": "", "phone": "01224385098", "address": null, "grade_id": "afb79da5-7db2-4b1b-b5d5-78694d100743", "full_name": "عبدالله اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "0348f3ab-58c7-4b36-81e2-85b7849b481f", "barcode_id": "ATL-G10-1004", "created_at": "2026-09-16T01:03:41.703Z", "updated_at": "2026-09-16T12:10:42.190Z", "parent_name": "محمد علي محمد", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385090", "student_code": 1004, "billing_model": "PACKAGE_BUNDLE"}	{"id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "notes": "0", "phone": "01224385098", "address": null, "grade_id": "afb79da5-7db2-4b1b-b5d5-78694d100743", "full_name": "عبدالله اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "0348f3ab-58c7-4b36-81e2-85b7849b481f", "barcode_id": "ATL-G10-1004", "created_at": "2026-09-16T01:03:41.703Z", "updated_at": "2026-09-16T12:10:48.730Z", "parent_name": "محمد علي محمد", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385090", "student_code": 1004, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-16 15:10:48.730804+03
352cc39d-b379-4bec-a350-0feb4914863e	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	7a09dc6d-585a-42bd-b90d-a7b8c44fca31	\N	{"id": "7a09dc6d-585a-42bd-b90d-a7b8c44fca31", "notes": "متخلف", "phone": "01027653886", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "يوسف", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "56e64c66-61ee-43a4-a731-0d3438ce978f", "barcode_id": "ATL-G01-1005", "created_at": "2026-09-16T13:27:54.413Z", "updated_at": "2026-09-16T13:27:54.413Z", "parent_name": "عباس", "sync_status": "local", "full_name_ar": null, "parent_phone": "01228156166", "student_code": 1005, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-16 16:27:54.413132+03
cb6738ea-21ea-4726-b477-dd9e524d2035	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	{"id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "notes": "0", "phone": "01224385098", "address": null, "grade_id": "afb79da5-7db2-4b1b-b5d5-78694d100743", "full_name": "عبدالله اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "0348f3ab-58c7-4b36-81e2-85b7849b481f", "barcode_id": "ATL-G10-1004", "created_at": "2026-09-16T01:03:41.703Z", "updated_at": "2026-09-16T12:10:48.730Z", "parent_name": "محمد علي محمد", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385090", "student_code": 1004, "billing_model": "PACKAGE_BUNDLE"}	{"id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "notes": "0", "phone": "01224385098", "address": null, "grade_id": "afb79da5-7db2-4b1b-b5d5-78694d100743", "full_name": "عبدالله اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "0348f3ab-58c7-4b36-81e2-85b7849b481f", "barcode_id": "ATL-G10-1004", "created_at": "2026-09-16T01:03:41.703Z", "updated_at": "2026-09-16T13:37:12.861Z", "parent_name": "محمد علي محمد", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385090", "student_code": 1004, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-16 16:37:12.86174+03
dd1b33bf-19c2-4863-8c05-951d5010d467	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	b2b7ccb0-0320-4770-b3ee-b1e9a27fec3e	\N	{"id": "b2b7ccb0-0320-4770-b3ee-b1e9a27fec3e", "notes": null, "phone": "01012592535", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب اختبار التدقيق 1782", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1006", "created_at": "2026-09-18T06:12:21.803Z", "updated_at": "2026-09-18T06:12:21.803Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1006, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 09:12:21.80346+03
2b9030e3-6944-4d54-bfe8-f7d0e429b230	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	group	5f0cf646-02f4-4e01-aee3-bfea811272b5	\N	{"id": "5f0cf646-02f4-4e01-aee3-bfea811272b5", "name": "مجموعة فحص التدقيق 1887", "status": "active", "name_ar": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "schedule": [{"day": "monday", "end_time": "13:30", "start_time": "12:00"}], "remote_id": null, "created_at": "2026-09-18T06:12:21.906Z", "subject_id": "af504fc9-7db3-4e00-9b78-5eb2a73f32c8", "teacher_id": "0f1a658d-9533-4ebb-a08d-9c26a84fd6e4", "updated_at": "2026-09-18T06:12:21.906Z", "sync_status": "local", "classroom_id": null, "max_students": 30, "price_per_month": "200.00", "price_per_session": "50.00"}	\N	\N	2026-09-18 09:12:21.917219+03
cf104145-36cc-49ee-8f1e-ef52431c131a	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 30, "paidNum": 200, "category": "الباكدج الكامل", "netPrice": 230, "grossPrice": 260, "student_id": "cf272d2f-a5a0-4935-8099-3f7c682ef9d3", "selected_group_ids": ["a8427ee3-928c-452f-bc66-2ddf01c28149", "e7862323-0e5e-44b3-8f3c-95fc3910afba", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "f8ce81a4-1fea-41aa-9e85-1bc7af5b6da8"]}	\N	\N	2026-09-26 05:17:55.504788+03
2123572a-4d5c-40a9-b7c4-d81192106be6	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	9594ff1a-7933-4178-b32e-6c95776c80a8	\N	{"id": "9594ff1a-7933-4178-b32e-6c95776c80a8", "notes": null, "phone": "01035098834", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب اختبار التدقيق 1418", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1007", "created_at": "2026-09-18T06:12:41.426Z", "updated_at": "2026-09-18T06:12:41.426Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1007, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 09:12:41.426948+03
868263d2-11c4-42e5-bdfa-54649bf6fe63	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	group	003325da-d578-4e6a-be6e-1a90e877d9c5	\N	{"id": "003325da-d578-4e6a-be6e-1a90e877d9c5", "name": "مجموعة فحص التدقيق 1481", "status": "active", "name_ar": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "schedule": [{"day": "monday", "end_time": "13:30", "start_time": "12:00"}], "remote_id": null, "created_at": "2026-09-18T06:12:41.489Z", "subject_id": "af504fc9-7db3-4e00-9b78-5eb2a73f32c8", "teacher_id": "0f1a658d-9533-4ebb-a08d-9c26a84fd6e4", "updated_at": "2026-09-18T06:12:41.489Z", "sync_status": "local", "classroom_id": null, "max_students": 30, "price_per_month": "200.00", "price_per_session": "50.00"}	\N	\N	2026-09-18 09:12:41.496023+03
7655f213-b435-46e8-bb22-dd9fe484a6e5	9cb28fe8-6c18-466e-a098-f7f862b22a26	CREATE	student	0b4d0dc9-6fb4-42a5-a108-5e17a126b786	\N	{"id": "0b4d0dc9-6fb4-42a5-a108-5e17a126b786", "notes": null, "phone": "01147209388", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تدقيق الصلاحيات 8564", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1008", "created_at": "2026-09-18T06:35:38.569Z", "updated_at": "2026-09-18T06:35:38.569Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1008, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 09:35:38.569449+03
fc34215d-2304-484d-8afe-a9df2aa89649	9cb28fe8-6c18-466e-a098-f7f862b22a26	UPDATE	student	0b4d0dc9-6fb4-42a5-a108-5e17a126b786	{"id": "0b4d0dc9-6fb4-42a5-a108-5e17a126b786", "notes": null, "phone": "01147209388", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تدقيق الصلاحيات 8564", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1008", "created_at": "2026-09-18T06:35:38.569Z", "updated_at": "2026-09-18T06:35:38.569Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1008, "billing_model": "PACKAGE_BUNDLE"}	{"id": "0b4d0dc9-6fb4-42a5-a108-5e17a126b786", "notes": "تم التحديث بنجاح بواسطة موظف الاستقبال", "phone": "01147209388", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تدقيق الصلاحيات 8564", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1008", "created_at": "2026-09-18T06:35:38.569Z", "updated_at": "2026-09-18T06:35:38.584Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1008, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 09:35:38.584297+03
688c659e-e834-4200-8a13-cb78567e7ee9	9cb28fe8-6c18-466e-a098-f7f862b22a26	CREATE	student	3c888942-2f9e-4532-8935-399b985322ca	\N	{"id": "3c888942-2f9e-4532-8935-399b985322ca", "notes": null, "phone": "01169253873", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تدقيق الصلاحيات 3397", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1009", "created_at": "2026-09-18T06:36:03.405Z", "updated_at": "2026-09-18T06:36:03.405Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1009, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 09:36:03.405269+03
5b03dcec-1297-4174-9abc-0280351f1286	9cb28fe8-6c18-466e-a098-f7f862b22a26	UPDATE	student	3c888942-2f9e-4532-8935-399b985322ca	{"id": "3c888942-2f9e-4532-8935-399b985322ca", "notes": null, "phone": "01169253873", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تدقيق الصلاحيات 3397", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1009", "created_at": "2026-09-18T06:36:03.405Z", "updated_at": "2026-09-18T06:36:03.405Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1009, "billing_model": "PACKAGE_BUNDLE"}	{"id": "3c888942-2f9e-4532-8935-399b985322ca", "notes": "تم التحديث بنجاح بواسطة موظف الاستقبال", "phone": "01169253873", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تدقيق الصلاحيات 3397", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1009", "created_at": "2026-09-18T06:36:03.405Z", "updated_at": "2026-09-18T06:36:03.418Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1009, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 09:36:03.418859+03
1a3ed894-96f6-4c97-b908-b31c1933e993	9cb28fe8-6c18-466e-a098-f7f862b22a26	CREATE	student	c5675508-afec-437c-b700-299df9b42c33	\N	{"id": "c5675508-afec-437c-b700-299df9b42c33", "notes": null, "phone": "01146319313", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تدقيق الصلاحيات 3255", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1010", "created_at": "2026-09-18T06:36:23.259Z", "updated_at": "2026-09-18T06:36:23.259Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1010, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 09:36:23.259802+03
0f64f9c8-09d5-46ad-bb93-a772e393a386	9cb28fe8-6c18-466e-a098-f7f862b22a26	UPDATE	student	c5675508-afec-437c-b700-299df9b42c33	{"id": "c5675508-afec-437c-b700-299df9b42c33", "notes": null, "phone": "01146319313", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تدقيق الصلاحيات 3255", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1010", "created_at": "2026-09-18T06:36:23.259Z", "updated_at": "2026-09-18T06:36:23.259Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1010, "billing_model": "PACKAGE_BUNDLE"}	{"id": "c5675508-afec-437c-b700-299df9b42c33", "notes": "تم التحديث بنجاح بواسطة موظف الاستقبال", "phone": "01146319313", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تدقيق الصلاحيات 3255", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1010", "created_at": "2026-09-18T06:36:23.259Z", "updated_at": "2026-09-18T06:36:23.271Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1010, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 09:36:23.271893+03
6c042a89-3052-4226-a444-41f9a478f93d	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	ab67466a-f62a-4d3e-b823-ec8fbb90696a	\N	{"id": "ab67466a-f62a-4d3e-b823-ec8fbb90696a", "notes": null, "phone": "01018702267", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب اختبار التدقيق 7083", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1011", "created_at": "2026-09-18T06:36:27.087Z", "updated_at": "2026-09-18T06:36:27.087Z", "parent_name": null, "sync_status": "local", "full_name_ar": null, "parent_phone": null, "student_code": 1011, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 09:36:27.087684+03
f96adb38-baa0-4008-a955-a56e4398800f	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	group	521ca9ea-fb0e-4750-8eda-992e40f01879	\N	{"id": "521ca9ea-fb0e-4750-8eda-992e40f01879", "name": "مجموعة فحص التدقيق 7119", "status": "active", "name_ar": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "schedule": [{"day": "monday", "end_time": "13:30", "start_time": "12:00"}], "remote_id": null, "created_at": "2026-09-18T06:36:27.126Z", "subject_id": "af504fc9-7db3-4e00-9b78-5eb2a73f32c8", "teacher_id": "0f1a658d-9533-4ebb-a08d-9c26a84fd6e4", "updated_at": "2026-09-18T06:36:27.126Z", "sync_status": "local", "classroom_id": null, "max_students": 30, "price_per_month": "200.00", "price_per_session": "50.00"}	\N	\N	2026-09-18 09:36:27.131639+03
11c5288b-bbfe-486a-8325-9eae21d8a6f7	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	7a09dc6d-585a-42bd-b90d-a7b8c44fca31	{"id": "7a09dc6d-585a-42bd-b90d-a7b8c44fca31", "notes": "متخلف", "phone": "01027653886", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "يوسف", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "56e64c66-61ee-43a4-a731-0d3438ce978f", "barcode_id": "ATL-G01-1005", "created_at": "2026-09-16T13:27:54.413Z", "updated_at": "2026-09-16T13:27:54.413Z", "parent_name": "عباس", "sync_status": "local", "full_name_ar": null, "parent_phone": "01228156166", "student_code": 1005, "billing_model": "PACKAGE_BUNDLE"}	{"id": "7a09dc6d-585a-42bd-b90d-a7b8c44fca31", "notes": "متخلف", "phone": "01027653886", "address": null, "grade_id": "79842e52-6787-4773-b13f-5d8abf4c5043", "full_name": "يوسف", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "56e64c66-61ee-43a4-a731-0d3438ce978f", "barcode_id": "ATL-G01-1005", "created_at": "2026-09-16T13:27:54.413Z", "updated_at": "2026-09-18T11:52:48.845Z", "parent_name": "عباس", "sync_status": "local", "full_name_ar": null, "parent_phone": "01228156166", "student_code": 1005, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 14:52:48.845986+03
81bd66b4-b680-4838-b918-994ae4874491	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	\N	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "", "phone": "01224385090", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-18T11:53:43.272Z", "parent_name": "0", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385091", "student_code": 1012, "billing_model": "PACKAGE_BUNDLE"}	\N	\N	2026-09-18 14:53:43.272563+03
89677891-5328-4989-9ed9-c38f3e0e41a0	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	group	6f11d291-359d-403b-8d57-b4c0003b505b	\N	{"id": "6f11d291-359d-403b-8d57-b4c0003b505b", "name": "الأحياء - Hossam Ibrahim", "status": "active", "name_ar": "الأحياء - Hossam Ibrahim", "grade_id": "79842e52-6787-4773-b13f-5d8abf4c5043", "schedule": [{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}], "remote_id": null, "created_at": "2026-09-18T11:55:55.995Z", "subject_id": "af504fc9-7db3-4e00-9b78-5eb2a73f32c8", "teacher_id": "0f1a658d-9533-4ebb-a08d-9c26a84fd6e4", "updated_at": "2026-09-18T11:55:55.995Z", "sync_status": "local", "classroom_id": "8656d593-ece1-4946-af99-20073616771d", "max_students": 9999, "price_per_month": "200.00", "price_per_session": "50.00"}	\N	\N	2026-09-18 14:55:56.010655+03
57821937-5e9b-4d4b-878d-bc773431695f	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "", "phone": "01224385090", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-18T11:53:43.272Z", "parent_name": "0", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385091", "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "", "phone": "01224385090", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-19T00:22:36.766Z", "parent_name": "0", "sync_status": "local", "full_name_ar": null, "parent_phone": "01224385091", "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-19 03:22:36.766833+03
141beccd-f2fa-4794-9572-ffea2c2b2fc3	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "", "phone": "01224385090", "gender": "male", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-19T00:22:36.766Z", "national_id": null, "parent_name": "0", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01224385091", "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": null, "phone": "01224385090", "gender": "female", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/test.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:39:42.909Z", "national_id": null, "parent_name": null, "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:39:42.909996+03
ebc0badd-b1e3-4a85-8712-25cb083cb956	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": null, "phone": "01224385090", "gender": "female", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/test.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:39:42.909Z", "national_id": null, "parent_name": null, "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_9d8a672d0deca4fe0a0a82058d6f2bd8d814a830a06ce627.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:40:46.909Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:40:46.909122+03
134e8e6d-468f-402c-b483-7b2abd1dcec4	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_9d8a672d0deca4fe0a0a82058d6f2bd8d814a830a06ce627.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:40:46.909Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "male", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_9d8a672d0deca4fe0a0a82058d6f2bd8d814a830a06ce627.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:40:46.928Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-14T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:40:46.928015+03
824e9c0e-eb9c-40c3-b2e4-fcbfb304e94e	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	9bd5ca2f-6bb6-4458-be6a-4464641bb05e	\N	{"id": "9bd5ca2f-6bb6-4458-be6a-4464641bb05e", "notes": "تم الإنشاء للاختبار الآلي", "phone": "01064459144", "gender": "male", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "طالب تجريبي للاختبار", "is_active": true, "photo_url": "/uploads/students/students_9d8a672d0deca4fe0a0a82058d6f2bd8d814a830a06ce627.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1013", "created_at": "2026-09-26T00:40:46.945Z", "updated_at": "2026-09-26T00:40:46.945Z", "national_id": "30805121234567", "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": "01233334444", "full_name_ar": null, "mother_phone": "01566667777", "parent_phone": "01233334444", "student_code": 1013, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-05-11T21:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:40:46.945702+03
79120803-443f-4b0c-b3a2-c45b69ab8e70	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "male", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_9d8a672d0deca4fe0a0a82058d6f2bd8d814a830a06ce627.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:40:46.928Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-14T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_b281690fc5f432758d683a33831e77825caae8db48374945.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:41:19.588Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:41:19.588337+03
42e6cd9a-4eb9-4414-a870-4bd6efc629f9	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_b281690fc5f432758d683a33831e77825caae8db48374945.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:41:19.588Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "male", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_b281690fc5f432758d683a33831e77825caae8db48374945.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:41:19.602Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-14T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:41:19.602298+03
bd9aa700-ead8-4f5c-94ff-e8db87584235	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	d165db70-ccd3-4dc9-9525-d958686770f7	\N	{"id": "d165db70-ccd3-4dc9-9525-d958686770f7", "notes": "تم الإنشاء للاختبار الآلي", "phone": "01016060511", "gender": "male", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "طالب تجريبي للاختبار", "is_active": true, "photo_url": "/uploads/students/students_b281690fc5f432758d683a33831e77825caae8db48374945.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1014", "created_at": "2026-09-26T00:41:19.616Z", "updated_at": "2026-09-26T00:41:19.616Z", "national_id": "30805121234567", "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": "01233334444", "full_name_ar": null, "mother_phone": "01566667777", "parent_phone": "01233334444", "student_code": 1014, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-05-11T21:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:41:19.616957+03
68321290-0c52-4f44-aa1a-c56fc5ca647b	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 116, "paidNum": 100, "category": "مواد سنتر منفردة (2 مادة)", "netPrice": 216, "grossPrice": 240, "student_id": "50a137c3-ff4d-494f-98ff-015a3f497dea", "selected_group_ids": ["a8427ee3-928c-452f-bc66-2ddf01c28149", "e7862323-0e5e-44b3-8f3c-95fc3910afba"]}	\N	\N	2026-09-26 05:17:55.540426+03
516ad064-9976-4ef6-839e-f4d08e5103b3	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "male", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_b281690fc5f432758d683a33831e77825caae8db48374945.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:41:19.602Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-14T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_373b18d7b94fb23979a70244fa5e7b8ccf95781b59c3125e.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:42:08.947Z", "national_id": "29901011234567", "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": "01011112222", "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-13T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:42:08.947563+03
c89e729a-fb8a-4aad-a953-fc5516b82c3f	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_373b18d7b94fb23979a70244fa5e7b8ccf95781b59c3125e.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:42:08.947Z", "national_id": "29901011234567", "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": "01011112222", "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-13T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_628d8cb8a6579ba1812e21b1fb65ddab61c50bfc3fb71adc.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:42:53.938Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:42:53.938109+03
8e5ad884-7594-48ec-8408-578d17454ddd	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_628d8cb8a6579ba1812e21b1fb65ddab61c50bfc3fb71adc.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:42:53.938Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "male", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_628d8cb8a6579ba1812e21b1fb65ddab61c50bfc3fb71adc.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:42:53.951Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-14T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:42:53.951045+03
5b6134cb-fcfa-4414-9412-92d27e3766b6	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	a0bc1b22-59f9-4c8d-a831-9c070d10f7a2	\N	{"id": "a0bc1b22-59f9-4c8d-a831-9c070d10f7a2", "notes": "تم الإنشاء للاختبار الآلي", "phone": "01095347695", "gender": "male", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "طالب تجريبي للاختبار", "is_active": true, "photo_url": "/uploads/students/students_628d8cb8a6579ba1812e21b1fb65ddab61c50bfc3fb71adc.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1015", "created_at": "2026-09-26T00:42:53.965Z", "updated_at": "2026-09-26T00:42:53.965Z", "national_id": "30805121234567", "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": "01233334444", "full_name_ar": null, "mother_phone": "01566667777", "parent_phone": "01233334444", "student_code": 1015, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-05-11T21:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 03:42:53.965203+03
336195ae-076e-4846-be35-88b30f0ed0db	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	67b6345d-88ac-4d11-809a-cc837d4612c7	\N	{"id": "67b6345d-88ac-4d11-809a-cc837d4612c7", "notes": null, "phone": "01282743376", "gender": "male", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب اختبار الباكدج الذكي", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1016", "created_at": "2026-09-26T01:05:32.220Z", "updated_at": "2026-09-26T01:05:32.220Z", "national_id": null, "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01282743376", "student_code": 1016, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 04:05:32.22088+03
1c06fc3a-cfd0-4745-823b-a762f8285431	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	cda6f670-70c7-4b7c-808f-b55474e35751	\N	{"student_id": "67b6345d-88ac-4d11-809a-cc837d4612c7", "package_price": "300.00", "selected_group_ids": ["cb448ecc-b250-4b48-b3e1-76dbf3efcc1a"]}	\N	\N	2026-09-26 04:05:32.243281+03
fddb455a-0efc-4709-87bb-5b953595d964	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	cda6f670-70c7-4b7c-808f-b55474e35751	\N	{"student_id": "67b6345d-88ac-4d11-809a-cc837d4612c7", "package_price": "300.00", "selected_group_ids": ["cb448ecc-b250-4b48-b3e1-76dbf3efcc1a"]}	\N	\N	2026-09-26 04:05:32.257814+03
4aa7f375-c046-4321-a5ee-4f4dec1e9e36	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	fc09cabe-3b8f-4fd0-bc8a-5590fac1edb4	\N	{"id": "fc09cabe-3b8f-4fd0-bc8a-5590fac1edb4", "notes": null, "phone": "01280662073", "gender": "male", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب اختبار الباكدج الذكي", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1017", "created_at": "2026-09-26T01:06:21.233Z", "updated_at": "2026-09-26T01:06:21.233Z", "national_id": null, "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01280662073", "student_code": 1017, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 04:06:21.233784+03
3b8cc2e9-015a-4b84-bfb2-6cb411fe748e	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	cda6f670-70c7-4b7c-808f-b55474e35751	\N	{"student_id": "fc09cabe-3b8f-4fd0-bc8a-5590fac1edb4", "package_price": "300.00", "selected_group_ids": ["cb448ecc-b250-4b48-b3e1-76dbf3efcc1a", "9af26238-d54e-4ad4-980e-03f578cb4b4c"]}	\N	\N	2026-09-26 04:06:21.274627+03
4b44228c-a4bf-4c5b-9f50-16460c144c8d	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "male", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_628d8cb8a6579ba1812e21b1fb65ddab61c50bfc3fb71adc.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T00:42:53.951Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-14T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_d8e0e1f89a80b1c2edd8a0ff52257d0ce650afe711a7b0e1.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T01:06:23.939Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 04:06:23.939805+03
110c1761-7b09-4526-ba87-dabf462e129a	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_d8e0e1f89a80b1c2edd8a0ff52257d0ce650afe711a7b0e1.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T01:06:23.939Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "male", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_d8e0e1f89a80b1c2edd8a0ff52257d0ce650afe711a7b0e1.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T01:06:23.956Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-14T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 04:06:23.956841+03
fc0570da-c706-4427-8b58-41ea9e87d173	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	881fa5ff-2bec-4f77-8804-f1eec5bebf09	\N	{"id": "881fa5ff-2bec-4f77-8804-f1eec5bebf09", "notes": "تم الإنشاء للاختبار الآلي", "phone": "01092965730", "gender": "male", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "طالب تجريبي للاختبار", "is_active": true, "photo_url": "/uploads/students/students_d8e0e1f89a80b1c2edd8a0ff52257d0ce650afe711a7b0e1.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1018", "created_at": "2026-09-26T01:06:23.971Z", "updated_at": "2026-09-26T01:06:23.971Z", "national_id": "30805121234567", "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": "01233334444", "full_name_ar": null, "mother_phone": "01566667777", "parent_phone": "01233334444", "student_code": 1018, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-05-11T21:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 04:06:23.971353+03
91e63fd6-720b-4b3a-97b0-0f684b794c84	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 30, "paidNum": 200, "category": "الباكدج الكامل", "netPrice": 230, "grossPrice": 260, "student_id": "c8cf13df-1f54-4c85-8783-53b9d64843e6", "selected_group_ids": ["a8427ee3-928c-452f-bc66-2ddf01c28149", "e7862323-0e5e-44b3-8f3c-95fc3910afba", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "f8ce81a4-1fea-41aa-9e85-1bc7af5b6da8"]}	\N	\N	2026-09-26 05:15:51.392548+03
4bc86813-65d3-4312-bb22-65030050c071	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 116, "paidNum": 100, "category": "مواد سنتر منفردة (2 مادة)", "netPrice": 216, "grossPrice": 240, "student_id": "fd84d491-d952-41d3-93ef-f604014f9cd8", "selected_group_ids": ["a8427ee3-928c-452f-bc66-2ddf01c28149", "e7862323-0e5e-44b3-8f3c-95fc3910afba"]}	\N	\N	2026-09-26 05:15:51.430591+03
d10437fa-e407-4cce-b3c2-7b41a9ff76c5	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 30, "paidNum": 200, "category": "الباكدج الكامل", "netPrice": 230, "grossPrice": 260, "student_id": "6b2f1c2d-25e6-4270-a180-b2b2cb5b8a2c", "selected_group_ids": ["a8427ee3-928c-452f-bc66-2ddf01c28149", "e7862323-0e5e-44b3-8f3c-95fc3910afba", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "f8ce81a4-1fea-41aa-9e85-1bc7af5b6da8"]}	\N	\N	2026-09-26 05:17:31.020537+03
fc068417-1156-498f-b09c-3900178dbf64	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 116, "paidNum": 100, "category": "مواد سنتر منفردة (2 مادة)", "netPrice": 216, "grossPrice": 240, "student_id": "ef0e148f-82ba-47a2-ab4c-aba13f88a9d7", "selected_group_ids": ["a8427ee3-928c-452f-bc66-2ddf01c28149", "e7862323-0e5e-44b3-8f3c-95fc3910afba"]}	\N	\N	2026-09-26 05:17:31.054972+03
acd9d2bb-c1b4-4211-b71f-65b5f03e8d31	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1	\N	{"id": "fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1", "notes": null, "phone": "01297393974", "gender": "male", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب اختبار الباكدج الذكي", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1019", "created_at": "2026-09-26T02:18:12.216Z", "updated_at": "2026-09-26T02:18:12.216Z", "national_id": null, "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01297393974", "student_code": 1019, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 05:18:12.216637+03
3153d071-7b12-4067-860a-ee12810ee639	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	cda6f670-70c7-4b7c-808f-b55474e35751	\N	{"dueNum": 70, "paidNum": 0, "category": "مواد سنتر منفردة (1 مادة)", "netPrice": 70, "grossPrice": 70, "student_id": "fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1", "selected_group_ids": ["cb448ecc-b250-4b48-b3e1-76dbf3efcc1a"]}	\N	\N	2026-09-26 05:18:12.246141+03
d09d3b21-737d-4d42-96fa-98fd3650ab2c	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	cda6f670-70c7-4b7c-808f-b55474e35751	\N	{"dueNum": 300, "paidNum": 0, "category": "الباكدج الكامل", "netPrice": 300, "grossPrice": 300, "student_id": "fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1", "selected_group_ids": ["cb448ecc-b250-4b48-b3e1-76dbf3efcc1a", "9af26238-d54e-4ad4-980e-03f578cb4b4c"]}	\N	\N	2026-09-26 05:18:12.260479+03
bc3a7008-aa14-4b88-bd50-699a3b057f50	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	3f4d6618-7e31-441e-bc1b-d14bfd4f8d32	\N	{"id": "3f4d6618-7e31-441e-bc1b-d14bfd4f8d32", "notes": null, "phone": "01229563551", "gender": "male", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب اختبار الباكدج الذكي", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1020", "created_at": "2026-09-26T02:18:42.029Z", "updated_at": "2026-09-26T02:18:42.029Z", "national_id": null, "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01229563551", "student_code": 1020, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 05:18:42.029228+03
2ae9bd94-9216-4240-ab5a-c97f27227c2a	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	cda6f670-70c7-4b7c-808f-b55474e35751	\N	{"dueNum": 70, "paidNum": 0, "category": "مواد سنتر منفردة (1 مادة)", "netPrice": 70, "grossPrice": 70, "student_id": "3f4d6618-7e31-441e-bc1b-d14bfd4f8d32", "selected_group_ids": ["cb448ecc-b250-4b48-b3e1-76dbf3efcc1a"]}	\N	\N	2026-09-26 05:18:42.066989+03
c96d8aff-0acb-42d8-b758-7420ac86a580	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	cda6f670-70c7-4b7c-808f-b55474e35751	\N	{"dueNum": 300, "paidNum": 0, "category": "الباكدج الكامل", "netPrice": 300, "grossPrice": 300, "student_id": "3f4d6618-7e31-441e-bc1b-d14bfd4f8d32", "selected_group_ids": ["cb448ecc-b250-4b48-b3e1-76dbf3efcc1a", "9af26238-d54e-4ad4-980e-03f578cb4b4c"]}	\N	\N	2026-09-26 05:18:42.08741+03
113bcb17-4864-4e12-b53f-2797dd8ef90f	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "male", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_d8e0e1f89a80b1c2edd8a0ff52257d0ce650afe711a7b0e1.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T01:06:23.956Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-14T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_91986ccaf599adb20170aea290904a3bd47769e99d07192b.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T02:18:50.073Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 05:18:50.073589+03
0dd01eb8-8190-4cb9-902b-e4c21c787dd9	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	4d2ee661-59b5-4cba-a77f-6966a8301c92	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "female", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن المحدث", "is_active": true, "photo_url": "/uploads/students/students_91986ccaf599adb20170aea290904a3bd47769e99d07192b.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T02:18:50.073Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "4d2ee661-59b5-4cba-a77f-6966a8301c92", "notes": "طالب مميز", "phone": "01224385090", "gender": "male", "address": "شارع الجمهورية - الدور الثالث", "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "ادمن", "is_active": true, "photo_url": "/uploads/students/students_91986ccaf599adb20170aea290904a3bd47769e99d07192b.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1012", "created_at": "2026-09-18T11:53:43.272Z", "updated_at": "2026-09-26T02:18:50.092Z", "national_id": "29901011234567", "parent_name": null, "sync_status": "local", "father_phone": "01011112222", "full_name_ar": null, "mother_phone": "01122223333", "parent_phone": null, "student_code": 1012, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-03-14T22:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 05:18:50.092032+03
2e0e3ed1-86f9-46e7-81cc-c0ec9f6bfd36	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	8cef0d44-9ad5-48f2-9321-3a09bcc526f4	\N	{"id": "8cef0d44-9ad5-48f2-9321-3a09bcc526f4", "notes": "تم الإنشاء للاختبار الآلي", "phone": "01082685343", "gender": "male", "address": null, "grade_id": "6d603462-3d6b-43b1-9f9d-71c8d88ac6ea", "full_name": "طالب تجريبي للاختبار", "is_active": true, "photo_url": "/uploads/students/students_91986ccaf599adb20170aea290904a3bd47769e99d07192b.webp", "remote_id": null, "status_id": null, "barcode_id": "ATL-G09-1021", "created_at": "2026-09-26T02:18:50.104Z", "updated_at": "2026-09-26T02:18:50.104Z", "national_id": "30805121234567", "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": "01233334444", "full_name_ar": null, "mother_phone": "01566667777", "parent_phone": "01233334444", "student_code": 1021, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": "2008-05-11T21:00:00.000Z", "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 05:18:50.104915+03
a419e305-4d64-4588-a57c-e1568e181cb2	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	03f04240-4980-43dc-992d-0811f17edf25	\N	{"dueNum": 0, "paidNum": 710, "category": "الباكدج الكامل", "netPrice": 710, "grossPrice": 710, "student_id": "d3cd5019-1818-478d-9e61-264a62b043bc", "selected_group_ids": ["e2a924c2-485e-4fdf-8265-490b5feef955", "3419633f-3643-4571-82fb-a3cb7a93ee11", "9ebafcbb-2b3e-4828-b130-1d25792d0259", "5debaf66-ad5f-409e-829f-424d88aa0bcb", "81f6ecfc-bb49-4a9c-a1f3-645835a4b407", "b804cc9a-ef86-4458-bbfa-7b972c0ba868", "98f53257-b216-4351-805d-4ea6dd989766", "c25c3d73-23f9-41df-aeef-330f399318f2"]}	\N	\N	2026-09-26 05:30:23.70968+03
8f37ab11-1fd7-4926-95cc-67466048529a	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 0, "paidNum": 260, "category": "الباكدج الكامل", "netPrice": 260, "grossPrice": 260, "student_id": "e5d9b9c7-293e-4206-bef6-e0911b206fd2", "selected_group_ids": ["a8427ee3-928c-452f-bc66-2ddf01c28149", "e7862323-0e5e-44b3-8f3c-95fc3910afba", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "f8ce81a4-1fea-41aa-9e85-1bc7af5b6da8"]}	\N	\N	2026-09-26 05:30:36.413095+03
387a520b-f518-4349-a860-dbed2138fa93	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 30, "paidNum": 200, "category": "الباكدج الكامل", "netPrice": 230, "grossPrice": 260, "student_id": "0928a786-a92b-4a21-8252-d9f9e41d5641", "selected_group_ids": ["a8427ee3-928c-452f-bc66-2ddf01c28149", "e7862323-0e5e-44b3-8f3c-95fc3910afba", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "f8ce81a4-1fea-41aa-9e85-1bc7af5b6da8"]}	\N	\N	2026-09-26 05:50:20.073863+03
2c895dba-c6d0-485d-960e-4bfe54a6f821	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 116, "paidNum": 100, "category": "مواد سنتر منفردة (2 مادة)", "netPrice": 216, "grossPrice": 240, "student_id": "73e535e7-9e2a-4d3c-98b3-9c86ae67b8fb", "selected_group_ids": ["a8427ee3-928c-452f-bc66-2ddf01c28149", "e7862323-0e5e-44b3-8f3c-95fc3910afba"]}	\N	\N	2026-09-26 05:50:20.136908+03
59ea8c55-0795-4338-ae2c-c821ae6b51c5	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	03f04240-4980-43dc-992d-0811f17edf25	\N	{"dueNum": 0, "paidNum": 639, "category": "الباكدج الكامل", "netPrice": 639, "grossPrice": 710, "student_id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "selected_group_ids": ["e2a924c2-485e-4fdf-8265-490b5feef955", "3419633f-3643-4571-82fb-a3cb7a93ee11", "9ebafcbb-2b3e-4828-b130-1d25792d0259", "5debaf66-ad5f-409e-829f-424d88aa0bcb", "81f6ecfc-bb49-4a9c-a1f3-645835a4b407", "b804cc9a-ef86-4458-bbfa-7b972c0ba868", "98f53257-b216-4351-805d-4ea6dd989766", "c25c3d73-23f9-41df-aeef-330f399318f2"]}	\N	\N	2026-09-26 10:29:00.580388+03
7681b7f7-045d-4f01-b24f-d8bcf45be084	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 30, "paidNum": 200, "category": "الباكدج الكامل", "netPrice": 230, "grossPrice": 260, "student_id": "2a80b364-c9fd-4b69-99dc-65f249b98eaf", "selected_group_ids": ["1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "8cb9be9b-2642-494f-9f8b-23ea998a30c3", "21d8e2e6-4f6c-427e-96ee-a1e118f29fc7"]}	\N	\N	2026-09-26 10:55:37.374166+03
67d79fb7-9793-452d-8dd5-a8f5f24037b8	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 116, "paidNum": 100, "category": "مواد سنتر منفردة (2 مادة)", "netPrice": 216, "grossPrice": 240, "student_id": "2d58d284-eb2e-4ef4-aaa5-eca657507379", "selected_group_ids": ["1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46"]}	\N	\N	2026-09-26 10:55:37.406465+03
4a0342ff-2ea2-4ba8-bafe-d5325e75a3f4	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	{"id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "notes": "0", "phone": "01224385098", "gender": "male", "address": null, "grade_id": "afb79da5-7db2-4b1b-b5d5-78694d100743", "full_name": "عبدالله اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "0348f3ab-58c7-4b36-81e2-85b7849b481f", "barcode_id": "ATL-G10-1004", "created_at": "2026-09-16T01:03:41.703Z", "updated_at": "2026-09-16T13:37:12.861Z", "national_id": null, "parent_name": "محمد علي محمد", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01224385090", "student_code": 1004, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "notes": "0", "phone": "01224385098", "gender": "male", "address": null, "grade_id": "9833561e-f6fb-43b9-b9d4-152b41863bc5", "full_name": "عبدالله اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": "0348f3ab-58c7-4b36-81e2-85b7849b481f", "barcode_id": "ATL-G04-1004", "created_at": "2026-09-16T01:03:41.703Z", "updated_at": "2026-09-26T10:06:21.533Z", "national_id": null, "parent_name": "محمد علي محمد", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01224385090", "student_code": 1004, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 13:06:21.533695+03
2857f8b7-f754-4e42-966b-a6e58c9e43e0	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 30, "paidNum": 200, "category": "الباكدج الكامل", "netPrice": 230, "grossPrice": 260, "student_id": "ee5d4681-31d8-4530-aca7-6f9be9131fd5", "selected_group_ids": ["1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "8cb9be9b-2642-494f-9f8b-23ea998a30c3", "21d8e2e6-4f6c-427e-96ee-a1e118f29fc7"]}	\N	\N	2026-09-26 13:32:21.100739+03
97ca6648-532b-45e9-90fa-b7996eb938a7	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 116, "paidNum": 100, "category": "مواد سنتر منفردة (2 مادة)", "netPrice": 216, "grossPrice": 240, "student_id": "b18fb64c-8741-4776-9b73-29a688d46676", "selected_group_ids": ["1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46"]}	\N	\N	2026-09-26 13:32:21.151475+03
e759c148-6899-48d0-852a-1f778e446176	6c49cae8-988b-4bed-9f78-c069486f9f68	UPDATE	student	aec529ab-55f3-4805-85e0-ef4fc7ca8731	{"id": "aec529ab-55f3-4805-85e0-ef4fc7ca8731", "notes": null, "phone": "01009999991", "gender": "male", "address": null, "grade_id": "9833561e-f6fb-43b9-b9d4-152b41863bc5", "full_name": "طالب تجربة مسار حكومي", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-TEST-EDU-1", "created_at": "2026-09-26T10:37:23.567Z", "updated_at": "2026-09-26T10:37:23.567Z", "national_id": null, "parent_name": null, "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": null, "student_code": 999991, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	{"id": "aec529ab-55f3-4805-85e0-ef4fc7ca8731", "notes": null, "phone": "01009999991", "gender": "male", "address": null, "grade_id": "9833561e-f6fb-43b9-b9d4-152b41863bc5", "full_name": "طالب تجربة مسار حكومي", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-TEST-EDU-1", "created_at": "2026-09-26T10:37:23.567Z", "updated_at": "2026-09-26T10:37:23.604Z", "national_id": null, "parent_name": null, "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": null, "student_code": 999991, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "LANGUAGES", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-26 13:37:23.604808+03
3cb21eb9-c6bb-444f-9823-0b889885e4e3	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	\N	{"dueNum": 60, "paidNum": 100, "category": "مواد سنتر منفردة (1 مادة)", "netPrice": 160, "grossPrice": 160, "student_id": "aec529ab-55f3-4805-85e0-ef4fc7ca8731", "selected_group_ids": ["bc88355f-9572-4fb6-9780-d5a8f8786fdc"]}	\N	\N	2026-09-26 13:37:23.624973+03
4a902039-ca7f-4c44-9352-a0718a1bd348	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 0, "paidNum": 235, "category": "الباكدج الكامل", "netPrice": 235, "grossPrice": 260, "student_id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "selected_group_ids": ["1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "8cb9be9b-2642-494f-9f8b-23ea998a30c3", "21d8e2e6-4f6c-427e-96ee-a1e118f29fc7"]}	\N	\N	2026-09-26 13:47:07.248546+03
47c36f0d-6cda-4f99-b9f8-d69925090d45	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 30, "paidNum": 200, "category": "الباكدج الكامل", "netPrice": 230, "grossPrice": 260, "student_id": "70095e4c-8bb4-43fc-8b06-82beaf87cf9f", "selected_group_ids": ["1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "8cb9be9b-2642-494f-9f8b-23ea998a30c3", "21d8e2e6-4f6c-427e-96ee-a1e118f29fc7"]}	\N	\N	2026-09-26 14:02:33.490832+03
e139db9c-e0b2-448e-bee1-16a9b0b62571	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 116, "paidNum": 100, "category": "مواد سنتر منفردة (2 مادة)", "netPrice": 216, "grossPrice": 240, "student_id": "9a9deda8-01c0-4e9b-812a-e3cd1b20a555", "selected_group_ids": ["1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46"]}	\N	\N	2026-09-26 14:02:33.522204+03
17d6649f-819b-4c3d-afe2-42b3f7506e50	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 30, "paidNum": 200, "category": "الباكدج الكامل", "netPrice": 230, "grossPrice": 260, "student_id": "8bd01808-f1af-400a-825c-144d7b53d6c8", "selected_group_ids": ["1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "8cb9be9b-2642-494f-9f8b-23ea998a30c3", "21d8e2e6-4f6c-427e-96ee-a1e118f29fc7"]}	\N	\N	2026-09-26 15:48:55.480545+03
806c99e6-c14f-48bb-b6aa-5fc6597df2d7	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 116, "paidNum": 100, "category": "مواد سنتر منفردة (2 مادة)", "netPrice": 216, "grossPrice": 240, "student_id": "945c4a3b-f048-4648-b83a-38d02b58262d", "selected_group_ids": ["1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46"]}	\N	\N	2026-09-26 15:48:55.519044+03
a6801791-ea49-42d4-b641-697c5c7cb29b	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	cda6f670-70c7-4b7c-808f-b55474e35751	\N	{"dueNum": 0, "paidNum": 300, "category": "الباكدج الكامل", "netPrice": 300, "grossPrice": 300, "student_id": "3c888942-2f9e-4532-8935-399b985322ca", "selected_group_ids": ["9af26238-d54e-4ad4-980e-03f578cb4b4c", "cb448ecc-b250-4b48-b3e1-76dbf3efcc1a"]}	\N	\N	2026-09-26 21:33:19.239381+03
1d550427-27c6-4b1a-8843-9cb41d60417b	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	cda6f670-70c7-4b7c-808f-b55474e35751	\N	{"dueNum": 0, "paidNum": 70, "category": "مواد سنتر منفردة (1 مادة)", "netPrice": 70, "grossPrice": 70, "student_id": "3c888942-2f9e-4532-8935-399b985322ca", "selected_group_ids": ["003325da-d578-4e6a-be6e-1a90e877d9c5"]}	\N	\N	2026-09-26 21:33:39.477712+03
a4e8a3e4-4b01-4656-8f96-8b88f1020679	6c49cae8-988b-4bed-9f78-c069486f9f68	ENROLL_PACKAGE	grade_packages	5f5ea76a-df23-4077-a009-87cb90a1d3b4	\N	{"dueNum": 0, "paidNum": 260, "category": "الباكدج الكامل", "netPrice": 260, "grossPrice": 260, "student_id": "d50ce1fc-7e42-4e55-9148-e9a8cdc40008", "selected_group_ids": ["21d8e2e6-4f6c-427e-96ee-a1e118f29fc7", "1b82140c-89ed-493c-b169-0b32f30a7414", "6d96a141-1d92-4042-8eb1-e4aeeb382f46", "edf6b3c6-4b6f-4a86-bf47-c6428efe5694", "63bd7c77-81f7-4a52-a5ce-e7aa6f03af96", "5f74f34d-5f46-45b2-b3e6-61346e86139d"]}	\N	\N	2026-09-28 01:56:58.731289+03
\.


--
-- Data for Name: barcode_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.barcode_batches (id, batch_name, prefix, grade_id, start_sequence, end_sequence, assigned_count, status, generated_by, notes, created_at, updated_at, use_center_sequence) FROM stdin;
\.


--
-- Data for Name: barcode_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.barcode_items (id, batch_id, barcode_value, status, assigned_to, assigned_at, created_at) FROM stdin;
\.


--
-- Data for Name: booklet_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booklet_groups (id, item_id, group_id, created_at) FROM stdin;
13ae3de9-5efa-475d-a414-2de06735bdbe	880325bb-7a06-4ea5-b7ae-11e764654d07	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-16 14:09:04.448472+03
8a2ff0c1-2dc5-45fe-a4e4-7adfbad48d69	b031c04e-ba6f-490c-a9fc-816307a49ade	6f11d291-359d-403b-8d57-b4c0003b505b	2026-09-18 15:04:36.705355+03
\.


--
-- Data for Name: booklet_reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booklet_reservations (id, reservation_number, student_id, item_id, group_id, quantity, unit_price, total_price, paid_amount, payment_status, delivery_status, reserved_at, delivered_at, notes, created_at, updated_at) FROM stdin;
eeff0301-5ed4-48b2-9b4f-ad24c87808b0	BK-1001	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	880325bb-7a06-4ea5-b7ae-11e764654d07	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	1	60.00	60.00	20.00	partial	delivered	2026-09-16 14:09:04.471002+03	2026-09-16 14:09:04.484443+03	حجز بعربون 20 ج.م وباقي 40 ج.م عند الاستلام	2026-09-16 14:09:04.471002+03	2026-09-16 14:09:04.484443+03
5f0cf55f-1fd3-48a0-acfa-2f285986c0ae	BK-1002	b2b7ccb0-0320-4770-b3ee-b1e9a27fec3e	880325bb-7a06-4ea5-b7ae-11e764654d07	\N	1	60.00	60.00	15.00	partial	cancelled	2026-09-18 09:12:21.967131+03	\N		2026-09-18 09:12:21.967131+03	2026-09-18 09:12:21.993017+03
40190e7d-9885-4b23-b309-c568aabb144f	BK-1003	9594ff1a-7933-4178-b32e-6c95776c80a8	880325bb-7a06-4ea5-b7ae-11e764654d07	\N	1	60.00	60.00	15.00	partial	cancelled	2026-09-18 09:12:41.518378+03	\N		2026-09-18 09:12:41.518378+03	2026-09-18 09:12:41.533093+03
54364839-238b-44f9-8c1f-8bea742c5ac7	BK-1004	0b4d0dc9-6fb4-42a5-a108-5e17a126b786	880325bb-7a06-4ea5-b7ae-11e764654d07	\N	1	60.00	60.00	20.00	partial	cancelled	2026-09-18 09:35:38.739723+03	\N		2026-09-18 09:35:38.739723+03	2026-09-18 09:35:38.751623+03
133203b0-155d-47f3-9cf5-fbe5a75f2a54	BK-1005	3c888942-2f9e-4532-8935-399b985322ca	880325bb-7a06-4ea5-b7ae-11e764654d07	\N	1	60.00	60.00	20.00	partial	cancelled	2026-09-18 09:36:03.556629+03	\N		2026-09-18 09:36:03.556629+03	2026-09-18 09:36:03.568134+03
3c3cf658-a540-4ce4-8878-290ba9709e60	BK-1006	c5675508-afec-437c-b700-299df9b42c33	880325bb-7a06-4ea5-b7ae-11e764654d07	\N	1	60.00	60.00	20.00	partial	cancelled	2026-09-18 09:36:23.430788+03	\N		2026-09-18 09:36:23.430788+03	2026-09-18 09:36:23.440992+03
667ec37f-3e0b-409b-81bc-77356825385d	BK-1007	ab67466a-f62a-4d3e-b823-ec8fbb90696a	880325bb-7a06-4ea5-b7ae-11e764654d07	\N	1	60.00	60.00	15.00	partial	cancelled	2026-09-18 09:36:27.149025+03	\N		2026-09-18 09:36:27.149025+03	2026-09-18 09:36:27.162827+03
1ae07a67-34c7-4807-b973-c22986596cd7	BK-1008	4d2ee661-59b5-4cba-a77f-6966a8301c92	b031c04e-ba6f-490c-a9fc-816307a49ade	\N	1	200.00	200.00	200.00	paid	delivered	2026-09-18 15:04:55.173284+03	2026-09-18 15:05:08.028416+03	\N	2026-09-18 15:04:55.173284+03	2026-09-18 15:05:08.028416+03
\.


--
-- Data for Name: cancelled_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cancelled_sessions (id, group_id, session_date, start_time, end_time, reason, cancelled_by, created_at) FROM stdin;
\.


--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classrooms (id, name, name_ar, capacity, floor, is_active, sync_status, created_at, updated_at) FROM stdin;
1cffaeb7-9631-4c64-bc55-492268b5c077	Room 1	قاعة 1	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
79e19f20-fabf-4170-8e9b-8e87e81bef89	Room 2	قاعة 2	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	Room 3	قاعة 3	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
8656d593-ece1-4946-af99-20073616771d	Room 4	قاعة 4	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
e049b8b5-9d3c-4682-9e17-92d8320fc9b3	Room 5	قاعة 5	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
f3a54e12-80b1-40bd-9d59-d0805b90880b	Room 6	قاعة 6	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
7f9a4f98-d6b9-45f5-af05-a29c03d10932	Room 7	قاعة 7	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
c68f8479-4b34-4bcb-b76d-f5371779e3a4	Room 8	قاعة 8	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
704bb3dd-1825-4de6-a4ba-45d462423c6c	Room 9	قاعة 9	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
46fb85a9-6521-4c90-9b5a-7c2dd2975b35	Room 10	قاعة 10	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
d07a2964-f011-44e9-b5e1-9e07722b5349	Room 11	قاعة 11	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
fc5345ca-2803-4cd5-9f0b-ecf634770e5e	Room 12	قاعة 12	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
3b6e8b34-dd14-461c-8297-26322e041c73	Room 13	قاعة 13	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
33308a2d-9277-4059-8d65-8a6d5057448c	Room 14	قاعة 14	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
24958dc7-3dc2-4b85-8d92-239bf8765af7	Room 15	قاعة 15	9999	0	t	local	2026-09-16 13:51:43.822029+03	2026-09-16 14:22:41.20219+03
\.


--
-- Data for Name: daily_settlements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_settlements (id, settlement_date, user_id, opening_balance, total_subscriptions, total_pos_sales, total_deposits, total_expenses, expected_cash, actual_cash, difference, status, notes, closed_at) FROM stdin;
a69d5da2-4104-47fe-b61a-270eb5569b60	2026-09-16	6c49cae8-988b-4bed-9f78-c069486f9f68	0.00	0.00	180.00	2000.00	250.00	1930.00	1940.00	10.00	closed	\N	2026-09-16 04:47:20.420378+03
45312170-618c-4ef4-a1aa-f3dfc57a8f87	2026-09-16	6c49cae8-988b-4bed-9f78-c069486f9f68	0.00	0.00	180.00	2000.00	250.00	1930.00	166.00	-1764.00	closed	\N	2026-09-16 04:47:28.338903+03
c4205ba9-34b9-4f7a-b514-cbb5b9c71b3d	2026-09-18	6c49cae8-988b-4bed-9f78-c069486f9f68	0.00	2150.00	0.00	305.00	3410.00	4150.00	4150.00	0.00	closed	\N	2026-09-18 16:57:33.777885+03
47c122e4-fc8c-4d74-819c-da7f04e3ad56	2026-09-26	6c49cae8-988b-4bed-9f78-c069486f9f68	0.00	4610.00	0.00	0.00	0.00	8710.00	8710.00	0.00	closed	\N	2026-09-26 10:27:33.91699+03
8b89b77b-dcba-415d-b20b-6b111d25a57d	2026-09-26	6c49cae8-988b-4bed-9f78-c069486f9f68	0.00	6934.00	0.00	0.00	9639.00	1395.00	1395.00	0.00	closed	\N	2026-09-26 14:38:05.966989+03
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, expense_category, amount, recipient_name, notes, voucher_no, recorded_by, expense_date, created_at) FROM stdin;
a99dd851-4d50-4abe-a325-dd6d19dea607	hospitality	250.00	عم فوزي	شاي وسكر وضيافة للمدرسين	VOU-328074	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16	2026-09-16 04:32:08.074109+03
\.


--
-- Data for Name: grade_packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grade_packages (id, name, grade_id, education_type, package_price, single_subject_price, is_active, notes, created_at, updated_at) FROM stdin;
cda6f670-70c7-4b7c-808f-b55474e35751	الصف الأول الابتدائي - حكومي / عربي	911c3cb2-c7f1-4a04-8ad7-82d62096a205	PUBLIC	300.00	70.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-19 02:39:47.45071+03
5abf3b1e-ee2d-49ae-8141-44777d10cc83	الصف الثاني الثانوي - حكومي / عربي	c206e817-623a-495c-9a9a-a07eb25c401e	PUBLIC	600.00	140.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-19 02:39:47.45071+03
574f5b8c-b15d-42a0-aac0-509d9b91b866	الصف الثالث الثانوي - حكومي / عربي	5d478a7c-0e54-4992-a27e-4ff1677b7679	PUBLIC	600.00	140.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-19 02:39:47.45071+03
9a914e85-981b-443a-a4d9-b97ee5947b73	الصف الأول الابتدائي - لغات / تجريبي	911c3cb2-c7f1-4a04-8ad7-82d62096a205	LANGUAGES	400.00	90.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-19 02:39:47.45071+03
27d4b217-1fbb-4312-a30d-773fa9d1bc70	الصف الثاني الابتدائي - لغات / تجريبي	80738b37-47bd-4ced-9ef9-805c6c6dc06c	LANGUAGES	400.00	90.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-19 02:39:47.45071+03
e4741f6c-cc8b-4bdf-8c30-602edd175ef7	الصف الثالث الابتدائي - لغات / تجريبي	23a6b0ab-07a5-4d0e-9b52-e58493982829	LANGUAGES	400.00	90.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-19 02:39:47.45071+03
41b659a5-e844-4aeb-99ae-46e9e6a91bc2	الصف الثاني الثانوي - لغات / تجريبي	c206e817-623a-495c-9a9a-a07eb25c401e	LANGUAGES	750.00	160.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-19 02:39:47.45071+03
816c3e94-57ac-4009-95c0-fbed5ae98c57	الصف الثالث الثانوي - لغات / تجريبي	5d478a7c-0e54-4992-a27e-4ff1677b7679	LANGUAGES	750.00	160.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-19 02:39:47.45071+03
2fa46789-579b-4bd8-8862-082f32af5a62	الصف الثاني الابتدائي - حكومي / عربي	80738b37-47bd-4ced-9ef9-805c6c6dc06c	PUBLIC	300.00	120.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-19 02:51:33.346181+03
d1c5b5b3-36cd-4d73-bf3a-ab6f021d9963	الصف الثالث الابتدائي - حكومي / عربي	23a6b0ab-07a5-4d0e-9b52-e58493982829	PUBLIC	260.00	120.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:42:48.063034+03
5f5ea76a-df23-4077-a009-87cb90a1d3b4	الصف الرابع الابتدائي - حكومي / عربي	9833561e-f6fb-43b9-b9d4-152b41863bc5	PUBLIC	260.00	120.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:47:43.016098+03
16c2439b-b03c-4bb6-958a-5a078f528672	الصف الخامس الابتدائي - حكومي / عربي	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	PUBLIC	260.00	120.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:47:51.769472+03
714a2b7b-761a-4908-8642-cfa8bddf98a7	الصف السادس الابتدائي - حكومي / عربي	59141280-1c86-41bc-a284-6d05d555f457	PUBLIC	260.00	120.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:47:57.583405+03
84fbb3e7-fdef-4113-b6e3-eb6dfb979336	الصف الرابع الابتدائي - لغات / تجريبي	9833561e-f6fb-43b9-b9d4-152b41863bc5	LANGUAGES	450.00	160.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:48:20.267462+03
c21045fb-6477-4885-b9db-8987a117663e	الصف الخامس الابتدائي - لغات / تجريبي	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	LANGUAGES	450.00	160.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:48:33.990003+03
0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	الصف السادس الابتدائي - لغات / تجريبي	59141280-1c86-41bc-a284-6d05d555f457	LANGUAGES	450.00	160.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:48:46.371436+03
6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	الصف الأول الإعدادي - لغات / تجريبي	eab6184a-f010-48ea-9eee-a75a44ee9f7e	LANGUAGES	460.00	160.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:50:38.124374+03
7094c844-980b-4399-8b18-306d8bbabac8	الصف الثاني الإعدادي - لغات / تجريبي	79842e52-6787-4773-b13f-5d8abf4c5043	LANGUAGES	460.00	160.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:50:46.988757+03
28705c72-d15e-44c6-92f8-a347b86a5e65	الصف الثالث الإعدادي - لغات / تجريبي	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	LANGUAGES	460.00	160.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:50:56.845658+03
14bac981-e410-43c7-9bb6-0b873749cc20	الصف الأول الإعدادي - حكومي / عربي	eab6184a-f010-48ea-9eee-a75a44ee9f7e	PUBLIC	360.00	120.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:51:39.135631+03
753299b8-25bc-4eaf-b1c4-aad1a6acabaa	الصف الثاني الإعدادي - حكومي / عربي	79842e52-6787-4773-b13f-5d8abf4c5043	PUBLIC	360.00	120.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:51:43.583819+03
9e91058c-e3d6-4efb-8faf-7596b0bf6f61	الصف الثالث الإعدادي - حكومي / عربي	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	PUBLIC	360.00	120.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-24 19:51:51.511489+03
94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	الصف الأول الثانوي - حكومي / عربي	afb79da5-7db2-4b1b-b5d5-78694d100743	PUBLIC	700.00	120.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-26 16:52:14.173503+03
03f04240-4980-43dc-992d-0811f17edf25	الصف الأول الثانوي - لغات / تجريبي	afb79da5-7db2-4b1b-b5d5-78694d100743	LANGUAGES	860.00	160.00	t	\N	2026-09-19 02:39:47.45071+03	2026-09-26 16:52:40.994745+03
\.


--
-- Data for Name: group_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_enrollments (id, student_id, group_id, enrolled_at, is_active, notes, sync_status, created_at, updated_at, enrollment_type, discount_type, discount_value) FROM stdin;
d8d892a1-aa52-4caf-a136-41583e5642fa	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	e2a924c2-485e-4fdf-8265-490b5feef955	2026-09-26 10:29:00.580388+03	f	\N	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
ec5d257d-79cb-45cb-b102-eab7169df00e	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	3419633f-3643-4571-82fb-a3cb7a93ee11	2026-09-26 10:29:00.580388+03	f	\N	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
939869d0-22e0-4adf-9b5e-a30af9599386	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	9ebafcbb-2b3e-4828-b130-1d25792d0259	2026-09-26 10:29:00.580388+03	f	\N	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
eb4429bc-ef49-46ad-b64f-2aebf0227351	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	21d8e2e6-4f6c-427e-96ee-a1e118f29fc7	2026-09-26 13:47:07.248546+03	t	\N	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
c0b255f7-783a-4c30-a9f3-3a5e1c672e71	c5675508-afec-437c-b700-299df9b42c33	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-18 09:36:23.371788+03	t	\N	local	2026-09-18 09:36:23.371788+03	2026-09-18 09:36:23.398259+03	PACKAGE	FIXED	0.00
f851b349-9565-4751-87a4-b4d5d02494ce	d3cd5019-1818-478d-9e61-264a62b043bc	003325da-d578-4e6a-be6e-1a90e877d9c5	2026-09-18 09:54:09.31282+03	t	\N	local	2026-09-18 09:54:09.31282+03	2026-09-18 09:54:09.31282+03	PACKAGE	FIXED	0.00
5b1a5f59-2710-4845-a9ed-59fadafa0dfe	d3cd5019-1818-478d-9e61-264a62b043bc	cb4a589d-470f-40a0-af41-c4885f97016f	2026-09-15 17:31:39.169645+03	f	\N	local	2026-09-15 17:31:39.169645+03	2026-09-18 09:54:25.586141+03	PACKAGE	FIXED	0.00
8a6242bd-dc7c-489f-b61d-76a91f786aa9	9594ff1a-7933-4178-b32e-6c95776c80a8	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-18 09:57:39.707163+03	t	\N	local	2026-09-18 09:57:39.707163+03	2026-09-18 09:57:39.707163+03	PACKAGE	FIXED	0.00
282ed2dc-2620-4401-a3d5-9205256abefb	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	5debaf66-ad5f-409e-829f-424d88aa0bcb	2026-09-26 10:29:00.580388+03	f	\N	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
d7084349-68ba-4e37-a819-58d0dd2e37b4	4d2ee661-59b5-4cba-a77f-6966a8301c92	6f11d291-359d-403b-8d57-b4c0003b505b	2026-09-18 14:56:28.691682+03	f	\N	local	2026-09-18 14:56:28.691682+03	2026-09-18 14:56:56.440996+03	PACKAGE	FIXED	0.00
e87419ca-917e-4840-a764-923ff6a679a6	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	81f6ecfc-bb49-4a9c-a1f3-645835a4b407	2026-09-26 10:29:00.580388+03	f	\N	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
41fb364a-f085-4d30-95dc-f832cc80091c	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	b804cc9a-ef86-4458-bbfa-7b972c0ba868	2026-09-26 10:29:00.580388+03	f	\N	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
ab389e33-a637-4eda-956c-aee74e3b2e8b	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	98f53257-b216-4351-805d-4ea6dd989766	2026-09-26 10:29:00.580388+03	f	\N	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
080a6ebe-442f-41fe-8c3b-1da7512eb8ba	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	c25c3d73-23f9-41df-aeef-330f399318f2	2026-09-26 10:29:00.580388+03	f	\N	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
140c7624-d2b2-4015-9a12-2cca9c614b39	7a09dc6d-585a-42bd-b90d-a7b8c44fca31	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-16 16:27:54.413132+03	f	\N	local	2026-09-16 16:27:54.413132+03	2026-09-18 16:54:51.821515+03	PACKAGE	FIXED	0.00
279c2d68-9f56-47fe-890c-4d14318a6d26	9594ff1a-7933-4178-b32e-6c95776c80a8	521ca9ea-fb0e-4750-8eda-992e40f01879	2026-09-18 17:31:56.559513+03	t	\N	local	2026-09-18 17:31:56.559513+03	2026-09-18 17:31:56.559513+03	PACKAGE	FIXED	0.00
f7ee4566-791c-42f7-9a84-7d699112ca3a	0b4d0dc9-6fb4-42a5-a108-5e17a126b786	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-18 09:35:38.694305+03	f	\N	local	2026-09-18 09:35:38.694305+03	2026-09-22 14:33:16.393339+03	PACKAGE	FIXED	0.00
36478b7c-7e86-4f0d-8137-e6d10f258fad	ab67466a-f62a-4d3e-b823-ec8fbb90696a	003325da-d578-4e6a-be6e-1a90e877d9c5	2026-09-22 16:33:41.572514+03	f	\N	local	2026-09-22 16:33:41.572514+03	2026-09-22 16:34:41.837455+03	PACKAGE	FIXED	0.00
cbb3dcf0-e5b2-43ca-a08f-29eb178f7ccd	b2b7ccb0-0320-4770-b3ee-b1e9a27fec3e	9af26238-d54e-4ad4-980e-03f578cb4b4c	2026-09-24 05:15:13.078086+03	f	\N	local	2026-09-24 05:15:13.078086+03	2026-09-24 05:39:35.58732+03	PACKAGE	FIXED	0.00
73bf9104-c4c7-470a-9a97-f4524ff01b5c	fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-26 05:18:12.246141+03	t	\N	local	2026-09-26 05:18:12.246141+03	2026-09-26 05:18:12.260479+03	PACKAGE	FIXED	0.00
000e46ce-3d30-45ab-8cb6-a752b0af29d7	fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1	9af26238-d54e-4ad4-980e-03f578cb4b4c	2026-09-26 05:18:12.260479+03	t	\N	local	2026-09-26 05:18:12.260479+03	2026-09-26 05:18:12.260479+03	PACKAGE	FIXED	0.00
2468c0a1-1a4d-4633-83b0-f6d5abe7ee4f	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	cb4a589d-470f-40a0-af41-c4885f97016f	2026-09-16 04:03:41.70366+03	f	\N	local	2026-09-16 04:03:41.70366+03	2026-09-24 19:44:14.481508+03	PACKAGE	FIXED	0.00
2faaef12-111c-433e-aa43-62637ee84264	67b6345d-88ac-4d11-809a-cc837d4612c7	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-26 04:05:32.243281+03	t	\N	local	2026-09-26 04:05:32.243281+03	2026-09-26 04:05:32.257814+03	PACKAGE	FIXED	0.00
611346c1-f352-4308-a51c-ba92cc01164e	fc09cabe-3b8f-4fd0-bc8a-5590fac1edb4	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-26 04:06:21.274627+03	t	\N	local	2026-09-26 04:06:21.274627+03	2026-09-26 04:06:21.274627+03	PACKAGE	FIXED	0.00
e2b80f89-babd-48ff-a66d-aea20c3cfbce	fc09cabe-3b8f-4fd0-bc8a-5590fac1edb4	9af26238-d54e-4ad4-980e-03f578cb4b4c	2026-09-26 04:06:21.274627+03	t	\N	local	2026-09-26 04:06:21.274627+03	2026-09-26 04:06:21.274627+03	PACKAGE	FIXED	0.00
e72b3ecc-4b7a-420c-8074-b8be98aef5cc	3f4d6618-7e31-441e-bc1b-d14bfd4f8d32	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-26 05:18:42.066989+03	t	\N	local	2026-09-26 05:18:42.066989+03	2026-09-26 05:18:42.08741+03	PACKAGE	FIXED	0.00
ccf07d15-d75c-428b-8c0e-2cf2f54b1b0b	3f4d6618-7e31-441e-bc1b-d14bfd4f8d32	9af26238-d54e-4ad4-980e-03f578cb4b4c	2026-09-26 05:18:42.08741+03	t	\N	local	2026-09-26 05:18:42.08741+03	2026-09-26 05:18:42.08741+03	PACKAGE	FIXED	0.00
07531ff3-f339-45da-b093-edb13a32b5f6	d3cd5019-1818-478d-9e61-264a62b043bc	e2a924c2-485e-4fdf-8265-490b5feef955	2026-09-26 05:30:23.70968+03	t	\N	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
e5b1ef22-9afc-4c3b-a51e-0b944499563b	d3cd5019-1818-478d-9e61-264a62b043bc	3419633f-3643-4571-82fb-a3cb7a93ee11	2026-09-26 05:30:23.70968+03	t	\N	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
ffdaefe3-9db6-4948-a80f-59c372ad5d57	d3cd5019-1818-478d-9e61-264a62b043bc	9ebafcbb-2b3e-4828-b130-1d25792d0259	2026-09-26 05:30:23.70968+03	t	\N	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
947b576d-d7f6-4587-9a2b-8ab10a09a909	d3cd5019-1818-478d-9e61-264a62b043bc	5debaf66-ad5f-409e-829f-424d88aa0bcb	2026-09-26 05:30:23.70968+03	t	\N	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
2f79c975-8b9b-418c-824b-512cb6320fba	d3cd5019-1818-478d-9e61-264a62b043bc	81f6ecfc-bb49-4a9c-a1f3-645835a4b407	2026-09-26 05:30:23.70968+03	t	\N	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
4efc04d9-87b2-4aa4-a03e-c57055c6ae3f	d3cd5019-1818-478d-9e61-264a62b043bc	b804cc9a-ef86-4458-bbfa-7b972c0ba868	2026-09-26 05:30:23.70968+03	t	\N	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
2bb3b259-a315-4312-af8c-ab61dd478103	d3cd5019-1818-478d-9e61-264a62b043bc	98f53257-b216-4351-805d-4ea6dd989766	2026-09-26 05:30:23.70968+03	t	\N	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
4aff7654-66d2-4956-96e9-6d999449cd08	d3cd5019-1818-478d-9e61-264a62b043bc	c25c3d73-23f9-41df-aeef-330f399318f2	2026-09-26 05:30:23.70968+03	t	\N	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
722e0f68-1eb6-4586-bacd-831338626971	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	1b82140c-89ed-493c-b169-0b32f30a7414	2026-09-26 13:47:07.248546+03	t	\N	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
3dcf9c24-2917-4c3c-ae36-8ee4abeb77b7	3c888942-2f9e-4532-8935-399b985322ca	9af26238-d54e-4ad4-980e-03f578cb4b4c	2026-09-26 21:33:19.239381+03	f	\N	local	2026-09-26 21:33:19.239381+03	2026-09-26 21:33:26.70263+03	PACKAGE	FIXED	0.00
f1ac1fd1-92fd-45ab-83bc-e5df9ae34faf	3c888942-2f9e-4532-8935-399b985322ca	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-18 09:36:03.510958+03	f	\N	local	2026-09-18 09:36:03.510958+03	2026-09-26 21:33:26.70263+03	PACKAGE	FIXED	0.00
8192bb4a-a7a6-4ad2-be06-464c82bd9668	3c888942-2f9e-4532-8935-399b985322ca	003325da-d578-4e6a-be6e-1a90e877d9c5	2026-09-26 21:33:39.477712+03	f	\N	local	2026-09-26 21:33:39.477712+03	2026-09-26 21:33:45.149748+03	PACKAGE	FIXED	0.00
bdec56f9-8b72-4140-8a64-66e135d84022	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	8cb9be9b-2642-494f-9f8b-23ea998a30c3	2026-09-26 13:47:07.248546+03	f	\N	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:37.926361+03	PACKAGE	FIXED	25.00
2983d274-06f4-4207-863d-678b489580f7	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	6d96a141-1d92-4042-8eb1-e4aeeb382f46	2026-09-26 13:47:07.248546+03	t	\N	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
dd895a4e-3edf-4f91-82bf-294788206708	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	edf6b3c6-4b6f-4a86-bf47-c6428efe5694	2026-09-26 13:47:07.248546+03	t	\N	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
2fb1c6be-dd0d-4269-8f2f-b5d7d77c456b	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	63bd7c77-81f7-4a52-a5ce-e7aa6f03af96	2026-09-26 13:47:07.248546+03	t	\N	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
1c40d6d6-cccc-41f5-b2b8-2879b916051a	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	5f74f34d-5f46-45b2-b3e6-61346e86139d	2026-09-28 01:56:58.731289+03	t	\N	local	2026-09-28 01:56:58.731289+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, name, name_ar, teacher_id, subject_id, grade_id, classroom_id, schedule, price_per_month, price_per_session, max_students, status, sync_status, remote_id, created_at, updated_at, package_teacher_ratio, package_center_ratio, private_teacher_ratio, private_center_ratio) FROM stdin;
36507edf-7adc-48b8-9ee9-68546450d823	Test Absence Group	مجموعة اختبار الغياب	3aa2fc39-0417-45c7-af5b-ba4c4f44ed29	ee099c24-42fa-4519-822e-93bf0b556a05	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	[{"day": "saturday", "end_time": "07:00", "start_time": "06:00"}]	200.00	50.00	9999	active	local	\N	2026-09-26 18:51:39.216456+03	2026-09-26 18:51:39.216456+03	0.00	100.00	75.00	25.00
cb4a589d-470f-40a0-af41-c4885f97016f	مجموعة الفيزياء - 1ث	مجموعة الفيزياء - 1ث	0f1a658d-9533-4ebb-a08d-9c26a84fd6e4	737b6229-6334-41c4-b878-8f3dbb0e9663	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "tuesday", "end_time": "18:00", "start_time": "16:00"}, {"day": "thursday", "end_time": "23:59", "start_time": "20:00"}]	350.00	50.00	9999	active	local	\N	2026-09-15 17:31:39.142866+03	2026-09-17 21:46:16.877534+03	0.00	100.00	75.00	25.00
5f0cf646-02f4-4e01-aee3-bfea811272b5	مجموعة فحص التدقيق 1887	\N	0f1a658d-9533-4ebb-a08d-9c26a84fd6e4	af504fc9-7db3-4e00-9b78-5eb2a73f32c8	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	[{"day": "monday", "end_time": "13:30", "start_time": "12:00"}]	200.00	50.00	30	active	local	\N	2026-09-18 09:12:21.906696+03	2026-09-18 09:12:21.906696+03	0.00	100.00	75.00	25.00
003325da-d578-4e6a-be6e-1a90e877d9c5	مجموعة فحص التدقيق 1481	\N	0f1a658d-9533-4ebb-a08d-9c26a84fd6e4	af504fc9-7db3-4e00-9b78-5eb2a73f32c8	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	[{"day": "monday", "end_time": "13:30", "start_time": "12:00"}]	200.00	50.00	30	active	local	\N	2026-09-18 09:12:41.489449+03	2026-09-18 09:12:41.489449+03	0.00	100.00	75.00	25.00
cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	Test Group Alpha	مجموعة أ للتجربة	0f1a658d-9533-4ebb-a08d-9c26a84fd6e4	af504fc9-7db3-4e00-9b78-5eb2a73f32c8	911c3cb2-c7f1-4a04-8ad7-82d62096a205	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "friday", "end_time": "23:00", "start_time": "08:00"}]	350.00	90.00	9999	active	local	\N	2026-09-16 14:09:04.405023+03	2026-09-18 09:36:23.385409+03	0.00	100.00	75.00	25.00
521ca9ea-fb0e-4750-8eda-992e40f01879	مجموعة فحص التدقيق 7119	\N	0f1a658d-9533-4ebb-a08d-9c26a84fd6e4	af504fc9-7db3-4e00-9b78-5eb2a73f32c8	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	[{"day": "monday", "end_time": "13:30", "start_time": "12:00"}]	200.00	50.00	30	active	local	\N	2026-09-18 09:36:27.126034+03	2026-09-18 09:36:27.126034+03	0.00	100.00	75.00	25.00
6f11d291-359d-403b-8d57-b4c0003b505b	الأحياء - Hossam Ibrahim	الأحياء - Hossam Ibrahim	0f1a658d-9533-4ebb-a08d-9c26a84fd6e4	af504fc9-7db3-4e00-9b78-5eb2a73f32c8	79842e52-6787-4773-b13f-5d8abf4c5043	8656d593-ece1-4946-af99-20073616771d	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	200.00	50.00	9999	active	local	\N	2026-09-18 14:55:55.995143+03	2026-09-18 14:55:55.995143+03	0.00	100.00	75.00	25.00
9af26238-d54e-4ad4-980e-03f578cb4b4c	مجموعة النخبة - لغة عربية أ/ حسام	مجموعة النخبة - لغة عربية أ/ حسام	0f1a658d-9533-4ebb-a08d-9c26a84fd6e4	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	911c3cb2-c7f1-4a04-8ad7-82d62096a205	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "thursday", "end_time": "23:59", "start_time": "00:00"}]	250.00	65.00	30	active	local	\N	2026-09-24 05:15:13.051851+03	2026-09-24 05:17:51.924796+03	0.00	100.00	75.00	25.00
87e91624-b916-489e-899e-e819e3e29e0e	لغة إنجليزية (English) (السبت 07:00 - 09:00 م) - ميس/ آلاء علاء	لغة إنجليزية (English) (السبت 07:00 - 09:00 م) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	9833561e-f6fb-43b9-b9d4-152b41863bc5	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "saturday", "end_time": "21:00", "start_time": "07:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
edf6b3c6-4b6f-4a86-bf47-c6428efe5694	علوم (الأحد 05:00 م) - أ/ حازم	علوم (الأحد 05:00 م) - أ/ حازم	b8716661-858e-475a-b196-1193f8d1e7f3	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	9833561e-f6fb-43b9-b9d4-152b41863bc5	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "sunday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
63bd7c77-81f7-4a52-a5ce-e7aa6f03af96	لغة إنجليزية (English) (الجمعة 02:00 ظ) - ميس/ آلاء علاء	لغة إنجليزية (English) (الجمعة 02:00 ظ) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	9833561e-f6fb-43b9-b9d4-152b41863bc5	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "friday", "end_time": "15:30", "start_time": "14:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
2af5da91-a3f0-4e8f-b589-388fbc38293b	لغة إنجليزية (English) (السبت 03:00 - 05:00 م) - ميس/ آلاء علاء	لغة إنجليزية (English) (السبت 03:00 - 05:00 م) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "saturday", "end_time": "17:00", "start_time": "03:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
4f2a930c-0e05-4314-882f-46ed54d27dd5	Test Absence Group	مجموعة اختبار الغياب	3aa2fc39-0417-45c7-af5b-ba4c4f44ed29	ee099c24-42fa-4519-822e-93bf0b556a05	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	[{"day": "saturday", "end_time": "07:00", "start_time": "06:00"}]	200.00	50.00	9999	active	local	\N	2026-09-26 18:51:54.289833+03	2026-09-26 18:51:54.289833+03	0.00	100.00	75.00	25.00
6076a89b-0161-4499-9273-8a4ae1fbd68f	لغة إنجليزية (English) (الجمعة 03:00 ع) - ميس/ آلاء علاء	لغة إنجليزية (English) (الجمعة 03:00 ع) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "friday", "end_time": "16:30", "start_time": "15:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
ef5de7c3-440b-4253-8ec0-68607f95c0a7	لغة إنجليزية (English) (السبت 05:00 - 07:00 م) - ميس/ آلاء علاء	لغة إنجليزية (English) (السبت 05:00 - 07:00 م) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	59141280-1c86-41bc-a284-6d05d555f457	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "saturday", "end_time": "19:00", "start_time": "05:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
ad081249-022c-470a-9547-f9d7125b79e7	لغة إنجليزية (English) (الجمعة 04:00 ع) - ميس/ آلاء علاء	لغة إنجليزية (English) (الجمعة 04:00 ع) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	59141280-1c86-41bc-a284-6d05d555f457	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "friday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
e8dd8044-c7c1-4346-899c-ac01adba7bf6	لغة إنجليزية (English) (الجمعة 10:00 ص) - أ/ محمد علاء	لغة إنجليزية (English) (الجمعة 10:00 ص) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	8656d593-ece1-4946-af99-20073616771d	[{"day": "friday", "end_time": "11:30", "start_time": "10:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
2d3a61d0-0aa0-45dd-889e-51a10aa2fff7	لغة إنجليزية (English) (الجمعة 11:00 ص) - أ/ محمد علاء	لغة إنجليزية (English) (الجمعة 11:00 ص) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "friday", "end_time": "12:30", "start_time": "11:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
7c7d2469-d00f-49f7-89b0-95311a39e25d	لغة إنجليزية (English) (الجمعة 12:00 ظ) - أ/ محمد علاء	لغة إنجليزية (English) (الجمعة 12:00 ظ) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	8656d593-ece1-4946-af99-20073616771d	[{"day": "friday", "end_time": "13:30", "start_time": "12:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
81f6ecfc-bb49-4a9c-a1f3-645835a4b407	فلسفة (السبت 07:00 م) - أ/ محمد صلاح ، أ/ علي فؤاد	فلسفة (السبت 07:00 م) - أ/ محمد صلاح ، أ/ علي فؤاد	cf8743b2-f65e-465c-9bd4-1c1f608d6726	9f9b6f17-3ad9-459f-b640-0d3d2f988ea8	afb79da5-7db2-4b1b-b5d5-78694d100743	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
b804cc9a-ef86-4458-bbfa-7b972c0ba868	لغة إيطالية (الأربعاء 07:00 م) - أ/ محمد إسماعيل	لغة إيطالية (الأربعاء 07:00 م) - أ/ محمد إسماعيل	61778034-b516-440f-bf93-116a168fd716	3d11fe4b-c72d-47bc-9bc8-6cab0c484836	afb79da5-7db2-4b1b-b5d5-78694d100743	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "wednesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	0.00	100.00	75.00	25.00
5f74f34d-5f46-45b2-b3e6-61346e86139d	لغة عربية (السبت 06:00 م) - أ/ مروان	لغة عربية (السبت 06:00 م) - أ/ مروان	ea658032-576c-4ef2-bb57-ff11fa442a3f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	9833561e-f6fb-43b9-b9d4-152b41863bc5	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "saturday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
6237a333-b682-40e8-a301-bca5e994f455	لغة عربية (السبت 06:00 م) - ميس/ دنيا	لغة عربية (السبت 06:00 م) - ميس/ دنيا	6cc25780-161f-4bd0-86e5-2f82c9f83f7f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	9833561e-f6fb-43b9-b9d4-152b41863bc5	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "saturday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
8ed4170f-cc83-4d04-9728-5ac8f0bf1dea	لغة إنجليزية (السبت 07:00 - 09:00 م) - ميس/ آلاء علاء	لغة إنجليزية (السبت 07:00 - 09:00 م) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	9833561e-f6fb-43b9-b9d4-152b41863bc5	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "saturday", "end_time": "21:00", "start_time": "07:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
6d96a141-1d92-4042-8eb1-e4aeeb382f46	رياضيات (الأحد 04:00 م) - أ/ أحمد محمود	رياضيات (الأحد 04:00 م) - أ/ أحمد محمود	2acdbe9b-46d8-44f5-92c5-d98d2de115ab	f4e734d7-0612-46bc-bfc0-1450fdc253f0	9833561e-f6fb-43b9-b9d4-152b41863bc5	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "sunday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
4917df94-aaf4-45ba-9fa7-2e197dcb477c	رياضيات (الأحد 04:00 م) - أ/ أدهم هاني	رياضيات (الأحد 04:00 م) - أ/ أدهم هاني	b08bbde8-4382-4cc2-a0f3-eba8b897b279	f4e734d7-0612-46bc-bfc0-1450fdc253f0	9833561e-f6fb-43b9-b9d4-152b41863bc5	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "sunday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
d532b6ab-b2c9-410b-be40-fadad339d6aa	Science (الأحد 05:00 م) - ميس/ إيناس	Science (الأحد 05:00 م) - ميس/ إيناس	fc09ef0c-2902-40fc-890b-f542c976857f	cae85df3-e30e-4e9e-89e4-4645bf9918c4	9833561e-f6fb-43b9-b9d4-152b41863bc5	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "sunday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
cf7c1301-e3c3-45e6-9748-56dfb0231c80	دراسات اجتماعية (الاثنين 05:00 م) - ميس/ شيماء	دراسات اجتماعية (الاثنين 05:00 م) - ميس/ شيماء	3bf81246-d120-49c0-be07-03bf85ffd113	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "monday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
1b82140c-89ed-493c-b169-0b32f30a7414	دراسات اجتماعية (الاثنين 05:00 م) - أ/ محمود رشاد	دراسات اجتماعية (الاثنين 05:00 م) - أ/ محمود رشاد	42bb5476-79c3-45f0-b7f0-92abffbf7fd8	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "monday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
009a3fa0-dcf9-488f-9094-0a634c6b8201	علوم (الاثنين 06:00 م) - أ/ أحمد عثمان	علوم (الاثنين 06:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	9833561e-f6fb-43b9-b9d4-152b41863bc5	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
21d8e2e6-4f6c-427e-96ee-a1e118f29fc7	ICT (الثلاثاء 04:00 م) - ميس/ نهلة	ICT (الثلاثاء 04:00 م) - ميس/ نهلة	ff0318b1-ce3c-4cf1-a609-429c021ae578	b59175b2-1b28-4825-8179-8557160906dc	9833561e-f6fb-43b9-b9d4-152b41863bc5	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "tuesday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
8cb9be9b-2642-494f-9f8b-23ea998a30c3	لغة عربية (الثلاثاء 05:00 م) - أ/ مروان	لغة عربية (الثلاثاء 05:00 م) - أ/ مروان	ea658032-576c-4ef2-bb57-ff11fa442a3f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	9833561e-f6fb-43b9-b9d4-152b41863bc5	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f7ae9231-ac40-4dc4-aa99-9cfc5726292d	لغة عربية (الثلاثاء 05:00 م) - ميس/ دنيا	لغة عربية (الثلاثاء 05:00 م) - ميس/ دنيا	6cc25780-161f-4bd0-86e5-2f82c9f83f7f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	9833561e-f6fb-43b9-b9d4-152b41863bc5	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
44e2916e-7e5c-4e10-9047-00648b609dc3	رياضيات (الأربعاء 04:00 م) - أ/ أحمد محمود	رياضيات (الأربعاء 04:00 م) - أ/ أحمد محمود	2acdbe9b-46d8-44f5-92c5-d98d2de115ab	f4e734d7-0612-46bc-bfc0-1450fdc253f0	9833561e-f6fb-43b9-b9d4-152b41863bc5	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "wednesday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
ccdea6ce-1ef4-4bf0-8b0f-ef68e9218380	رياضيات (الأربعاء 04:00 م) - أ/ أدهم هاني	رياضيات (الأربعاء 04:00 م) - أ/ أدهم هاني	b08bbde8-4382-4cc2-a0f3-eba8b897b279	f4e734d7-0612-46bc-bfc0-1450fdc253f0	9833561e-f6fb-43b9-b9d4-152b41863bc5	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "wednesday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
bc88355f-9572-4fb6-9780-d5a8f8786fdc	Math (الأربعاء 04:30 م) - ميس/ ياسمين	Math (الأربعاء 04:30 م) - ميس/ ياسمين	5d7f6ee4-7311-4f1d-9780-0c8734becad2	13e61af9-7072-46de-9141-d85e764dc20a	9833561e-f6fb-43b9-b9d4-152b41863bc5	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "wednesday", "end_time": "18:00", "start_time": "16:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
6865203d-98be-4db9-b7e6-3225a0c19f66	علوم (الأربعاء 05:00 م) - أ/ حازم	علوم (الأربعاء 05:00 م) - أ/ حازم	b8716661-858e-475a-b196-1193f8d1e7f3	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	9833561e-f6fb-43b9-b9d4-152b41863bc5	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "wednesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
d4ba4f48-ded8-4894-a16b-d1df48ba296a	علوم (الخميس 05:00 م) - أ/ أحمد عثمان	علوم (الخميس 05:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	9833561e-f6fb-43b9-b9d4-152b41863bc5	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "thursday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
06543e50-da0e-4c23-9fbb-6d6d016d9dd1	دراسات اجتماعية (الخميس 06:00 م) - ميس/ شيماء	دراسات اجتماعية (الخميس 06:00 م) - ميس/ شيماء	3bf81246-d120-49c0-be07-03bf85ffd113	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
38500b2e-a5e1-4116-aa4f-44bee1253afe	دراسات اجتماعية (الخميس 06:00 م) - أ/ محمود رشاد	دراسات اجتماعية (الخميس 06:00 م) - أ/ محمود رشاد	42bb5476-79c3-45f0-b7f0-92abffbf7fd8	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0905b1bb-acdc-46cb-b58c-76a2d19b8c1d	لغة إنجليزية (الجمعة 02:00 ظ) - ميس/ آلاء علاء	لغة إنجليزية (الجمعة 02:00 ظ) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	9833561e-f6fb-43b9-b9d4-152b41863bc5	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "friday", "end_time": "15:30", "start_time": "14:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
d86a5c1b-7cf4-4994-9ec0-395a8265e98b	لغة إنجليزية (السبت 03:00 - 05:00 م) - ميس/ آلاء علاء	لغة إنجليزية (السبت 03:00 - 05:00 م) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "saturday", "end_time": "17:00", "start_time": "03:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
6b5c6fa3-42ef-4e46-8796-14ad442012dd	لغة عربية (السبت 05:00 م) - أ/ مروان	لغة عربية (السبت 05:00 م) - أ/ مروان	ea658032-576c-4ef2-bb57-ff11fa442a3f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
db3cd020-b3dc-42d5-bd65-ec1b51c62649	لغة عربية (السبت 05:00 م) - ميس/ دنيا	لغة عربية (السبت 05:00 م) - ميس/ دنيا	6cc25780-161f-4bd0-86e5-2f82c9f83f7f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f6d4cf17-268b-451d-ab2c-54346a4570bc	رياضيات (الأحد 05:00 م) - أ/ أحمد محمود	رياضيات (الأحد 05:00 م) - أ/ أحمد محمود	2acdbe9b-46d8-44f5-92c5-d98d2de115ab	f4e734d7-0612-46bc-bfc0-1450fdc253f0	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	8656d593-ece1-4946-af99-20073616771d	[{"day": "sunday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
90f95a19-2127-4efe-8342-a04dc5bb6fa6	رياضيات (الأحد 05:00 م) - أ/ أدهم هاني	رياضيات (الأحد 05:00 م) - أ/ أدهم هاني	b08bbde8-4382-4cc2-a0f3-eba8b897b279	f4e734d7-0612-46bc-bfc0-1450fdc253f0	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "sunday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
10e09aa3-fdd1-4667-8b50-29413b9232e9	علوم (الأحد 06:00 م) - أ/ حازم	علوم (الأحد 06:00 م) - أ/ حازم	b8716661-858e-475a-b196-1193f8d1e7f3	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "sunday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
7ce9704a-f8c1-497a-946c-8c2100851180	Science (الأحد 07:00 م) - ميس/ إيناس	Science (الأحد 07:00 م) - ميس/ إيناس	fc09ef0c-2902-40fc-890b-f542c976857f	cae85df3-e30e-4e9e-89e4-4645bf9918c4	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "sunday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
66d79575-b5fa-4e79-bceb-412141bf477b	Math (الاثنين 03:00 م) - أ/ ياسمين	Math (الاثنين 03:00 م) - أ/ ياسمين	f112b8b5-5fd2-4470-a98e-c703783b7b38	13e61af9-7072-46de-9141-d85e764dc20a	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "monday", "end_time": "16:30", "start_time": "15:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
9d4ac6e3-153a-4f09-adda-490761b41b59	دراسات اجتماعية (الاثنين 07:00 م) - ميس/ شيماء	دراسات اجتماعية (الاثنين 07:00 م) - ميس/ شيماء	3bf81246-d120-49c0-be07-03bf85ffd113	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "monday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
70bd4949-1baa-4812-8ff5-480b982b3625	دراسات اجتماعية (الاثنين 07:00 م) - أ/ محمود رشاد	دراسات اجتماعية (الاثنين 07:00 م) - أ/ محمود رشاد	42bb5476-79c3-45f0-b7f0-92abffbf7fd8	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "monday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
8f947afd-8620-47b3-9651-25a50db42f1b	علوم (الاثنين 08:00 م) - أ/ أحمد عثمان	علوم (الاثنين 08:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "monday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
5c640bc0-6e30-47e4-abfe-b937da63e924	ICT (الثلاثاء 05:00 م) - ميس/ نهلة	ICT (الثلاثاء 05:00 م) - ميس/ نهلة	ff0318b1-ce3c-4cf1-a609-429c021ae578	b59175b2-1b28-4825-8179-8557160906dc	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
97c4afd7-ecfe-46c8-9643-4bb1c13e6541	لغة عربية (الثلاثاء 06:00 م) - أ/ مروان	لغة عربية (الثلاثاء 06:00 م) - أ/ مروان	ea658032-576c-4ef2-bb57-ff11fa442a3f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3fa4f3cc-9be6-4945-b8de-f7e4930ccbfa	لغة عربية (الثلاثاء 06:00 م) - ميس/ دنيا	لغة عربية (الثلاثاء 06:00 م) - ميس/ دنيا	6cc25780-161f-4bd0-86e5-2f82c9f83f7f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
b1f065dc-bbe2-49f6-8b87-2582577173c1	تكنولوجيا المعلومات (الثلاثاء 07:00 م) - ميس/ هبة	تكنولوجيا المعلومات (الثلاثاء 07:00 م) - ميس/ هبة	39698159-25ca-479c-a3b1-b70aa63db586	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
fe1d0aed-91b2-4375-953e-15579396b19c	Math (الأربعاء 05:00 م) - أ/ أسماء	Math (الأربعاء 05:00 م) - أ/ أسماء	9b22cbc2-1144-4527-bcde-6798e1329528	13e61af9-7072-46de-9141-d85e764dc20a	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "wednesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
cc7e0890-cd38-4e2c-aa4f-02bb929cf1d6	رياضيات (الأربعاء 05:00 م) - أ/ أحمد محمود	رياضيات (الأربعاء 05:00 م) - أ/ أحمد محمود	2acdbe9b-46d8-44f5-92c5-d98d2de115ab	f4e734d7-0612-46bc-bfc0-1450fdc253f0	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "wednesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
ffd3df62-6161-42df-b757-2156004515e8	رياضيات (الأربعاء 05:00 م) - أ/ أدهم هاني	رياضيات (الأربعاء 05:00 م) - أ/ أدهم هاني	b08bbde8-4382-4cc2-a0f3-eba8b897b279	f4e734d7-0612-46bc-bfc0-1450fdc253f0	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "wednesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0c8a4f00-482e-4160-8c9a-d06079c5df59	علوم (الأربعاء 06:00 م) - أ/ حازم	علوم (الأربعاء 06:00 م) - أ/ حازم	b8716661-858e-475a-b196-1193f8d1e7f3	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "wednesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3c9a7f45-54e1-4915-b32a-1fd43ec5aa8c	دراسات اجتماعية (الخميس 07:00 م) - ميس/ شيماء	دراسات اجتماعية (الخميس 07:00 م) - ميس/ شيماء	3bf81246-d120-49c0-be07-03bf85ffd113	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "thursday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3ff2f6a8-6583-4a1f-8a9d-4157c551f3ba	دراسات اجتماعية (الخميس 07:00 م) - أ/ محمود رشاد	دراسات اجتماعية (الخميس 07:00 م) - أ/ محمود رشاد	42bb5476-79c3-45f0-b7f0-92abffbf7fd8	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "thursday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0bdaa206-3fa2-484a-a128-12ca9a410b06	علوم (الخميس 08:00 م) - أ/ أحمد عثمان	علوم (الخميس 08:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "thursday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
5917a8e7-2fca-4c02-be4b-0b9f0633bae6	لغة إنجليزية (الجمعة 03:00 ع) - ميس/ آلاء علاء	لغة إنجليزية (الجمعة 03:00 ع) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "friday", "end_time": "16:30", "start_time": "15:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
7a9e4c43-7507-4a42-b2da-f68cda60a5c5	علوم (الخميس 06:00 م) - أ/ أحمد عثمان	علوم (الخميس 06:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	59141280-1c86-41bc-a284-6d05d555f457	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
86a5ba77-a572-4770-9dc4-7e0236227748	لغة إنجليزية (السبت 05:00 - 07:00 م) - ميس/ آلاء علاء	لغة إنجليزية (السبت 05:00 - 07:00 م) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	59141280-1c86-41bc-a284-6d05d555f457	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "saturday", "end_time": "19:00", "start_time": "05:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
384d51a5-1af7-4f3f-b8b6-e02e89aec8bd	لغة عربية (السبت 07:00 م) - أ/ مروان	لغة عربية (السبت 07:00 م) - أ/ مروان	ea658032-576c-4ef2-bb57-ff11fa442a3f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	59141280-1c86-41bc-a284-6d05d555f457	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f9018e50-06e1-43de-aa63-27daa5ac6de1	لغة عربية (السبت 07:00 م) - ميس/ دنيا	لغة عربية (السبت 07:00 م) - ميس/ دنيا	6cc25780-161f-4bd0-86e5-2f82c9f83f7f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	59141280-1c86-41bc-a284-6d05d555f457	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
fbbca9c0-6dd7-40dd-8f08-1e2d55d24bf4	رياضيات (الأحد 06:00 م) - أ/ أحمد محمود	رياضيات (الأحد 06:00 م) - أ/ أحمد محمود	2acdbe9b-46d8-44f5-92c5-d98d2de115ab	f4e734d7-0612-46bc-bfc0-1450fdc253f0	59141280-1c86-41bc-a284-6d05d555f457	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "sunday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
eea6bb80-138c-45e6-b9ee-f47bccf9b151	رياضيات (الأحد 06:00 م) - أ/ أدهم هاني	رياضيات (الأحد 06:00 م) - أ/ أدهم هاني	b08bbde8-4382-4cc2-a0f3-eba8b897b279	f4e734d7-0612-46bc-bfc0-1450fdc253f0	59141280-1c86-41bc-a284-6d05d555f457	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "sunday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0fc492bb-50ac-4186-8a65-721452db0a77	علوم (الأحد 07:00 م) - أ/ حازم	علوم (الأحد 07:00 م) - أ/ حازم	b8716661-858e-475a-b196-1193f8d1e7f3	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	59141280-1c86-41bc-a284-6d05d555f457	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "sunday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
b23118c5-0170-47c6-be6c-e3332e2a1d31	علوم (الاثنين 05:00 م) - أ/ أحمد عثمان	علوم (الاثنين 05:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	59141280-1c86-41bc-a284-6d05d555f457	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "monday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
8d36e70c-a23d-47b8-8f9a-89349f38bd27	دراسات اجتماعية (الاثنين 06:00 م) - ميس/ شيماء	دراسات اجتماعية (الاثنين 06:00 م) - ميس/ شيماء	3bf81246-d120-49c0-be07-03bf85ffd113	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
8b19a313-9e9e-480f-9bb8-18cf854a5afe	دراسات اجتماعية (الاثنين 06:00 م) - أ/ محمود رشاد	دراسات اجتماعية (الاثنين 06:00 م) - أ/ محمود رشاد	42bb5476-79c3-45f0-b7f0-92abffbf7fd8	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
1c6d6225-5bed-4938-90ce-4150cca92b9f	لغة عربية (الثلاثاء 07:00 م) - أ/ مروان	لغة عربية (الثلاثاء 07:00 م) - أ/ مروان	ea658032-576c-4ef2-bb57-ff11fa442a3f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	59141280-1c86-41bc-a284-6d05d555f457	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
16fb546d-f3da-481c-8024-95d5bfd3f742	لغة عربية (الثلاثاء 07:00 م) - ميس/ دنيا	لغة عربية (الثلاثاء 07:00 م) - ميس/ دنيا	6cc25780-161f-4bd0-86e5-2f82c9f83f7f	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	59141280-1c86-41bc-a284-6d05d555f457	8656d593-ece1-4946-af99-20073616771d	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
d4dbeaac-0389-4ea7-b0e0-0d9c28f5356c	ICT (الثلاثاء 08:00 م) - ميس/ نهلة	ICT (الثلاثاء 08:00 م) - ميس/ نهلة	ff0318b1-ce3c-4cf1-a609-429c021ae578	b59175b2-1b28-4825-8179-8557160906dc	59141280-1c86-41bc-a284-6d05d555f457	8656d593-ece1-4946-af99-20073616771d	[{"day": "tuesday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
1cb1e620-6b8f-48e8-9c22-3b122cb97d1e	تكنولوجيا المعلومات (الثلاثاء 08:00 م) - ميس/ هبة	تكنولوجيا المعلومات (الثلاثاء 08:00 م) - ميس/ هبة	39698159-25ca-479c-a3b1-b70aa63db586	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	59141280-1c86-41bc-a284-6d05d555f457	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "tuesday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3ceb4d9b-3c24-46b5-b36e-885b4f7cb799	Math (الأربعاء 06:00 م) - ميس/ ياسمين	Math (الأربعاء 06:00 م) - ميس/ ياسمين	5d7f6ee4-7311-4f1d-9780-0c8734becad2	13e61af9-7072-46de-9141-d85e764dc20a	59141280-1c86-41bc-a284-6d05d555f457	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "wednesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
beb0b460-8463-4d12-b0a5-52fa0c4d1c88	رياضيات (الأربعاء 06:00 م) - أ/ أحمد محمود	رياضيات (الأربعاء 06:00 م) - أ/ أحمد محمود	2acdbe9b-46d8-44f5-92c5-d98d2de115ab	f4e734d7-0612-46bc-bfc0-1450fdc253f0	59141280-1c86-41bc-a284-6d05d555f457	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "wednesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
9568193d-6ac2-4390-b475-155957494d91	رياضيات (الأربعاء 06:00 م) - أ/ أدهم هاني	رياضيات (الأربعاء 06:00 م) - أ/ أدهم هاني	b08bbde8-4382-4cc2-a0f3-eba8b897b279	f4e734d7-0612-46bc-bfc0-1450fdc253f0	59141280-1c86-41bc-a284-6d05d555f457	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "wednesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
bfa78fbe-a3fe-4683-8a50-c7f8bc9357ad	علوم (الأربعاء 07:00 م) - أ/ حازم	علوم (الأربعاء 07:00 م) - أ/ حازم	b8716661-858e-475a-b196-1193f8d1e7f3	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	59141280-1c86-41bc-a284-6d05d555f457	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "wednesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3ecc2e63-c7bc-4c4d-a61f-84bd3a5a743f	دراسات اجتماعية (الخميس 05:00 م) - ميس/ شيماء	دراسات اجتماعية (الخميس 05:00 م) - ميس/ شيماء	3bf81246-d120-49c0-be07-03bf85ffd113	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "thursday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f04cde63-f79c-4ae0-bc93-9be06475616c	دراسات اجتماعية (الخميس 05:00 م) - أ/ محمود رشاد	دراسات اجتماعية (الخميس 05:00 م) - أ/ محمود رشاد	42bb5476-79c3-45f0-b7f0-92abffbf7fd8	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "thursday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
82aa8fa5-508e-4031-ae26-1a388df68d7e	Science (الخميس 06:00 م) - ميس/ إيناس	Science (الخميس 06:00 م) - ميس/ إيناس	fc09ef0c-2902-40fc-890b-f542c976857f	cae85df3-e30e-4e9e-89e4-4645bf9918c4	59141280-1c86-41bc-a284-6d05d555f457	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
a9905a79-6e05-4cef-bb09-9b59c3d19c3b	Math (الاثنين 04:30 م) - أ/ ياسمين	Math (الاثنين 04:30 م) - أ/ ياسمين	f112b8b5-5fd2-4470-a98e-c703783b7b38	13e61af9-7072-46de-9141-d85e764dc20a	79842e52-6787-4773-b13f-5d8abf4c5043	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "monday", "end_time": "18:00", "start_time": "16:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
faa2c12e-4eff-4179-9f40-8575e573fffd	لغة إنجليزية (الجمعة 04:00 ع) - ميس/ آلاء علاء	لغة إنجليزية (الجمعة 04:00 ع) - ميس/ آلاء علاء	7faa099e-960f-4735-abed-4f0598bec1d6	37455367-fad4-4bb6-87d8-4b2d0ec9da10	59141280-1c86-41bc-a284-6d05d555f457	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "friday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
a4fc1da3-aa85-4967-824d-5e4515c6a004	لغة إنجليزية (السبت 06:00 م) - أ/ صبحي محمد	لغة إنجليزية (السبت 06:00 م) - أ/ صبحي محمد	214bd4ee-8381-4178-a7ac-311ffe35c78c	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "saturday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
cc2dc35d-3fce-4b60-875f-2ee2064df33c	لغة إنجليزية (السبت 06:00 م) - أ/ محمد علاء	لغة إنجليزية (السبت 06:00 م) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "saturday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
a77929fa-d3f1-437c-b6e1-df60d9d6e0a5	Science (السبت 07:00 م) - مستر/ إسلام عبد الجليل	Science (السبت 07:00 م) - مستر/ إسلام عبد الجليل	889dfb93-0ee3-4a65-84ad-55a1b68adc28	cae85df3-e30e-4e9e-89e4-4645bf9918c4	eab6184a-f010-48ea-9eee-a75a44ee9f7e	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
055c720f-a6c6-475e-be50-e0a179069d0d	Science (السبت 07:00 م) - مستر/ محمد العربي	Science (السبت 07:00 م) - مستر/ محمد العربي	2fe7fc93-7ac6-4e6b-83b6-f8969a942745	cae85df3-e30e-4e9e-89e4-4645bf9918c4	eab6184a-f010-48ea-9eee-a75a44ee9f7e	8656d593-ece1-4946-af99-20073616771d	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
82c8ba3e-7ac2-4d15-9200-078c9f9a88a5	علوم (السبت 07:00 م) - ميس/ آية آدم	علوم (السبت 07:00 م) - ميس/ آية آدم	f3e74f5e-d4e9-4b29-a882-adef9a120cf2	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
1969bf48-1920-4c07-bd24-91e03e3d3214	علوم (السبت 07:00 م) - أ/ أحمد عثمان	علوم (السبت 07:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0cb09172-e9a9-4ba9-ae34-66855e34baef	علوم (السبت 07:00 م) - أ/ أحمد عبد الله	علوم (السبت 07:00 م) - أ/ أحمد عبد الله	d3a3ca6d-e0fe-4985-8350-63aafb66f548	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
5d0723b8-fd1d-41de-9156-35df21e6884a	دراسات اجتماعية (الأحد 05:30 م) - أ/ محمد سعيد	دراسات اجتماعية (الأحد 05:30 م) - أ/ محمد سعيد	35a30e35-35f7-4527-a6e1-3cd61481cda4	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "sunday", "end_time": "19:00", "start_time": "17:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
4d4ce700-a7ea-4dd2-ac99-3a14f37b26cf	عربي (الأحد 06:30 م) - أ/ محمد صلاح	عربي (الأحد 06:30 م) - أ/ محمد صلاح	6924d0f7-ff06-40e8-8472-d3ea57382637	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	eab6184a-f010-48ea-9eee-a75a44ee9f7e	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "sunday", "end_time": "20:00", "start_time": "18:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
19714147-ca3f-40c5-9cce-a317d114b218	دراسات اجتماعية (الأحد 07:30 م) - أ/ محمود طارق	دراسات اجتماعية (الأحد 07:30 م) - أ/ محمود طارق	78443196-52fd-486e-87e7-fdffa6d41a41	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "sunday", "end_time": "21:00", "start_time": "19:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
955a2401-8360-438e-b51a-450b5543debd	Math (الاثنين 04:00 م) - أ/ أسماء	Math (الاثنين 04:00 م) - أ/ أسماء	9b22cbc2-1144-4527-bcde-6798e1329528	13e61af9-7072-46de-9141-d85e764dc20a	eab6184a-f010-48ea-9eee-a75a44ee9f7e	8656d593-ece1-4946-af99-20073616771d	[{"day": "monday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
4000b15d-ba00-4abf-a90c-3312448f66f6	شرعي (الاثنين 05:00 م) - أ/ آلاء محمد	شرعي (الاثنين 05:00 م) - أ/ آلاء محمد	b056d2d3-449c-4eb5-8df8-12a2f26b713f	3954d6f5-1bff-49b1-bb06-60c852e8910b	eab6184a-f010-48ea-9eee-a75a44ee9f7e	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "monday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f9280d52-78c8-4b5e-a38f-2bd6816d2ebd	Math (الاثنين 06:00 م) - أ/ ياسمين مجدي	Math (الاثنين 06:00 م) - أ/ ياسمين مجدي	bbc8cd65-dd65-44d4-a18d-75faced278af	13e61af9-7072-46de-9141-d85e764dc20a	eab6184a-f010-48ea-9eee-a75a44ee9f7e	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
34a7175a-4ffc-457c-b6fb-6e02c8d95e35	لغة عربية (الاثنين 06:00 م) - أ/ ياسمين حسن	لغة عربية (الاثنين 06:00 م) - أ/ ياسمين حسن	610a1230-9e73-4a55-96de-8005dec2b99c	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	eab6184a-f010-48ea-9eee-a75a44ee9f7e	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
2741ec82-c6c7-4a85-a3e3-79952e753a4f	رياضيات (الاثنين 07:00 م) - أ/ محمد بكير	رياضيات (الاثنين 07:00 م) - أ/ محمد بكير	fc37bbab-da95-4a63-ba15-58cc1ff148b4	f4e734d7-0612-46bc-bfc0-1450fdc253f0	eab6184a-f010-48ea-9eee-a75a44ee9f7e	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "monday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f8f363f9-f039-49e0-b6e2-bd5cd2c59dde	رياضيات (الاثنين 07:00 م) - أ/ محمد عادل	رياضيات (الاثنين 07:00 م) - أ/ محمد عادل	35399c88-3eff-400c-a239-e15a916f4852	f4e734d7-0612-46bc-bfc0-1450fdc253f0	eab6184a-f010-48ea-9eee-a75a44ee9f7e	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "monday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
cf604af0-393c-4e17-b59d-3934d75ed954	لغة إنجليزية (الثلاثاء 06:00 م) - أ/ صبحي محمد	لغة إنجليزية (الثلاثاء 06:00 م) - أ/ صبحي محمد	214bd4ee-8381-4178-a7ac-311ffe35c78c	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
ec5a60f9-b53c-410c-a118-aa6559bd083a	لغة إنجليزية (الثلاثاء 06:00 م) - أ/ محمد علاء	لغة إنجليزية (الثلاثاء 06:00 م) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
edd69656-96bf-4860-b117-1ca7279c6307	علوم (الثلاثاء 07:00 م) - أ/ أحمد عبد الله	علوم (الثلاثاء 07:00 م) - أ/ أحمد عبد الله	d3a3ca6d-e0fe-4985-8350-63aafb66f548	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	8656d593-ece1-4946-af99-20073616771d	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
65fb0769-18a6-44bf-8858-9d6659f2faa6	علوم (الثلاثاء 07:00 م) - أ/ أحمد عثمان	علوم (الثلاثاء 07:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
e2014a88-91da-45ea-bbe2-704b9b22fa0a	علوم (الثلاثاء 07:00 م) - ميس/ آية آدم	علوم (الثلاثاء 07:00 م) - ميس/ آية آدم	f3e74f5e-d4e9-4b29-a882-adef9a120cf2	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
65bce91c-74d9-443e-a204-968ae58e0774	ICT (الثلاثاء 07:00 م) - ميس/ نهلة	ICT (الثلاثاء 07:00 م) - ميس/ نهلة	ff0318b1-ce3c-4cf1-a609-429c021ae578	b59175b2-1b28-4825-8179-8557160906dc	eab6184a-f010-48ea-9eee-a75a44ee9f7e	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
d0888ed4-6f7b-47a9-abc8-2df11a36cc3d	فرنساوي (الثلاثاء 08:00 م) - مسيو/ خالد النصيري	فرنساوي (الثلاثاء 08:00 م) - مسيو/ خالد النصيري	48afae2d-181a-4d53-bd23-243b6bf061d9	640f4d8d-69e4-47ad-9682-863a1c9158b7	eab6184a-f010-48ea-9eee-a75a44ee9f7e	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "tuesday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
94a8da3c-8d72-41b7-ada5-881bd94aef59	دراسات اجتماعية (الأربعاء 05:30 م) - أ/ محمد سعيد	دراسات اجتماعية (الأربعاء 05:30 م) - أ/ محمد سعيد	35a30e35-35f7-4527-a6e1-3cd61481cda4	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "wednesday", "end_time": "19:00", "start_time": "17:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
8311e86f-7517-4003-be9a-49f69114ab35	لغة عربية (الأربعاء 06:30 م) - أ/ محمد صلاح	لغة عربية (الأربعاء 06:30 م) - أ/ محمد صلاح	6924d0f7-ff06-40e8-8472-d3ea57382637	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	eab6184a-f010-48ea-9eee-a75a44ee9f7e	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "wednesday", "end_time": "20:00", "start_time": "18:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
d6a9d789-79ed-4815-915b-fbd0d566e00a	دراسات اجتماعية (الأربعاء 07:30 م) - أ/ محمود طارق	دراسات اجتماعية (الأربعاء 07:30 م) - أ/ محمود طارق	78443196-52fd-486e-87e7-fdffa6d41a41	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "wednesday", "end_time": "21:00", "start_time": "19:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
70f14094-17f8-4078-aea0-4a8cdbb48d43	لغة عربية (الخميس 05:00 م) - ميس/ ياسمين حسن	لغة عربية (الخميس 05:00 م) - ميس/ ياسمين حسن	b1d23568-bdb0-4a7d-9b8e-4cfd6b909a2c	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	eab6184a-f010-48ea-9eee-a75a44ee9f7e	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "thursday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
488bbd5c-a453-422c-99ed-4c389a344561	Math (الخميس 06:00 م) - ميس/ ندى	Math (الخميس 06:00 م) - ميس/ ندى	34290997-d379-4a46-b5df-9a54f1d0d64e	13e61af9-7072-46de-9141-d85e764dc20a	eab6184a-f010-48ea-9eee-a75a44ee9f7e	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3394d716-8d4a-49c1-b04e-33f5367ca48e	رياضيات (الخميس 07:00 م) - أ/ محمد عادل	رياضيات (الخميس 07:00 م) - أ/ محمد عادل	35399c88-3eff-400c-a239-e15a916f4852	f4e734d7-0612-46bc-bfc0-1450fdc253f0	eab6184a-f010-48ea-9eee-a75a44ee9f7e	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "thursday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
8bb65a0e-ac24-406f-a21d-5549bad0ea12	رياضيات (الخميس 07:00 م) - أ/ محمد بكير	رياضيات (الخميس 07:00 م) - أ/ محمد بكير	fc37bbab-da95-4a63-ba15-58cc1ff148b4	f4e734d7-0612-46bc-bfc0-1450fdc253f0	eab6184a-f010-48ea-9eee-a75a44ee9f7e	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "thursday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
cae083fb-7ce1-4e90-8481-227350d352b7	لغة إنجليزية (الجمعة 10:00 ص) - أ/ محمد علاء	لغة إنجليزية (الجمعة 10:00 ص) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "friday", "end_time": "11:30", "start_time": "10:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
b9559fd6-2023-46c8-8a65-27303fd0fa96	Science (السبت 03:00 م) - مستر/ إسلام عبد الجليل	Science (السبت 03:00 م) - مستر/ إسلام عبد الجليل	889dfb93-0ee3-4a65-84ad-55a1b68adc28	cae85df3-e30e-4e9e-89e4-4645bf9918c4	79842e52-6787-4773-b13f-5d8abf4c5043	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "saturday", "end_time": "16:30", "start_time": "15:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0e85c5cb-b33c-47e0-8f91-c7cc9f76a5ed	لغة إنجليزية (السبت 05:00 م) - أ/ صبحي محمد	لغة إنجليزية (السبت 05:00 م) - أ/ صبحي محمد	214bd4ee-8381-4178-a7ac-311ffe35c78c	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
100c9e2a-b165-4749-b9c2-d4e50c34f158	لغة إنجليزية (السبت 05:00 م) - أ/ محمد علاء	لغة إنجليزية (السبت 05:00 م) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	8656d593-ece1-4946-af99-20073616771d	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3811e8d9-0461-4f03-83b5-d08b06457194	علوم (السبت 06:00 م) - ميس/ آية آدم	علوم (السبت 06:00 م) - ميس/ آية آدم	f3e74f5e-d4e9-4b29-a882-adef9a120cf2	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "saturday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f4d7160b-d068-4d5a-907c-2da7db3c0d3e	علوم (السبت 06:00 م) - أ/ أحمد عبد الله	علوم (السبت 06:00 م) - أ/ أحمد عبد الله	d3a3ca6d-e0fe-4985-8350-63aafb66f548	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "saturday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
971df9ac-ce38-484c-9983-6a092f40bffb	دراسات اجتماعية (الأحد 04:30 م) - أ/ محمد سعيد	دراسات اجتماعية (الأحد 04:30 م) - أ/ محمد سعيد	35a30e35-35f7-4527-a6e1-3cd61481cda4	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	79842e52-6787-4773-b13f-5d8abf4c5043	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "sunday", "end_time": "18:00", "start_time": "16:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
50ad3444-86e8-49a8-aed5-c926f76f1d20	عربي (الأحد 05:30 م) - أ/ محمد صلاح	عربي (الأحد 05:30 م) - أ/ محمد صلاح	6924d0f7-ff06-40e8-8472-d3ea57382637	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	79842e52-6787-4773-b13f-5d8abf4c5043	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "sunday", "end_time": "19:00", "start_time": "17:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
51661fa7-2379-4600-b018-e832b28849ce	دراسات اجتماعية (الأحد 06:30 م) - أ/ محمود طارق	دراسات اجتماعية (الأحد 06:30 م) - أ/ محمود طارق	78443196-52fd-486e-87e7-fdffa6d41a41	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	79842e52-6787-4773-b13f-5d8abf4c5043	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "sunday", "end_time": "20:00", "start_time": "18:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
099f1210-c1ac-470e-ad42-0a4d2544d26f	Math (الاثنين 05:00 م) - أ/ ندى	Math (الاثنين 05:00 م) - أ/ ندى	e7f458cf-7618-477a-b0ce-87181ff1f3f6	13e61af9-7072-46de-9141-d85e764dc20a	79842e52-6787-4773-b13f-5d8abf4c5043	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "monday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
9255670b-e110-457f-9ef2-987d11e57648	شرعي (الاثنين 06:00 م) - أ/ آلاء محمد	شرعي (الاثنين 06:00 م) - أ/ آلاء محمد	b056d2d3-449c-4eb5-8df8-12a2f26b713f	3954d6f5-1bff-49b1-bb06-60c852e8910b	79842e52-6787-4773-b13f-5d8abf4c5043	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
a77c8537-af7f-4adf-90cf-dd7f1d445e6f	لغة عربية (الاثنين 07:00 م) - أ/ ياسمين حسن	لغة عربية (الاثنين 07:00 م) - أ/ ياسمين حسن	610a1230-9e73-4a55-96de-8005dec2b99c	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	79842e52-6787-4773-b13f-5d8abf4c5043	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "monday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
4c7edd66-3e09-4afd-923b-621519c744a5	علوم (الاثنين 07:00 م) - أ/ أحمد عثمان	علوم (الاثنين 07:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "monday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0d2f21fc-57fd-41b7-8399-bd2e2dbf639a	رياضيات (الاثنين 08:00 م) - أ/ محمد عادل	رياضيات (الاثنين 08:00 م) - أ/ محمد عادل	35399c88-3eff-400c-a239-e15a916f4852	f4e734d7-0612-46bc-bfc0-1450fdc253f0	79842e52-6787-4773-b13f-5d8abf4c5043	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "monday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
e1803488-1c37-4e46-be9e-ca1be4842c48	رياضيات (الاثنين 08:00 م) - أ/ محمد بكير	رياضيات (الاثنين 08:00 م) - أ/ محمد بكير	fc37bbab-da95-4a63-ba15-58cc1ff148b4	f4e734d7-0612-46bc-bfc0-1450fdc253f0	79842e52-6787-4773-b13f-5d8abf4c5043	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "monday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
e47f6253-ee6a-4170-8e30-6e85266cb7d0	لغة إنجليزية (الثلاثاء 05:00 م) - أ/ صبحي محمد	لغة إنجليزية (الثلاثاء 05:00 م) - أ/ صبحي محمد	214bd4ee-8381-4178-a7ac-311ffe35c78c	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
5c8ed261-8692-4015-a229-6a93ea325fd2	لغة إنجليزية (الثلاثاء 05:00 م) - أ/ محمد علاء	لغة إنجليزية (الثلاثاء 05:00 م) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
b3fc6af6-81dc-421f-9a4b-bc75dfc28047	علوم (الثلاثاء 06:00 م) - أ/ أحمد عبد الله	علوم (الثلاثاء 06:00 م) - أ/ أحمد عبد الله	d3a3ca6d-e0fe-4985-8350-63aafb66f548	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	8656d593-ece1-4946-af99-20073616771d	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
288fbaf3-5011-4346-bcd3-aa0029957c7e	علوم (الثلاثاء 06:00 م) - ميس/ آية آدم	علوم (الثلاثاء 06:00 م) - ميس/ آية آدم	f3e74f5e-d4e9-4b29-a882-adef9a120cf2	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
49603cc0-e7c6-47d0-9874-a220f4b0a3b4	ICT (الثلاثاء 06:00 م) - ميس/ نهلة	ICT (الثلاثاء 06:00 م) - ميس/ نهلة	ff0318b1-ce3c-4cf1-a609-429c021ae578	b59175b2-1b28-4825-8179-8557160906dc	79842e52-6787-4773-b13f-5d8abf4c5043	8656d593-ece1-4946-af99-20073616771d	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
19ad3f9c-1aa8-43d7-9441-f6f3b9386c55	فرنساوي (الثلاثاء 07:00 م) - مسيو/ خالد النصيري	فرنساوي (الثلاثاء 07:00 م) - مسيو/ خالد النصيري	48afae2d-181a-4d53-bd23-243b6bf061d9	640f4d8d-69e4-47ad-9682-863a1c9158b7	79842e52-6787-4773-b13f-5d8abf4c5043	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
2d28da6c-71b2-4159-bec8-afbdee5f7b62	دراسات اجتماعية (الأربعاء 04:30 م) - أ/ محمد سعيد	دراسات اجتماعية (الأربعاء 04:30 م) - أ/ محمد سعيد	35a30e35-35f7-4527-a6e1-3cd61481cda4	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	79842e52-6787-4773-b13f-5d8abf4c5043	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "wednesday", "end_time": "18:00", "start_time": "16:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0515ab5a-b35e-4e41-8391-9ed407657725	لغة عربية (الأربعاء 05:30 م) - أ/ محمد صلاح	لغة عربية (الأربعاء 05:30 م) - أ/ محمد صلاح	6924d0f7-ff06-40e8-8472-d3ea57382637	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	79842e52-6787-4773-b13f-5d8abf4c5043	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "wednesday", "end_time": "19:00", "start_time": "17:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
8f227704-4f78-4c0c-9b57-1957c9c371e7	دراسات اجتماعية (الأربعاء 06:30 م) - أ/ محمود طارق	دراسات اجتماعية (الأربعاء 06:30 م) - أ/ محمود طارق	78443196-52fd-486e-87e7-fdffa6d41a41	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	79842e52-6787-4773-b13f-5d8abf4c5043	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "wednesday", "end_time": "20:00", "start_time": "18:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
271adfb1-4eb0-43d7-9f8a-1f4119442270	Science (الخميس 05:00 - 07:00 م) - مستر/ محمد العربي	Science (الخميس 05:00 - 07:00 م) - مستر/ محمد العربي	2fe7fc93-7ac6-4e6b-83b6-f8969a942745	cae85df3-e30e-4e9e-89e4-4645bf9918c4	79842e52-6787-4773-b13f-5d8abf4c5043	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "thursday", "end_time": "19:00", "start_time": "05:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
228f02cb-79ea-40bb-a203-3f5688164e9f	لغة عربية (الخميس 06:00 م) - ميس/ ياسمين	لغة عربية (الخميس 06:00 م) - ميس/ ياسمين	5d7f6ee4-7311-4f1d-9780-0c8734becad2	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	79842e52-6787-4773-b13f-5d8abf4c5043	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3ffe1e70-ec2f-4c39-8908-87b9430a1433	علوم (الخميس 07:00 م) - أ/ أحمد عثمان	علوم (الخميس 07:00 م) - أ/ أحمد عثمان	3edf073c-59cf-4380-95f7-fc02a8acb0ad	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "thursday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
cae6f57c-d30b-4e67-ae67-3937273b63bc	رياضيات (الخميس 08:00 م) - أ/ محمد عادل	رياضيات (الخميس 08:00 م) - أ/ محمد عادل	35399c88-3eff-400c-a239-e15a916f4852	f4e734d7-0612-46bc-bfc0-1450fdc253f0	79842e52-6787-4773-b13f-5d8abf4c5043	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "thursday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
4fe9bd90-16cc-4272-90de-58fa3f14b846	رياضيات (الخميس 08:00 م) - أ/ محمد بكير	رياضيات (الخميس 08:00 م) - أ/ محمد بكير	fc37bbab-da95-4a63-ba15-58cc1ff148b4	f4e734d7-0612-46bc-bfc0-1450fdc253f0	79842e52-6787-4773-b13f-5d8abf4c5043	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "thursday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
b70bc20d-b2ae-4b0b-8d7a-e4e48a62e848	لغة إنجليزية (الجمعة 11:00 ص) - أ/ محمد علاء	لغة إنجليزية (الجمعة 11:00 ص) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "friday", "end_time": "12:30", "start_time": "11:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
5ff65f72-914d-416b-9033-1e2983c538fd	فرنساوي (السبت 03:00 م) - مسيو/ خالد النصيري	فرنساوي (السبت 03:00 م) - مسيو/ خالد النصيري	48afae2d-181a-4d53-bd23-243b6bf061d9	640f4d8d-69e4-47ad-9682-863a1c9158b7	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "saturday", "end_time": "16:30", "start_time": "15:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
95715141-b2ad-4ee3-be1b-77f3e7584a36	لغة إنجليزية (السبت 04:00 م) - أ/ صبحي محمد	لغة إنجليزية (السبت 04:00 م) - أ/ صبحي محمد	214bd4ee-8381-4178-a7ac-311ffe35c78c	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "saturday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
1fb7da1e-8da4-41b4-b87b-1652f6af7818	لغة إنجليزية (السبت 04:00 م) - أ/ محمد علاء	لغة إنجليزية (السبت 04:00 م) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	8656d593-ece1-4946-af99-20073616771d	[{"day": "saturday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
7f0c1d5a-cdca-4872-98d4-50be8707ad51	Science (السبت 05:00 م) - مستر/ إسلام عبد الجليل	Science (السبت 05:00 م) - مستر/ إسلام عبد الجليل	889dfb93-0ee3-4a65-84ad-55a1b68adc28	cae85df3-e30e-4e9e-89e4-4645bf9918c4	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
2c5ac824-28cd-4819-8f89-7f9ae1f18441	علوم (السبت 05:00 م) - ميس/ آية آدم	علوم (السبت 05:00 م) - ميس/ آية آدم	f3e74f5e-d4e9-4b29-a882-adef9a120cf2	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
4ffb41d1-db31-46d6-9c96-4e917708daf5	علوم (السبت 05:00 م) - أ/ أحمد عبد الله	علوم (السبت 05:00 م) - أ/ أحمد عبد الله	d3a3ca6d-e0fe-4985-8350-63aafb66f548	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
a7497074-793f-4013-bd5d-dd60f4b7fabb	دراسات اجتماعية (الأحد 03:30 م) - أ/ محمد سعيد	دراسات اجتماعية (الأحد 03:30 م) - أ/ محمد سعيد	35a30e35-35f7-4527-a6e1-3cd61481cda4	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "sunday", "end_time": "17:00", "start_time": "15:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
eb57bcda-a9a4-42d9-9114-7ec1ec9c906f	عربي (الأحد 04:30 م) - أ/ محمد صلاح	عربي (الأحد 04:30 م) - أ/ محمد صلاح	6924d0f7-ff06-40e8-8472-d3ea57382637	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	8656d593-ece1-4946-af99-20073616771d	[{"day": "sunday", "end_time": "18:00", "start_time": "16:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
60bd5f17-f900-47ee-b932-546c36bddef7	دراسات اجتماعية (الأحد 05:30 م) - أ/ محمود طارق	دراسات اجتماعية (الأحد 05:30 م) - أ/ محمود طارق	78443196-52fd-486e-87e7-fdffa6d41a41	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	e049b8b5-9d3c-4682-9e17-92d8320fc9b3	[{"day": "sunday", "end_time": "19:00", "start_time": "17:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
c6a67d21-60d9-4d8f-a202-0b0287fe2063	Math (الاثنين 03:00 م) - أ/ ندى	Math (الاثنين 03:00 م) - أ/ ندى	e7f458cf-7618-477a-b0ce-87181ff1f3f6	13e61af9-7072-46de-9141-d85e764dc20a	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "monday", "end_time": "16:30", "start_time": "15:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
ac4abf25-ae59-4696-a386-75b2b19021d1	رياضيات (الاثنين 06:00 م) - أ/ محمد عادل	رياضيات (الاثنين 06:00 م) - أ/ محمد عادل	35399c88-3eff-400c-a239-e15a916f4852	f4e734d7-0612-46bc-bfc0-1450fdc253f0	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f66c336a-5989-496c-a397-174170d14b08	رياضيات (الاثنين 06:00 م) - أ/ محمد بكير	رياضيات (الاثنين 06:00 م) - أ/ محمد بكير	fc37bbab-da95-4a63-ba15-58cc1ff148b4	f4e734d7-0612-46bc-bfc0-1450fdc253f0	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3046d5d7-465a-4757-9015-43430a54cbc6	Math (الثلاثاء 01:00 م) - ميس/ ياسمين	Math (الثلاثاء 01:00 م) - ميس/ ياسمين	5d7f6ee4-7311-4f1d-9780-0c8734becad2	13e61af9-7072-46de-9141-d85e764dc20a	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "tuesday", "end_time": "14:30", "start_time": "13:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
4c5dc2ab-9583-40af-977d-c0c292516e78	ICT (الثلاثاء 03:00 م) - ميس/ نهلة	ICT (الثلاثاء 03:00 م) - ميس/ نهلة	ff0318b1-ce3c-4cf1-a609-429c021ae578	b59175b2-1b28-4825-8179-8557160906dc	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "tuesday", "end_time": "16:30", "start_time": "15:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
43308fad-de32-4d9c-8dfd-d8d9908d2181	لغة إنجليزية (الثلاثاء 04:00 م) - أ/ صبحي محمد	لغة إنجليزية (الثلاثاء 04:00 م) - أ/ صبحي محمد	214bd4ee-8381-4178-a7ac-311ffe35c78c	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "tuesday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
29126be2-41b3-4289-a8c9-2435f590b3b1	لغة إنجليزية (الثلاثاء 04:00 م) - أ/ محمد علاء	لغة إنجليزية (الثلاثاء 04:00 م) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "tuesday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f711a5af-7576-4a95-976a-2921d074f051	علوم (الثلاثاء 05:00 م) - أ/ أحمد عبد الله	علوم (الثلاثاء 05:00 م) - أ/ أحمد عبد الله	d3a3ca6d-e0fe-4985-8350-63aafb66f548	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
c9252015-fdbd-4e20-840a-d1d8f3734e4d	علوم (الثلاثاء 05:00 م) - ميس/ آية آدم	علوم (الثلاثاء 05:00 م) - ميس/ آية آدم	f3e74f5e-d4e9-4b29-a882-adef9a120cf2	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	8656d593-ece1-4946-af99-20073616771d	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
395a1234-76c0-4cbc-b08b-d84d84d61b01	لغة عربية (الأربعاء 02:30 ظ) - أ/ محمد صلاح	لغة عربية (الأربعاء 02:30 ظ) - أ/ محمد صلاح	6924d0f7-ff06-40e8-8472-d3ea57382637	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "wednesday", "end_time": "16:00", "start_time": "14:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
d9df7f12-935f-4248-8feb-4a33c0009943	دراسات اجتماعية (الأربعاء 03:30 م) - أ/ محمد سعيد	دراسات اجتماعية (الأربعاء 03:30 م) - أ/ محمد سعيد	35a30e35-35f7-4527-a6e1-3cd61481cda4	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "wednesday", "end_time": "17:00", "start_time": "15:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0162bb4b-ff75-41ae-9847-6850ce36ccc6	لغة عربية (الأربعاء 04:30 م) - أ/ محمد صلاح	لغة عربية (الأربعاء 04:30 م) - أ/ محمد صلاح	6924d0f7-ff06-40e8-8472-d3ea57382637	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "wednesday", "end_time": "18:00", "start_time": "16:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
c1845b2d-457f-4623-a154-d705ea692c6c	دراسات اجتماعية (الأربعاء 05:30 م) - أ/ محمود طارق	دراسات اجتماعية (الأربعاء 05:30 م) - أ/ محمود طارق	78443196-52fd-486e-87e7-fdffa6d41a41	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "wednesday", "end_time": "19:00", "start_time": "17:30"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
c3fba14e-f174-4acb-887b-b465bf698319	Science (الخميس 03:00 - 05:00 م) - مستر/ محمد العربي	Science (الخميس 03:00 - 05:00 م) - مستر/ محمد العربي	2fe7fc93-7ac6-4e6b-83b6-f8969a942745	cae85df3-e30e-4e9e-89e4-4645bf9918c4	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "thursday", "end_time": "17:00", "start_time": "03:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
4c476196-f867-4db2-a8e7-355582e15247	شرعي (الخميس 04:00 م) - أ/ إسلام جمال	شرعي (الخميس 04:00 م) - أ/ إسلام جمال	a025c0b6-98ce-4c6e-9438-eee349934233	3954d6f5-1bff-49b1-bb06-60c852e8910b	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "thursday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
52d8e371-c05c-4f9a-b5a0-f2067b5174d4	رياضيات (الخميس 06:00 م) - أ/ محمد عادل	رياضيات (الخميس 06:00 م) - أ/ محمد عادل	35399c88-3eff-400c-a239-e15a916f4852	f4e734d7-0612-46bc-bfc0-1450fdc253f0	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
ebe3b026-c19e-4a5c-b568-ecb12f0d1326	رياضيات (الخميس 06:00 م) - أ/ محمد بكير	رياضيات (الخميس 06:00 م) - أ/ محمد بكير	fc37bbab-da95-4a63-ba15-58cc1ff148b4	f4e734d7-0612-46bc-bfc0-1450fdc253f0	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
5387161a-345f-4781-b996-107db8eced6e	لغة إنجليزية (الجمعة 12:00 ظ) - أ/ محمد علاء	لغة إنجليزية (الجمعة 12:00 ظ) - أ/ محمد علاء	4343e658-80c4-49e8-8b00-550d6e7c2aff	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "friday", "end_time": "13:30", "start_time": "12:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
996e9d63-1b7a-4d0d-9879-24b0db5cdafd	فلسفة (السبت 07:00 م) - أ/ محمد صلاح	فلسفة (السبت 07:00 م) - أ/ محمد صلاح	6924d0f7-ff06-40e8-8472-d3ea57382637	9f9b6f17-3ad9-459f-b640-0d3d2f988ea8	afb79da5-7db2-4b1b-b5d5-78694d100743	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
579527a6-b7c9-49e9-8556-6b5c4824282c	فلسفة (السبت 07:00 م) - أ/ علي فؤاد	فلسفة (السبت 07:00 م) - أ/ علي فؤاد	7760a9ff-5cb9-451b-b9f3-dc060a42cce6	9f9b6f17-3ad9-459f-b640-0d3d2f988ea8	afb79da5-7db2-4b1b-b5d5-78694d100743	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
c25c3d73-23f9-41df-aeef-330f399318f2	لغة إنجليزية (الأحد 05:00 م) - أ/ الشاذلي	لغة إنجليزية (الأحد 05:00 م) - أ/ الشاذلي	44e5fdfa-04bc-4ed6-8240-f29fd89e8389	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "sunday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
e21aad01-c721-42f1-9dfc-233fcd41a8d7	رياضيات (الأحد 07:00 م) - أ/ محمد يوسف	رياضيات (الأحد 07:00 م) - أ/ محمد يوسف	76fc2a54-8475-494b-8f33-16de0e47cba6	f4e734d7-0612-46bc-bfc0-1450fdc253f0	afb79da5-7db2-4b1b-b5d5-78694d100743	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "sunday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
9ac7ca2b-68a7-4c17-bdf9-f548f8f0b5de	رياضيات (الاثنين 05:00 م) - أ/ منعم درويش	رياضيات (الاثنين 05:00 م) - أ/ منعم درويش	d9b91ffc-7375-4b62-8219-493e2462f8d2	f4e734d7-0612-46bc-bfc0-1450fdc253f0	afb79da5-7db2-4b1b-b5d5-78694d100743	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "monday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3419633f-3643-4571-82fb-a3cb7a93ee11	برمجة (الاثنين 05:00 م) - أ/ محمد عاشور	برمجة (الاثنين 05:00 م) - أ/ محمد عاشور	fc1315f6-7dc3-406e-8954-d3e605c83661	4815ecec-0d9f-466f-a6c6-b88364951f89	afb79da5-7db2-4b1b-b5d5-78694d100743	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "monday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
98f53257-b216-4351-805d-4ea6dd989766	لغة عربية (الثلاثاء 05:00 م) - أ/ الغزالي	لغة عربية (الثلاثاء 05:00 م) - أ/ الغزالي	c2b9d2d9-8536-4d23-87c8-351c72c10118	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	afb79da5-7db2-4b1b-b5d5-78694d100743	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
439cdb1a-c511-4da0-914a-368f176f5c10	لغة إنجليزية (الثلاثاء 07:00 م) - أ/ أدهم أبو الصفا	لغة إنجليزية (الثلاثاء 07:00 م) - أ/ أدهم أبو الصفا	c9ce5957-98c8-48c7-9586-6e5e8d008c0d	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
fdbb338a-e74b-4907-8b39-f3beaf8cb602	لغة إنجليزية (الثلاثاء 07:00 م) - مستر/ صبحي محمد	لغة إنجليزية (الثلاثاء 07:00 م) - مستر/ صبحي محمد	a22ec622-ed16-4f52-b764-071a36543981	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
5debaf66-ad5f-409e-829f-424d88aa0bcb	Integrated Science (الأربعاء 05:00 م) - مستر/ محمد العربي	Integrated Science (الأربعاء 05:00 م) - مستر/ محمد العربي	2fe7fc93-7ac6-4e6b-83b6-f8969a942745	a30f912c-914f-4a2a-87cb-c998dd144a0c	afb79da5-7db2-4b1b-b5d5-78694d100743	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "wednesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
84681ac5-f82f-4c2d-92e1-0ab2ac7e63a9	علوم متكاملة (الأربعاء 05:00 م) - ميس/ آية آدم	علوم متكاملة (الأربعاء 05:00 م) - ميس/ آية آدم	f3e74f5e-d4e9-4b29-a882-adef9a120cf2	a30f912c-914f-4a2a-87cb-c998dd144a0c	afb79da5-7db2-4b1b-b5d5-78694d100743	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "wednesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f22d2be1-2a32-49ca-9858-5d38300b39aa	لغة إيطالية 🇮🇹 (الأربعاء 07:00 م) - أ/ محمد إسماعيل	لغة إيطالية 🇮🇹 (الأربعاء 07:00 م) - أ/ محمد إسماعيل	61778034-b516-440f-bf93-116a168fd716	3d11fe4b-c72d-47bc-9bc8-6cab0c484836	afb79da5-7db2-4b1b-b5d5-78694d100743	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "wednesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
ff99fd7a-0313-4e1f-aab8-d073c6d05ade	برمجة (الخميس 05:00 م) - أ/ محمد عاشور	برمجة (الخميس 05:00 م) - أ/ محمد عاشور	fc1315f6-7dc3-406e-8954-d3e605c83661	4815ecec-0d9f-466f-a6c6-b88364951f89	afb79da5-7db2-4b1b-b5d5-78694d100743	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "thursday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
e2a924c2-485e-4fdf-8265-490b5feef955	Math (الخميس 05:00 م) - أ/ عمر جمال	Math (الخميس 05:00 م) - أ/ عمر جمال	ecd93074-7a71-4f31-a502-4608ff7104e1	13e61af9-7072-46de-9141-d85e764dc20a	afb79da5-7db2-4b1b-b5d5-78694d100743	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "thursday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
9ebafcbb-2b3e-4828-b130-1d25792d0259	تاريخ (الخميس 07:00 م) - أ/ أيمن سليمان	تاريخ (الخميس 07:00 م) - أ/ أيمن سليمان	520cabff-e639-4f53-b9ed-9f5d71e1653d	53e7da3c-8cdc-4c19-9747-72c6cd90001d	afb79da5-7db2-4b1b-b5d5-78694d100743	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "thursday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	active	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f8ce81a4-1fea-41aa-9e85-1bc7af5b6da8	لغة عربية (الثلاثاء 05:00 م) - أ/ مروان & ميس/ دنيا	لغة عربية (الثلاثاء 05:00 م) - أ/ مروان & ميس/ دنيا	3bfa89ba-9d01-4471-94a2-a2f4fdf92a02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	9833561e-f6fb-43b9-b9d4-152b41863bc5	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
ab7d1772-3b88-49d7-a442-f8566d5e3f33	رياضيات (الأربعاء 04:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	رياضيات (الأربعاء 04:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	834c2bd4-8b69-4b87-988f-b6e832d18a2a	f4e734d7-0612-46bc-bfc0-1450fdc253f0	9833561e-f6fb-43b9-b9d4-152b41863bc5	8656d593-ece1-4946-af99-20073616771d	[{"day": "wednesday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f9d0fc6e-45fc-4d66-a1b3-6f0e46c3ad92	لغة عربية (السبت 06:00 م) - أ/ مروان & ميس/ دنيا	لغة عربية (السبت 06:00 م) - أ/ مروان & ميس/ دنيا	3bfa89ba-9d01-4471-94a2-a2f4fdf92a02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	9833561e-f6fb-43b9-b9d4-152b41863bc5	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "saturday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
e7862323-0e5e-44b3-8f3c-95fc3910afba	رياضيات (الأحد 04:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	رياضيات (الأحد 04:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	834c2bd4-8b69-4b87-988f-b6e832d18a2a	f4e734d7-0612-46bc-bfc0-1450fdc253f0	9833561e-f6fb-43b9-b9d4-152b41863bc5	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "sunday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
a8427ee3-928c-452f-bc66-2ddf01c28149	دراسات اجتماعية (الاثنين 05:00 م) - أ/ شيماء ، أ/ محمود رشاد	دراسات اجتماعية (الاثنين 05:00 م) - أ/ شيماء ، أ/ محمود رشاد	4108ea95-9336-432a-bcbd-40191870bdad	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "monday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f69acad9-f70b-4d4a-a9c6-0541d868e128	دراسات اجتماعية (الخميس 06:00 م) - ميس/ شيماء ، أ/ محمود رشاد	دراسات اجتماعية (الخميس 06:00 م) - ميس/ شيماء ، أ/ محمود رشاد	54ebf7b9-8b3f-4be8-a6f2-a15c03b7db4a	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
4baf7dcc-18a1-4559-98e4-e4c8b332224d	لغة عربية (السبت 05:00 م) - أ/ مروان & ميس/ دنيا	لغة عربية (السبت 05:00 م) - أ/ مروان & ميس/ دنيا	3bfa89ba-9d01-4471-94a2-a2f4fdf92a02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
05893036-9dd4-43c6-a49e-20ac7e666c2c	رياضيات (الأحد 05:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	رياضيات (الأحد 05:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	834c2bd4-8b69-4b87-988f-b6e832d18a2a	f4e734d7-0612-46bc-bfc0-1450fdc253f0	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "sunday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
83b30878-d9eb-4cae-a8a1-cc9a5a8a53ce	دراسات اجتماعية (الاثنين 07:00 م) - أ/ شيماء ، أ/ محمود رشاد	دراسات اجتماعية (الاثنين 07:00 م) - أ/ شيماء ، أ/ محمود رشاد	4108ea95-9336-432a-bcbd-40191870bdad	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "monday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
afa8df12-d928-425b-88bd-5c1fc1f4178a	لغة عربية (الثلاثاء 06:00 م) - أ/ مروان & ميس/ دنيا	لغة عربية (الثلاثاء 06:00 م) - أ/ مروان & ميس/ دنيا	3bfa89ba-9d01-4471-94a2-a2f4fdf92a02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	8656d593-ece1-4946-af99-20073616771d	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
596b07de-19a7-4f52-830e-f4e5998ba480	رياضيات (الأربعاء 05:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	رياضيات (الأربعاء 05:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	834c2bd4-8b69-4b87-988f-b6e832d18a2a	f4e734d7-0612-46bc-bfc0-1450fdc253f0	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "wednesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
49dd05a4-5fa7-4078-a056-c6a742833a8a	دراسات اجتماعية (الخميس 07:00 م) - ميس/ شيماء ، أ/ محمود رشاد	دراسات اجتماعية (الخميس 07:00 م) - ميس/ شيماء ، أ/ محمود رشاد	54ebf7b9-8b3f-4be8-a6f2-a15c03b7db4a	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "thursday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
24c318e1-3fba-4495-87d2-09bdcfaf7c43	لغة عربية (السبت 07:00 م) - أ/ مروان & ميس/ دنيا	لغة عربية (السبت 07:00 م) - أ/ مروان & ميس/ دنيا	3bfa89ba-9d01-4471-94a2-a2f4fdf92a02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	59141280-1c86-41bc-a284-6d05d555f457	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
04ea2468-ec7c-4ae0-ad0e-080f11a7089c	رياضيات (الأحد 06:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	رياضيات (الأحد 06:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	834c2bd4-8b69-4b87-988f-b6e832d18a2a	f4e734d7-0612-46bc-bfc0-1450fdc253f0	59141280-1c86-41bc-a284-6d05d555f457	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "sunday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
e04b3442-7399-41de-bb93-fb8a23f1d674	دراسات اجتماعية (الاثنين 06:00 م) - أ/ شيماء ، أ/ محمود رشاد	دراسات اجتماعية (الاثنين 06:00 م) - أ/ شيماء ، أ/ محمود رشاد	4108ea95-9336-432a-bcbd-40191870bdad	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
61ba3af5-7316-4c87-8184-3d00feeb23f4	لغة عربية (الثلاثاء 07:00 م) - أ/ مروان & ميس/ دنيا	لغة عربية (الثلاثاء 07:00 م) - أ/ مروان & ميس/ دنيا	3bfa89ba-9d01-4471-94a2-a2f4fdf92a02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	59141280-1c86-41bc-a284-6d05d555f457	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
0a9bbffd-b184-4fb2-b2f8-a7a4afae7a5a	رياضيات (الأربعاء 06:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	رياضيات (الأربعاء 06:00 م) - أ/ أحمد محمود ، أ/ أدهم هاني	834c2bd4-8b69-4b87-988f-b6e832d18a2a	f4e734d7-0612-46bc-bfc0-1450fdc253f0	59141280-1c86-41bc-a284-6d05d555f457	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "wednesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
07b60b18-1658-4bf6-85ff-db03bd7f298f	دراسات اجتماعية (الخميس 05:00 م) - ميس/ شيماء ، أ/ محمود رشاد	دراسات اجتماعية (الخميس 05:00 م) - ميس/ شيماء ، أ/ محمود رشاد	54ebf7b9-8b3f-4be8-a6f2-a15c03b7db4a	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "thursday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
92cb3a93-b081-4a86-b787-b28e2bd99e5b	لغة إنجليزية (السبت 06:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	لغة إنجليزية (السبت 06:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	3aa2fc39-0417-45c7-af5b-ba4c4f44ed29	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	fc5345ca-2803-4cd5-9f0b-ecf634770e5e	[{"day": "saturday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
280e52b4-065e-45ca-b986-f0ed6e292baf	Science (السبت 07:00 م) - مستر/ إسلام عبد الجليل ، مستر/ محمد العربي	Science (السبت 07:00 م) - مستر/ إسلام عبد الجليل ، مستر/ محمد العربي	b052f5f1-e588-4d0d-8266-910bf73b6183	cae85df3-e30e-4e9e-89e4-4645bf9918c4	eab6184a-f010-48ea-9eee-a75a44ee9f7e	3b6e8b34-dd14-461c-8297-26322e041c73	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3668d4ed-cc8e-49e8-913c-61fec4b5775a	علوم (السبت 07:00 م) - ميس/ آية آدم ، أ/ أحمد عثمان ، أ/ أحمد عبد الله	علوم (السبت 07:00 م) - ميس/ آية آدم ، أ/ أحمد عثمان ، أ/ أحمد عبد الله	1f1a369f-51e4-4e00-b27d-4c2961bffb5f	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
e455b96e-3622-409c-a586-657003bafd41	رياضيات (الاثنين 07:00 م) - أ/ محمد بكير ، أ/ محمد عادل	رياضيات (الاثنين 07:00 م) - أ/ محمد بكير ، أ/ محمد عادل	96aeaf7f-0359-4028-ac1d-aa1e2b6b1177	f4e734d7-0612-46bc-bfc0-1450fdc253f0	eab6184a-f010-48ea-9eee-a75a44ee9f7e	c68f8479-4b34-4bcb-b76d-f5371779e3a4	[{"day": "monday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
53b404ab-e070-4617-b54b-6b0645189e5e	لغة إنجليزية (الثلاثاء 06:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	لغة إنجليزية (الثلاثاء 06:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	3aa2fc39-0417-45c7-af5b-ba4c4f44ed29	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
ccd0dd12-4b93-496a-b389-a5b25497edc9	علوم (الثلاثاء 07:00 م) - أ/ أحمد عبد الله ، أ/ أحمد عثمان ، ميس/ آية آدم	علوم (الثلاثاء 07:00 م) - أ/ أحمد عبد الله ، أ/ أحمد عثمان ، ميس/ آية آدم	4334fbf6-0951-49bb-8611-0bcb95ac718a	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
b9db4830-cfcd-46cc-a19e-08f6b21c2cc3	رياضيات (الخميس 07:00 م) - أ/ محمد عادل ، أ/ محمد بكير	رياضيات (الخميس 07:00 م) - أ/ محمد عادل ، أ/ محمد بكير	8b885eaf-49d8-4cba-b644-73ad76688b7d	f4e734d7-0612-46bc-bfc0-1450fdc253f0	eab6184a-f010-48ea-9eee-a75a44ee9f7e	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "thursday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
3298f8e9-fe18-42df-b4f8-137e0c0bf9cd	لغة إنجليزية (السبت 05:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	لغة إنجليزية (السبت 05:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	3aa2fc39-0417-45c7-af5b-ba4c4f44ed29	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	f3a54e12-80b1-40bd-9d59-d0805b90880b	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
d371f00a-33c4-4061-8c77-93def35894af	علوم (السبت 06:00 م) - ميس/ آية آدم ، أ/ أحمد عبد الله	علوم (السبت 06:00 م) - ميس/ آية آدم ، أ/ أحمد عبد الله	e42e23bf-f742-4727-b676-d11acfee67fb	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "saturday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
6f7496c8-41d2-4159-8b38-3533b211ec32	رياضيات (الاثنين 08:00 م) - أ/ محمد عادل ، أ/ محمد بكير	رياضيات (الاثنين 08:00 م) - أ/ محمد عادل ، أ/ محمد بكير	8b885eaf-49d8-4cba-b644-73ad76688b7d	f4e734d7-0612-46bc-bfc0-1450fdc253f0	79842e52-6787-4773-b13f-5d8abf4c5043	24958dc7-3dc2-4b85-8d92-239bf8765af7	[{"day": "monday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
bbc698b0-f884-496e-82ab-b19537f8a2d2	لغة إنجليزية (الثلاثاء 05:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	لغة إنجليزية (الثلاثاء 05:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	3aa2fc39-0417-45c7-af5b-ba4c4f44ed29	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
18beacbf-9ac6-4cfa-868d-fed715516ca4	علوم (الثلاثاء 06:00 م) - أ/ أحمد عبد الله ، ميس/ آية آدم	علوم (الثلاثاء 06:00 م) - أ/ أحمد عبد الله ، ميس/ آية آدم	720490db-edde-4242-8416-a70f7e0c2885	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "tuesday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
7a9517a2-f0ff-43db-8584-2dd09b003fe1	رياضيات (الخميس 08:00 م) - أ/ محمد عادل ، أ/ محمد بكير	رياضيات (الخميس 08:00 م) - أ/ محمد عادل ، أ/ محمد بكير	8b885eaf-49d8-4cba-b644-73ad76688b7d	f4e734d7-0612-46bc-bfc0-1450fdc253f0	79842e52-6787-4773-b13f-5d8abf4c5043	d07a2964-f011-44e9-b5e1-9e07722b5349	[{"day": "thursday", "end_time": "21:30", "start_time": "20:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
010998dd-d0f6-4b75-a194-a47f7d95f527	لغة إنجليزية (السبت 04:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	لغة إنجليزية (السبت 04:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	3aa2fc39-0417-45c7-af5b-ba4c4f44ed29	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	33308a2d-9277-4059-8d65-8a6d5057448c	[{"day": "saturday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
860d7cc6-05d0-442a-bf65-113aa41ef4e8	علوم (السبت 05:00 م) - ميس/ آية آدم ، أ/ أحمد عبد الله	علوم (السبت 05:00 م) - ميس/ آية آدم ، أ/ أحمد عبد الله	e42e23bf-f742-4727-b676-d11acfee67fb	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	79e19f20-fabf-4170-8e9b-8e87e81bef89	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
6a4b343d-4627-4918-b160-da7ba68a5571	رياضيات (الاثنين 06:00 م) - أ/ محمد عادل ، أ/ محمد بكير	رياضيات (الاثنين 06:00 م) - أ/ محمد عادل ، أ/ محمد بكير	8b885eaf-49d8-4cba-b644-73ad76688b7d	f4e734d7-0612-46bc-bfc0-1450fdc253f0	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
cb09e1c5-7ea0-4e4e-a6b0-18e1de4aa346	لغة إنجليزية (الثلاثاء 04:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	لغة إنجليزية (الثلاثاء 04:00 م) - أ/ صبحي محمد ، أ/ محمد علاء	3aa2fc39-0417-45c7-af5b-ba4c4f44ed29	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	1cffaeb7-9631-4c64-bc55-492268b5c077	[{"day": "tuesday", "end_time": "17:30", "start_time": "16:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
c3ea133a-a242-4861-8896-2da063553d8d	علوم (الثلاثاء 05:00 م) - أ/ أحمد عبد الله ، ميس/ آية آدم	علوم (الثلاثاء 05:00 م) - أ/ أحمد عبد الله ، ميس/ آية آدم	720490db-edde-4242-8416-a70f7e0c2885	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
01fb98df-b3bd-4b4c-8f63-dcac7da93c49	رياضيات (الخميس 06:00 م) - أ/ محمد عادل ، أ/ محمد بكير	رياضيات (الخميس 06:00 م) - أ/ محمد عادل ، أ/ محمد بكير	8b885eaf-49d8-4cba-b644-73ad76688b7d	f4e734d7-0612-46bc-bfc0-1450fdc253f0	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	605b5a5e-2d1e-4dce-9c4a-cdb8299c0086	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
f96c93cf-0794-44b8-b6c3-cc50718f61cf	لغة إنجليزية (الثلاثاء 07:00 م) - أ/ أدهم أبو الصفا ، مستر/ صبحي محمد	لغة إنجليزية (الثلاثاء 07:00 م) - أ/ أدهم أبو الصفا ، مستر/ صبحي محمد	2c6051f7-d15b-4778-874a-c7ea7e97291a	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	46fb85a9-6521-4c90-9b5a-7c2dd2975b35	[{"day": "tuesday", "end_time": "20:30", "start_time": "19:00"}]	120.00	35.00	40	archived	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	0.00	100.00	75.00	25.00
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_items (id, name, category, barcode, subject_id, grade_id, cost_price, selling_price, current_stock, min_stock_alert, is_active, created_at, updated_at, teacher_id) FROM stdin;
3f93e183-c013-487c-be5e-82e2eb2abfd5	ملزمة الفيزياء - الباب الأول (الكهربية)	booklet	ITM-PHYS-01	\N	\N	25.00	45.00	50	10	t	2026-09-16 04:24:50.956372+03	2026-09-16 04:24:50.956372+03	\N
309f2735-12ba-4c6b-9d92-09f88a3f8656	كشكول سلك أطلس 100 ورقة	supply	ITM-NOTE-100	\N	\N	18.00	30.00	80	15	t	2026-09-16 04:24:50.956372+03	2026-09-16 04:24:50.956372+03	\N
c8aa248b-627c-4d3e-b9ac-588a7b7753fc	قلم جاف أزرق روترنج	supply	ITM-PEN-BLUE	\N	\N	4.00	8.00	60	10	t	2026-09-16 04:24:50.956372+03	2026-09-16 04:24:50.956372+03	\N
eca32ab1-5b66-46e4-b3b1-22a083e0b767	ملزمة الكيمياء - الباب الثاني (التحليل)	booklet	ITM-CHEM-02	\N	\N	20.00	40.00	34	10	t	2026-09-16 04:24:50.956372+03	2026-09-16 04:32:08.098525+03	\N
d41e54c3-9444-4a63-8538-322b1549a451	ملزمه  اختبار	booklet	ITM-891033	737b6229-6334-41c4-b878-8f3dbb0e9663	eab6184a-f010-48ea-9eee-a75a44ee9f7e	100.00	120.00	49	5	t	2026-09-16 04:42:02.917722+03	2026-09-16 04:42:15.3606+03	\N
0132e505-50f9-4b1e-bd9f-fdbb22ffa0c2	كارت حضور ذكي بديل (QR)	card	ITM-CARD-REP	\N	\N	5.00	20.00	99	20	t	2026-09-16 04:24:50.956372+03	2026-09-16 04:46:55.771048+03	\N
880325bb-7a06-4ea5-b7ae-11e764654d07	مذكرة المراجعة النهائية فيزياء 2026	booklet	BK-120660	af504fc9-7db3-4e00-9b78-5eb2a73f32c8	911c3cb2-c7f1-4a04-8ad7-82d62096a205	0.00	60.00	79	5	t	2026-09-16 14:09:04.448472+03	2026-09-16 14:09:04.484443+03	0f1a658d-9533-4ebb-a08d-9c26a84fd6e4
b031c04e-ba6f-490c-a9fc-816307a49ade	تانيه اعدادي اختبار	booklet	BK-499349	af504fc9-7db3-4e00-9b78-5eb2a73f32c8	79842e52-6787-4773-b13f-5d8abf4c5043	0.00	200.00	49	5	t	2026-09-18 15:04:36.705355+03	2026-09-18 15:05:08.028416+03	0f1a658d-9533-4ebb-a08d-9c26a84fd6e4
\.


--
-- Data for Name: package_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.package_groups (id, package_id, group_id, created_at) FROM stdin;
78c1878c-ded6-4f85-8138-df1250aaf374	cda6f670-70c7-4b7c-808f-b55474e35751	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2026-09-26 04:05:32.191124+03
7ec62cdb-a819-4549-b7e3-69aaba56c4b1	cda6f670-70c7-4b7c-808f-b55474e35751	003325da-d578-4e6a-be6e-1a90e877d9c5	2026-09-26 04:05:32.197302+03
7f970f8c-8cdf-4306-8a1b-df374cd2b303	cda6f670-70c7-4b7c-808f-b55474e35751	5f0cf646-02f4-4e01-aee3-bfea811272b5	2026-09-26 04:05:32.201802+03
e9dc9766-8997-4661-b66e-f295b4d17f73	cda6f670-70c7-4b7c-808f-b55474e35751	521ca9ea-fb0e-4750-8eda-992e40f01879	2026-09-26 04:06:21.205712+03
abbd3836-bab7-476c-809f-7ffabea9c214	cda6f670-70c7-4b7c-808f-b55474e35751	9af26238-d54e-4ad4-980e-03f578cb4b4c	2026-09-26 04:06:21.210736+03
2a66946b-e36d-45c2-a584-1986e93aee39	5f5ea76a-df23-4077-a009-87cb90a1d3b4	87e91624-b916-489e-899e-e819e3e29e0e	2026-09-26 05:01:02.658105+03
a3d18132-8c6d-4562-8aba-0fe31990e53a	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	87e91624-b916-489e-899e-e819e3e29e0e	2026-09-26 05:01:02.658105+03
ecb5a0f9-c16d-4615-a075-cbc87e9f6da4	5f5ea76a-df23-4077-a009-87cb90a1d3b4	edf6b3c6-4b6f-4a86-bf47-c6428efe5694	2026-09-26 05:01:02.658105+03
c75bb8fc-710d-41ff-8730-2b5410f077d2	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	d532b6ab-b2c9-410b-be40-fadad339d6aa	2026-09-26 05:01:02.658105+03
20b4a93a-7d06-4b3e-905c-6d3e2607e0e6	5f5ea76a-df23-4077-a009-87cb90a1d3b4	009a3fa0-dcf9-488f-9094-0a634c6b8201	2026-09-26 05:01:02.658105+03
83f6b411-bbcc-4547-9cfb-ef8903948d13	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	21d8e2e6-4f6c-427e-96ee-a1e118f29fc7	2026-09-26 05:01:02.658105+03
034a4d59-022b-4a93-b958-4b86e82af252	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	bc88355f-9572-4fb6-9780-d5a8f8786fdc	2026-09-26 05:01:02.658105+03
3e9143d8-abfe-45e9-b258-72e4ebe6b1fd	5f5ea76a-df23-4077-a009-87cb90a1d3b4	6865203d-98be-4db9-b7e6-3225a0c19f66	2026-09-26 05:01:02.658105+03
a5946a97-7a23-4114-8e4d-6ff1aff32935	5f5ea76a-df23-4077-a009-87cb90a1d3b4	d4ba4f48-ded8-4894-a16b-d1df48ba296a	2026-09-26 05:01:02.658105+03
b1d6882e-dee6-4bd5-bf51-f5cfa95f91da	5f5ea76a-df23-4077-a009-87cb90a1d3b4	63bd7c77-81f7-4a52-a5ce-e7aa6f03af96	2026-09-26 05:01:02.658105+03
0b5a8774-c049-4765-b360-fc542c56d156	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	63bd7c77-81f7-4a52-a5ce-e7aa6f03af96	2026-09-26 05:01:02.658105+03
c8d090fa-16b7-4b42-a042-961c102fcca5	16c2439b-b03c-4bb6-958a-5a078f528672	2af5da91-a3f0-4e8f-b589-388fbc38293b	2026-09-26 05:01:02.658105+03
d296dab2-5701-4789-9381-bb2197118c5c	c21045fb-6477-4885-b9db-8987a117663e	2af5da91-a3f0-4e8f-b589-388fbc38293b	2026-09-26 05:01:02.658105+03
2af41bb1-53e9-4b05-9275-b48bc1b18358	16c2439b-b03c-4bb6-958a-5a078f528672	10e09aa3-fdd1-4667-8b50-29413b9232e9	2026-09-26 05:01:02.658105+03
17efbced-4ff7-411f-b78c-fd12b81aa622	c21045fb-6477-4885-b9db-8987a117663e	7ce9704a-f8c1-497a-946c-8c2100851180	2026-09-26 05:01:02.658105+03
de250b82-7102-4412-be13-57357c192d77	c21045fb-6477-4885-b9db-8987a117663e	66d79575-b5fa-4e79-bceb-412141bf477b	2026-09-26 05:01:02.658105+03
eacbef77-2206-4483-8ced-54ab879e2b42	16c2439b-b03c-4bb6-958a-5a078f528672	8f947afd-8620-47b3-9651-25a50db42f1b	2026-09-26 05:01:02.658105+03
c7c87f2c-d858-4059-bfa2-c6c0a1658344	c21045fb-6477-4885-b9db-8987a117663e	5c640bc0-6e30-47e4-abfe-b937da63e924	2026-09-26 05:01:02.658105+03
35c72852-7f2a-44ec-aa5a-1e9176838bd2	16c2439b-b03c-4bb6-958a-5a078f528672	b1f065dc-bbe2-49f6-8b87-2582577173c1	2026-09-26 05:01:02.658105+03
2387aa30-9828-47eb-ae8b-710f5cf8d294	c21045fb-6477-4885-b9db-8987a117663e	fe1d0aed-91b2-4375-953e-15579396b19c	2026-09-26 05:01:02.658105+03
b63d158c-17f4-4380-8dba-0fc89ccd8544	16c2439b-b03c-4bb6-958a-5a078f528672	0c8a4f00-482e-4160-8c9a-d06079c5df59	2026-09-26 05:01:02.658105+03
aecb365a-dc39-4093-a438-f745ae56fc7e	16c2439b-b03c-4bb6-958a-5a078f528672	0bdaa206-3fa2-484a-a128-12ca9a410b06	2026-09-26 05:01:02.658105+03
ec266035-2eaf-4ba2-98ba-fe014e34c829	16c2439b-b03c-4bb6-958a-5a078f528672	6076a89b-0161-4499-9273-8a4ae1fbd68f	2026-09-26 05:01:02.658105+03
b2f63096-ba76-47da-8a16-b6d2df42a056	c21045fb-6477-4885-b9db-8987a117663e	6076a89b-0161-4499-9273-8a4ae1fbd68f	2026-09-26 05:01:02.658105+03
ace7833c-8270-4313-985a-df6c46d1e597	714a2b7b-761a-4908-8642-cfa8bddf98a7	ef5de7c3-440b-4253-8ec0-68607f95c0a7	2026-09-26 05:01:02.658105+03
0c5cea5d-282c-4b60-852c-9d54874e2526	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	ef5de7c3-440b-4253-8ec0-68607f95c0a7	2026-09-26 05:01:02.658105+03
659acabf-bff4-4cd1-b195-0f8ad9defbd6	714a2b7b-761a-4908-8642-cfa8bddf98a7	0fc492bb-50ac-4186-8a65-721452db0a77	2026-09-26 05:01:02.658105+03
b56d98fe-978e-4ffd-b4dd-1435d938cbea	714a2b7b-761a-4908-8642-cfa8bddf98a7	b23118c5-0170-47c6-be6c-e3332e2a1d31	2026-09-26 05:01:02.658105+03
4d7157eb-68e9-4210-82e6-193e9fe39ae4	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	d4dbeaac-0389-4ea7-b0e0-0d9c28f5356c	2026-09-26 05:01:02.658105+03
9d8b0e80-fa24-4822-94cb-14286eea30d2	714a2b7b-761a-4908-8642-cfa8bddf98a7	1cb1e620-6b8f-48e8-9c22-3b122cb97d1e	2026-09-26 05:01:02.658105+03
a61aae0e-09cf-4503-97c6-44c98ef3b730	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	3ceb4d9b-3c24-46b5-b36e-885b4f7cb799	2026-09-26 05:01:02.658105+03
ca322ac3-8286-44d3-a48f-4efc5f166b2e	714a2b7b-761a-4908-8642-cfa8bddf98a7	bfa78fbe-a3fe-4683-8a50-c7f8bc9357ad	2026-09-26 05:01:02.658105+03
a0be17d2-b361-47ce-817b-cc6807f3b731	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	82aa8fa5-508e-4031-ae26-1a388df68d7e	2026-09-26 05:01:02.658105+03
921300ac-32e6-45a5-a8eb-989f2b480fd9	714a2b7b-761a-4908-8642-cfa8bddf98a7	7a9e4c43-7507-4a42-b2da-f68cda60a5c5	2026-09-26 05:01:02.658105+03
3e8c2c4d-97b9-485c-aee0-67ed6eab8998	714a2b7b-761a-4908-8642-cfa8bddf98a7	ad081249-022c-470a-9547-f9d7125b79e7	2026-09-26 05:01:02.658105+03
d531c99f-3c35-4f53-aff1-489ed72885a3	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	ad081249-022c-470a-9547-f9d7125b79e7	2026-09-26 05:01:02.658105+03
e864dd4a-7fa4-43a0-8653-9ff56f28f7b9	14bac981-e410-43c7-9bb6-0b873749cc20	5d0723b8-fd1d-41de-9156-35df21e6884a	2026-09-26 05:01:02.658105+03
4ccfe223-e487-429b-9585-9c2a70bf875c	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	5d0723b8-fd1d-41de-9156-35df21e6884a	2026-09-26 05:01:02.658105+03
e0934d82-8d80-468a-9cbc-73ec35aeed87	14bac981-e410-43c7-9bb6-0b873749cc20	4d4ce700-a7ea-4dd2-ac99-3a14f37b26cf	2026-09-26 05:01:02.658105+03
cbe21529-51ee-45fe-ac42-23e09a9ac9d0	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	4d4ce700-a7ea-4dd2-ac99-3a14f37b26cf	2026-09-26 05:01:02.658105+03
8dbb8069-d03d-498d-b643-26976d4660c3	14bac981-e410-43c7-9bb6-0b873749cc20	19714147-ca3f-40c5-9cce-a317d114b218	2026-09-26 05:01:02.658105+03
ae15d630-e767-4ef2-9ecb-28537d83f4ae	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	19714147-ca3f-40c5-9cce-a317d114b218	2026-09-26 05:01:02.658105+03
da33ce77-69fb-4307-a4e8-aef651f1c847	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	955a2401-8360-438e-b51a-450b5543debd	2026-09-26 05:01:02.658105+03
edd5da28-3a45-4c41-94c7-2e8753a070bd	14bac981-e410-43c7-9bb6-0b873749cc20	4000b15d-ba00-4abf-a90c-3312448f66f6	2026-09-26 05:01:02.658105+03
ce42e289-6e7c-4961-87ee-1971d0ab998d	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	4000b15d-ba00-4abf-a90c-3312448f66f6	2026-09-26 05:01:02.658105+03
d7ae5287-ed0c-4f52-800b-68f0d644c608	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	f9280d52-78c8-4b5e-a38f-2bd6816d2ebd	2026-09-26 05:01:02.658105+03
7aff9e75-14f0-4d90-9442-f175483768cf	14bac981-e410-43c7-9bb6-0b873749cc20	34a7175a-4ffc-457c-b6fb-6e02c8d95e35	2026-09-26 05:01:02.658105+03
74fa144e-b46d-4b72-b05d-25841e15e534	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	34a7175a-4ffc-457c-b6fb-6e02c8d95e35	2026-09-26 05:01:02.658105+03
aaa8cbb8-a203-4765-87e0-9d83896c130a	14bac981-e410-43c7-9bb6-0b873749cc20	65bce91c-74d9-443e-a204-968ae58e0774	2026-09-26 05:01:02.658105+03
a1037f94-89fa-4433-a1bc-bee5f907b774	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	65bce91c-74d9-443e-a204-968ae58e0774	2026-09-26 05:01:02.658105+03
bbb1ff96-fa66-42d3-9e97-7a9f7e0b23b7	14bac981-e410-43c7-9bb6-0b873749cc20	d0888ed4-6f7b-47a9-abc8-2df11a36cc3d	2026-09-26 05:01:02.658105+03
82df3d36-065b-44ea-b7b5-436f1dcbed6f	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	d0888ed4-6f7b-47a9-abc8-2df11a36cc3d	2026-09-26 05:01:02.658105+03
3a1f61c4-2372-4f7d-b468-5c8e62074e86	14bac981-e410-43c7-9bb6-0b873749cc20	94a8da3c-8d72-41b7-ada5-881bd94aef59	2026-09-26 05:01:02.658105+03
8fcc7472-bcc8-4096-9cd5-ecb6ee66d5c6	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	94a8da3c-8d72-41b7-ada5-881bd94aef59	2026-09-26 05:01:02.658105+03
19dea5fb-9e4b-4ba4-8138-fc2d2729bf83	14bac981-e410-43c7-9bb6-0b873749cc20	8311e86f-7517-4003-be9a-49f69114ab35	2026-09-26 05:01:02.658105+03
f7b421cf-0ace-4b04-90d7-c213415b9ac1	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	8311e86f-7517-4003-be9a-49f69114ab35	2026-09-26 05:01:02.658105+03
59167fd9-b17a-467f-b813-ccadb9af82af	14bac981-e410-43c7-9bb6-0b873749cc20	d6a9d789-79ed-4815-915b-fbd0d566e00a	2026-09-26 05:01:02.658105+03
e15524c9-4166-4c3b-ac14-7d9c7fa92ed8	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	d6a9d789-79ed-4815-915b-fbd0d566e00a	2026-09-26 05:01:02.658105+03
3dc847d6-6cc2-4b30-ad64-12262cdfd615	14bac981-e410-43c7-9bb6-0b873749cc20	70f14094-17f8-4078-aea0-4a8cdbb48d43	2026-09-26 05:01:02.658105+03
069482ea-f856-45fd-97f4-38aa67cf7d67	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	70f14094-17f8-4078-aea0-4a8cdbb48d43	2026-09-26 05:01:02.658105+03
cbfa95e1-6107-458d-ba6c-7a82fd98b983	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	488bbd5c-a453-422c-99ed-4c389a344561	2026-09-26 05:01:02.658105+03
9a292386-3b26-47e9-bd1d-3b43aeac02fb	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	e8dd8044-c7c1-4346-899c-ac01adba7bf6	2026-09-26 05:01:02.658105+03
7eb2f944-9d5e-41d7-a5e9-464b970f01de	7094c844-980b-4399-8b18-306d8bbabac8	b9559fd6-2023-46c8-8a65-27303fd0fa96	2026-09-26 05:01:02.658105+03
5fe7efc0-69f3-4e8d-b6dc-c1e51c6829b2	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	971df9ac-ce38-484c-9983-6a092f40bffb	2026-09-26 05:01:02.658105+03
f9959c8c-8f55-4c92-b3ff-40fb20a6f96d	7094c844-980b-4399-8b18-306d8bbabac8	971df9ac-ce38-484c-9983-6a092f40bffb	2026-09-26 05:01:02.658105+03
ad164a86-1936-4bbb-b6ca-540cd5b47c49	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	50ad3444-86e8-49a8-aed5-c926f76f1d20	2026-09-26 05:01:02.658105+03
ec076daa-c044-493f-8221-08ce8fa42a9c	7094c844-980b-4399-8b18-306d8bbabac8	50ad3444-86e8-49a8-aed5-c926f76f1d20	2026-09-26 05:01:02.658105+03
21585e94-7e50-49f7-9f81-f40d34d44021	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	51661fa7-2379-4600-b018-e832b28849ce	2026-09-26 05:01:02.658105+03
7dee1f71-0c98-4f3c-8479-dd08f983d79f	7094c844-980b-4399-8b18-306d8bbabac8	51661fa7-2379-4600-b018-e832b28849ce	2026-09-26 05:01:02.658105+03
667f21a7-1d01-4d94-b9ad-de48c7809b06	7094c844-980b-4399-8b18-306d8bbabac8	a9905a79-6e05-4cef-bb09-9b59c3d19c3b	2026-09-26 05:01:02.658105+03
8c252c06-b277-4b1c-81d1-dcfac56f2d83	7094c844-980b-4399-8b18-306d8bbabac8	099f1210-c1ac-470e-ad42-0a4d2544d26f	2026-09-26 05:01:02.658105+03
5d8ed468-3260-44e2-85c5-f85826bc7222	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	9255670b-e110-457f-9ef2-987d11e57648	2026-09-26 05:01:02.658105+03
1143545e-2f99-4ac5-89a1-ad2e8d2fd6c9	7094c844-980b-4399-8b18-306d8bbabac8	9255670b-e110-457f-9ef2-987d11e57648	2026-09-26 05:01:02.658105+03
7ff3daed-cdd1-46b7-8284-66d71b2da18d	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	a77c8537-af7f-4adf-90cf-dd7f1d445e6f	2026-09-26 05:01:02.658105+03
5eb540be-3f52-4ed2-881d-66edc578647f	7094c844-980b-4399-8b18-306d8bbabac8	a77c8537-af7f-4adf-90cf-dd7f1d445e6f	2026-09-26 05:01:02.658105+03
36dc4cef-a19a-417f-b820-b4912fd029cd	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	4c7edd66-3e09-4afd-923b-621519c744a5	2026-09-26 05:01:02.658105+03
3d3ebb14-6e77-436f-afd1-304f1e551fe1	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	49603cc0-e7c6-47d0-9874-a220f4b0a3b4	2026-09-26 05:01:02.658105+03
ac42552d-98ee-48da-b9a7-aaaec25d7e8c	7094c844-980b-4399-8b18-306d8bbabac8	49603cc0-e7c6-47d0-9874-a220f4b0a3b4	2026-09-26 05:01:02.658105+03
c2999440-12c0-4c38-a8ac-c289944b368a	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	19ad3f9c-1aa8-43d7-9441-f6f3b9386c55	2026-09-26 05:01:02.658105+03
970fc08c-bcda-42ee-8104-89fb44410138	7094c844-980b-4399-8b18-306d8bbabac8	19ad3f9c-1aa8-43d7-9441-f6f3b9386c55	2026-09-26 05:01:02.658105+03
f3f33ebb-a540-4edc-8f4a-092071ee9ed9	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	2d28da6c-71b2-4159-bec8-afbdee5f7b62	2026-09-26 05:01:02.658105+03
9869f8f6-af32-472a-958d-d6e4829de9a8	7094c844-980b-4399-8b18-306d8bbabac8	2d28da6c-71b2-4159-bec8-afbdee5f7b62	2026-09-26 05:01:02.658105+03
c89a48ee-21e8-4956-b2f8-b353849f103b	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	0515ab5a-b35e-4e41-8391-9ed407657725	2026-09-26 05:01:02.658105+03
ff2d84fe-05f8-429f-b19f-30bab811ee0d	7094c844-980b-4399-8b18-306d8bbabac8	0515ab5a-b35e-4e41-8391-9ed407657725	2026-09-26 05:01:02.658105+03
686e44e7-ed88-4c1d-aa90-59321f5abc86	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	8f227704-4f78-4c0c-9b57-1957c9c371e7	2026-09-26 05:01:02.658105+03
158e3150-4452-4c2d-b9d9-da4d58d04eba	7094c844-980b-4399-8b18-306d8bbabac8	8f227704-4f78-4c0c-9b57-1957c9c371e7	2026-09-26 05:01:02.658105+03
c3f74a20-537c-4f1f-b9f4-0d580dadb9ba	7094c844-980b-4399-8b18-306d8bbabac8	271adfb1-4eb0-43d7-9f8a-1f4119442270	2026-09-26 05:01:02.658105+03
07fdd69b-8162-48f1-a80a-b8a3b65817a5	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	228f02cb-79ea-40bb-a203-3f5688164e9f	2026-09-26 05:01:02.658105+03
1ad074bf-31ea-4d63-a025-857b35baf394	7094c844-980b-4399-8b18-306d8bbabac8	228f02cb-79ea-40bb-a203-3f5688164e9f	2026-09-26 05:01:02.658105+03
7f5e936a-f149-474c-8e09-df5106bb2bd9	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	3ffe1e70-ec2f-4c39-8908-87b9430a1433	2026-09-26 05:01:02.658105+03
9c1d8208-dbc3-4e4c-b80a-ff91f5696706	7094c844-980b-4399-8b18-306d8bbabac8	2d3a61d0-0aa0-45dd-889e-51a10aa2fff7	2026-09-26 05:01:02.658105+03
da5d25da-f745-467d-a5a1-67d87b2e05a0	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	5ff65f72-914d-416b-9033-1e2983c538fd	2026-09-26 05:01:02.658105+03
c6cef767-c2b7-4b67-a58c-0e361fb2fa35	28705c72-d15e-44c6-92f8-a347b86a5e65	5ff65f72-914d-416b-9033-1e2983c538fd	2026-09-26 05:01:02.658105+03
5cced789-33d1-403a-80dd-5e53ea96a00a	28705c72-d15e-44c6-92f8-a347b86a5e65	7f0c1d5a-cdca-4872-98d4-50be8707ad51	2026-09-26 05:01:02.658105+03
ab05bf34-b646-49a2-928c-f212cbc66238	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	a7497074-793f-4013-bd5d-dd60f4b7fabb	2026-09-26 05:01:02.658105+03
58f12dc2-bce4-4b16-bc05-a8e250589782	28705c72-d15e-44c6-92f8-a347b86a5e65	a7497074-793f-4013-bd5d-dd60f4b7fabb	2026-09-26 05:01:02.658105+03
6979797c-aae2-4bda-99f0-6340099b2631	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	eb57bcda-a9a4-42d9-9114-7ec1ec9c906f	2026-09-26 05:01:02.658105+03
bbd2bc58-002f-43cb-a321-682f7185502d	28705c72-d15e-44c6-92f8-a347b86a5e65	eb57bcda-a9a4-42d9-9114-7ec1ec9c906f	2026-09-26 05:01:02.658105+03
72c8ecc0-4c3d-45a5-ab71-53f974471983	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	60bd5f17-f900-47ee-b932-546c36bddef7	2026-09-26 05:01:02.658105+03
30ce486b-82bb-423b-9f54-c62e0336301a	28705c72-d15e-44c6-92f8-a347b86a5e65	60bd5f17-f900-47ee-b932-546c36bddef7	2026-09-26 05:01:02.658105+03
6921edd1-90dc-4a42-a836-186ec7ca6a0a	28705c72-d15e-44c6-92f8-a347b86a5e65	c6a67d21-60d9-4d8f-a202-0b0287fe2063	2026-09-26 05:01:02.658105+03
70ce21b6-30dd-4db2-8892-dee400509067	28705c72-d15e-44c6-92f8-a347b86a5e65	3046d5d7-465a-4757-9015-43430a54cbc6	2026-09-26 05:01:02.658105+03
ef58eb85-d4db-4592-b5c4-1cc76b94ded4	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	4c5dc2ab-9583-40af-977d-c0c292516e78	2026-09-26 05:01:02.658105+03
7f759a96-98db-4b13-b9ac-e41d53db60f9	28705c72-d15e-44c6-92f8-a347b86a5e65	4c5dc2ab-9583-40af-977d-c0c292516e78	2026-09-26 05:01:02.658105+03
76b6f6e6-9159-47e9-8269-69ead9124407	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	395a1234-76c0-4cbc-b08b-d84d84d61b01	2026-09-26 05:01:02.658105+03
bc7fe83c-a7c1-4195-b25c-fbcacf28bf1f	28705c72-d15e-44c6-92f8-a347b86a5e65	395a1234-76c0-4cbc-b08b-d84d84d61b01	2026-09-26 05:01:02.658105+03
141652da-f4c5-472b-9bc5-000d89484daa	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	d9df7f12-935f-4248-8feb-4a33c0009943	2026-09-26 05:01:02.658105+03
b1ed1042-948d-4654-850f-53027806001c	28705c72-d15e-44c6-92f8-a347b86a5e65	d9df7f12-935f-4248-8feb-4a33c0009943	2026-09-26 05:01:02.658105+03
2c0c0663-f3f0-45a4-b8a4-ecf9281ac41c	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	0162bb4b-ff75-41ae-9847-6850ce36ccc6	2026-09-26 05:01:02.658105+03
4c77aa4a-5ec4-46ad-b37b-4bea0ccd2610	28705c72-d15e-44c6-92f8-a347b86a5e65	0162bb4b-ff75-41ae-9847-6850ce36ccc6	2026-09-26 05:01:02.658105+03
266725c4-0647-4d71-b9d2-a63da7e1654b	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	c1845b2d-457f-4623-a154-d705ea692c6c	2026-09-26 05:01:02.658105+03
84cbf5ef-a06f-4dbb-8190-39b2dee0949e	28705c72-d15e-44c6-92f8-a347b86a5e65	c1845b2d-457f-4623-a154-d705ea692c6c	2026-09-26 05:01:02.658105+03
9aae6c57-6d51-4553-ba65-d5b07d4ec8cd	28705c72-d15e-44c6-92f8-a347b86a5e65	c3fba14e-f174-4acb-887b-b465bf698319	2026-09-26 05:01:02.658105+03
0b879927-1123-4220-89b1-931200986959	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	4c476196-f867-4db2-a8e7-355582e15247	2026-09-26 05:01:02.658105+03
8154f05f-db76-457d-ac80-faeb483004c3	28705c72-d15e-44c6-92f8-a347b86a5e65	4c476196-f867-4db2-a8e7-355582e15247	2026-09-26 05:01:02.658105+03
a53f0cf0-772f-453e-ba2d-ff9ea21657da	28705c72-d15e-44c6-92f8-a347b86a5e65	7c7d2469-d00f-49f7-89b0-95311a39e25d	2026-09-26 05:01:02.658105+03
ab12481b-833c-472f-8cad-7f9ece9620eb	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	81f6ecfc-bb49-4a9c-a1f3-645835a4b407	2026-09-26 05:01:02.658105+03
342812e3-01b1-4577-8ac1-a1f21c2f6f0f	03f04240-4980-43dc-992d-0811f17edf25	81f6ecfc-bb49-4a9c-a1f3-645835a4b407	2026-09-26 05:01:02.658105+03
092b25a5-ab6f-4e40-ae88-11853f23773b	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	c25c3d73-23f9-41df-aeef-330f399318f2	2026-09-26 05:01:02.658105+03
a65ddf6c-c556-4089-a33d-18fb39a1c6e6	03f04240-4980-43dc-992d-0811f17edf25	c25c3d73-23f9-41df-aeef-330f399318f2	2026-09-26 05:01:02.658105+03
9a38b8ad-3754-411c-b382-95e242ee0167	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	e21aad01-c721-42f1-9dfc-233fcd41a8d7	2026-09-26 05:01:02.658105+03
bdc87b8b-fb3b-47a0-833d-ec4f7e749087	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	9ac7ca2b-68a7-4c17-bdf9-f548f8f0b5de	2026-09-26 05:01:02.658105+03
165ac1bb-9435-439a-a1bf-17e591850a51	03f04240-4980-43dc-992d-0811f17edf25	3419633f-3643-4571-82fb-a3cb7a93ee11	2026-09-26 05:01:02.658105+03
47eb1d76-b83f-4c3c-a3aa-51679f5df55d	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	98f53257-b216-4351-805d-4ea6dd989766	2026-09-26 05:01:02.658105+03
0a493f6b-deba-4195-94c0-ffe566d82f80	03f04240-4980-43dc-992d-0811f17edf25	98f53257-b216-4351-805d-4ea6dd989766	2026-09-26 05:01:02.658105+03
802874d8-5f06-44cc-b585-76829f0e28eb	03f04240-4980-43dc-992d-0811f17edf25	5debaf66-ad5f-409e-829f-424d88aa0bcb	2026-09-26 05:01:02.658105+03
61791be1-1452-44ce-a9a8-6a830d8a10e9	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	84681ac5-f82f-4c2d-92e1-0ab2ac7e63a9	2026-09-26 05:01:02.658105+03
2276248e-d0e5-4bb9-b475-b661b085280b	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	b804cc9a-ef86-4458-bbfa-7b972c0ba868	2026-09-26 05:01:02.658105+03
e79012d3-f62d-49c0-9102-903de0401485	03f04240-4980-43dc-992d-0811f17edf25	b804cc9a-ef86-4458-bbfa-7b972c0ba868	2026-09-26 05:01:02.658105+03
30845d71-b3fc-408e-b3ae-ce39cb783d5e	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	ff99fd7a-0313-4e1f-aab8-d073c6d05ade	2026-09-26 05:01:02.658105+03
c131dc61-78e4-4a0b-b3f0-a435b5cb7003	03f04240-4980-43dc-992d-0811f17edf25	e2a924c2-485e-4fdf-8265-490b5feef955	2026-09-26 05:01:02.658105+03
4adc9be3-1c72-4128-b6a5-7d4a1288e8aa	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	9ebafcbb-2b3e-4828-b130-1d25792d0259	2026-09-26 05:01:02.658105+03
7340e600-2ae4-4a01-aeba-ce8cb92c5e25	03f04240-4980-43dc-992d-0811f17edf25	9ebafcbb-2b3e-4828-b130-1d25792d0259	2026-09-26 05:01:02.658105+03
9ea1adc4-2b9c-4b2d-9dac-e3e2ef818226	5f5ea76a-df23-4077-a009-87cb90a1d3b4	5f74f34d-5f46-45b2-b3e6-61346e86139d	2026-09-26 10:55:32.400343+03
c09f8a0e-75e0-46bd-bfd1-41747d09890f	5f5ea76a-df23-4077-a009-87cb90a1d3b4	6237a333-b682-40e8-a301-bca5e994f455	2026-09-26 10:55:32.400343+03
94453789-c6c5-4af0-974b-e2dc870511f7	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	8ed4170f-cc83-4d04-9728-5ac8f0bf1dea	2026-09-26 10:55:32.400343+03
1711b4dc-15a1-427e-baa5-7e37f6b699ab	5f5ea76a-df23-4077-a009-87cb90a1d3b4	8ed4170f-cc83-4d04-9728-5ac8f0bf1dea	2026-09-26 10:55:32.400343+03
7a23a68d-35ac-4191-9ca3-4fa000c20a9c	5f5ea76a-df23-4077-a009-87cb90a1d3b4	6d96a141-1d92-4042-8eb1-e4aeeb382f46	2026-09-26 10:55:32.400343+03
f157e59b-400c-4bc8-b1a6-5e851f3764aa	5f5ea76a-df23-4077-a009-87cb90a1d3b4	4917df94-aaf4-45ba-9fa7-2e197dcb477c	2026-09-26 10:55:32.400343+03
08a2662e-3500-4b5e-b930-5c8d371a57fe	5f5ea76a-df23-4077-a009-87cb90a1d3b4	cf7c1301-e3c3-45e6-9748-56dfb0231c80	2026-09-26 10:55:32.400343+03
db4554ed-1277-4435-bc8d-f46bbf028996	5f5ea76a-df23-4077-a009-87cb90a1d3b4	1b82140c-89ed-493c-b169-0b32f30a7414	2026-09-26 10:55:32.400343+03
71995866-7914-4dd5-aa66-17a610c087da	5f5ea76a-df23-4077-a009-87cb90a1d3b4	21d8e2e6-4f6c-427e-96ee-a1e118f29fc7	2026-09-26 10:55:32.400343+03
2235cb4c-440e-4431-b2ed-df4f4e7df5a9	5f5ea76a-df23-4077-a009-87cb90a1d3b4	8cb9be9b-2642-494f-9f8b-23ea998a30c3	2026-09-26 10:55:32.400343+03
c4afd6d6-fedb-46f2-9067-df2acfddd2c8	5f5ea76a-df23-4077-a009-87cb90a1d3b4	f7ae9231-ac40-4dc4-aa99-9cfc5726292d	2026-09-26 10:55:32.400343+03
be2533b9-8123-4d3f-8774-0bc7b6843b44	5f5ea76a-df23-4077-a009-87cb90a1d3b4	44e2916e-7e5c-4e10-9047-00648b609dc3	2026-09-26 10:55:32.400343+03
1b6be998-240d-4f9a-b755-3e55c5be3bff	5f5ea76a-df23-4077-a009-87cb90a1d3b4	ccdea6ce-1ef4-4bf0-8b0f-ef68e9218380	2026-09-26 10:55:32.400343+03
7a9eb433-f939-4b95-a828-972ca0181091	5f5ea76a-df23-4077-a009-87cb90a1d3b4	06543e50-da0e-4c23-9fbb-6d6d016d9dd1	2026-09-26 10:55:32.400343+03
94feed43-eb3f-492f-94da-7f137ea568c2	5f5ea76a-df23-4077-a009-87cb90a1d3b4	38500b2e-a5e1-4116-aa4f-44bee1253afe	2026-09-26 10:55:32.400343+03
d4fca3b4-3fe4-4189-85f7-6b75ac3a6c5b	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	0905b1bb-acdc-46cb-b58c-76a2d19b8c1d	2026-09-26 10:55:32.400343+03
155ebc61-1b19-4e54-a6e2-366f3a32619e	5f5ea76a-df23-4077-a009-87cb90a1d3b4	0905b1bb-acdc-46cb-b58c-76a2d19b8c1d	2026-09-26 10:55:32.400343+03
e4c57528-d0c7-4426-a5c4-3d95d4d53750	c21045fb-6477-4885-b9db-8987a117663e	d86a5c1b-7cf4-4994-9ec0-395a8265e98b	2026-09-26 10:55:32.400343+03
e360b064-2a17-46d6-a6b9-da404d979dba	16c2439b-b03c-4bb6-958a-5a078f528672	d86a5c1b-7cf4-4994-9ec0-395a8265e98b	2026-09-26 10:55:32.400343+03
bf47e418-cfa8-4369-bdf3-4e4a6b41227d	16c2439b-b03c-4bb6-958a-5a078f528672	6b5c6fa3-42ef-4e46-8796-14ad442012dd	2026-09-26 10:55:32.400343+03
00be76eb-8024-41b2-a46b-c7971662c161	16c2439b-b03c-4bb6-958a-5a078f528672	db3cd020-b3dc-42d5-bd65-ec1b51c62649	2026-09-26 10:55:32.400343+03
080b90e8-46ab-4d27-919f-99d6a5dacd3b	16c2439b-b03c-4bb6-958a-5a078f528672	f6d4cf17-268b-451d-ab2c-54346a4570bc	2026-09-26 10:55:32.400343+03
0c05d4a0-b3bc-4d0d-9cdd-a82b8bdab153	16c2439b-b03c-4bb6-958a-5a078f528672	90f95a19-2127-4efe-8342-a04dc5bb6fa6	2026-09-26 10:55:32.400343+03
685ef245-9fdb-4570-9960-a1f9ef4e7d2f	16c2439b-b03c-4bb6-958a-5a078f528672	9d4ac6e3-153a-4f09-adda-490761b41b59	2026-09-26 10:55:32.400343+03
fbcc5c74-cb6d-46b7-ac05-1c51ac6e43f4	16c2439b-b03c-4bb6-958a-5a078f528672	70bd4949-1baa-4812-8ff5-480b982b3625	2026-09-26 10:55:32.400343+03
a38d4754-9245-480a-b7f1-f1b4afc6a0e8	16c2439b-b03c-4bb6-958a-5a078f528672	5c640bc0-6e30-47e4-abfe-b937da63e924	2026-09-26 10:55:32.400343+03
c85f1703-1319-4ce0-8f15-20a91490c995	16c2439b-b03c-4bb6-958a-5a078f528672	97c4afd7-ecfe-46c8-9643-4bb1c13e6541	2026-09-26 10:55:32.400343+03
4e0eba32-27ef-4f49-bad3-42ede116f5ca	16c2439b-b03c-4bb6-958a-5a078f528672	3fa4f3cc-9be6-4945-b8de-f7e4930ccbfa	2026-09-26 10:55:32.400343+03
239763d1-bfe6-4ee7-8e5c-3cd3a0960f32	16c2439b-b03c-4bb6-958a-5a078f528672	cc7e0890-cd38-4e2c-aa4f-02bb929cf1d6	2026-09-26 10:55:32.400343+03
5ee2404c-6507-4c1c-aadb-4a89ea816e83	16c2439b-b03c-4bb6-958a-5a078f528672	ffd3df62-6161-42df-b757-2156004515e8	2026-09-26 10:55:32.400343+03
f5e0be4b-1b88-414e-9f4d-45a0c047a928	16c2439b-b03c-4bb6-958a-5a078f528672	3c9a7f45-54e1-4915-b32a-1fd43ec5aa8c	2026-09-26 10:55:32.400343+03
011b50bd-6ec5-49e3-a85d-74cfdb6b257b	16c2439b-b03c-4bb6-958a-5a078f528672	3ff2f6a8-6583-4a1f-8a9d-4157c551f3ba	2026-09-26 10:55:32.400343+03
0886dcab-97ec-4bfd-aaa1-110e925d6fd7	c21045fb-6477-4885-b9db-8987a117663e	5917a8e7-2fca-4c02-be4b-0b9f0633bae6	2026-09-26 10:55:32.400343+03
c53e8d14-83ed-4e97-ae9d-a3e8d2eec096	16c2439b-b03c-4bb6-958a-5a078f528672	5917a8e7-2fca-4c02-be4b-0b9f0633bae6	2026-09-26 10:55:32.400343+03
6c6878f2-11c1-4cb7-a521-de7afe29b10e	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	86a5ba77-a572-4770-9dc4-7e0236227748	2026-09-26 10:55:32.400343+03
8e382d98-bba0-4527-a822-ff7ac68cdcb3	714a2b7b-761a-4908-8642-cfa8bddf98a7	86a5ba77-a572-4770-9dc4-7e0236227748	2026-09-26 10:55:32.400343+03
b479b625-b63b-4d73-99a0-403c67d8bc67	714a2b7b-761a-4908-8642-cfa8bddf98a7	384d51a5-1af7-4f3f-b8b6-e02e89aec8bd	2026-09-26 10:55:32.400343+03
d41c3d81-c234-4b42-b51e-ea7ae77902d7	714a2b7b-761a-4908-8642-cfa8bddf98a7	f9018e50-06e1-43de-aa63-27daa5ac6de1	2026-09-26 10:55:32.400343+03
51a0abf7-f512-4947-95c9-268874273488	714a2b7b-761a-4908-8642-cfa8bddf98a7	fbbca9c0-6dd7-40dd-8f08-1e2d55d24bf4	2026-09-26 10:55:32.400343+03
2bca97ff-6fa6-48e3-9d43-d7280253da67	714a2b7b-761a-4908-8642-cfa8bddf98a7	eea6bb80-138c-45e6-b9ee-f47bccf9b151	2026-09-26 10:55:32.400343+03
2bb4c3a6-ce00-4261-b43a-ef7fbd46a4ef	714a2b7b-761a-4908-8642-cfa8bddf98a7	8d36e70c-a23d-47b8-8f9a-89349f38bd27	2026-09-26 10:55:32.400343+03
295e389f-b11e-4423-b4d3-e12ff49a110a	714a2b7b-761a-4908-8642-cfa8bddf98a7	8b19a313-9e9e-480f-9bb8-18cf854a5afe	2026-09-26 10:55:32.400343+03
210ca190-50e2-4056-8aab-ef096d01b14d	714a2b7b-761a-4908-8642-cfa8bddf98a7	1c6d6225-5bed-4938-90ce-4150cca92b9f	2026-09-26 10:55:32.400343+03
d9af8b81-4b47-4668-a491-7608e6d5cab4	714a2b7b-761a-4908-8642-cfa8bddf98a7	16fb546d-f3da-481c-8024-95d5bfd3f742	2026-09-26 10:55:32.400343+03
12976ec2-2d14-4cc5-bec5-96b850a9bceb	714a2b7b-761a-4908-8642-cfa8bddf98a7	d4dbeaac-0389-4ea7-b0e0-0d9c28f5356c	2026-09-26 10:55:32.400343+03
6cdc8be9-c11a-4ff0-ad6e-c5dd059015d2	714a2b7b-761a-4908-8642-cfa8bddf98a7	beb0b460-8463-4d12-b0a5-52fa0c4d1c88	2026-09-26 10:55:32.400343+03
34e5bd85-85dc-4041-9fd6-ec0779fd4fd7	714a2b7b-761a-4908-8642-cfa8bddf98a7	9568193d-6ac2-4390-b475-155957494d91	2026-09-26 10:55:32.400343+03
0d0d4336-0663-49c5-911f-0b640963b153	714a2b7b-761a-4908-8642-cfa8bddf98a7	3ecc2e63-c7bc-4c4d-a61f-84bd3a5a743f	2026-09-26 10:55:32.400343+03
decb6b55-277a-4f48-8bfb-2544145c0f93	714a2b7b-761a-4908-8642-cfa8bddf98a7	f04cde63-f79c-4ae0-bc93-9be06475616c	2026-09-26 10:55:32.400343+03
e59ad500-f013-4e46-892b-f714ad354392	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	faa2c12e-4eff-4179-9f40-8575e573fffd	2026-09-26 10:55:32.400343+03
d1c992ef-1124-46da-a0a9-5fc365d7b9ed	714a2b7b-761a-4908-8642-cfa8bddf98a7	faa2c12e-4eff-4179-9f40-8575e573fffd	2026-09-26 10:55:32.400343+03
a3d4aee6-c899-4f85-8b65-4435c9e27fa1	14bac981-e410-43c7-9bb6-0b873749cc20	a4fc1da3-aa85-4967-824d-5e4515c6a004	2026-09-26 10:55:32.400343+03
cc72fb1f-cd7d-4c8e-a805-4e5effba374c	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	a4fc1da3-aa85-4967-824d-5e4515c6a004	2026-09-26 10:55:32.400343+03
3eec540e-b5d9-4cdb-929f-efee2b3b2f5f	14bac981-e410-43c7-9bb6-0b873749cc20	cc2dc35d-3fce-4b60-875f-2ee2064df33c	2026-09-26 10:55:32.400343+03
ebd9b4db-2715-4f4b-81e6-3adf0bd75842	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	cc2dc35d-3fce-4b60-875f-2ee2064df33c	2026-09-26 10:55:32.400343+03
fe507494-1aea-4fe3-b8bd-6938566468d3	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	a77929fa-d3f1-437c-b6e1-df60d9d6e0a5	2026-09-26 10:55:32.400343+03
7f0d3721-df13-4096-a148-64e8a7af3dc7	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	055c720f-a6c6-475e-be50-e0a179069d0d	2026-09-26 10:55:32.400343+03
5943cb66-b10e-4b28-81e9-d0547fdf6de7	14bac981-e410-43c7-9bb6-0b873749cc20	82c8ba3e-7ac2-4d15-9200-078c9f9a88a5	2026-09-26 10:55:32.400343+03
4e478e5f-93d2-4c8c-b4e2-f6166654d175	14bac981-e410-43c7-9bb6-0b873749cc20	1969bf48-1920-4c07-bd24-91e03e3d3214	2026-09-26 10:55:32.400343+03
478ec4c9-36a4-4e25-9f9b-c50b03088b49	14bac981-e410-43c7-9bb6-0b873749cc20	0cb09172-e9a9-4ba9-ae34-66855e34baef	2026-09-26 10:55:32.400343+03
67aacda3-3e46-4b04-a97d-00acdc67690e	14bac981-e410-43c7-9bb6-0b873749cc20	2741ec82-c6c7-4a85-a3e3-79952e753a4f	2026-09-26 10:55:32.400343+03
e34923ec-3090-41ad-8d03-1fafd121fd45	14bac981-e410-43c7-9bb6-0b873749cc20	f8f363f9-f039-49e0-b6e2-bd5cd2c59dde	2026-09-26 10:55:32.400343+03
ffb4f9c4-0f7f-4fcd-8c3d-bda5c7606e88	14bac981-e410-43c7-9bb6-0b873749cc20	cf604af0-393c-4e17-b59d-3934d75ed954	2026-09-26 10:55:32.400343+03
ff6d0c88-0ba7-47d0-a588-d3344f16983a	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	cf604af0-393c-4e17-b59d-3934d75ed954	2026-09-26 10:55:32.400343+03
ddb3ff29-2d8d-4496-aa4c-959fc4878926	14bac981-e410-43c7-9bb6-0b873749cc20	ec5a60f9-b53c-410c-a118-aa6559bd083a	2026-09-26 10:55:32.400343+03
2022d643-4ae0-4827-b27e-dd700ede803b	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	ec5a60f9-b53c-410c-a118-aa6559bd083a	2026-09-26 10:55:32.400343+03
4b0c094e-5ff1-4991-bd60-ef16a9de39e1	14bac981-e410-43c7-9bb6-0b873749cc20	edd69656-96bf-4860-b117-1ca7279c6307	2026-09-26 10:55:32.400343+03
33131abe-b288-4990-b189-d27b17471af4	14bac981-e410-43c7-9bb6-0b873749cc20	65fb0769-18a6-44bf-8858-9d6659f2faa6	2026-09-26 10:55:32.400343+03
ea7514b3-5dbc-44bc-ad02-b250ba838082	14bac981-e410-43c7-9bb6-0b873749cc20	e2014a88-91da-45ea-bbe2-704b9b22fa0a	2026-09-26 10:55:32.400343+03
a8648b6e-787f-49f8-b17d-5e0f515acb12	14bac981-e410-43c7-9bb6-0b873749cc20	3394d716-8d4a-49c1-b04e-33f5367ca48e	2026-09-26 10:55:32.400343+03
f61df02c-0fa2-49f6-a3d4-94a7718dd371	14bac981-e410-43c7-9bb6-0b873749cc20	8bb65a0e-ac24-406f-a21d-5549bad0ea12	2026-09-26 10:55:32.400343+03
b784a912-b5d2-47ed-8867-c68fc7ac638c	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	cae083fb-7ce1-4e90-8481-227350d352b7	2026-09-26 10:55:32.400343+03
8a842c5e-25eb-4f7f-98dc-60fb3caaa3e4	14bac981-e410-43c7-9bb6-0b873749cc20	cae083fb-7ce1-4e90-8481-227350d352b7	2026-09-26 10:55:32.400343+03
afa7566e-14ae-450d-8839-d0cb049a950a	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	0e85c5cb-b33c-47e0-8f91-c7cc9f76a5ed	2026-09-26 10:55:32.400343+03
8e743637-4f2a-40bd-b9f7-21398c91a3d3	7094c844-980b-4399-8b18-306d8bbabac8	0e85c5cb-b33c-47e0-8f91-c7cc9f76a5ed	2026-09-26 10:55:32.400343+03
be06374b-b29b-4785-bc08-1aaf82fc2cad	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	100c9e2a-b165-4749-b9c2-d4e50c34f158	2026-09-26 10:55:32.400343+03
52b760b0-5ed7-4765-a419-3d3df9c7ecd6	7094c844-980b-4399-8b18-306d8bbabac8	100c9e2a-b165-4749-b9c2-d4e50c34f158	2026-09-26 10:55:32.400343+03
e1be0a10-b61b-4d59-8aed-5ee9572c3c95	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	3811e8d9-0461-4f03-83b5-d08b06457194	2026-09-26 10:55:32.400343+03
e655ddad-cd11-41eb-b6a4-44164f5a9601	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	f4d7160b-d068-4d5a-907c-2da7db3c0d3e	2026-09-26 10:55:32.400343+03
31a5ba84-7743-4cb0-a83a-d31eae209177	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	0d2f21fc-57fd-41b7-8399-bd2e2dbf639a	2026-09-26 10:55:32.400343+03
9f0a2fa2-b5f9-4caf-a8ea-0311978fbb88	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	e1803488-1c37-4e46-be9e-ca1be4842c48	2026-09-26 10:55:32.400343+03
3aca78f7-c18d-4454-9c26-862f926b3f1a	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	e47f6253-ee6a-4170-8e30-6e85266cb7d0	2026-09-26 10:55:32.400343+03
1557662c-1a4b-444a-8f26-b886df66d167	7094c844-980b-4399-8b18-306d8bbabac8	e47f6253-ee6a-4170-8e30-6e85266cb7d0	2026-09-26 10:55:32.400343+03
ada12bc6-d8b1-4b67-9b6c-98e1fdada0c7	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	5c8ed261-8692-4015-a229-6a93ea325fd2	2026-09-26 10:55:32.400343+03
eaf40bbd-353b-4b36-8fb0-482a5901b071	7094c844-980b-4399-8b18-306d8bbabac8	5c8ed261-8692-4015-a229-6a93ea325fd2	2026-09-26 10:55:32.400343+03
955344a1-7e2b-4107-a0a4-e646e6d17b5a	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	b3fc6af6-81dc-421f-9a4b-bc75dfc28047	2026-09-26 10:55:32.400343+03
60175591-adea-4b1a-b3d9-4d4198bcfa38	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	288fbaf3-5011-4346-bcd3-aa0029957c7e	2026-09-26 10:55:32.400343+03
940bb290-16c5-49be-aa84-3b193498ea66	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	cae6f57c-d30b-4e67-ae67-3937273b63bc	2026-09-26 10:55:32.400343+03
4bc43b9f-32d3-4d49-95ef-c5c1e0b33f4f	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	4fe9bd90-16cc-4272-90de-58fa3f14b846	2026-09-26 10:55:32.400343+03
fe55679a-d2de-4499-8aba-4aded0276b59	7094c844-980b-4399-8b18-306d8bbabac8	b70bc20d-b2ae-4b0b-8d7a-e4e48a62e848	2026-09-26 10:55:32.400343+03
74cf89ca-d3a5-4bbd-a038-ab931aa47416	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	b70bc20d-b2ae-4b0b-8d7a-e4e48a62e848	2026-09-26 10:55:32.400343+03
0efe9afb-8918-4bc4-bbb9-7e8b221432a0	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	95715141-b2ad-4ee3-be1b-77f3e7584a36	2026-09-26 10:55:32.400343+03
9d84d84d-f58d-43c6-8e97-eefdb854b583	28705c72-d15e-44c6-92f8-a347b86a5e65	95715141-b2ad-4ee3-be1b-77f3e7584a36	2026-09-26 10:55:32.400343+03
b4b36db7-d321-4c9a-a517-0d9393884218	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	1fb7da1e-8da4-41b4-b87b-1652f6af7818	2026-09-26 10:55:32.400343+03
4e5e0a67-5e18-431f-864a-8c2f9083acc0	28705c72-d15e-44c6-92f8-a347b86a5e65	1fb7da1e-8da4-41b4-b87b-1652f6af7818	2026-09-26 10:55:32.400343+03
58ff88e4-0f9b-47b5-a965-15e03b035dea	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	2c5ac824-28cd-4819-8f89-7f9ae1f18441	2026-09-26 10:55:32.400343+03
434feeb7-66c1-4f4a-a26c-e1dc2c56cfe5	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	4ffb41d1-db31-46d6-9c96-4e917708daf5	2026-09-26 10:55:32.400343+03
f10b81fb-1ab5-4ebc-91b5-a81e4216d694	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	ac4abf25-ae59-4696-a386-75b2b19021d1	2026-09-26 10:55:32.400343+03
4faa16f7-8630-4cdb-9579-5e3b48e01b7e	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	f66c336a-5989-496c-a397-174170d14b08	2026-09-26 10:55:32.400343+03
ad20e377-d625-4285-a674-3146f39950e9	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	43308fad-de32-4d9c-8dfd-d8d9908d2181	2026-09-26 10:55:32.400343+03
cb80d2a1-6220-41e9-a9c1-7c07ba6a0f03	28705c72-d15e-44c6-92f8-a347b86a5e65	43308fad-de32-4d9c-8dfd-d8d9908d2181	2026-09-26 10:55:32.400343+03
98f064a6-a763-4ef2-946c-a98553ddf0a7	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	29126be2-41b3-4289-a8c9-2435f590b3b1	2026-09-26 10:55:32.400343+03
645665a8-b471-4167-91e1-e9cb12eb3ada	28705c72-d15e-44c6-92f8-a347b86a5e65	29126be2-41b3-4289-a8c9-2435f590b3b1	2026-09-26 10:55:32.400343+03
d70b7328-569e-44e8-9150-3733ada610c5	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	f711a5af-7576-4a95-976a-2921d074f051	2026-09-26 10:55:32.400343+03
c3b40996-a64d-4981-9726-2e4c36465147	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	c9252015-fdbd-4e20-840a-d1d8f3734e4d	2026-09-26 10:55:32.400343+03
98421ecf-c80c-4909-91a0-ec8d09fbeac7	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	52d8e371-c05c-4f9a-b5a0-f2067b5174d4	2026-09-26 10:55:32.400343+03
28cd114a-1af9-4d1f-97cf-de596f3aa8cd	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	ebe3b026-c19e-4a5c-b568-ecb12f0d1326	2026-09-26 10:55:32.400343+03
c7a03f8b-f42c-43c7-8be1-585327d36305	28705c72-d15e-44c6-92f8-a347b86a5e65	5387161a-345f-4781-b996-107db8eced6e	2026-09-26 10:55:32.400343+03
0eb4a487-f2c5-479f-aacd-f5bebc3dbecd	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	5387161a-345f-4781-b996-107db8eced6e	2026-09-26 10:55:32.400343+03
8adfef02-9640-4981-9e83-02e82a8656e4	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	996e9d63-1b7a-4d0d-9879-24b0db5cdafd	2026-09-26 10:55:32.400343+03
f8403059-21e5-4027-848f-9b0772bf0032	03f04240-4980-43dc-992d-0811f17edf25	996e9d63-1b7a-4d0d-9879-24b0db5cdafd	2026-09-26 10:55:32.400343+03
a1a2c5db-9ff3-4dfd-bff0-226c7d02ebef	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	579527a6-b7c9-49e9-8556-6b5c4824282c	2026-09-26 10:55:32.400343+03
0901cf29-253a-4b46-9cac-61ba473bb451	03f04240-4980-43dc-992d-0811f17edf25	579527a6-b7c9-49e9-8556-6b5c4824282c	2026-09-26 10:55:32.400343+03
3190322e-463e-4be9-84bf-25ba11093573	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	439cdb1a-c511-4da0-914a-368f176f5c10	2026-09-26 10:55:32.400343+03
9b4863c7-1237-46f3-ab75-f8d28c65e674	03f04240-4980-43dc-992d-0811f17edf25	439cdb1a-c511-4da0-914a-368f176f5c10	2026-09-26 10:55:32.400343+03
3bd1eba5-3031-47c5-a509-1b007466cb44	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	fdbb338a-e74b-4907-8b39-f3beaf8cb602	2026-09-26 10:55:32.400343+03
dbafa279-3ee8-4667-b4c2-f015ed34d916	03f04240-4980-43dc-992d-0811f17edf25	fdbb338a-e74b-4907-8b39-f3beaf8cb602	2026-09-26 10:55:32.400343+03
cd870f1c-7fad-45d6-a163-57fcc120c8f4	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	f22d2be1-2a32-49ca-9858-5d38300b39aa	2026-09-26 10:55:32.400343+03
5147b271-f20f-4a22-91fb-0982759ee9f7	03f04240-4980-43dc-992d-0811f17edf25	f22d2be1-2a32-49ca-9858-5d38300b39aa	2026-09-26 10:55:32.400343+03
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, code, module, label_ar, label_en, description, created_at) FROM stdin;
b693d32b-8067-4587-9c0d-82a3f2e1fbc4	students.view	students	عرض الطلاب	View Students	\N	2026-09-15 14:29:44.395437+03
b72e92d0-e66a-4688-9daa-8d8c2ab8b544	students.create	students	إضافة طالب	Create Student	\N	2026-09-15 14:29:44.395437+03
6585136f-ee3a-4384-8dcf-01cc935ea933	students.edit	students	تعديل طالب	Edit Student	\N	2026-09-15 14:29:44.395437+03
09c2c380-827f-4578-9cf9-8f7d09f0f8ed	students.delete	students	حذف طالب	Delete Student	\N	2026-09-15 14:29:44.395437+03
d5515c48-2ef4-46bb-a250-ed632373599b	teachers.view	teachers	عرض المدرسين	View Teachers	\N	2026-09-15 14:29:44.395437+03
d1ac3118-99d3-4310-b6f4-f9be122e826a	teachers.create	teachers	إضافة مدرس	Create Teacher	\N	2026-09-15 14:29:44.395437+03
8c675273-9680-40c8-98be-71f284f0e0db	teachers.edit	teachers	تعديل مدرس	Edit Teacher	\N	2026-09-15 14:29:44.395437+03
8558d6a5-549d-44ab-8208-d67aa59206b2	teachers.delete	teachers	حذف مدرس	Delete Teacher	\N	2026-09-15 14:29:44.395437+03
640bcbc8-1aa6-4432-9bbb-a2ebcd031048	groups.view	groups	عرض المجموعات	View Groups	\N	2026-09-15 14:29:44.395437+03
c619d9aa-62e6-45e7-b918-215a9d0f6d4f	groups.create	groups	إنشاء مجموعة	Create Group	\N	2026-09-15 14:29:44.395437+03
b5f587b0-ae4e-4931-9e2f-c2cefe088c3f	groups.edit	groups	تعديل مجموعة	Edit Group	\N	2026-09-15 14:29:44.395437+03
8802d098-bcb0-400e-9caf-97d46fbd489d	groups.delete	groups	حذف مجموعة	Delete Group	\N	2026-09-15 14:29:44.395437+03
c743029e-1ff3-4e64-8b8a-2ef4e2bab420	attendance.scan	attendance	تسجيل حضور	Scan Attendance	\N	2026-09-15 14:29:44.395437+03
3a461bcb-79f6-4a97-b653-14f36f840460	attendance.view	attendance	عرض الحضور	View Attendance	\N	2026-09-15 14:29:44.395437+03
11a1552f-4b91-4778-806f-31757de861db	attendance.edit	attendance	تعديل حضور	Edit Attendance	\N	2026-09-15 14:29:44.395437+03
4bbf796f-09b1-4130-8f4d-50237bee46da	barcodes.generate	barcodes	توليد باركود	Generate Barcodes	\N	2026-09-15 14:29:44.395437+03
e01d3ec7-65a2-4799-9a99-0676f6b56c9e	barcodes.assign	barcodes	ربط باركود	Assign Barcode	\N	2026-09-15 14:29:44.395437+03
92eeba98-4937-48e9-857c-4ef9529b3473	barcodes.print	barcodes	طباعة باركود	Print Barcode	\N	2026-09-15 14:29:44.395437+03
f5ef0bca-06bd-4a95-809d-f2f0b1855fd8	finance.view	finance	عرض المالية	View Finance	\N	2026-09-15 14:29:44.395437+03
60a0c310-ebf7-4e2b-b0d7-fb7f4f30c157	finance.manage	finance	إدارة المالية	Manage Finance	\N	2026-09-15 14:29:44.395437+03
31a70e29-5215-42b6-a1f7-ca5d84405656	finance.settlements	finance	تسويات المدرسين	Teacher Settlements	\N	2026-09-15 14:29:44.395437+03
3737b9ca-cef3-4ac6-a9b3-ba5251e64752	settings.view	settings	عرض الإعدادات	View Settings	\N	2026-09-15 14:29:44.395437+03
4684505b-e228-4bc5-83c7-2b874da96cbc	settings.manage	settings	إدارة الإعدادات	Manage Settings	\N	2026-09-15 14:29:44.395437+03
a20aab85-05e5-4c92-a506-b7bedb31813d	master.view	master	عرض البيانات الأساسية	View Master Data	\N	2026-09-15 14:29:44.395437+03
b1e34353-15a2-45d6-a419-d9ee51e96d32	master.manage	master	إدارة البيانات الأساسية	Manage Master Data	\N	2026-09-15 14:29:44.395437+03
4ced8d85-c4e1-40b9-889a-a719065878e2	reports.view	reports	عرض التقارير	View Reports	\N	2026-09-15 14:29:44.395437+03
cbb708b1-81dd-4e81-9b36-cd31260cfbd8	reports.export	reports	تصدير التقارير	Export Reports	\N	2026-09-15 14:29:44.395437+03
\.


--
-- Data for Name: pos_sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pos_sale_items (id, sale_id, item_id, item_name, quantity, unit_cost, unit_price, total_price) FROM stdin;
1dbaed11-021c-4f2b-9982-b61fa7ac1da5	3b5d6da4-7bd9-4db9-8437-303be311ffea	eca32ab1-5b66-46e4-b3b1-22a083e0b767	ملزمة الكيمياء - الباب الثاني (التحليل)	1	20.00	40.00	40.00
48878b8d-7081-45c1-ab2b-ea5b3f3f8e86	39d27228-df8e-4892-b3b2-adbe0cd02ed9	d41e54c3-9444-4a63-8538-322b1549a451	ملزمه  اختبار	1	100.00	120.00	120.00
84378923-7df2-4133-8b9d-45a81517b5ae	cbf536c3-375d-4261-ba8e-0e94b361b96a	0132e505-50f9-4b1e-bd9f-fdbb22ffa0c2	كارت حضور ذكي بديل (QR)	1	5.00	20.00	20.00
\.


--
-- Data for Name: pos_sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pos_sales (id, invoice_number, cashier_id, student_id, subtotal, discount, total_amount, paid_amount, change_amount, payment_method, notes, created_at) FROM stdin;
3b5d6da4-7bd9-4db9-8437-303be311ffea	INV-22328098	6c49cae8-988b-4bed-9f78-c069486f9f68	\N	40.00	0.00	40.00	50.00	10.00	cash	\N	2026-09-16 04:32:08.098525+03
39d27228-df8e-4892-b3b2-adbe0cd02ed9	INV-22935360	6c49cae8-988b-4bed-9f78-c069486f9f68	\N	120.00	0.00	120.00	120.00	0.00	cash	\N	2026-09-16 04:42:15.3606+03
cbf536c3-375d-4261-ba8e-0e94b361b96a	INV-23215771	6c49cae8-988b-4bed-9f78-c069486f9f68	\N	20.00	0.00	20.00	20.00	0.00	cash	\N	2026-09-16 04:46:55.771048+03
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, role_id, permission_id, created_at) FROM stdin;
4d8ac314-5d35-472f-9192-63531a376004	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	b693d32b-8067-4587-9c0d-82a3f2e1fbc4	2026-09-15 14:29:44.404822+03
83f9287d-c520-48eb-8091-0687487190e0	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	b72e92d0-e66a-4688-9daa-8d8c2ab8b544	2026-09-15 14:29:44.404822+03
0b9d41ce-2f43-4347-b3fd-ec5e3548985d	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	6585136f-ee3a-4384-8dcf-01cc935ea933	2026-09-15 14:29:44.404822+03
0cb142fc-826f-48b7-b969-e908812fd226	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	09c2c380-827f-4578-9cf9-8f7d09f0f8ed	2026-09-15 14:29:44.404822+03
2151a8aa-3ba0-45af-b39d-7701e7b5e43d	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	d5515c48-2ef4-46bb-a250-ed632373599b	2026-09-15 14:29:44.404822+03
8a171957-1363-41bf-b289-9ed966f23397	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	d1ac3118-99d3-4310-b6f4-f9be122e826a	2026-09-15 14:29:44.404822+03
97c301b6-a1ff-47c2-b0af-2afbbdd5a1d6	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	8c675273-9680-40c8-98be-71f284f0e0db	2026-09-15 14:29:44.404822+03
fa7aee38-b105-4373-a47b-96cd39402487	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	8558d6a5-549d-44ab-8208-d67aa59206b2	2026-09-15 14:29:44.404822+03
bf49d643-70be-4a71-b1fb-2f0e6763b311	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	640bcbc8-1aa6-4432-9bbb-a2ebcd031048	2026-09-15 14:29:44.404822+03
0a3a1050-eebb-43d3-9a46-91db85ad695a	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	c619d9aa-62e6-45e7-b918-215a9d0f6d4f	2026-09-15 14:29:44.404822+03
c90da4b3-a9b5-4cd8-a99f-4bdee752e893	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	b5f587b0-ae4e-4931-9e2f-c2cefe088c3f	2026-09-15 14:29:44.404822+03
943b4453-d405-46f9-9626-c5519e1ffb6b	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	8802d098-bcb0-400e-9caf-97d46fbd489d	2026-09-15 14:29:44.404822+03
3d58b122-6751-4572-858e-e6f4d74347d6	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	c743029e-1ff3-4e64-8b8a-2ef4e2bab420	2026-09-15 14:29:44.404822+03
54581cd2-d8dd-4eaa-ad29-5fa4ba29f558	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	3a461bcb-79f6-4a97-b653-14f36f840460	2026-09-15 14:29:44.404822+03
9f6d9212-c4b5-4e4c-b586-ea50a2a0fcfa	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	11a1552f-4b91-4778-806f-31757de861db	2026-09-15 14:29:44.404822+03
d991103f-9254-4f4c-abab-941df4ccfb87	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	4bbf796f-09b1-4130-8f4d-50237bee46da	2026-09-15 14:29:44.404822+03
40e58b8f-2768-4647-81ed-e69a156fe8ea	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	e01d3ec7-65a2-4799-9a99-0676f6b56c9e	2026-09-15 14:29:44.404822+03
7d833b26-615a-4233-8b1d-0d86069ebe42	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	92eeba98-4937-48e9-857c-4ef9529b3473	2026-09-15 14:29:44.404822+03
a807f239-ce48-4865-88f7-0b28ab225a23	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	f5ef0bca-06bd-4a95-809d-f2f0b1855fd8	2026-09-15 14:29:44.404822+03
129c665b-25ed-4223-a464-0755adffa1dc	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	60a0c310-ebf7-4e2b-b0d7-fb7f4f30c157	2026-09-15 14:29:44.404822+03
ba062e83-18c9-4bc3-9607-b2322f4ad2f6	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	31a70e29-5215-42b6-a1f7-ca5d84405656	2026-09-15 14:29:44.404822+03
dd8d12a9-3e89-45f8-9d35-0c388d91c38c	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	3737b9ca-cef3-4ac6-a9b3-ba5251e64752	2026-09-15 14:29:44.404822+03
9e634a3f-b6ae-4517-a18e-87eaad19336a	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	4684505b-e228-4bc5-83c7-2b874da96cbc	2026-09-15 14:29:44.404822+03
b8cc26dc-42dd-48c5-ae52-c6be1e2aed93	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	a20aab85-05e5-4c92-a506-b7bedb31813d	2026-09-15 14:29:44.404822+03
330fa7f6-640e-4efc-9d24-cc682a5d3e4e	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	b1e34353-15a2-45d6-a419-d9ee51e96d32	2026-09-15 14:29:44.404822+03
90b16fd4-0059-4bf6-99d4-1c303499a7f6	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	4ced8d85-c4e1-40b9-889a-a719065878e2	2026-09-15 14:29:44.404822+03
f21ac112-8838-4609-abb3-b297f20e7476	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	cbb708b1-81dd-4e81-9b36-cd31260cfbd8	2026-09-15 14:29:44.404822+03
f7345554-a256-4391-bd85-c068658c0c20	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	b693d32b-8067-4587-9c0d-82a3f2e1fbc4	2026-09-15 14:29:44.416354+03
6906a68e-f285-46f7-a7df-607b430f7761	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	b72e92d0-e66a-4688-9daa-8d8c2ab8b544	2026-09-15 14:29:44.416354+03
4bc49754-98ce-46b4-b7ea-604c0bc2333e	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	6585136f-ee3a-4384-8dcf-01cc935ea933	2026-09-15 14:29:44.416354+03
362ccec7-da77-432c-95bb-578e2a95a77d	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	09c2c380-827f-4578-9cf9-8f7d09f0f8ed	2026-09-15 14:29:44.416354+03
e93e3a6d-2157-4c3a-85ed-f8f7cd132e54	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	d5515c48-2ef4-46bb-a250-ed632373599b	2026-09-15 14:29:44.416354+03
5e9910d6-6e1a-4c72-896e-4eb56b966718	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	d1ac3118-99d3-4310-b6f4-f9be122e826a	2026-09-15 14:29:44.416354+03
6dda71fd-e726-4533-beb6-068bd811545c	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	8c675273-9680-40c8-98be-71f284f0e0db	2026-09-15 14:29:44.416354+03
49e8fc23-d617-4e7d-9038-423795e86900	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	8558d6a5-549d-44ab-8208-d67aa59206b2	2026-09-15 14:29:44.416354+03
935d8dd5-8974-48c2-ada5-060a76f10872	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	640bcbc8-1aa6-4432-9bbb-a2ebcd031048	2026-09-15 14:29:44.416354+03
5a1e4b06-e576-4098-8e62-2f0233d2d9e0	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	c619d9aa-62e6-45e7-b918-215a9d0f6d4f	2026-09-15 14:29:44.416354+03
ba232d34-45cb-4639-b905-65ad158b83ed	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	b5f587b0-ae4e-4931-9e2f-c2cefe088c3f	2026-09-15 14:29:44.416354+03
c78dfe00-ac29-4234-9c55-1278e4db0f48	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	8802d098-bcb0-400e-9caf-97d46fbd489d	2026-09-15 14:29:44.416354+03
9c1af164-c06d-4f35-bf46-73af1687f4d9	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	c743029e-1ff3-4e64-8b8a-2ef4e2bab420	2026-09-15 14:29:44.416354+03
3ab264e7-3cd9-4bc3-9736-65d01ddbacac	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	3a461bcb-79f6-4a97-b653-14f36f840460	2026-09-15 14:29:44.416354+03
1590c8b8-bdcc-44f5-9633-e93a57950f96	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	11a1552f-4b91-4778-806f-31757de861db	2026-09-15 14:29:44.416354+03
d09c5d9b-cf80-4c57-8180-7688581c4623	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	4bbf796f-09b1-4130-8f4d-50237bee46da	2026-09-15 14:29:44.416354+03
5d32e64f-bea6-462b-88f2-06211dbe3d20	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	e01d3ec7-65a2-4799-9a99-0676f6b56c9e	2026-09-15 14:29:44.416354+03
842888f8-95ca-4f4d-b80d-c3b6f1ba4dfe	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	92eeba98-4937-48e9-857c-4ef9529b3473	2026-09-15 14:29:44.416354+03
0b39e900-1b7a-45db-aa94-2a424f96b464	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	f5ef0bca-06bd-4a95-809d-f2f0b1855fd8	2026-09-15 14:29:44.416354+03
e1ee1e10-be03-4ad0-befb-cae41af9bad6	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	3737b9ca-cef3-4ac6-a9b3-ba5251e64752	2026-09-15 14:29:44.416354+03
9b90c5aa-3cda-439e-804e-22b5273d39ff	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	a20aab85-05e5-4c92-a506-b7bedb31813d	2026-09-15 14:29:44.416354+03
4d10c96e-85c0-4090-92d9-ac90a1a5ecb5	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	b1e34353-15a2-45d6-a419-d9ee51e96d32	2026-09-15 14:29:44.416354+03
9a83eaf9-1cd1-4319-b82f-683333008714	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	4ced8d85-c4e1-40b9-889a-a719065878e2	2026-09-15 14:29:44.416354+03
aac01a95-5420-4d01-bbf5-9dbae7985515	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	cbb708b1-81dd-4e81-9b36-cd31260cfbd8	2026-09-15 14:29:44.416354+03
d733bd78-a71c-48a9-99f8-faef0fe9e2a2	ad233712-296a-4aa6-89e3-3f90671d4a09	b693d32b-8067-4587-9c0d-82a3f2e1fbc4	2026-09-15 14:29:44.428615+03
d27a2d7d-d131-4f3b-b701-a654836f78fc	ad233712-296a-4aa6-89e3-3f90671d4a09	d5515c48-2ef4-46bb-a250-ed632373599b	2026-09-15 14:29:44.428615+03
ba244620-8e9a-4819-a816-1ec6f7cc42f2	ad233712-296a-4aa6-89e3-3f90671d4a09	640bcbc8-1aa6-4432-9bbb-a2ebcd031048	2026-09-15 14:29:44.428615+03
98dceaba-ed28-4f34-b833-5bcab7d3aec6	ad233712-296a-4aa6-89e3-3f90671d4a09	3a461bcb-79f6-4a97-b653-14f36f840460	2026-09-15 14:29:44.428615+03
c00f3562-a8e8-4e4c-9e91-15fc15ab2f5f	ad233712-296a-4aa6-89e3-3f90671d4a09	f5ef0bca-06bd-4a95-809d-f2f0b1855fd8	2026-09-15 14:29:44.428615+03
35eaed3d-3eec-4ac0-9812-a2aef37d1696	ad233712-296a-4aa6-89e3-3f90671d4a09	60a0c310-ebf7-4e2b-b0d7-fb7f4f30c157	2026-09-15 14:29:44.428615+03
23c81d37-e4bc-4e54-965a-c71310e43f54	ad233712-296a-4aa6-89e3-3f90671d4a09	31a70e29-5215-42b6-a1f7-ca5d84405656	2026-09-15 14:29:44.428615+03
e292e5be-f934-48f3-b253-131d5b0a7626	ad233712-296a-4aa6-89e3-3f90671d4a09	4ced8d85-c4e1-40b9-889a-a719065878e2	2026-09-15 14:29:44.428615+03
18522e4b-7efc-48ad-8e0a-c4ef02cd469b	ad233712-296a-4aa6-89e3-3f90671d4a09	cbb708b1-81dd-4e81-9b36-cd31260cfbd8	2026-09-15 14:29:44.428615+03
f6f08b60-cc87-438f-9cd1-1b1e78d150ac	14d607eb-4061-4320-af28-64b40ea58eee	b693d32b-8067-4587-9c0d-82a3f2e1fbc4	2026-09-15 14:29:44.447898+03
a43ead51-f359-49dc-bf81-47f5c406b8de	14d607eb-4061-4320-af28-64b40ea58eee	c743029e-1ff3-4e64-8b8a-2ef4e2bab420	2026-09-15 14:29:44.447898+03
3a13251c-7f7f-415a-ab6e-80ab05caa308	14d607eb-4061-4320-af28-64b40ea58eee	3a461bcb-79f6-4a97-b653-14f36f840460	2026-09-15 14:29:44.447898+03
5ee542a2-d4ee-40e3-8960-9c477085d88a	14d607eb-4061-4320-af28-64b40ea58eee	e01d3ec7-65a2-4799-9a99-0676f6b56c9e	2026-09-15 14:29:44.447898+03
741b14be-56e8-42c1-96e6-3e13e01ed9e0	14d607eb-4061-4320-af28-64b40ea58eee	92eeba98-4937-48e9-857c-4ef9529b3473	2026-09-15 14:29:44.447898+03
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, label_ar, label_en, description, is_system, created_at, updated_at, allowed_pages) FROM stdin;
42c9cdc5-7909-40c8-bf3b-f81cde1336ac	SUPER_ADMIN_OWNER	مالك النظام	Super Admin / Owner	Full unrestricted access — Finances, Settings, Profit split	t	2026-09-15 14:29:44.386261+03	2026-09-25 17:20:31.467966+03	["dashboard", "students", "teachers", "groups", "subjects", "subscriptions", "packages", "finance", "booklets", "qrcode", "gate", "users"]
ad233712-296a-4aa6-89e3-3f90671d4a09	FINANCE_MANAGER	مدير المالية	Finance Manager	Treasury, Teacher Settlements, POS Ledger, End-of-Day Closures	t	2026-09-15 14:29:44.386261+03	2026-09-25 17:20:31.467966+03	["dashboard", "students", "teachers", "groups", "subscriptions", "finance"]
14d607eb-4061-4320-af28-64b40ea58eee	RECEPTION_ASSISTANT	مساعد الاستقبال	Reception Assistant	Smart Attendance Gate scanning ONLY, Fast student lookup	t	2026-09-15 14:29:44.386261+03	2026-09-25 17:20:31.467966+03	["students", "subscriptions", "booklets", "gate"]
43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	CENTER_MANAGER	مدير السنتر	Center Manager	Schedules, Teachers, Students, General Operations & Reports	t	2026-09-15 14:29:44.386261+03	2026-09-26 03:51:06.571681+03	["dashboard", "students", "teachers", "groups", "subjects", "packages", "booklets", "qrcode", "gate"]
\.


--
-- Data for Name: student_package_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_package_enrollments (id, student_id, package_id, selected_group_ids, total_price, status, enrolled_at, notes) FROM stdin;
30653512-e23d-496e-b854-8120c774c88c	67b6345d-88ac-4d11-809a-cc837d4612c7	cda6f670-70c7-4b7c-808f-b55474e35751	{cb448ecc-b250-4b48-b3e1-76dbf3efcc1a}	300.00	active	2026-09-26 04:05:32.243281+03	\N
999cf650-c002-4705-a7ad-38e1ca4b4491	67b6345d-88ac-4d11-809a-cc837d4612c7	cda6f670-70c7-4b7c-808f-b55474e35751	{cb448ecc-b250-4b48-b3e1-76dbf3efcc1a}	300.00	active	2026-09-26 04:05:32.257814+03	اشتراك باكدج تجريبي من سكريبت الفحص
e0879e0a-f20f-4b9b-bb6e-d8d06cf6067d	fc09cabe-3b8f-4fd0-bc8a-5590fac1edb4	cda6f670-70c7-4b7c-808f-b55474e35751	{cb448ecc-b250-4b48-b3e1-76dbf3efcc1a,9af26238-d54e-4ad4-980e-03f578cb4b4c}	300.00	active	2026-09-26 04:06:21.274627+03	اشتراك باكدج تجريبي من سكريبت الفحص
8faa7314-b676-49f2-b04a-d7cd9f52123f	fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1	cda6f670-70c7-4b7c-808f-b55474e35751	{cb448ecc-b250-4b48-b3e1-76dbf3efcc1a}	70.00	active	2026-09-26 05:18:12.246141+03	مواد سنتر منفردة (1 مادة) - إجمالي السعر: 70 ج.م - الخصم: 0 ج.م - الصافي: 70 ج.م
7cd9728c-6f63-499d-af80-2e5267643208	fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1	cda6f670-70c7-4b7c-808f-b55474e35751	{cb448ecc-b250-4b48-b3e1-76dbf3efcc1a,9af26238-d54e-4ad4-980e-03f578cb4b4c}	300.00	active	2026-09-26 05:18:12.260479+03	اشتراك باكدج تجريبي من سكريبت الفحص
170f8792-74f6-478d-904f-576829a2521e	3f4d6618-7e31-441e-bc1b-d14bfd4f8d32	cda6f670-70c7-4b7c-808f-b55474e35751	{cb448ecc-b250-4b48-b3e1-76dbf3efcc1a}	70.00	active	2026-09-26 05:18:42.066989+03	مواد سنتر منفردة (1 مادة) - إجمالي السعر: 70 ج.م - الخصم: 0 ج.م - الصافي: 70 ج.م
08c9a312-3d90-43ad-abce-75370bd379ce	3f4d6618-7e31-441e-bc1b-d14bfd4f8d32	cda6f670-70c7-4b7c-808f-b55474e35751	{cb448ecc-b250-4b48-b3e1-76dbf3efcc1a,9af26238-d54e-4ad4-980e-03f578cb4b4c}	300.00	active	2026-09-26 05:18:42.08741+03	اشتراك باكدج تجريبي من سكريبت الفحص
930404fc-04bf-42d9-8614-1d1ada4492d3	d3cd5019-1818-478d-9e61-264a62b043bc	03f04240-4980-43dc-992d-0811f17edf25	{e2a924c2-485e-4fdf-8265-490b5feef955,3419633f-3643-4571-82fb-a3cb7a93ee11,9ebafcbb-2b3e-4828-b130-1d25792d0259,5debaf66-ad5f-409e-829f-424d88aa0bcb,81f6ecfc-bb49-4a9c-a1f3-645835a4b407,b804cc9a-ef86-4458-bbfa-7b972c0ba868,98f53257-b216-4351-805d-4ea6dd989766,c25c3d73-23f9-41df-aeef-330f399318f2}	710.00	active	2026-09-26 05:30:23.70968+03	الباكدج الكامل - إجمالي السعر: 710 ج.م - الخصم: 0 ج.م - الصافي: 710 ج.م
c2f5b752-1014-4c7c-8956-9cf6d8cc108d	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	03f04240-4980-43dc-992d-0811f17edf25	{e2a924c2-485e-4fdf-8265-490b5feef955,3419633f-3643-4571-82fb-a3cb7a93ee11,9ebafcbb-2b3e-4828-b130-1d25792d0259,5debaf66-ad5f-409e-829f-424d88aa0bcb,81f6ecfc-bb49-4a9c-a1f3-645835a4b407,b804cc9a-ef86-4458-bbfa-7b972c0ba868,98f53257-b216-4351-805d-4ea6dd989766,c25c3d73-23f9-41df-aeef-330f399318f2}	639.00	cleared	2026-09-26 10:29:00.580388+03	الباكدج الكامل - إجمالي السعر: 710 ج.م - الخصم: 71 ج.م - الصافي: 639 ج.م - تمت تصفية الباكدج بتاريخ 2026-09-26
681deeae-a340-4250-a6aa-c8edf3829e6f	3c888942-2f9e-4532-8935-399b985322ca	cda6f670-70c7-4b7c-808f-b55474e35751	{9af26238-d54e-4ad4-980e-03f578cb4b4c,cb448ecc-b250-4b48-b3e1-76dbf3efcc1a}	300.00	cleared	2026-09-26 21:33:19.239381+03	الباكدج الكامل - إجمالي السعر: 300 ج.م - الخصم: 0 ج.م - الصافي: 300 ج.م - تمت تصفية الباكدج بتاريخ 2026-09-26
bc28830f-34cc-45a1-9d15-7d9e39f01392	3c888942-2f9e-4532-8935-399b985322ca	cda6f670-70c7-4b7c-808f-b55474e35751	{003325da-d578-4e6a-be6e-1a90e877d9c5}	70.00	cleared	2026-09-26 21:33:39.477712+03	مواد سنتر منفردة (1 مادة) - إجمالي السعر: 70 ج.م - الخصم: 0 ج.م - الصافي: 70 ج.م - تمت تصفية الباكدج بتاريخ 2026-09-26
366d2a08-7609-4c7d-80bb-51e681d06086	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	5f5ea76a-df23-4077-a009-87cb90a1d3b4	{1b82140c-89ed-493c-b169-0b32f30a7414,6d96a141-1d92-4042-8eb1-e4aeeb382f46,edf6b3c6-4b6f-4a86-bf47-c6428efe5694,63bd7c77-81f7-4a52-a5ce-e7aa6f03af96,8cb9be9b-2642-494f-9f8b-23ea998a30c3,21d8e2e6-4f6c-427e-96ee-a1e118f29fc7}	235.00	cleared	2026-09-26 13:47:07.248546+03	الباكدج الكامل - إجمالي السعر: 260 ج.م - الخصم: 25 ج.م - الصافي: 235 ج.م - تمت تصفية الباكدج بتاريخ 2026-09-28
641bb877-f2b2-4f05-8f21-755ba9c621e5	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	5f5ea76a-df23-4077-a009-87cb90a1d3b4	{21d8e2e6-4f6c-427e-96ee-a1e118f29fc7,1b82140c-89ed-493c-b169-0b32f30a7414,6d96a141-1d92-4042-8eb1-e4aeeb382f46,edf6b3c6-4b6f-4a86-bf47-c6428efe5694,63bd7c77-81f7-4a52-a5ce-e7aa6f03af96,5f74f34d-5f46-45b2-b3e6-61346e86139d}	260.00	active	2026-09-28 01:56:58.731289+03	الباكدج الكامل - إجمالي السعر: 260 ج.م - الخصم: 0 ج.م - الصافي: 260 ج.م
\.


--
-- Data for Name: student_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_statuses (id, name_ar, name_en, discount_percent, color, is_active, created_at, updated_at) FROM stdin;
6395bfe4-f6be-43de-82c4-3fc29c03a13b	عادي	Regular	0.00	#0C3C82	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
33fae18b-91ad-441d-8b43-49b5469e1928	متفوق	Distinguished	10.00	#10B981	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
0348f3ab-58c7-4b36-81e2-85b7849b481f	يتيم	Orphan	50.00	#F59E0B	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
082c5669-ab7b-4133-921c-c1168ada820a	حالة خاصة	Special Case	25.00	#8B5CF6	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
56e64c66-61ee-43a4-a731-0d3438ce978f	ابن موظف	Staff Child	100.00	#0EA5E9	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
\.


--
-- Data for Name: student_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_subscriptions (id, student_id, group_id, total_sessions, used_sessions, amount_paid, amount_due, billing_month, status, starts_at, expires_at, notes, sync_status, created_at, updated_at, enrollment_type, discount_type, discount_value) FROM stdin;
7f4dd002-5e31-4074-8b64-7ae75586c1c3	d3cd5019-1818-478d-9e61-264a62b043bc	e2a924c2-485e-4fdf-8265-490b5feef955	4	0	88.75	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الأول الثانوي - لغات / تجريبي	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
b5a9bf4e-f25d-43d9-898f-6f72c7ba7e05	d3cd5019-1818-478d-9e61-264a62b043bc	9ebafcbb-2b3e-4828-b130-1d25792d0259	4	0	88.75	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الأول الثانوي - لغات / تجريبي	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
85b62702-c61c-4e70-b90a-d19d361f51c1	c5675508-afec-437c-b700-299df9b42c33	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2	2	100.00	0.00	2026-06	expired	\N	\N	تصفية حساب: رصيد 6 حصص (بقيمة 540 ج.م)، خصم مديونية 60 ج.م، صافي مسترد 100 ج.م.	local	2026-09-18 09:36:23.304664+03	2026-09-18 09:36:23.359503+03	PACKAGE	FIXED	0.00
36b8b54b-8d04-46e2-b72d-03731646b98e	c5675508-afec-437c-b700-299df9b42c33	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	4	100.00	0.00	2026-05	expired	\N	\N	تصفية حساب: رصيد 6 حصص (بقيمة 540 ج.م)، خصم مديونية 60 ج.م، صافي مسترد 100 ج.م.	local	2026-09-18 09:36:23.298559+03	2026-09-18 09:36:23.359503+03	PACKAGE	FIXED	0.00
02b70df8-dd5c-48df-89f0-36250fceee31	7a09dc6d-585a-42bd-b90d-a7b8c44fca31	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	0	0	350.00	0.00	2026-09	expired	\N	\N	تصفية حساب: رصيد 4 حصص (بقيمة 360 ج.م)، خصم مديونية 0 ج.م، صافي مسترد 360 ج.م.	local	2026-09-17 21:34:03.762622+03	2026-09-18 16:54:51.821515+03	PACKAGE	FIXED	0.00
2596386d-cde8-4a01-a8ef-fdc151ddaca0	c5675508-afec-437c-b700-299df9b42c33	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2	1	100.00	0.00	2026-09	active	\N	\N	\N	local	2026-09-18 09:36:23.371788+03	2026-09-18 09:36:23.41149+03	PACKAGE	FIXED	0.00
c3f3110e-9044-4bb3-8bd8-7e1cfd4f8bd0	d3cd5019-1818-478d-9e61-264a62b043bc	cb4a589d-470f-40a0-af41-c4885f97016f	1	1	480.00	0.00	2026-09	expired	\N	\N	تصفية حساب: رصيد 8 حصص (بقيمة 400 ج.م)، خصم مديونية 30 ج.م، صافي مسترد 370 ج.م.	local	2026-09-16 13:38:47.529185+03	2026-09-18 09:54:25.586141+03	PACKAGE	FIXED	0.00
d2a1c3a7-cdab-4913-a744-0890f45444a1	d3cd5019-1818-478d-9e61-264a62b043bc	5debaf66-ad5f-409e-829f-424d88aa0bcb	4	0	88.75	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الأول الثانوي - لغات / تجريبي	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
871fa83b-fb2d-45fb-a326-1d80c5340564	d3cd5019-1818-478d-9e61-264a62b043bc	b804cc9a-ef86-4458-bbfa-7b972c0ba868	4	0	88.75	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الأول الثانوي - لغات / تجريبي	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
6ce40b02-4330-47f1-81cf-d2c764146bfa	9594ff1a-7933-4178-b32e-6c95776c80a8	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	0	350.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 350 ج.م لمجموعة مجموعة أ للتجربة	local	2026-09-18 09:58:09.162648+03	2026-09-18 09:58:09.162648+03	PACKAGE	FIXED	0.00
d19bb10e-fdf8-4af4-a1c1-d9f8aec064a1	3c888942-2f9e-4532-8935-399b985322ca	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2	2	140.00	0.00	2026-07	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 9 حصة (صافي: 150 ج.م)	local	2026-09-18 09:36:03.489807+03	2026-09-26 21:33:26.70263+03	PACKAGE	FIXED	0.00
5b7ec639-4217-404d-bb29-c37bf8db3cc8	9594ff1a-7933-4178-b32e-6c95776c80a8	521ca9ea-fb0e-4750-8eda-992e40f01879	4	1	200.00	0.00	2026-09	active	\N	\N	تجديد 4 حصص لمجموعة مجموعة فحص التدقيق 7119	local	2026-09-18 17:32:01.581112+03	2026-09-28 01:51:26.052227+03	PACKAGE	FIXED	0.00
0b0910c2-36cb-435a-964d-86de75de82e2	ab67466a-f62a-4d3e-b823-ec8fbb90696a	003325da-d578-4e6a-be6e-1a90e877d9c5	0	0	50.00	0.00	2026-09	expired	\N	\N	تصفية حساب: رصيد 4 حصص (بقيمة 200 ج.م)، خصم مديونية 0 ج.م، صافي مسترد 200 ج.م.	local	2026-09-22 16:34:11.903234+03	2026-09-22 16:34:41.837455+03	PACKAGE	FIXED	0.00
6d83ed88-f621-4e8d-b301-b9ae66892221	d3cd5019-1818-478d-9e61-264a62b043bc	003325da-d578-4e6a-be6e-1a90e877d9c5	5	1	250.00	0.00	2026-09	active	\N	\N	تجديد 4 حصص لمجموعة مجموعة فحص التدقيق 1481	local	2026-09-18 09:54:54.749679+03	2026-09-28 17:04:31.705247+03	PACKAGE	FIXED	0.00
4fd19cd8-509f-4c82-bbd1-d16cca2bedd6	d3cd5019-1818-478d-9e61-264a62b043bc	3419633f-3643-4571-82fb-a3cb7a93ee11	4	1	88.75	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الأول الثانوي - لغات / تجريبي	local	2026-09-26 05:30:23.70968+03	2026-09-28 18:31:09.53886+03	PACKAGE	FIXED	0.00
20490a3b-39cb-4850-becc-ec5ac26828ca	4d2ee661-59b5-4cba-a77f-6966a8301c92	6f11d291-359d-403b-8d57-b4c0003b505b	0	0	200.00	0.00	2026-09	expired	\N	\N	تصفية حساب: رصيد 4 حصص (بقيمة 200 ج.م)، خصم مديونية 0 ج.م، صافي مسترد 200 ج.م.	local	2026-09-18 14:56:38.982311+03	2026-09-18 14:56:56.440996+03	PACKAGE	FIXED	0.00
7f7b099f-e9a5-43be-951c-25af7f3de10f	0b4d0dc9-6fb4-42a5-a108-5e17a126b786	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	1	1	100.00	0.00	2026-09	expired	\N	\N	تصفية حساب: رصيد 1 حصص (بقيمة 90 ج.م)، خصم مديونية 0 ج.م، صافي مسترد 90 ج.م.	local	2026-09-18 09:35:38.694305+03	2026-09-22 14:33:16.393339+03	PACKAGE	FIXED	0.00
a9071525-44e2-4b7a-8934-aa6bd1ed02fa	c5675508-afec-437c-b700-299df9b42c33	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2	2	140.00	0.00	2026-07	expired	\N	\N	تصفية حساب: رصيد 6 حصص (بقيمة 540 ج.م)، خصم مديونية 60 ج.م، صافي مسترد 100 ج.م.	local	2026-09-18 09:36:23.344702+03	2026-09-18 09:36:23.359503+03	PACKAGE	FIXED	0.00
fce93dad-276f-412a-9285-403ddf0fadc8	0b4d0dc9-6fb4-42a5-a108-5e17a126b786	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2	2	140.00	0.00	2026-07	expired	\N	\N	تصفية حساب: رصيد 1 حصص (بقيمة 90 ج.م)، خصم مديونية 0 ج.م، صافي مسترد 90 ج.م.	local	2026-09-18 09:35:38.670438+03	2026-09-22 14:33:16.393339+03	PACKAGE	FIXED	0.00
950fbd0f-8777-42a4-a484-70f20db4bf23	0b4d0dc9-6fb4-42a5-a108-5e17a126b786	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2	2	100.00	0.00	2026-06	expired	\N	\N	تصفية حساب: رصيد 1 حصص (بقيمة 90 ج.م)، خصم مديونية 0 ج.م، صافي مسترد 90 ج.م.	local	2026-09-18 09:35:38.616995+03	2026-09-22 14:33:16.393339+03	PACKAGE	FIXED	0.00
d29bf955-4956-4314-8e14-49cf09ea22af	0b4d0dc9-6fb4-42a5-a108-5e17a126b786	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	4	100.00	0.00	2026-05	expired	\N	\N	تصفية حساب: رصيد 1 حصص (بقيمة 90 ج.م)، خصم مديونية 0 ج.م، صافي مسترد 90 ج.م.	local	2026-09-18 09:35:38.610112+03	2026-09-22 14:33:16.393339+03	PACKAGE	FIXED	0.00
69698781-ff72-4374-accb-ac545ae4037a	67b6345d-88ac-4d11-809a-cc837d4612c7	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	0	350.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 350 ج.م لمجموعة مجموعة أ للتجربة	local	2026-09-26 04:11:39.164717+03	2026-09-26 04:11:39.164717+03	PACKAGE	FIXED	0.00
9b4b57c3-6f15-41c6-acb6-58baf8ca9c65	b2b7ccb0-0320-4770-b3ee-b1e9a27fec3e	9af26238-d54e-4ad4-980e-03f578cb4b4c	0	0	250.00	0.00	2026-09	expired	\N	\N	تصفية حساب: رصيد 4 حصص (بقيمة 260 ج.م)، خصم مديونية 0 ج.م، صافي مسترد 100 ج.م.	local	2026-09-24 05:20:34.199984+03	2026-09-24 05:39:35.58732+03	PACKAGE	FIXED	0.00
a47c8eee-cd59-4a85-a736-5624bec223dd	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	cb4a589d-470f-40a0-af41-c4885f97016f	0	0	4025.00	0.00	2026-09	expired	\N	\N	تصفية حساب: رصيد 4 حصص (بقيمة 200 ج.م)، خصم مديونية 0 ج.م، صافي مسترد 200 ج.م.	local	2026-09-16 13:38:53.060578+03	2026-09-24 19:44:14.481508+03	PACKAGE	PERCENT	50.00
8f5fecae-5c68-47c2-a727-c13db8b6ed2c	fc09cabe-3b8f-4fd0-bc8a-5590fac1edb4	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	0	350.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 350 ج.م لمجموعة مجموعة أ للتجربة	local	2026-09-26 04:11:40.924872+03	2026-09-26 04:11:40.924872+03	PACKAGE	FIXED	0.00
e28a4e26-218b-4ea3-810a-4b69e60e6eff	fc09cabe-3b8f-4fd0-bc8a-5590fac1edb4	9af26238-d54e-4ad4-980e-03f578cb4b4c	4	0	250.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 250 ج.م لمجموعة مجموعة النخبة - لغة عربية أ/ حسام	local	2026-09-26 04:11:42.874306+03	2026-09-26 04:11:42.874306+03	PACKAGE	FIXED	0.00
5c1cd5e3-9ba9-416e-af09-72b9c07ef21b	fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	0	70.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 150 ج.م لمجموعة مجموعة أ للتجربة	local	2026-09-26 05:18:12.246141+03	2026-09-26 05:29:03.608916+03	PACKAGE	FIXED	0.00
7652a192-dde5-4269-b1be-893a4f65ea59	fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	0	150.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 70 ج.م لمجموعة مجموعة أ للتجربة	local	2026-09-26 05:18:12.260479+03	2026-09-26 05:29:10.220624+03	PACKAGE	FIXED	0.00
b9cf2e4f-3274-4275-859f-6794812adc54	d3cd5019-1818-478d-9e61-264a62b043bc	c25c3d73-23f9-41df-aeef-330f399318f2	4	0	88.75	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الأول الثانوي - لغات / تجريبي	local	2026-09-26 05:30:23.70968+03	2026-09-26 05:30:23.70968+03	PACKAGE	FIXED	0.00
9d5e4f74-7010-40d8-a297-18556d8bc084	3c888942-2f9e-4532-8935-399b985322ca	003325da-d578-4e6a-be6e-1a90e877d9c5	0	0	70.00	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 4 حصة (صافي: 70 ج.م)	local	2026-09-26 21:33:39.477712+03	2026-09-26 21:33:45.149748+03	PACKAGE	FIXED	0.00
8914b339-813b-40fb-8c00-fa01faa83ef5	d3cd5019-1818-478d-9e61-264a62b043bc	98f53257-b216-4351-805d-4ea6dd989766	4	1	88.75	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الأول الثانوي - لغات / تجريبي	local	2026-09-26 05:30:23.70968+03	2026-09-29 21:55:40.531381+03	PACKAGE	FIXED	0.00
fb8d9fab-5737-4601-bea5-bcdeab0ed883	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	c25c3d73-23f9-41df-aeef-330f399318f2	0	0	79.88	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 32 حصة (صافي: 639 ج.م)	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
4d1c3bb1-0c45-4e09-ab18-f099272c4bc7	fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1	9af26238-d54e-4ad4-980e-03f578cb4b4c	4	0	150.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 150 ج.م لمجموعة مجموعة النخبة - لغة عربية أ/ حسام	local	2026-09-26 05:18:12.260479+03	2026-09-26 05:29:05.323936+03	PACKAGE	FIXED	0.00
0105c0b9-91af-4525-bfb4-6086f03c5cb5	3f4d6618-7e31-441e-bc1b-d14bfd4f8d32	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	0	70.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 150 ج.م لمجموعة مجموعة أ للتجربة	local	2026-09-26 05:18:42.066989+03	2026-09-26 05:29:07.054758+03	PACKAGE	FIXED	0.00
f14cd50d-52a8-47a8-9ac2-f702989e5bf9	d3cd5019-1818-478d-9e61-264a62b043bc	81f6ecfc-bb49-4a9c-a1f3-645835a4b407	4	1	88.75	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الأول الثانوي - لغات / تجريبي	local	2026-09-26 05:30:23.70968+03	2026-09-26 20:32:55.771723+03	PACKAGE	FIXED	0.00
0d30af0c-ab00-44a1-95d7-58cca1718bec	3f4d6618-7e31-441e-bc1b-d14bfd4f8d32	9af26238-d54e-4ad4-980e-03f578cb4b4c	4	0	150.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 150 ج.م لمجموعة مجموعة النخبة - لغة عربية أ/ حسام	local	2026-09-26 05:18:42.08741+03	2026-09-26 05:29:08.457756+03	PACKAGE	FIXED	0.00
bbad8266-3c79-4623-91c9-69bfbd59ccd1	3f4d6618-7e31-441e-bc1b-d14bfd4f8d32	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	0	150.00	0.00	2026-09	active	\N	\N	سداد مديونية اشتراك: 70 ج.م لمجموعة مجموعة أ للتجربة	local	2026-09-26 05:18:42.08741+03	2026-09-26 05:29:12.584775+03	PACKAGE	FIXED	0.00
66a4a3b4-a48e-493c-9946-f4176b7bf74b	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	e2a924c2-485e-4fdf-8265-490b5feef955	0	0	79.88	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 32 حصة (صافي: 639 ج.م)	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
c38bd555-1a49-450b-91b0-6391d76b1ba9	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	3419633f-3643-4571-82fb-a3cb7a93ee11	0	0	79.88	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 32 حصة (صافي: 639 ج.م)	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
cbe4fbce-e697-4b6a-b677-9c2fe11edc59	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	9ebafcbb-2b3e-4828-b130-1d25792d0259	0	0	79.88	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 32 حصة (صافي: 639 ج.م)	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
3e3a2f6d-26a0-4826-8c80-b869f428deb6	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	5debaf66-ad5f-409e-829f-424d88aa0bcb	0	0	79.88	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 32 حصة (صافي: 639 ج.م)	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
5f6db7d3-ba78-4ea9-83d8-2df04074334d	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	81f6ecfc-bb49-4a9c-a1f3-645835a4b407	0	0	79.88	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 32 حصة (صافي: 639 ج.م)	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
d0e6dd42-47f2-4317-bb64-04ea72a869f5	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	b804cc9a-ef86-4458-bbfa-7b972c0ba868	0	0	79.88	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 32 حصة (صافي: 639 ج.م)	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
4e10b84e-2120-46a2-8990-a32aa92475d5	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	98f53257-b216-4351-805d-4ea6dd989766	0	0	79.88	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 32 حصة (صافي: 639 ج.م)	local	2026-09-26 10:29:00.580388+03	2026-09-26 13:02:35.334438+03	PACKAGE	PERCENT	10.00
82d01f47-db9f-4de9-89e0-c3658ccb0661	3c888942-2f9e-4532-8935-399b985322ca	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	2	2	100.00	0.00	2026-06	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 9 حصة (صافي: 150 ج.م)	local	2026-09-18 09:36:03.447417+03	2026-09-26 21:33:26.70263+03	PACKAGE	FIXED	0.00
2933bd97-4a02-4ce5-9f18-83b1cc00127a	3c888942-2f9e-4532-8935-399b985322ca	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	4	4	100.00	0.00	2026-05	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 9 حصة (صافي: 150 ج.م)	local	2026-09-18 09:36:03.44108+03	2026-09-26 21:33:26.70263+03	PACKAGE	FIXED	0.00
505f12aa-aa28-4c2c-8ab3-f5716df5607d	3c888942-2f9e-4532-8935-399b985322ca	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	1	1	100.00	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 9 حصة (صافي: 150 ج.م)	local	2026-09-18 09:36:03.510958+03	2026-09-26 21:33:26.70263+03	PACKAGE	FIXED	0.00
5ccd3d68-c2b6-4c73-9af4-2d3d2551e6df	3c888942-2f9e-4532-8935-399b985322ca	9af26238-d54e-4ad4-980e-03f578cb4b4c	0	0	150.00	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 9 حصة (صافي: 150 ج.م)	local	2026-09-26 21:33:19.239381+03	2026-09-26 21:33:26.70263+03	PACKAGE	FIXED	0.00
5a41568c-38ea-4efd-93f3-5b290556a0b1	3c888942-2f9e-4532-8935-399b985322ca	cb448ecc-b250-4b48-b3e1-76dbf3efcc1a	0	0	150.00	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 9 حصة (صافي: 150 ج.م)	local	2026-09-26 21:33:19.239381+03	2026-09-26 21:33:26.70263+03	PACKAGE	FIXED	0.00
3df45227-aa5b-4430-8532-84a30671b784	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	6d96a141-1d92-4042-8eb1-e4aeeb382f46	0	0	39.17	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 23 حصة (صافي: 225 ج.م)	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:37.926361+03	PACKAGE	FIXED	25.00
32bb5f6e-b697-4721-acfb-01b6085075f3	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	edf6b3c6-4b6f-4a86-bf47-c6428efe5694	0	0	39.17	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 23 حصة (صافي: 225 ج.م)	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:37.926361+03	PACKAGE	FIXED	25.00
bb1011c8-b79a-4538-ba4a-57d2cb8cdea5	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	63bd7c77-81f7-4a52-a5ce-e7aa6f03af96	0	0	39.16	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 23 حصة (صافي: 225 ج.م)	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:37.926361+03	PACKAGE	FIXED	25.00
1e1e8474-fdca-4f26-9ce4-177df52a7067	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	8cb9be9b-2642-494f-9f8b-23ea998a30c3	0	0	39.17	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 23 حصة (صافي: 225 ج.م)	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:37.926361+03	PACKAGE	FIXED	25.00
ac98c6d1-d920-4a39-abb8-ae684f96de1c	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	21d8e2e6-4f6c-427e-96ee-a1e118f29fc7	0	0	39.16	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 23 حصة (صافي: 225 ج.م)	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:37.926361+03	PACKAGE	FIXED	25.00
4525a7f4-f5bc-4f60-86ff-01b63f80e932	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	1b82140c-89ed-493c-b169-0b32f30a7414	1	1	39.17	0.00	2026-09	expired	\N	\N	تمت تصفية الباكدج بالكامل واسترداد رصيد 23 حصة (صافي: 225 ج.م)	local	2026-09-26 13:47:07.248546+03	2026-09-28 01:56:37.926361+03	PACKAGE	FIXED	25.00
0624629c-4643-462e-bc2f-89be71f072c8	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	1b82140c-89ed-493c-b169-0b32f30a7414	4	0	43.33	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الرابع الابتدائي - حكومي / عربي	local	2026-09-28 01:56:58.731289+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
e9d85a6a-a04f-4f24-ad41-bb73b27889b4	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	6d96a141-1d92-4042-8eb1-e4aeeb382f46	4	0	43.34	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الرابع الابتدائي - حكومي / عربي	local	2026-09-28 01:56:58.731289+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
1471ca68-5df7-4f3f-ae67-71cf9bc6960e	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	edf6b3c6-4b6f-4a86-bf47-c6428efe5694	4	0	43.33	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الرابع الابتدائي - حكومي / عربي	local	2026-09-28 01:56:58.731289+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
7941a077-aa4a-4db7-8fbb-52c4089adc25	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	63bd7c77-81f7-4a52-a5ce-e7aa6f03af96	4	0	43.34	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الرابع الابتدائي - حكومي / عربي	local	2026-09-28 01:56:58.731289+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
11119526-cce7-436b-9804-f0c504f6aa7f	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	5f74f34d-5f46-45b2-b3e6-61346e86139d	4	0	43.33	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الرابع الابتدائي - حكومي / عربي	local	2026-09-28 01:56:58.731289+03	2026-09-28 01:56:58.731289+03	PACKAGE	FIXED	0.00
b5a7aac2-969d-47cd-af22-f96f018214d8	d50ce1fc-7e42-4e55-9148-e9a8cdc40008	21d8e2e6-4f6c-427e-96ee-a1e118f29fc7	4	1	43.33	0.00	2026-09	active	\N	\N	اشتراك الباكدج الكامل - باكدج: الصف الرابع الابتدائي - حكومي / عربي	local	2026-09-28 01:56:58.731289+03	2026-09-29 21:55:40.479038+03	PACKAGE	FIXED	0.00
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, barcode_id, full_name, full_name_ar, phone, parent_phone, parent_name, grade_id, status_id, billing_model, photo_url, address, notes, is_active, sync_status, remote_id, created_at, updated_at, student_code, education_type, enrollment_type, father_phone, mother_phone, gender, national_id, date_of_birth) FROM stdin;
d3cd5019-1818-478d-9e61-264a62b043bc	ATL-G10-1003	عمر خالد الشربيني	\N	01122334455	01055556666	خالد الشربيني	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	\N	\N	\N	t	local	\N	2026-09-15 17:31:39.157309+03	2026-09-15 17:31:39.157309+03	1003	PUBLIC	PACKAGE	\N	\N	male	\N	\N
67b6345d-88ac-4d11-809a-cc837d4612c7	ATL-G01-1016	طالب اختبار الباكدج الذكي	\N	01282743376	01282743376	ولي أمر الطالب	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	\N	t	local	\N	2026-09-26 04:05:32.22088+03	2026-09-26 04:05:32.22088+03	1016	PUBLIC	PACKAGE	\N	\N	male	\N	\N
b2b7ccb0-0320-4770-b3ee-b1e9a27fec3e	ATL-G01-1006	طالب اختبار التدقيق 1782	\N	01012592535	\N	\N	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	\N	t	local	\N	2026-09-18 09:12:21.80346+03	2026-09-18 09:12:21.80346+03	1006	PUBLIC	PACKAGE	\N	\N	male	\N	\N
9594ff1a-7933-4178-b32e-6c95776c80a8	ATL-G01-1007	طالب اختبار التدقيق 1418	\N	01035098834	\N	\N	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	\N	t	local	\N	2026-09-18 09:12:41.426948+03	2026-09-18 09:12:41.426948+03	1007	PUBLIC	PACKAGE	\N	\N	male	\N	\N
0b4d0dc9-6fb4-42a5-a108-5e17a126b786	ATL-G01-1008	طالب تدقيق الصلاحيات 8564	\N	01147209388	\N	\N	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	تم التحديث بنجاح بواسطة موظف الاستقبال	t	local	\N	2026-09-18 09:35:38.569449+03	2026-09-18 09:35:38.584297+03	1008	PUBLIC	PACKAGE	\N	\N	male	\N	\N
3c888942-2f9e-4532-8935-399b985322ca	ATL-G01-1009	طالب تدقيق الصلاحيات 3397	\N	01169253873	\N	\N	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	تم التحديث بنجاح بواسطة موظف الاستقبال	t	local	\N	2026-09-18 09:36:03.405269+03	2026-09-18 09:36:03.418859+03	1009	PUBLIC	PACKAGE	\N	\N	male	\N	\N
c5675508-afec-437c-b700-299df9b42c33	ATL-G01-1010	طالب تدقيق الصلاحيات 3255	\N	01146319313	\N	\N	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	تم التحديث بنجاح بواسطة موظف الاستقبال	t	local	\N	2026-09-18 09:36:23.259802+03	2026-09-18 09:36:23.271893+03	1010	PUBLIC	PACKAGE	\N	\N	male	\N	\N
ab67466a-f62a-4d3e-b823-ec8fbb90696a	ATL-G01-1011	طالب اختبار التدقيق 7083	\N	01018702267	\N	\N	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	\N	t	local	\N	2026-09-18 09:36:27.087684+03	2026-09-18 09:36:27.087684+03	1011	PUBLIC	PACKAGE	\N	\N	male	\N	\N
7a09dc6d-585a-42bd-b90d-a7b8c44fca31	ATL-G08-1005	يوسف	\N	01027653886	01228156166	عباس	79842e52-6787-4773-b13f-5d8abf4c5043	56e64c66-61ee-43a4-a731-0d3438ce978f	PACKAGE_BUNDLE	\N	\N	متخلف	t	local	\N	2026-09-16 16:27:54.413132+03	2026-09-18 16:14:48.487965+03	1005	PUBLIC	PACKAGE	\N	\N	male	\N	\N
fc09cabe-3b8f-4fd0-bc8a-5590fac1edb4	ATL-G01-1017	طالب اختبار الباكدج الذكي	\N	01280662073	01280662073	ولي أمر الطالب	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	\N	t	local	\N	2026-09-26 04:06:21.233784+03	2026-09-26 04:06:21.233784+03	1017	PUBLIC	PACKAGE	\N	\N	male	\N	\N
fda6cb8e-b97f-4699-a4c7-1c65f2fbedf1	ATL-G01-1019	طالب اختبار الباكدج الذكي	\N	01297393974	01297393974	ولي أمر الطالب	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	\N	t	local	\N	2026-09-26 05:18:12.216637+03	2026-09-26 05:18:12.216637+03	1019	PUBLIC	PACKAGE	\N	\N	male	\N	\N
3f4d6618-7e31-441e-bc1b-d14bfd4f8d32	ATL-G01-1020	طالب اختبار الباكدج الذكي	\N	01229563551	01229563551	ولي أمر الطالب	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	\N	\N	\N	t	local	\N	2026-09-26 05:18:42.029228+03	2026-09-26 05:18:42.029228+03	1020	PUBLIC	PACKAGE	\N	\N	male	\N	\N
4d2ee661-59b5-4cba-a77f-6966a8301c92	ATL-G09-1012	ادمن	\N	01224385090	\N	\N	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	/uploads/students/students_91986ccaf599adb20170aea290904a3bd47769e99d07192b.webp	شارع الجمهورية - الدور الثالث	طالب مميز	t	local	\N	2026-09-18 14:53:43.272563+03	2026-09-26 05:18:50.092032+03	1012	PUBLIC	PACKAGE	01011112222	01122223333	male	29901011234567	2008-03-15
d50ce1fc-7e42-4e55-9148-e9a8cdc40008	ATL-G04-1004	عبدالله اختبار	\N	01224385098	01224385090	محمد علي محمد	9833561e-f6fb-43b9-b9d4-152b41863bc5	0348f3ab-58c7-4b36-81e2-85b7849b481f	PACKAGE_BUNDLE	\N	\N	0	t	local	\N	2026-09-16 04:03:41.70366+03	2026-09-26 13:06:21.533695+03	1004	PUBLIC	PACKAGE	\N	\N	male	\N	\N
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (id, name_ar, name_en, code, color, is_active, sync_status, created_at, updated_at, education_type) FROM stdin;
ee099c24-42fa-4519-822e-93bf0b556a05	الكيمياء	Chemistry	CHM	#EF4444	t	local	2026-09-15 14:29:44.467388+03	2026-09-15 14:29:44.467388+03	general
af504fc9-7db3-4e00-9b78-5eb2a73f32c8	الأحياء	Biology	BIO	#22C55E	t	local	2026-09-15 14:29:44.467388+03	2026-09-15 14:29:44.467388+03	general
9e606e1c-0cc5-47dd-872e-8cb39a9bfab9	الجيولوجيا	Geology	GEO	#A855F7	t	local	2026-09-15 14:29:44.467388+03	2026-09-15 14:29:44.467388+03	general
737b6229-6334-41c4-b878-8f3dbb0e9663	الفيزياء	Physics	PHYS	#0EA5E9	t	local	2026-09-15 17:31:39.124069+03	2026-09-15 17:31:39.124069+03	general
c765d90b-12d2-493d-969f-c55f2bcf61c2	الفقه والأصول	Fiqh	FQH	#059669	t	local	2026-09-16 04:24:56.632757+03	2026-09-16 04:24:56.632757+03	azhar
95bddeb2-f4c1-466b-b928-102fa15be97c	التفسير والحديث	Tafsir & Hadith	THF	#10B981	t	local	2026-09-16 04:24:56.632757+03	2026-09-16 04:24:56.632757+03	azhar
2e60049a-8329-4743-86aa-b0b3b5882a27	التوحيد والسيرة	Tawhid	TWD	#047857	t	local	2026-09-16 04:24:56.632757+03	2026-09-16 04:24:56.632757+03	azhar
3842cd93-85b7-46d0-a334-47d007f9c936	الفيزياء	Physics	PHY	#06B6D4	t	local	2026-09-15 14:29:44.467388+03	2026-09-16 16:35:16.441568+03	general
d9620fc2-df55-418d-9a9d-aeae69e8e2c3	اللغة العربية	Arabic	ARA	#16a34a	t	local	2026-09-15 14:29:44.467388+03	2026-09-26 10:55:32.400343+03	general
37455367-fad4-4bb6-87d8-4b2d0ec9da10	اللغة الإنجليزية	English	ENG	#2563eb	t	local	2026-09-15 14:29:44.467388+03	2026-09-26 10:55:32.400343+03	general
f4e734d7-0612-46bc-bfc0-1450fdc253f0	الرياضيات	Mathematics	MTH	#d97706	t	local	2026-09-15 14:29:44.467388+03	2026-09-26 10:55:32.400343+03	general
ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	العلوم	Science	SCI	#0891b2	t	local	2026-09-15 14:29:44.467388+03	2026-09-26 10:55:32.400343+03	general
d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	الدراسات الاجتماعية	Social Studies	SOC	#ca8a04	t	local	2026-09-15 14:29:44.467388+03	2026-09-26 10:55:32.400343+03	general
b59175b2-1b28-4825-8179-8557160906dc	تكنولوجيا المعلومات والاتصالات ICT	\N	ICT	#7c3aed	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
13e61af9-7072-46de-9141-d85e764dc20a	Math (الرياضيات لغات)	\N	MATH-EN	#ea580c	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
cae85df3-e30e-4e9e-89e4-4645bf9918c4	Science (العلوم لغات)	\N	SCI-EN	#0284c7	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
640f4d8d-69e4-47ad-9682-863a1c9158b7	اللغة الفرنسية	French	FRN	#9333ea	t	local	2026-09-15 14:29:44.467388+03	2026-09-26 10:55:32.400343+03	general
3954d6f5-1bff-49b1-bb06-60c852e8910b	العلوم الشرعية والأزهرية	\N	SHAR	#059669	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
9f9b6f17-3ad9-459f-b640-0d3d2f988ea8	الفلسفة والمنطق	\N	PHIL	#4f46e5	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
4815ecec-0d9f-466f-a6c6-b88364951f89	البرمجة وعلوم الحاسب	\N	PROG	#0d9488	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
a30f912c-914f-4a2a-87cb-c998dd144a0c	العلوم المتكاملة (Integrated Science)	\N	INT-SCI	#0284c7	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
3d11fe4b-c72d-47bc-9bc8-6cab0c484836	اللغة الإيطالية	\N	ITA	#e11d48	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
53e7da3c-8cdc-4c19-9747-72c6cd90001d	التاريخ	\N	HIST	#b45309	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, key, value, value_type, category, label_ar, label_en, is_public, updated_by, created_at, updated_at) FROM stdin;
e22779fb-114f-40e5-afe8-1f31fbc71982	center_name	سنتر أطلس	string	general	اسم السنتر	Center Name	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
a8f58fd5-34c2-4bd5-9058-7ecef5f11400	center_name_en	Atlas Center	string	general	اسم السنتر بالإنجليزية	Center Name (English)	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
57f49016-276a-4572-a14c-604ee545a90e	currency	EGP	string	billing	العملة	Currency	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
bebecdfc-f282-4e47-ad8f-9973444aa1d0	default_package_sessions	4	number	billing	عدد الحصص الافتراضي في الباقة	Default Package Sessions	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
71d88112-c49b-45f4-941f-fd1b8e5694b5	multi_session_gap_minutes	60	number	attendance	الحد الأقصى للفاصل بين الحصص المتتالية (بالدقائق)	Multi-Session Max Gap (Minutes)	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
92a6310e-5adb-4e38-a69b-2c2d6598c39b	attendance_early_allowance_minutes	30	number	attendance	وقت السماح بالحضور قبل الحصة (بالدقائق)	Early Attendance Allowance (Minutes)	f	\N	2026-09-28 03:41:25.693362+03	2026-09-28 03:58:11.448375+03
d048fa02-16d5-469b-89cd-531af0af78e5	attendance_late_allowance_minutes	30	number	attendance	وقت السماح بالحضور بعد انتهاء الحصة (بالدقائق)	Late Attendance Allowance (Minutes)	f	\N	2026-09-28 03:41:25.693362+03	2026-09-28 03:58:11.448375+03
daf4c0e2-5f47-40e6-8a8b-7a2f75af7fad	session_duration_minutes	90	number	schedule	مدة الحصة بالدقائق	Session Duration (Minutes)	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
4087326c-d507-4c5c-8614-4a5d1fb71d7c	attendance_debounce_ms	300	number	attendance	مدة منع التكرار بالميللي ثانية	Attendance Debounce (ms)	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
ffb2de7c-0915-4927-a008-180e151d181c	barcode_prefix	ATL	string	barcode	بادئة الباركود	Barcode Prefix	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
185d0f2b-3e30-4772-889c-fcdaef293e93	barcode_pattern	ATL-G{grade}-{seq}	string	barcode	نمط الباركود	Barcode Pattern	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
636dd69c-8dfd-471e-8a84-6c23b54fecbf	thermal_sticker_width_mm	50	number	printing	عرض الملصق	Sticker Width (mm)	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
1d138489-34ec-4aa4-a4a3-5a0e6458c5ba	thermal_sticker_height_mm	25	number	printing	ارتفاع الملصق	Sticker Height (mm)	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
474ed202-078c-46ec-ab0d-ab20f28e5beb	sync_enabled	false	boolean	sync	تفعيل المزامنة	Enable Sync	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
3fa8a290-a2e4-4923-92cd-710e32a0ab50	sync_remote_url		string	sync	عنوان السيرفر البعيد	Remote Server URL	f	\N	2026-09-15 14:29:44.486698+03	2026-09-28 03:58:11.448375+03
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teachers (id, full_name, full_name_ar, phone, email, specialization, revenue_split_percent, revenue_split_type, fixed_rate_per_student, is_active, notes, sync_status, remote_id, created_at, updated_at, subject_id, subject_ids, aka, gender, national_id, bio, social_links, secretary_name, secretary_phone, photo_url, logo_url, date_of_birth) FROM stdin;
3aa2fc39-0417-45c7-af5b-ba4c4f44ed29	أ/ صبحي محمد ، أ/ محمد علاء	\N	01050001014	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ صبحي محمد ، أ/ محمد علاء	male	\N	\N	{}	\N	\N	\N	\N	\N
b052f5f1-e588-4d0d-8266-910bf73b6183	مستر/ إسلام عبد الجليل ، مستر/ محمد العربي	\N	01050001015	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	مستر/ إسلام عبد الجليل ، مستر/ محمد العربي	male	\N	\N	{}	\N	\N	\N	\N	\N
1f1a369f-51e4-4e00-b27d-4c2961bffb5f	ميس/ آية آدم ، أ/ أحمد عثمان ، أ/ أحمد عبد الله	\N	01050001016	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ آية آدم ، أ/ أحمد عثمان ، أ/ أحمد عبد الله	male	\N	\N	{}	\N	\N	\N	\N	\N
35a30e35-35f7-4527-a6e1-3cd61481cda4	أ/ محمد سعيد	\N	01050001017	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمد سعيد	male	\N	\N	{}	\N	\N	\N	\N	\N
6924d0f7-ff06-40e8-8472-d3ea57382637	أ/ محمد صلاح	\N	01050001018	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمد صلاح	male	\N	\N	{}	\N	\N	\N	\N	\N
78443196-52fd-486e-87e7-fdffa6d41a41	أ/ محمود طارق	\N	01050001019	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمود طارق	male	\N	\N	{}	\N	\N	\N	\N	\N
b056d2d3-449c-4eb5-8df8-12a2f26b713f	أ/ آلاء محمد	\N	01050001020	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ آلاء محمد	male	\N	\N	{}	\N	\N	\N	\N	\N
bbc8cd65-dd65-44d4-a18d-75faced278af	أ/ ياسمين مجدي	\N	01050001021	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ ياسمين مجدي	male	\N	\N	{}	\N	\N	\N	\N	\N
610a1230-9e73-4a55-96de-8005dec2b99c	أ/ ياسمين حسن	\N	01050001022	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ ياسمين حسن	male	\N	\N	{}	\N	\N	\N	\N	\N
3bfa89ba-9d01-4471-94a2-a2f4fdf92a02	أ/ مروان & ميس/ دنيا	\N	01050001001	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ مروان & ميس/ دنيا	male	\N	\N	{}	\N	\N	\N	\N	\N
7faa099e-960f-4735-abed-4f0598bec1d6	ميس/ آلاء علاء	\N	01050001002	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ آلاء علاء	male	\N	\N	{}	\N	\N	\N	\N	\N
834c2bd4-8b69-4b87-988f-b6e832d18a2a	أ/ أحمد محمود ، أ/ أدهم هاني	\N	01050001003	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ أحمد محمود ، أ/ أدهم هاني	male	\N	\N	{}	\N	\N	\N	\N	\N
b8716661-858e-475a-b196-1193f8d1e7f3	أ/ حازم	\N	01050001004	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ حازم	male	\N	\N	{}	\N	\N	\N	\N	\N
fc09ef0c-2902-40fc-890b-f542c976857f	ميس/ إيناس	\N	01050001005	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ إيناس	male	\N	\N	{}	\N	\N	\N	\N	\N
4108ea95-9336-432a-bcbd-40191870bdad	أ/ شيماء ، أ/ محمود رشاد	\N	01050001006	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ شيماء ، أ/ محمود رشاد	male	\N	\N	{}	\N	\N	\N	\N	\N
3edf073c-59cf-4380-95f7-fc02a8acb0ad	أ/ أحمد عثمان	\N	01050001007	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ أحمد عثمان	male	\N	\N	{}	\N	\N	\N	\N	\N
ff0318b1-ce3c-4cf1-a609-429c021ae578	ميس/ نهلة	\N	01050001008	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ نهلة	male	\N	\N	{}	\N	\N	\N	\N	\N
5d7f6ee4-7311-4f1d-9780-0c8734becad2	ميس/ ياسمين	\N	01050001009	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ ياسمين	male	\N	\N	{}	\N	\N	\N	\N	\N
54ebf7b9-8b3f-4be8-a6f2-a15c03b7db4a	ميس/ شيماء ، أ/ محمود رشاد	\N	01050001010	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ شيماء ، أ/ محمود رشاد	male	\N	\N	{}	\N	\N	\N	\N	\N
f112b8b5-5fd2-4470-a98e-c703783b7b38	أ/ ياسمين	\N	01050001011	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ ياسمين	male	\N	\N	{}	\N	\N	\N	\N	\N
39698159-25ca-479c-a3b1-b70aa63db586	ميس/ هبة	\N	01050001012	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ هبة	male	\N	\N	{}	\N	\N	\N	\N	\N
9b22cbc2-1144-4527-bcde-6798e1329528	أ/ أسماء	\N	01050001013	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ أسماء	male	\N	\N	{}	\N	\N	\N	\N	\N
96aeaf7f-0359-4028-ac1d-aa1e2b6b1177	أ/ محمد بكير ، أ/ محمد عادل	\N	01050001023	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمد بكير ، أ/ محمد عادل	male	\N	\N	{}	\N	\N	\N	\N	\N
4334fbf6-0951-49bb-8611-0bcb95ac718a	أ/ أحمد عبد الله ، أ/ أحمد عثمان ، ميس/ آية آدم	\N	01050001024	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ أحمد عبد الله ، أ/ أحمد عثمان ، ميس/ آية آدم	male	\N	\N	{}	\N	\N	\N	\N	\N
48afae2d-181a-4d53-bd23-243b6bf061d9	مسيو/ خالد النصيري	\N	01050001025	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	مسيو/ خالد النصيري	male	\N	\N	{}	\N	\N	\N	\N	\N
b1d23568-bdb0-4a7d-9b8e-4cfd6b909a2c	ميس/ ياسمين حسن	\N	01050001026	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ ياسمين حسن	male	\N	\N	{}	\N	\N	\N	\N	\N
34290997-d379-4a46-b5df-9a54f1d0d64e	ميس/ ندى	\N	01050001027	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ ندى	male	\N	\N	{}	\N	\N	\N	\N	\N
8b885eaf-49d8-4cba-b644-73ad76688b7d	أ/ محمد عادل ، أ/ محمد بكير	\N	01050001028	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمد عادل ، أ/ محمد بكير	male	\N	\N	{}	\N	\N	\N	\N	\N
4343e658-80c4-49e8-8b00-550d6e7c2aff	أ/ محمد علاء	\N	01050001029	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمد علاء	male	\N	\N	{}	\N	\N	\N	\N	\N
889dfb93-0ee3-4a65-84ad-55a1b68adc28	مستر/ إسلام عبد الجليل	\N	01050001030	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	مستر/ إسلام عبد الجليل	male	\N	\N	{}	\N	\N	\N	\N	\N
e42e23bf-f742-4727-b676-d11acfee67fb	ميس/ آية آدم ، أ/ أحمد عبد الله	\N	01050001031	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ آية آدم ، أ/ أحمد عبد الله	male	\N	\N	{}	\N	\N	\N	\N	\N
e7f458cf-7618-477a-b0ce-87181ff1f3f6	أ/ ندى	\N	01050001032	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ ندى	male	\N	\N	{}	\N	\N	\N	\N	\N
720490db-edde-4242-8416-a70f7e0c2885	أ/ أحمد عبد الله ، ميس/ آية آدم	\N	01050001033	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ أحمد عبد الله ، ميس/ آية آدم	male	\N	\N	{}	\N	\N	\N	\N	\N
2fe7fc93-7ac6-4e6b-83b6-f8969a942745	مستر/ محمد العربي	\N	01050001034	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	مستر/ محمد العربي	male	\N	\N	{}	\N	\N	\N	\N	\N
a025c0b6-98ce-4c6e-9438-eee349934233	أ/ إسلام جمال	\N	01050001035	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ إسلام جمال	male	\N	\N	{}	\N	\N	\N	\N	\N
cf8743b2-f65e-465c-9bd4-1c1f608d6726	أ/ محمد صلاح ، أ/ علي فؤاد	\N	01050001036	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمد صلاح ، أ/ علي فؤاد	male	\N	\N	{}	\N	\N	\N	\N	\N
44e5fdfa-04bc-4ed6-8240-f29fd89e8389	أ/ الشاذلي	\N	01050001037	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ الشاذلي	male	\N	\N	{}	\N	\N	\N	\N	\N
76fc2a54-8475-494b-8f33-16de0e47cba6	أ/ محمد يوسف	\N	01050001038	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمد يوسف	male	\N	\N	{}	\N	\N	\N	\N	\N
d9b91ffc-7375-4b62-8219-493e2462f8d2	أ/ منعم درويش	\N	01050001039	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ منعم درويش	male	\N	\N	{}	\N	\N	\N	\N	\N
fc1315f6-7dc3-406e-8954-d3e605c83661	أ/ محمد عاشور	\N	01050001040	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمد عاشور	male	\N	\N	{}	\N	\N	\N	\N	\N
c2b9d2d9-8536-4d23-87c8-351c72c10118	أ/ الغزالي	\N	01050001041	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ الغزالي	male	\N	\N	{}	\N	\N	\N	\N	\N
2c6051f7-d15b-4778-874a-c7ea7e97291a	أ/ أدهم أبو الصفا ، مستر/ صبحي محمد	\N	01050001042	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ أدهم أبو الصفا ، مستر/ صبحي محمد	male	\N	\N	{}	\N	\N	\N	\N	\N
f3e74f5e-d4e9-4b29-a882-adef9a120cf2	ميس/ آية آدم	\N	01050001043	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	ميس/ آية آدم	male	\N	\N	{}	\N	\N	\N	\N	\N
61778034-b516-440f-bf93-116a168fd716	أ/ محمد إسماعيل	\N	01050001044	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ محمد إسماعيل	male	\N	\N	{}	\N	\N	\N	\N	\N
ecd93074-7a71-4f31-a502-4608ff7104e1	أ/ عمر جمال	\N	01050001045	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ عمر جمال	male	\N	\N	{}	\N	\N	\N	\N	\N
520cabff-e639-4f53-b9ed-9f5d71e1653d	أ/ أيمن سليمان	\N	01050001046	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 05:01:02.658105+03	2026-09-26 05:01:02.658105+03	\N	{}	أ/ أيمن سليمان	male	\N	\N	{}	\N	\N	\N	\N	\N
0f1a658d-9533-4ebb-a08d-9c26a84fd6e4	Hossam Ibrahim	م/ حسام إبراهيم	01099998888	\N	الفيزياء	40.00	percentage	0.00	t	\N	local	\N	2026-09-15 17:31:39.130767+03	2026-09-26 05:18:50.133142+03	737b6229-6334-41c4-b878-8f3dbb0e9663	{737b6229-6334-41c4-b878-8f3dbb0e9663}	مستر عبقري	male	\N	\N	{"youtube": "", "facebook": "", "telegram": "", "whatsapp": ""}	أحمد السكرتير	01099998888	/uploads/students/students_91986ccaf599adb20170aea290904a3bd47769e99d07192b.webp	/uploads/logos/logos_b1176956cd554a8791765f8d5318955a8805f36898225b71.webp	\N
ea658032-576c-4ef2-bb57-ff11fa442a3f	أ/ مروان	\N	01050001001	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ مروان	male	\N	\N	{}	\N	\N	\N	\N	\N
6cc25780-161f-4bd0-86e5-2f82c9f83f7f	ميس/ دنيا	\N	01050001002	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	ميس/ دنيا	male	\N	\N	{}	\N	\N	\N	\N	\N
2acdbe9b-46d8-44f5-92c5-d98d2de115ab	أ/ أحمد محمود	\N	01050001003	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ أحمد محمود	male	\N	\N	{}	\N	\N	\N	\N	\N
b08bbde8-4382-4cc2-a0f3-eba8b897b279	أ/ أدهم هاني	\N	01050001004	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ أدهم هاني	male	\N	\N	{}	\N	\N	\N	\N	\N
3bf81246-d120-49c0-be07-03bf85ffd113	ميس/ شيماء	\N	01050001005	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	ميس/ شيماء	male	\N	\N	{}	\N	\N	\N	\N	\N
42bb5476-79c3-45f0-b7f0-92abffbf7fd8	أ/ محمود رشاد	\N	01050001006	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ محمود رشاد	male	\N	\N	{}	\N	\N	\N	\N	\N
214bd4ee-8381-4178-a7ac-311ffe35c78c	أ/ صبحي محمد	\N	01050001007	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ صبحي محمد	male	\N	\N	{}	\N	\N	\N	\N	\N
d3a3ca6d-e0fe-4985-8350-63aafb66f548	أ/ أحمد عبد الله	\N	01050001008	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ أحمد عبد الله	male	\N	\N	{}	\N	\N	\N	\N	\N
fc37bbab-da95-4a63-ba15-58cc1ff148b4	أ/ محمد بكير	\N	01050001009	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ محمد بكير	male	\N	\N	{}	\N	\N	\N	\N	\N
35399c88-3eff-400c-a239-e15a916f4852	أ/ محمد عادل	\N	01050001010	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ محمد عادل	male	\N	\N	{}	\N	\N	\N	\N	\N
7760a9ff-5cb9-451b-b9f3-dc060a42cce6	أ/ علي فؤاد	\N	01050001011	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ علي فؤاد	male	\N	\N	{}	\N	\N	\N	\N	\N
c9ce5957-98c8-48c7-9586-6e5e8d008c0d	أ/ أدهم أبو الصفا	\N	01050001012	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	أ/ أدهم أبو الصفا	male	\N	\N	{}	\N	\N	\N	\N	\N
a22ec622-ed16-4f52-b764-071a36543981	مستر/ صبحي محمد	\N	01050001013	\N	\N	0.00	percentage	0.00	t	تم إنشاؤه آلياً من جدول الحصص الرسمي data.txt	local	\N	2026-09-26 10:55:32.400343+03	2026-09-26 10:55:32.400343+03	\N	{}	مستر/ صبحي محمد	male	\N	\N	{}	\N	\N	\N	\N	\N
\.


--
-- Data for Name: treasury_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.treasury_transactions (id, transaction_type, amount, reference_id, notes, recorded_by, created_at) FROM stdin;
1eebf432-8f5c-4d21-846f-0e4b1e0034b9	manual_deposit	2000.00	\N	عهدة افتتاحية لبداية الوردية	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 04:32:08.059197+03
01114852-18cf-46ce-ae5b-5a5ccd6846c5	expense	-250.00	a99dd851-4d50-4abe-a325-dd6d19dea607	مصروف: شاي وسكر وضيافة للمدرسين (إذن #VOU-328074)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 04:32:08.074109+03
9ec2a2f8-bbc7-40cf-b94f-4100a11a963d	pos_sale	40.00	3b5d6da4-7bd9-4db9-8437-303be311ffea	مبيعات كاشير فاتورة #INV-22328098	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 04:32:08.098525+03
bd39c223-4542-4657-a197-945698c2db5f	pos_sale	120.00	39d27228-df8e-4892-b3b2-adbe0cd02ed9	مبيعات كاشير فاتورة #INV-22935360	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 04:42:15.3606+03
014449fe-c11f-4776-a998-53140c6a5358	pos_sale	20.00	cbf536c3-375d-4261-ba8e-0e94b361b96a	مبيعات كاشير فاتورة #INV-23215771	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 04:46:55.771048+03
8d056f74-20f8-4f8a-9f68-0d819c13f0e0	subscription_fee	350.00	c3f3110e-9044-4bb3-8bd8-7e1cfd4f8bd0	350	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 13:38:47.529185+03
ebf464cb-9a0e-4f3a-88ee-6c828795f8f2	subscription_fee	350.00	a47c8eee-cd59-4a85-a736-5624bec223dd	200	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 13:38:53.060578+03
5200dbcd-b681-40d7-b885-de46bd8c2191	cash_out	-75.00	\N	سحب/خروج نقدية من الدرج: تصوير أوراق امتحانات وسحب فكة (مستر أحمد)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 14:09:04.428886+03
c2c9587a-a175-4237-a1c8-c557b92c2123	booklet_reservation_deposit	20.00	eeff0301-5ed4-48b2-9b4f-ad24c87808b0	عربون/حجز ملزمة: مذكرة المراجعة النهائية فيزياء 2026 للطالب عبدالله اختبار (#1004)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 14:09:04.471002+03
d164ad61-786c-4b29-a62a-4e43588bd0a5	cash_out	-50.00	\N	سحب/خروج نقدية من الدرج: TTasweer warak emtehanasweer warak emtehan 3ajel	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-16 14:18:35.730691+03
536fce7c-9a8f-476e-ad18-5d4ba8161cfa	subscription_fee	350.00	02b70df8-dd5c-48df-89f0-36250fceee31	دفع شهر كامل (4 حصص) نقداً	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-17 21:34:03.762622+03
326e5afe-99b9-4c79-aacb-9799090248d2	subscription_fee	300.00	a47c8eee-cd59-4a85-a736-5624bec223dd	تجديد 4 حصص لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-17 21:35:09.66269+03
93900d43-5b9e-45c6-b345-6497e7aedf91	subscription_fee	450.00	a47c8eee-cd59-4a85-a736-5624bec223dd	تجديد 4 حصص لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-17 21:35:25.547188+03
31619394-c508-4c04-acee-84e46e3842a5	subscription_fee	1000.00	a47c8eee-cd59-4a85-a736-5624bec223dd	تجديد 4 حصص لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-17 21:35:34.57122+03
6b710dd3-fac7-4d81-ae4e-2e0c370da527	subscription_fee	350.00	a47c8eee-cd59-4a85-a736-5624bec223dd	تجديد 8 حصص لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-17 21:38:45.978806+03
9f514836-6137-4e6c-84b2-2b47f3b474c3	subscription_fee	60.00	c3f3110e-9044-4bb3-8bd8-7e1cfd4f8bd0	دفعة سداد مديونية	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-17 21:46:41.435085+03
c353f8ab-35e2-4b4c-99ca-a3141c6da64c	cash_out	-300.00	\N	تصفية حساب الطالب عمر خالد الشربيني واسترداد 7 حصص متبقية بمبلغ 300 ج.م من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-17 21:46:55.802943+03
7b3be118-e77f-4f5e-a7bc-05aeff743300	subscription_fee	350.00	c3f3110e-9044-4bb3-8bd8-7e1cfd4f8bd0	شحن شهر جديد (8 حصص)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-17 21:48:11.644785+03
092ded31-de28-4d4c-8638-1d405e129ff0	subscription_fee	20.00	c3f3110e-9044-4bb3-8bd8-7e1cfd4f8bd0	سداد مديونية اشتراك: 20 ج.م لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-17 21:52:45.132305+03
e846eaa6-ef49-4c9f-bd4d-e7e0cf3c8551	booklet_reservation_deposit	15.00	5f0cf55f-1fd3-48a0-acfa-2f285986c0ae	عربون/حجز ملزمة: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب اختبار التدقيق 1782 (#1006)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:12:21.967131+03
c68c3aad-a761-4a88-8f75-b62c524c68ff	cash_out	-15.00	5f0cf55f-1fd3-48a0-acfa-2f285986c0ae	استرداد عربون حجز ملزمة ملغي: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب اختبار التدقيق 1782 (#1006)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:12:21.993017+03
71529f21-090b-4230-847c-83ccb472547f	booklet_reservation_deposit	15.00	40190e7d-9885-4b23-b309-c568aabb144f	عربون/حجز ملزمة: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب اختبار التدقيق 1418 (#1007)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:12:41.518378+03
eba50d7b-ebd4-40ff-98a9-0a1806104fd7	cash_out	-15.00	40190e7d-9885-4b23-b309-c568aabb144f	استرداد عربون حجز ملزمة ملغي: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب اختبار التدقيق 1418 (#1007)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:12:41.533093+03
020548df-3156-4c08-9352-40e155b04f13	subscription_fee	75.00	950fbd0f-8777-42a4-a484-70f20db4bf23	سداد مديونية اشتراك: 75 ج.م - مجموعة مجموعة أ للتجربة (المتبقي كدين: 25 ج.م)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:35:38.62654+03
5516c36f-fe05-4e93-83af-2250949b40ab	subscription_fee	25.00	950fbd0f-8777-42a4-a484-70f20db4bf23	سداد مديونية اشتراك: 25 ج.م - مجموعة مجموعة أ للتجربة (المتبقي كدين: 0 ج.م)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:35:38.648138+03
38ea466a-4f55-4c58-a35d-e88ee59d2c3f	cash_out	-150.00	\N	تصفية حساب الطالب طالب تدقيق الصلاحيات 8564 واسترداد 6 حصص متبقية (صافي بعد خصم المديونية: 150 ج.م) من مجموعة مجموعة أ للتجربة	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:35:38.679758+03
238ef1bd-54f5-47f8-b34f-715ee12169d4	subscription_fee	100.00	7f7b099f-e9a5-43be-951c-25af7f3de10f	تحصيل 2 حصص (100 ج.م) - مجموعة مجموعة أ للتجربة - شهر 2026-09	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:35:38.694305+03
b633a5fc-a1bf-4d33-9b2d-36244934138b	booklet_reservation_deposit	20.00	54364839-238b-44f9-8c1f-8bea742c5ac7	عربون/حجز ملزمة: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب تدقيق الصلاحيات 8564 (#1008)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:35:38.739723+03
b8b77c28-cec1-49f7-a901-6ee584239ee7	cash_out	-20.00	54364839-238b-44f9-8c1f-8bea742c5ac7	استرداد عربون حجز ملزمة ملغي: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب تدقيق الصلاحيات 8564 (#1008)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:35:38.751623+03
4fb8f683-9059-4dd5-9e00-7ac08858b43e	subscription_fee	75.00	82d01f47-db9f-4de9-89e0-c3658ccb0661	سداد مديونية اشتراك: 75 ج.م - مجموعة مجموعة أ للتجربة (المتبقي كدين: 25 ج.م)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:03.455753+03
91027496-be37-4261-9f59-30a56e94353b	subscription_fee	25.00	82d01f47-db9f-4de9-89e0-c3658ccb0661	سداد مديونية اشتراك: 25 ج.م - مجموعة مجموعة أ للتجربة (المتبقي كدين: 0 ج.م)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:03.470199+03
e151d25c-91ee-45d5-9ff2-da8ca5a5afb5	cash_out	-250.00	\N	تصفية حساب الطالب طالب تدقيق الصلاحيات 3397 واسترداد 6 حصص متبقية (صافي بعد خصم المديونية: 250 ج.م) من مجموعة مجموعة أ للتجربة	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:03.498034+03
3c99ba27-edec-4ff3-ac7b-aeb0b3703b2e	subscription_fee	100.00	505f12aa-aa28-4c2c-8ab3-f5716df5607d	تحصيل 2 حصص (100 ج.م) - مجموعة مجموعة أ للتجربة - شهر 2026-09	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:03.510958+03
f6206d43-ec5b-4272-ae6e-32928d4f954e	booklet_reservation_deposit	20.00	133203b0-155d-47f3-9cf5-fbe5a75f2a54	عربون/حجز ملزمة: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب تدقيق الصلاحيات 3397 (#1009)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:03.556629+03
8271beaa-019d-4038-a141-a0f20e499e0d	cash_out	-20.00	133203b0-155d-47f3-9cf5-fbe5a75f2a54	استرداد عربون حجز ملزمة ملغي: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب تدقيق الصلاحيات 3397 (#1009)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:03.568134+03
20581cea-b83b-45de-8151-0fe4d4b96ed5	subscription_fee	75.00	85b62702-c61c-4e70-b90a-d19d361f51c1	سداد مديونية اشتراك: 75 ج.م - مجموعة مجموعة أ للتجربة (المتبقي كدين: 25 ج.م)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:23.312751+03
71877493-10c0-4045-8ddb-91a70f2e608c	subscription_fee	25.00	85b62702-c61c-4e70-b90a-d19d361f51c1	سداد مديونية اشتراك: 25 ج.م - مجموعة مجموعة أ للتجربة (المتبقي كدين: 0 ج.م)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:23.326281+03
65eaa44a-41ad-40e4-ad13-047ac3c0df7a	cash_out	-100.00	\N	تصفية حساب الطالب طالب تدقيق الصلاحيات 3255 واسترداد 6 حصص متبقية (صافي بعد خصم المديونية: 100 ج.م) من مجموعة مجموعة أ للتجربة	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:23.359503+03
8bb90125-1f91-4b2d-8001-546b2ce24beb	subscription_fee	100.00	2596386d-cde8-4a01-a8ef-fdc151ddaca0	تحصيل 2 حصص (100 ج.م) - مجموعة مجموعة أ للتجربة - شهر 2026-09	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:23.371788+03
70442df7-90d7-4267-8c05-0efedcf13df1	booklet_reservation_deposit	20.00	3c3cf658-a540-4ce4-8878-290ba9709e60	عربون/حجز ملزمة: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب تدقيق الصلاحيات 3255 (#1010)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:23.430788+03
69cebdd7-0923-4778-9c7f-9882201b0aea	cash_out	-20.00	3c3cf658-a540-4ce4-8878-290ba9709e60	استرداد عربون حجز ملزمة ملغي: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب تدقيق الصلاحيات 3255 (#1010)	9cb28fe8-6c18-466e-a098-f7f862b22a26	2026-09-18 09:36:23.440992+03
c6e71ccb-6f29-4bd9-8d1c-689b89fecea1	booklet_reservation_deposit	15.00	667ec37f-3e0b-409b-81bc-77356825385d	عربون/حجز ملزمة: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب اختبار التدقيق 7083 (#1011)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:36:27.149025+03
a738bc7c-bd14-4e41-b39a-432aeaa5e47e	cash_out	-15.00	667ec37f-3e0b-409b-81bc-77356825385d	استرداد عربون حجز ملزمة ملغي: مذكرة المراجعة النهائية فيزياء 2026 للطالب طالب اختبار التدقيق 7083 (#1011)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:36:27.162827+03
a40126a8-d0dc-4005-92b3-aa995efd9fa0	cash_out	-370.00	\N	تصفية حساب الطالب عمر خالد الشربيني واسترداد 8 حصص متبقية (صافي بعد خصم المديونية: 370 ج.م) من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:54:25.586141+03
f4c1da6c-902d-42bd-978f-ed0727570055	subscription_fee	50.00	6d83ed88-f621-4e8d-b301-b9ae66892221	تجديد 1 حصص لمجموعة مجموعة فحص التدقيق 1481	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:54:54.749679+03
15c2dbe9-2e76-4e07-9634-5fe4419d946e	subscription_fee	200.00	6d83ed88-f621-4e8d-b301-b9ae66892221	تجديد 4 حصص لمجموعة مجموعة فحص التدقيق 1481	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:55:29.045337+03
7ab104d3-0022-4b5d-bcdb-4d030a6769ca	subscription_fee	350.00	6ce40b02-4330-47f1-81cf-d2c764146bfa	سداد مديونية اشتراك: 350 ج.م لمجموعة مجموعة أ للتجربة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:58:09.162648+03
fb716881-f238-4e36-a6e7-96dfce6506f2	subscription_fee	50.00	a47c8eee-cd59-4a85-a736-5624bec223dd	سداد مديونية اشتراك: 50 ج.م لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 09:58:11.294879+03
99d6aa19-27fe-4dfa-80e3-98906e9e0d55	subscription_fee	200.00	20490a3b-39cb-4850-becc-ec5ac26828ca	تجديد 4 حصص لمجموعة الأحياء - Hossam Ibrahim	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 14:56:38.982311+03
1b6d762c-280a-421d-8e53-7846e2354538	cash_out	-200.00	\N	تصفية حساب الطالب ادمن واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 200 ج.م) من مجموعة الأحياء - Hossam Ibrahim	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 14:56:56.440996+03
b803cd32-d0c6-48a4-a62a-5ead16a37674	cash_out	-1400.00	\N	تصفية حساب الطالب عبدالله اختبار واسترداد 28 حصص متبقية (صافي بعد خصم المديونية: 1400 ج.م) من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 14:59:48.145847+03
108b5e69-4d97-4c84-9ca8-36fcdf0fb18c	subscription_fee	300.00	a47c8eee-cd59-4a85-a736-5624bec223dd	تجديد 4 حصص لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 14:59:59.516643+03
cd7be324-f387-406b-9e63-7bfc9b0d59ed	cash_out	-75.00	\N	سحب/خروج نقدية من الدرج: درع كاميرا (عبدالله مجدي)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 15:01:07.816276+03
6ffcd3dd-2834-45a8-8f66-e3c96912a263	booklet_reservation_deposit	200.00	1ae07a67-34c7-4807-b973-c22986596cd7	عربون/حجز ملزمة: تانيه اعدادي اختبار للطالب ادمن (#1012)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 15:04:55.173284+03
2a19e00f-d1a4-4c5a-985d-e65f4ed9e11d	cash_out	-150.00	\N	تصفية حساب الطالب عبدالله اختبار واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 150 ج.م) من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 16:50:30.401328+03
59ee336b-c65d-465d-a07a-6a8aeffb56f6	subscription_fee	350.00	a47c8eee-cd59-4a85-a736-5624bec223dd	تجديد 4 حصص لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 16:50:39.177195+03
faafcc3e-0429-49c7-8cc1-3d444963fa2c	subscription_fee	50.00	a47c8eee-cd59-4a85-a736-5624bec223dd	سداد مديونية اشتراك: 50 ج.م لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 16:51:04.245482+03
395ba9c7-e7d1-4907-b616-89eaaa9c81ab	cash_out	-250.00	\N	تصفية حساب الطالب عبدالله اختبار واسترداد 5 حصص متبقية (صافي بعد خصم المديونية: 250 ج.م) من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 16:51:13.222311+03
a4930dfd-faba-4e8e-9911-1bc42861218a	cash_out	-360.00	\N	تصفية حساب الطالب يوسف واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 360 ج.م) من مجموعة مجموعة أ للتجربة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 16:54:51.821515+03
ea0c35dc-5e4a-4bec-b25d-0fe946eafd2c	subscription_fee	200.00	5b7ec639-4217-404d-bb29-c37bf8db3cc8	تجديد 4 حصص لمجموعة مجموعة فحص التدقيق 7119	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-18 17:32:01.581112+03
24474d6e-44da-4736-820d-8be9b0507d02	cash_out	-200.00	\N	تصفية حساب الطالب عبدالله اختبار واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 200 ج.م) من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-21 16:16:58.227052+03
87263b48-e6bd-4d72-8dba-d174d4918472	cash_out	-90.00	\N	تصفية حساب الطالب طالب تدقيق الصلاحيات 8564 واسترداد 1 حصص متبقية (صافي بعد خصم المديونية: 90 ج.م) من مجموعة مجموعة أ للتجربة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-22 14:33:16.393339+03
d0f61af2-d571-44d5-b5e5-4328f9d91ebc	subscription_fee	350.00	a47c8eee-cd59-4a85-a736-5624bec223dd	تجديد 4 حصص (باكدج) لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-22 16:29:15.227082+03
4c69bc08-f79d-42ea-b570-b13bdec6a651	cash_out	-200.00	\N	تصفية حساب الطالب عبدالله اختبار واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 200 ج.م) من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-22 16:30:31.451529+03
13184516-f0c4-4a54-a682-133d9af5affe	subscription_fee	50.00	0b0910c2-36cb-435a-964d-86de75de82e2	تجديد 3 حصص (باكدج) لمجموعة مجموعة فحص التدقيق 1481	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-22 16:34:29.742433+03
bff9e788-0950-4009-b46d-5651ddf398a5	cash_out	-200.00	\N	تصفية حساب الطالب طالب اختبار التدقيق 7083 واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 200 ج.م) من مجموعة مجموعة فحص التدقيق 1481	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-22 16:34:41.837455+03
14613009-dab3-468e-9a4f-c4aa574e008e	subscription_fee	300.00	a47c8eee-cd59-4a85-a736-5624bec223dd	تجديد 4 حصص (باكدج) لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-23 21:18:34.709338+03
e393a35a-806c-467a-9ca5-3283061e5023	cash_out	-185.00	\N	تصفية حساب الطالب عبدالله اختبار واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 185 ج.م) من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-23 21:19:15.962998+03
9944e856-24c9-4a5a-977a-fd8a57ed6545	subscription_fee	250.00	9b4b57c3-6f15-41c6-acb6-58baf8ca9c65	تجديد 4 حصص (باكدج) لمجموعة مجموعة النخبة - لغة عربية أ/ حسام	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-24 05:20:34.199984+03
a30e6bcb-9f69-46c7-8b59-85c21f94c408	subscription_fee	200.00	1ac5d65a-19de-4dcc-9531-efdef0d61970	تحصيل اشتراك الباكدج الكامل (200 ج.م) - الطالب: طالب باكدج كامل تجريبي (#769584)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 13:32:21.100739+03
b4656238-45a1-48ce-a608-e64246915008	cash_out	-100.00	\N	تصفية حساب الطالب طالب اختبار التدقيق 1782 واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 100 ج.م) من مجموعة مجموعة النخبة - لغة عربية أ/ حسام	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-24 05:39:35.58732+03
41f8c360-9a9e-44a1-8fbd-184274960ee4	cash_out	-200.00	\N	تصفية حساب الطالب عبدالله اختبار واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 200 ج.م) من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-24 19:43:53.142452+03
226deb84-bc63-485b-a0ad-3e2c18cb06dd	subscription_fee	175.00	a47c8eee-cd59-4a85-a736-5624bec223dd	تجديد 4 حصص (باكدج) لمجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-24 19:44:07.584535+03
be2f63e8-e352-414c-bed6-688173025cb1	cash_out	-200.00	\N	تصفية حساب الطالب عبدالله اختبار واسترداد 4 حصص متبقية (صافي بعد خصم المديونية: 200 ج.م) من مجموعة مجموعة الفيزياء - 1ث	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-24 19:44:14.481508+03
0ea995c6-2f97-478b-b183-5b6c6c01389e	subscription_fee	350.00	69698781-ff72-4374-accb-ac545ae4037a	سداد مديونية اشتراك: 350 ج.م لمجموعة مجموعة أ للتجربة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 04:11:39.164717+03
acc4cf49-d92d-4638-8de2-d34c001ab561	subscription_fee	350.00	8f5fecae-5c68-47c2-a727-c13db8b6ed2c	سداد مديونية اشتراك: 350 ج.م لمجموعة مجموعة أ للتجربة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 04:11:40.924872+03
0c59dc06-bcf1-42e1-963d-3c2f5eebd565	subscription_fee	250.00	e28a4e26-218b-4ea3-810a-4b69e60e6eff	سداد مديونية اشتراك: 250 ج.م لمجموعة مجموعة النخبة - لغة عربية أ/ حسام	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 04:11:42.874306+03
937f9bc9-4f87-4c86-a4de-6e2b09998e75	subscription_fee	150.00	4e731936-160a-4a74-8a30-661b5c9a4f0f	تحصيل اشتراك مجموعة خاصة (150 ج.م) - الطالب: طالب برايفت تجريبي	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:15:22.906489+03
f33441b3-88c6-49b6-bf23-246e88c6aae5	subscription_fee	200.00	8e6722d2-8a0a-40e0-97ee-e8b6bacb3618	تحصيل اشتراك الباكدج الكامل (200 ج.م) - الطالب: طالب باكدج كامل تجريبي (#537319)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:15:51.392548+03
bb97cc3b-176e-4d18-b611-7d66f8d38f94	subscription_fee	100.00	2186f2bb-43e4-43b9-ab8e-40158101b012	تحصيل اشتراك مواد سنتر منفردة (2 مادة) (100 ج.م) - الطالب: طالب مواد سنتر تجريبي (#584542)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:15:51.430591+03
fa5d0b57-98bc-4a85-beea-11317ffb6889	subscription_fee	150.00	9349ea62-4739-41c9-b3b6-3e754fb1c84c	تحصيل اشتراك مجموعة خاصة (150 ج.م) - الطالب: طالب برايفت تجريبي	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:15:51.452757+03
941b2796-b12b-41f0-915f-f9f2612bd479	subscription_fee	200.00	323914fc-5359-4295-bd2b-36cbc5dc8b32	تحصيل اشتراك الباكدج الكامل (200 ج.م) - الطالب: طالب باكدج كامل تجريبي (#106942)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:17:31.020537+03
b991ed54-90e6-4bf0-a198-334a69bea111	subscription_fee	100.00	f3558ebc-b612-4840-83c2-f3a7c465b950	تحصيل اشتراك مواد سنتر منفردة (2 مادة) (100 ج.م) - الطالب: طالب مواد سنتر تجريبي (#514064)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:17:31.054972+03
c7005d84-74cc-4358-aa7d-7bd1b3437ed1	subscription_fee	150.00	3bcc5959-8d1c-403c-b240-1e0340d7b6c7	تحصيل اشتراك مجموعة خاصة (150 ج.م) - الطالب: طالب برايفت تجريبي	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:17:31.077987+03
79f661e2-89a4-4bf5-b035-eb5dcc38eb12	subscription_fee	200.00	50cf1e3a-f56f-4143-83e9-0dc2590debdb	تحصيل اشتراك الباكدج الكامل (200 ج.م) - الطالب: طالب باكدج كامل تجريبي (#755659)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:17:55.504788+03
5560221a-a264-410d-81eb-03d98ed6cd94	subscription_fee	100.00	73e001fb-6e3b-460a-b31d-9f26291ec946	تحصيل اشتراك مواد سنتر منفردة (2 مادة) (100 ج.م) - الطالب: طالب مواد سنتر تجريبي (#250756)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:17:55.540426+03
484b0339-408f-47fc-8016-f38f596a34dc	subscription_fee	150.00	2c19ac30-4fc0-419e-b66e-a30c7d05bab1	تحصيل اشتراك مجموعة خاصة (150 ج.م) - الطالب: طالب برايفت تجريبي	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:17:55.563975+03
1144df10-5d29-4a6d-adcd-210ed039f6e7	subscription_fee	150.00	7652a192-dde5-4269-b1be-893a4f65ea59	سداد مديونية اشتراك: 150 ج.م لمجموعة مجموعة أ للتجربة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:29:03.608916+03
ca5662e6-e731-4869-9e56-aefda855debe	subscription_fee	150.00	4d1c3bb1-0c45-4e09-ab18-f099272c4bc7	سداد مديونية اشتراك: 150 ج.م لمجموعة مجموعة النخبة - لغة عربية أ/ حسام	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:29:05.323936+03
68710122-e612-4d7f-ae54-af947788090e	subscription_fee	150.00	bbad8266-3c79-4623-91c9-69bfbd59ccd1	سداد مديونية اشتراك: 150 ج.م لمجموعة مجموعة أ للتجربة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:29:07.054758+03
8571b8fe-2ede-4b13-820f-d4f8409541e2	subscription_fee	150.00	0d30af0c-ab00-44a1-95d7-58cca1718bec	سداد مديونية اشتراك: 150 ج.م لمجموعة مجموعة النخبة - لغة عربية أ/ حسام	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:29:08.457756+03
8c38f5be-b098-4371-974d-11cee7506ef0	subscription_fee	70.00	7652a192-dde5-4269-b1be-893a4f65ea59	سداد مديونية اشتراك: 70 ج.م لمجموعة مجموعة أ للتجربة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:29:10.220624+03
eb6eecca-ab73-4e00-80d5-86682c83e5a8	subscription_fee	70.00	bbad8266-3c79-4623-91c9-69bfbd59ccd1	سداد مديونية اشتراك: 70 ج.م لمجموعة مجموعة أ للتجربة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:29:12.584775+03
e19de261-cd90-44b7-9fa2-5f1853c1680f	subscription_fee	710.00	930404fc-04bf-42d9-8614-1d1ada4492d3	تحصيل اشتراك الباكدج الكامل (710 ج.م) - الطالب: عمر خالد الشربيني (#1003)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:30:23.70968+03
d3b616c4-b306-4e12-8c1d-2be3094f8781	subscription_fee	260.00	d9dadafd-2b36-4b06-a66c-5e43588d138c	تحصيل اشتراك الباكدج الكامل (260 ج.م) - الطالب: طالب برايفت تجريبي (#619709)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:30:36.413095+03
7aea8c39-d73a-4ae4-815b-52428a86f738	subscription_fee	200.00	f8e1e86b-da5d-4bbb-8a7c-5b598888b3b6	تحصيل اشتراك الباكدج الكامل (200 ج.م) - الطالب: طالب باكدج كامل تجريبي (#827863)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:50:20.073863+03
2055259c-59c2-48ab-b381-ed85c3571125	subscription_fee	100.00	47222ae1-7c02-479f-8d72-3381e38cca1f	تحصيل اشتراك مواد سنتر منفردة (2 مادة) (100 ج.م) - الطالب: طالب مواد سنتر تجريبي (#552588)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:50:20.136908+03
4aefb4ca-9ee4-423d-98c9-04f3deac90ae	subscription_fee	150.00	92fa1ae1-7c35-4c1b-bf04-b2e31ab2275f	تحصيل اشتراك مجموعة خاصة (150 ج.م) - الطالب: طالب برايفت تجريبي	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 05:50:20.174857+03
97fa9ce4-817a-4b0a-8b06-d3b063c67513	subscription_fee	639.00	c2f5b752-1014-4c7c-8956-9cf6d8cc108d	تحصيل اشتراك الباكدج الكامل (639 ج.م) - الطالب: عبدالله اختبار (#1004)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 10:29:00.580388+03
c9b60799-00f7-47f8-b38c-752f9aeb6b79	subscription_fee	200.00	e0e14c72-3982-4409-ac78-c392896a5783	تحصيل اشتراك الباكدج الكامل (200 ج.م) - الطالب: طالب باكدج كامل تجريبي (#399176)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 10:55:37.374166+03
6f903dd1-78c4-4af0-a0b6-5578d9fbdabc	subscription_fee	100.00	f8f2acde-ddaa-4cf9-a5d6-f0d3cd25a7dd	تحصيل اشتراك مواد سنتر منفردة (2 مادة) (100 ج.م) - الطالب: طالب مواد سنتر تجريبي (#800780)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 10:55:37.406465+03
a7b2baaf-a6bd-46ed-8818-d4543146f808	subscription_fee	150.00	afa63f59-117e-4015-bb98-bf7d2326d4b6	تحصيل اشتراك مجموعة خاصة (150 ج.م) - الطالب: طالب برايفت تجريبي	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 10:55:37.429328+03
76bf8490-a5d2-4b92-920f-f8fe1e544028	cash_out	-9000.00	\N	سحب/خروج نقدية من الدرج: تقفيل اليوم لمستر جمال	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 11:18:48.568767+03
a5da8bf1-b004-4875-a877-36e2163e295d	cash_out	-639.00	c2f5b752-1014-4c7c-8956-9cf6d8cc108d	استرداد تصفية باكدج (639 ج.م) - الطالب: عبدالله اختبار (#1004) - رصيد مسترد: 32 حصة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 13:02:35.334438+03
332b4678-4961-4453-889d-5adeb53c19ea	subscription_fee	100.00	bb1bc26c-9f61-48b7-a529-ff988ac25ff4	تحصيل اشتراك مواد سنتر منفردة (2 مادة) (100 ج.م) - الطالب: طالب مواد سنتر تجريبي (#447428)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 13:32:21.151475+03
1bd250c9-e8c2-4dcb-88c2-b1f2648c4213	subscription_fee	150.00	111da5b6-570d-4fd8-a43e-5b2ae4e36a66	تحصيل اشتراك مجموعة خاصة (150 ج.م) - الطالب: طالب برايفت تجريبي	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 13:32:21.177567+03
136237c9-63da-42a3-b613-b254990086f5	subscription_fee	100.00	644a7b20-cee2-4a66-b76a-d3226ca9fb89	تحصيل اشتراك مواد سنتر منفردة (1 مادة) (100 ج.م) - الطالب: طالب تجربة مسار حكومي (#999991)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 13:37:23.624973+03
92e2371d-364c-451d-ba58-f12f6e274baf	subscription_fee	235.00	366d2a08-7609-4c7d-80bb-51e681d06086	تحصيل اشتراك الباكدج الكامل (235 ج.م) - الطالب: عبدالله اختبار (#1004)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 13:47:07.248546+03
618d5df4-f724-45b5-a382-0d3bb80622ea	subscription_fee	200.00	f6609744-9b93-419c-a18b-1fa3e1d7a2f2	تحصيل اشتراك الباكدج الكامل (200 ج.م) - الطالب: طالب باكدج كامل تجريبي (#616272)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 14:02:33.490832+03
80f5f6bf-a2d7-461e-89e7-050561e33800	subscription_fee	100.00	286f4ee7-3fef-45d2-8aa4-7b8823a6fbbe	تحصيل اشتراك مواد سنتر منفردة (2 مادة) (100 ج.م) - الطالب: طالب مواد سنتر تجريبي (#861677)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 14:02:33.522204+03
d5363fbe-1362-4781-869c-d507160a3875	subscription_fee	150.00	25a39592-16c7-4b07-8a1f-fd1ce1a0847f	تحصيل اشتراك مجموعة خاصة (150 ج.م) - الطالب: طالب برايفت تجريبي	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 14:02:33.545889+03
d3752fca-233c-4d77-87a8-aac8c8af7b44	cash_out	-1395.00	\N	سحب/خروج نقدية من الدرج: حساب مستر جمال (0)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 14:38:27.735183+03
65a731e8-bc60-49d2-af73-0e6f621a0181	subscription_fee	200.00	7a12bbb6-40cc-4b65-8666-3b3c002261e3	تحصيل اشتراك الباكدج الكامل (200 ج.م) - الطالب: طالب باكدج كامل تجريبي (#526405)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 15:48:55.480545+03
99535d1c-a08e-4eb5-ace5-4865aa581f71	subscription_fee	100.00	dabdadb7-4820-4612-b3a6-ca9ed084c296	تحصيل اشتراك مواد سنتر منفردة (2 مادة) (100 ج.م) - الطالب: طالب مواد سنتر تجريبي (#166459)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 15:48:55.519044+03
b209c278-567c-4dab-ad1d-4937c1d9c974	subscription_fee	150.00	64803da1-4dc5-46b6-8547-3dec7cce0252	تحصيل اشتراك مجموعة خاصة (150 ج.م) - الطالب: طالب برايفت تجريبي	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 15:48:55.54153+03
41dd1500-79ca-4d84-8cc3-ea2d357aef7e	cash_out	-450.00	\N	سحب/خروج نقدية من الدرج: مستر جمال	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 16:53:28.414244+03
56064edd-8c4c-491e-a951-d9c1976161d2	subscription_fee	300.00	681deeae-a340-4250-a6aa-c8edf3829e6f	تحصيل اشتراك الباكدج الكامل (300 ج.م) - الطالب: طالب تدقيق الصلاحيات 3397 (#1009)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 21:33:19.239381+03
13cffc60-90d9-487a-b693-cb939a2f3698	cash_out	-150.00	681deeae-a340-4250-a6aa-c8edf3829e6f	استرداد تصفية باكدج (150 ج.م) - الطالب: طالب تدقيق الصلاحيات 3397 (#1009) - رصيد مسترد: 9 حصة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 21:33:26.70263+03
a997225c-6bda-45e1-b77b-5fd993d5e83d	subscription_fee	70.00	bc28830f-34cc-45a1-9d15-7d9e39f01392	تحصيل اشتراك مواد سنتر منفردة (1 مادة) (70 ج.م) - الطالب: طالب تدقيق الصلاحيات 3397 (#1009)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 21:33:39.477712+03
cf7ddbaa-230e-4ff2-804d-660c8fed8e9a	cash_out	-70.00	bc28830f-34cc-45a1-9d15-7d9e39f01392	استرداد تصفية باكدج (70 ج.م) - الطالب: طالب تدقيق الصلاحيات 3397 (#1009) - رصيد مسترد: 4 حصة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-26 21:33:45.149748+03
d52e280a-f9e5-4147-b41f-f33e95a29885	cash_out	-225.00	366d2a08-7609-4c7d-80bb-51e681d06086	استرداد تصفية باكدج (225 ج.م) - الطالب: عبدالله اختبار (#1004) - رصيد مسترد: 23 حصة	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-28 01:56:37.926361+03
ed0e1722-b879-447d-b1c3-e62fba384258	subscription_fee	260.00	641bb877-f2b2-4f05-8f21-755ba9c621e5	تحصيل اشتراك الباكدج الكامل (260 ج.م) - الطالب: عبدالله اختبار (#1004)	6c49cae8-988b-4bed-9f78-c069486f9f68	2026-09-28 01:56:58.731289+03
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, full_name, full_name_ar, phone, email, role_id, is_active, last_login_at, sync_status, remote_id, created_at, updated_at, photo_url) FROM stdin;
765a2cf1-6549-46d0-874f-aaa35ba39c17	reception	$2b$10$kTZxt8jkUL06i651LWuv.u4j3Jp2IdusPHbx1NaPkEjX1JsaNdMBi	Reception & Gate Officer	موظف الاستقبال وبوابة الحضور	01056789012	reception@atlas-educational.com	14d607eb-4061-4320-af28-64b40ea58eee	t	2026-09-26 05:18:41.940559+03	local	\N	2026-09-16 14:53:16.906195+03	2026-09-26 05:18:41.940559+03	\N
0d849aaf-181d-41b7-8d26-d9410a58bed8	center_mgr	$2b$10$mTfrXV7fNUvI3M59ga00mOGvBSBxa9fvSpiy1Jw.F7Kcuopr3MKmu	Center Operations Manager	مدير العمليات والسنتر	01023456789	manager@atlas-educational.com	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	t	2026-09-26 05:21:55.35506+03	local	\N	2026-09-16 14:53:16.906195+03	2026-09-26 05:21:55.35506+03	\N
9cb28fe8-6c18-466e-a098-f7f862b22a26	test_receptionist	$2b$10$MqVLon0xZCzn6PW0lDF1.OSbvsXVjcNTPsOVMk1Eegfz3Mgn78.em	موظف استقبال تجريبي	\N	\N	\N	14d607eb-4061-4320-af28-64b40ea58eee	t	2026-09-18 09:36:23.235918+03	local	\N	2026-09-18 09:35:38.435976+03	2026-09-18 09:36:23.235918+03	\N
c442cd1f-3343-4df7-9863-27cd8294e5d9	finance_mgr	$2b$10$kTZxt8jkUL06i651LWuv.u4j3Jp2IdusPHbx1NaPkEjX1JsaNdMBi	Treasury & Finance Supervisor	مشرف الخزينة والمالية العامة	01034567890	finance@atlas-educational.com	ad233712-296a-4aa6-89e3-3f90671d4a09	t	\N	local	\N	2026-09-16 14:53:16.906195+03	2026-09-16 14:53:16.906195+03	\N
6c49cae8-988b-4bed-9f78-c069486f9f68	admin	$2b$10$3Cwp.e45jouE5HWL0WpsE.OMda6CaP8iPTiqgAe0TmxhrbrQUu9qO	System Administrator	ايمان ادمن	01224385098	admin@atlas-educational.com	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	t	2026-09-29 23:50:49.134494+03	local	\N	2026-09-15 14:29:44.452575+03	2026-09-29 23:50:49.134494+03	\N
\.


--
-- Name: booklet_reservation_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.booklet_reservation_seq', 1008, true);


--
-- Name: student_code_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_code_seq', 1021, true);


--
-- Name: academic_grades academic_grades_grade_order_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_grades
    ADD CONSTRAINT academic_grades_grade_order_key UNIQUE (grade_order);


--
-- Name: academic_grades academic_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_grades
    ADD CONSTRAINT academic_grades_pkey PRIMARY KEY (id);


--
-- Name: attendance_logs attendance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance_logs attendance_logs_student_id_group_id_session_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_student_id_group_id_session_date_key UNIQUE (student_id, group_id, session_date);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: barcode_batches barcode_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barcode_batches
    ADD CONSTRAINT barcode_batches_pkey PRIMARY KEY (id);


--
-- Name: barcode_items barcode_items_barcode_value_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barcode_items
    ADD CONSTRAINT barcode_items_barcode_value_key UNIQUE (barcode_value);


--
-- Name: barcode_items barcode_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barcode_items
    ADD CONSTRAINT barcode_items_pkey PRIMARY KEY (id);


--
-- Name: booklet_groups booklet_groups_item_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booklet_groups
    ADD CONSTRAINT booklet_groups_item_id_group_id_key UNIQUE (item_id, group_id);


--
-- Name: booklet_groups booklet_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booklet_groups
    ADD CONSTRAINT booklet_groups_pkey PRIMARY KEY (id);


--
-- Name: booklet_reservations booklet_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_pkey PRIMARY KEY (id);


--
-- Name: booklet_reservations booklet_reservations_reservation_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_reservation_number_key UNIQUE (reservation_number);


--
-- Name: cancelled_sessions cancelled_sessions_group_id_session_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancelled_sessions
    ADD CONSTRAINT cancelled_sessions_group_id_session_date_key UNIQUE (group_id, session_date);


--
-- Name: cancelled_sessions cancelled_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancelled_sessions
    ADD CONSTRAINT cancelled_sessions_pkey PRIMARY KEY (id);


--
-- Name: classrooms classrooms_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_name_key UNIQUE (name);


--
-- Name: classrooms classrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_pkey PRIMARY KEY (id);


--
-- Name: daily_settlements daily_settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_settlements
    ADD CONSTRAINT daily_settlements_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: grade_packages grade_packages_grade_id_education_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_packages
    ADD CONSTRAINT grade_packages_grade_id_education_type_key UNIQUE (grade_id, education_type);


--
-- Name: grade_packages grade_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_packages
    ADD CONSTRAINT grade_packages_pkey PRIMARY KEY (id);


--
-- Name: group_enrollments group_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_enrollments
    ADD CONSTRAINT group_enrollments_pkey PRIMARY KEY (id);


--
-- Name: group_enrollments group_enrollments_student_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_enrollments
    ADD CONSTRAINT group_enrollments_student_id_group_id_key UNIQUE (student_id, group_id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_barcode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_barcode_key UNIQUE (barcode);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: package_groups package_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_groups
    ADD CONSTRAINT package_groups_pkey PRIMARY KEY (id);


--
-- Name: package_groups package_groups_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_groups
    ADD CONSTRAINT package_groups_unique UNIQUE (package_id, group_id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: pos_sale_items pos_sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_sale_items
    ADD CONSTRAINT pos_sale_items_pkey PRIMARY KEY (id);


--
-- Name: pos_sales pos_sales_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_sales
    ADD CONSTRAINT pos_sales_invoice_number_key UNIQUE (invoice_number);


--
-- Name: pos_sales pos_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_sales
    ADD CONSTRAINT pos_sales_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: student_package_enrollments student_package_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_package_enrollments
    ADD CONSTRAINT student_package_enrollments_pkey PRIMARY KEY (id);


--
-- Name: student_statuses student_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_statuses
    ADD CONSTRAINT student_statuses_pkey PRIMARY KEY (id);


--
-- Name: student_subscriptions student_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subscriptions
    ADD CONSTRAINT student_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: students students_barcode_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_barcode_id_key UNIQUE (barcode_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_student_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_code_key UNIQUE (student_code);


--
-- Name: subjects subjects_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_code_key UNIQUE (code);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: treasury_transactions treasury_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.treasury_transactions
    ADD CONSTRAINT treasury_transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_attendance_date_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_date_group ON public.attendance_logs USING btree (session_date, group_id);


--
-- Name: idx_attendance_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_group_id ON public.attendance_logs USING btree (group_id);


--
-- Name: idx_attendance_logs_today; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_logs_today ON public.attendance_logs USING btree (session_date, status, payment_status);


--
-- Name: idx_attendance_scan_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_scan_timestamp ON public.attendance_logs USING btree (scan_timestamp);


--
-- Name: idx_attendance_session_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_session_date ON public.attendance_logs USING btree (session_date);


--
-- Name: idx_attendance_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_student_id ON public.attendance_logs USING btree (student_id);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at);


--
-- Name: idx_audit_log_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_audit_log_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_log_user_id ON public.audit_log USING btree (user_id);


--
-- Name: idx_barcode_items_barcode_value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_barcode_items_barcode_value ON public.barcode_items USING btree (barcode_value);


--
-- Name: idx_barcode_items_batch_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_barcode_items_batch_id ON public.barcode_items USING btree (batch_id);


--
-- Name: idx_barcode_items_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_barcode_items_status ON public.barcode_items USING btree (status);


--
-- Name: idx_booklet_groups_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booklet_groups_group ON public.booklet_groups USING btree (group_id);


--
-- Name: idx_booklet_groups_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booklet_groups_item ON public.booklet_groups USING btree (item_id);


--
-- Name: idx_booklet_res_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booklet_res_item ON public.booklet_reservations USING btree (item_id);


--
-- Name: idx_booklet_res_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booklet_res_status ON public.booklet_reservations USING btree (delivery_status);


--
-- Name: idx_booklet_res_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_booklet_res_student ON public.booklet_reservations USING btree (student_id);


--
-- Name: idx_cancelled_sessions_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cancelled_sessions_date ON public.cancelled_sessions USING btree (session_date);


--
-- Name: idx_cancelled_sessions_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cancelled_sessions_group ON public.cancelled_sessions USING btree (group_id);


--
-- Name: idx_classrooms_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_classrooms_active ON public.classrooms USING btree (is_active);


--
-- Name: idx_enrollments_group_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_group_id ON public.group_enrollments USING btree (group_id);


--
-- Name: idx_enrollments_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_student_id ON public.group_enrollments USING btree (student_id);


--
-- Name: idx_grade_packages_edu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grade_packages_edu ON public.grade_packages USING btree (education_type);


--
-- Name: idx_grade_packages_grade; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grade_packages_grade ON public.grade_packages USING btree (grade_id);


--
-- Name: idx_group_enrollments_group_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_group_enrollments_group_active ON public.group_enrollments USING btree (group_id, is_active) WHERE (is_active = true);


--
-- Name: idx_groups_classroom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_classroom ON public.groups USING btree (classroom_id);


--
-- Name: idx_groups_grade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_grade_id ON public.groups USING btree (grade_id);


--
-- Name: idx_groups_subject_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_subject_id ON public.groups USING btree (subject_id);


--
-- Name: idx_groups_teacher_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_groups_teacher_id ON public.groups USING btree (teacher_id);


--
-- Name: idx_pkg_groups_grp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pkg_groups_grp ON public.package_groups USING btree (group_id);


--
-- Name: idx_pkg_groups_pkg; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pkg_groups_pkg ON public.package_groups USING btree (package_id);


--
-- Name: idx_student_pkg_package; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_pkg_package ON public.student_package_enrollments USING btree (package_id);


--
-- Name: idx_student_pkg_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_pkg_student ON public.student_package_enrollments USING btree (student_id);


--
-- Name: idx_student_subscriptions_active_sessions; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_subscriptions_active_sessions ON public.student_subscriptions USING btree (student_id, status, remaining_sessions) WHERE (status = 'active'::public.subscription_status_enum);


--
-- Name: idx_student_subscriptions_group_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_subscriptions_group_active ON public.student_subscriptions USING btree (student_id, group_id, status) WHERE (status = 'active'::public.subscription_status_enum);


--
-- Name: idx_students_barcode_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_barcode_id ON public.students USING btree (barcode_id);


--
-- Name: idx_students_full_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_full_name ON public.students USING btree (full_name);


--
-- Name: idx_students_grade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_grade_id ON public.students USING btree (grade_id);


--
-- Name: idx_students_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_is_active ON public.students USING btree (is_active);


--
-- Name: idx_students_parent_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_parent_phone ON public.students USING btree (parent_phone);


--
-- Name: idx_students_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_phone ON public.students USING btree (phone);


--
-- Name: idx_students_student_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_student_code ON public.students USING btree (student_code);


--
-- Name: idx_subscriptions_billing_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_billing_month ON public.student_subscriptions USING btree (billing_month);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_status ON public.student_subscriptions USING btree (status);


--
-- Name: idx_subscriptions_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_student_id ON public.student_subscriptions USING btree (student_id);


--
-- Name: idx_treasury_transactions_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_treasury_transactions_created ON public.treasury_transactions USING btree (created_at DESC);


--
-- Name: idx_treasury_transactions_reference; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_treasury_transactions_reference ON public.treasury_transactions USING btree (reference_id) WHERE (reference_id IS NOT NULL);


--
-- Name: idx_treasury_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_treasury_transactions_type ON public.treasury_transactions USING btree (transaction_type);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: academic_grades set_academic_grades_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_academic_grades_updated_at BEFORE UPDATE ON public.academic_grades FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: barcode_batches set_barcode_batches_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_barcode_batches_updated_at BEFORE UPDATE ON public.barcode_batches FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: booklet_reservations set_booklet_reservations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_booklet_reservations_updated_at BEFORE UPDATE ON public.booklet_reservations FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: classrooms set_classrooms_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: grade_packages set_grade_packages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_grade_packages_updated_at BEFORE UPDATE ON public.grade_packages FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: group_enrollments set_group_enrollments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_group_enrollments_updated_at BEFORE UPDATE ON public.group_enrollments FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: groups set_groups_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: inventory_items set_inventory_items_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: roles set_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: student_statuses set_student_statuses_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_student_statuses_updated_at BEFORE UPDATE ON public.student_statuses FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: student_subscriptions set_student_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_student_subscriptions_updated_at BEFORE UPDATE ON public.student_subscriptions FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: students set_students_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: subjects set_subjects_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: system_settings set_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: teachers set_teachers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: users set_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: attendance_logs attendance_logs_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: attendance_logs attendance_logs_scanned_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_scanned_by_user_id_fkey FOREIGN KEY (scanned_by_user_id) REFERENCES public.users(id);


--
-- Name: attendance_logs attendance_logs_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: attendance_logs attendance_logs_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.student_subscriptions(id);


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: barcode_batches barcode_batches_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barcode_batches
    ADD CONSTRAINT barcode_batches_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id);


--
-- Name: barcode_batches barcode_batches_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barcode_batches
    ADD CONSTRAINT barcode_batches_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id);


--
-- Name: barcode_items barcode_items_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barcode_items
    ADD CONSTRAINT barcode_items_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.students(id);


--
-- Name: barcode_items barcode_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.barcode_items
    ADD CONSTRAINT barcode_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.barcode_batches(id) ON DELETE CASCADE;


--
-- Name: booklet_groups booklet_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booklet_groups
    ADD CONSTRAINT booklet_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: booklet_groups booklet_groups_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booklet_groups
    ADD CONSTRAINT booklet_groups_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- Name: booklet_reservations booklet_reservations_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;


--
-- Name: booklet_reservations booklet_reservations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;


--
-- Name: booklet_reservations booklet_reservations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: cancelled_sessions cancelled_sessions_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancelled_sessions
    ADD CONSTRAINT cancelled_sessions_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id);


--
-- Name: cancelled_sessions cancelled_sessions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cancelled_sessions
    ADD CONSTRAINT cancelled_sessions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: daily_settlements daily_settlements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_settlements
    ADD CONSTRAINT daily_settlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expenses expenses_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: grade_packages grade_packages_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade_packages
    ADD CONSTRAINT grade_packages_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id) ON DELETE CASCADE;


--
-- Name: group_enrollments group_enrollments_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_enrollments
    ADD CONSTRAINT group_enrollments_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_enrollments group_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_enrollments
    ADD CONSTRAINT group_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: groups groups_classroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id);


--
-- Name: groups groups_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id);


--
-- Name: groups groups_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id);


--
-- Name: groups groups_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);


--
-- Name: inventory_items inventory_items_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id) ON DELETE SET NULL;


--
-- Name: inventory_items inventory_items_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;


--
-- Name: inventory_items inventory_items_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: package_groups package_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_groups
    ADD CONSTRAINT package_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: package_groups package_groups_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.package_groups
    ADD CONSTRAINT package_groups_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.grade_packages(id) ON DELETE CASCADE;


--
-- Name: pos_sale_items pos_sale_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_sale_items
    ADD CONSTRAINT pos_sale_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: pos_sale_items pos_sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_sale_items
    ADD CONSTRAINT pos_sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pos_sales(id) ON DELETE CASCADE;


--
-- Name: pos_sales pos_sales_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_sales
    ADD CONSTRAINT pos_sales_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: pos_sales pos_sales_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pos_sales
    ADD CONSTRAINT pos_sales_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: student_package_enrollments student_package_enrollments_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_package_enrollments
    ADD CONSTRAINT student_package_enrollments_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.grade_packages(id) ON DELETE CASCADE;


--
-- Name: student_package_enrollments student_package_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_package_enrollments
    ADD CONSTRAINT student_package_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_subscriptions student_subscriptions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subscriptions
    ADD CONSTRAINT student_subscriptions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: student_subscriptions student_subscriptions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_subscriptions
    ADD CONSTRAINT student_subscriptions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: students students_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id);


--
-- Name: students students_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.student_statuses(id);


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: teachers teachers_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;


--
-- Name: treasury_transactions treasury_transactions_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.treasury_transactions
    ADD CONSTRAINT treasury_transactions_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict WSFD6qkqLqe15zivlL7g2uVSB8vPH81PqWrJ8yo4Zb4reml2wUoJ5UzgUcfR4EG

