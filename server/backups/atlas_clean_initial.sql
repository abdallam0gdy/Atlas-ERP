--
-- PostgreSQL database dump
--

\restrict eXbNH0wqPBWw82689zwx5A12UMQkJ7b3Zs98eKPZxrPnQgkGKoqB4rWtjkG71KS

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
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: attendance_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status_enum AS ENUM (
    'present',
    'absent',
    'late',
    'excused'
);


--
-- Name: barcode_item_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.barcode_item_status_enum AS ENUM (
    'unassigned',
    'assigned',
    'damaged'
);


--
-- Name: batch_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.batch_status_enum AS ENUM (
    'pending',
    'generated',
    'partially_assigned',
    'fully_assigned'
);


--
-- Name: billing_model_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.billing_model_enum AS ENUM (
    'PACKAGE_BUNDLE',
    'PER_SUBJECT'
);


--
-- Name: day_of_week_enum; Type: TYPE; Schema: public; Owner: -
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


--
-- Name: group_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.group_status_enum AS ENUM (
    'active',
    'inactive',
    'archived'
);


--
-- Name: payment_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status_enum AS ENUM (
    'paid',
    'pending',
    'free'
);


--
-- Name: subscription_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_status_enum AS ENUM (
    'active',
    'expired',
    'suspended'
);


--
-- Name: trigger_set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trigger_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_grades; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: attendance_logs; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: barcode_batches; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: barcode_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: booklet_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booklet_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: booklet_reservation_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.booklet_reservation_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: booklet_reservations; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: cancelled_sessions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: classrooms; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: daily_settlements; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: grade_packages; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: group_enrollments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: package_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.package_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    package_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: pos_sale_items; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: pos_sales; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: student_code_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.student_code_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: student_package_enrollments; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: student_statuses; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: student_subscriptions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: treasury_transactions; Type: TABLE; Schema: public; Owner: -
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


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
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


--
-- Data for Name: academic_grades; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: attendance_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_logs (id, student_id, group_id, session_date, scan_timestamp, status, billing_type, payment_status, subscription_id, scanned_by_user_id, notes, sync_status, remote_id, created_at) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_log (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: barcode_batches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.barcode_batches (id, batch_name, prefix, grade_id, start_sequence, end_sequence, assigned_count, status, generated_by, notes, created_at, updated_at, use_center_sequence) FROM stdin;
\.


--
-- Data for Name: barcode_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.barcode_items (id, batch_id, barcode_value, status, assigned_to, assigned_at, created_at) FROM stdin;
\.


--
-- Data for Name: booklet_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booklet_groups (id, item_id, group_id, created_at) FROM stdin;
\.


--
-- Data for Name: booklet_reservations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booklet_reservations (id, reservation_number, student_id, item_id, group_id, quantity, unit_price, total_price, paid_amount, payment_status, delivery_status, reserved_at, delivered_at, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: cancelled_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cancelled_sessions (id, group_id, session_date, start_time, end_time, reason, cancelled_by, created_at) FROM stdin;
\.


--
-- Data for Name: classrooms; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: daily_settlements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_settlements (id, settlement_date, user_id, opening_balance, total_subscriptions, total_pos_sales, total_deposits, total_expenses, expected_cash, actual_cash, difference, status, notes, closed_at) FROM stdin;
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, expense_category, amount, recipient_name, notes, voucher_no, recorded_by, expense_date, created_at) FROM stdin;
\.


--
-- Data for Name: grade_packages; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: group_enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_enrollments (id, student_id, group_id, enrolled_at, is_active, notes, sync_status, created_at, updated_at, enrollment_type, discount_type, discount_value) FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.groups (id, name, name_ar, teacher_id, subject_id, grade_id, classroom_id, schedule, price_per_month, price_per_session, max_students, status, sync_status, remote_id, created_at, updated_at, package_teacher_ratio, package_center_ratio, private_teacher_ratio, private_center_ratio) FROM stdin;
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_items (id, name, category, barcode, subject_id, grade_id, cost_price, selling_price, current_stock, min_stock_alert, is_active, created_at, updated_at, teacher_id) FROM stdin;
\.


--
-- Data for Name: package_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.package_groups (id, package_id, group_id, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: pos_sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pos_sale_items (id, sale_id, item_id, item_name, quantity, unit_cost, unit_price, total_price) FROM stdin;
\.


--
-- Data for Name: pos_sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pos_sales (id, invoice_number, cashier_id, student_id, subtotal, discount, total_amount, paid_amount, change_amount, payment_method, notes, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, label_ar, label_en, description, is_system, created_at, updated_at, allowed_pages) FROM stdin;
42c9cdc5-7909-40c8-bf3b-f81cde1336ac	SUPER_ADMIN_OWNER	مالك النظام	Super Admin / Owner	Full unrestricted access — Finances, Settings, Profit split	t	2026-09-15 14:29:44.386261+03	2026-09-25 17:20:31.467966+03	["dashboard", "students", "teachers", "groups", "subjects", "subscriptions", "packages", "finance", "booklets", "qrcode", "gate", "users"]
ad233712-296a-4aa6-89e3-3f90671d4a09	FINANCE_MANAGER	مدير المالية	Finance Manager	Treasury, Teacher Settlements, POS Ledger, End-of-Day Closures	t	2026-09-15 14:29:44.386261+03	2026-09-25 17:20:31.467966+03	["dashboard", "students", "teachers", "groups", "subscriptions", "finance"]
14d607eb-4061-4320-af28-64b40ea58eee	RECEPTION_ASSISTANT	مساعد الاستقبال	Reception Assistant	Smart Attendance Gate scanning ONLY, Fast student lookup	t	2026-09-15 14:29:44.386261+03	2026-09-25 17:20:31.467966+03	["students", "subscriptions", "booklets", "gate"]
43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	CENTER_MANAGER	مدير السنتر	Center Manager	Schedules, Teachers, Students, General Operations & Reports	t	2026-09-15 14:29:44.386261+03	2026-09-26 03:51:06.571681+03	["dashboard", "students", "teachers", "groups", "subjects", "packages", "booklets", "qrcode", "gate"]
\.


--
-- Data for Name: student_package_enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_package_enrollments (id, student_id, package_id, selected_group_ids, total_price, status, enrolled_at, notes) FROM stdin;
\.


--
-- Data for Name: student_statuses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_statuses (id, name_ar, name_en, discount_percent, color, is_active, created_at, updated_at) FROM stdin;
6395bfe4-f6be-43de-82c4-3fc29c03a13b	عادي	Regular	0.00	#0C3C82	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
33fae18b-91ad-441d-8b43-49b5469e1928	متفوق	Distinguished	10.00	#10B981	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
0348f3ab-58c7-4b36-81e2-85b7849b481f	يتيم	Orphan	50.00	#F59E0B	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
082c5669-ab7b-4133-921c-c1168ada820a	حالة خاصة	Special Case	25.00	#8B5CF6	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
56e64c66-61ee-43a4-a731-0d3438ce978f	ابن موظف	Staff Child	100.00	#0EA5E9	t	2026-09-15 14:29:44.477287+03	2026-09-15 14:29:44.477287+03
\.


--
-- Data for Name: student_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_subscriptions (id, student_id, group_id, total_sessions, used_sessions, amount_paid, amount_due, billing_month, status, starts_at, expires_at, notes, sync_status, created_at, updated_at, enrollment_type, discount_type, discount_value) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.students (id, barcode_id, full_name, full_name_ar, phone, parent_phone, parent_name, grade_id, status_id, billing_model, photo_url, address, notes, is_active, sync_status, remote_id, created_at, updated_at, student_code, education_type, enrollment_type, father_phone, mother_phone, gender, national_id, date_of_birth) FROM stdin;
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
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
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teachers (id, full_name, full_name_ar, phone, email, specialization, revenue_split_percent, revenue_split_type, fixed_rate_per_student, is_active, notes, sync_status, remote_id, created_at, updated_at, subject_id, subject_ids, aka, gender, national_id, bio, social_links, secretary_name, secretary_phone, photo_url, logo_url, date_of_birth) FROM stdin;
\.


--
-- Data for Name: treasury_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.treasury_transactions (id, transaction_type, amount, reference_id, notes, recorded_by, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password_hash, full_name, full_name_ar, phone, email, role_id, is_active, last_login_at, sync_status, remote_id, created_at, updated_at, photo_url) FROM stdin;
765a2cf1-6549-46d0-874f-aaa35ba39c17	reception	$2b$10$kTZxt8jkUL06i651LWuv.u4j3Jp2IdusPHbx1NaPkEjX1JsaNdMBi	Reception & Gate Officer	موظف الاستقبال وبوابة الحضور	01056789012	reception@atlas-educational.com	14d607eb-4061-4320-af28-64b40ea58eee	t	2026-09-26 05:18:41.940559+03	local	\N	2026-09-16 14:53:16.906195+03	2026-09-26 05:18:41.940559+03	\N
0d849aaf-181d-41b7-8d26-d9410a58bed8	center_mgr	$2b$10$mTfrXV7fNUvI3M59ga00mOGvBSBxa9fvSpiy1Jw.F7Kcuopr3MKmu	Center Operations Manager	مدير العمليات والسنتر	01023456789	manager@atlas-educational.com	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	t	2026-09-26 05:21:55.35506+03	local	\N	2026-09-16 14:53:16.906195+03	2026-09-26 05:21:55.35506+03	\N
9cb28fe8-6c18-466e-a098-f7f862b22a26	test_receptionist	$2b$10$MqVLon0xZCzn6PW0lDF1.OSbvsXVjcNTPsOVMk1Eegfz3Mgn78.em	موظف استقبال تجريبي	\N	\N	\N	14d607eb-4061-4320-af28-64b40ea58eee	t	2026-09-18 09:36:23.235918+03	local	\N	2026-09-18 09:35:38.435976+03	2026-09-18 09:36:23.235918+03	\N
c442cd1f-3343-4df7-9863-27cd8294e5d9	finance_mgr	$2b$10$kTZxt8jkUL06i651LWuv.u4j3Jp2IdusPHbx1NaPkEjX1JsaNdMBi	Treasury & Finance Supervisor	مشرف الخزينة والمالية العامة	01034567890	finance@atlas-educational.com	ad233712-296a-4aa6-89e3-3f90671d4a09	t	\N	local	\N	2026-09-16 14:53:16.906195+03	2026-09-16 14:53:16.906195+03	\N
6c49cae8-988b-4bed-9f78-c069486f9f68	admin	$2b$10$3Cwp.e45jouE5HWL0WpsE.OMda6CaP8iPTiqgAe0TmxhrbrQUu9qO	System Administrator	ايمان ادمن	01224385098	admin@atlas-educational.com	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	t	2026-09-29 23:50:49.134494+03	local	\N	2026-09-15 14:29:44.452575+03	2026-09-29 23:50:49.134494+03	\N
\.


--
-- Name: booklet_reservation_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.booklet_reservation_seq', 1001, false);


--
-- Name: student_code_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.student_code_seq', 1001, false);


--
-- Name: academic_grades academic_grades_grade_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_grades
    ADD CONSTRAINT academic_grades_grade_order_key UNIQUE (grade_order);


--
-- Name: academic_grades academic_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_grades
    ADD CONSTRAINT academic_grades_pkey PRIMARY KEY (id);


--
-- Name: attendance_logs attendance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance_logs attendance_logs_student_id_group_id_session_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_student_id_group_id_session_date_key UNIQUE (student_id, group_id, session_date);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: barcode_batches barcode_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barcode_batches
    ADD CONSTRAINT barcode_batches_pkey PRIMARY KEY (id);


--
-- Name: barcode_items barcode_items_barcode_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barcode_items
    ADD CONSTRAINT barcode_items_barcode_value_key UNIQUE (barcode_value);


--
-- Name: barcode_items barcode_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barcode_items
    ADD CONSTRAINT barcode_items_pkey PRIMARY KEY (id);


--
-- Name: booklet_groups booklet_groups_item_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booklet_groups
    ADD CONSTRAINT booklet_groups_item_id_group_id_key UNIQUE (item_id, group_id);


--
-- Name: booklet_groups booklet_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booklet_groups
    ADD CONSTRAINT booklet_groups_pkey PRIMARY KEY (id);


--
-- Name: booklet_reservations booklet_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_pkey PRIMARY KEY (id);


--
-- Name: booklet_reservations booklet_reservations_reservation_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_reservation_number_key UNIQUE (reservation_number);


--
-- Name: cancelled_sessions cancelled_sessions_group_id_session_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancelled_sessions
    ADD CONSTRAINT cancelled_sessions_group_id_session_date_key UNIQUE (group_id, session_date);


--
-- Name: cancelled_sessions cancelled_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancelled_sessions
    ADD CONSTRAINT cancelled_sessions_pkey PRIMARY KEY (id);


--
-- Name: classrooms classrooms_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_name_key UNIQUE (name);


--
-- Name: classrooms classrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classrooms
    ADD CONSTRAINT classrooms_pkey PRIMARY KEY (id);


--
-- Name: daily_settlements daily_settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_settlements
    ADD CONSTRAINT daily_settlements_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: grade_packages grade_packages_grade_id_education_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade_packages
    ADD CONSTRAINT grade_packages_grade_id_education_type_key UNIQUE (grade_id, education_type);


--
-- Name: grade_packages grade_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade_packages
    ADD CONSTRAINT grade_packages_pkey PRIMARY KEY (id);


--
-- Name: group_enrollments group_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_enrollments
    ADD CONSTRAINT group_enrollments_pkey PRIMARY KEY (id);


--
-- Name: group_enrollments group_enrollments_student_id_group_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_enrollments
    ADD CONSTRAINT group_enrollments_student_id_group_id_key UNIQUE (student_id, group_id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_barcode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_barcode_key UNIQUE (barcode);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: package_groups package_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.package_groups
    ADD CONSTRAINT package_groups_pkey PRIMARY KEY (id);


--
-- Name: package_groups package_groups_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.package_groups
    ADD CONSTRAINT package_groups_unique UNIQUE (package_id, group_id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: pos_sale_items pos_sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sale_items
    ADD CONSTRAINT pos_sale_items_pkey PRIMARY KEY (id);


--
-- Name: pos_sales pos_sales_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sales
    ADD CONSTRAINT pos_sales_invoice_number_key UNIQUE (invoice_number);


--
-- Name: pos_sales pos_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sales
    ADD CONSTRAINT pos_sales_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: student_package_enrollments student_package_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_package_enrollments
    ADD CONSTRAINT student_package_enrollments_pkey PRIMARY KEY (id);


--
-- Name: student_statuses student_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_statuses
    ADD CONSTRAINT student_statuses_pkey PRIMARY KEY (id);


--
-- Name: student_subscriptions student_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subscriptions
    ADD CONSTRAINT student_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: students students_barcode_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_barcode_id_key UNIQUE (barcode_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_student_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_code_key UNIQUE (student_code);


--
-- Name: subjects subjects_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_code_key UNIQUE (code);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_key_key UNIQUE (key);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: treasury_transactions treasury_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treasury_transactions
    ADD CONSTRAINT treasury_transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_attendance_date_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_date_group ON public.attendance_logs USING btree (session_date, group_id);


--
-- Name: idx_attendance_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_group_id ON public.attendance_logs USING btree (group_id);


--
-- Name: idx_attendance_logs_today; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_logs_today ON public.attendance_logs USING btree (session_date, status, payment_status);


--
-- Name: idx_attendance_scan_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_scan_timestamp ON public.attendance_logs USING btree (scan_timestamp);


--
-- Name: idx_attendance_session_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_session_date ON public.attendance_logs USING btree (session_date);


--
-- Name: idx_attendance_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_student_id ON public.attendance_logs USING btree (student_id);


--
-- Name: idx_audit_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_created_at ON public.audit_log USING btree (created_at);


--
-- Name: idx_audit_log_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_audit_log_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_user_id ON public.audit_log USING btree (user_id);


--
-- Name: idx_barcode_items_barcode_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_barcode_items_barcode_value ON public.barcode_items USING btree (barcode_value);


--
-- Name: idx_barcode_items_batch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_barcode_items_batch_id ON public.barcode_items USING btree (batch_id);


--
-- Name: idx_barcode_items_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_barcode_items_status ON public.barcode_items USING btree (status);


--
-- Name: idx_booklet_groups_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booklet_groups_group ON public.booklet_groups USING btree (group_id);


--
-- Name: idx_booklet_groups_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booklet_groups_item ON public.booklet_groups USING btree (item_id);


--
-- Name: idx_booklet_res_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booklet_res_item ON public.booklet_reservations USING btree (item_id);


--
-- Name: idx_booklet_res_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booklet_res_status ON public.booklet_reservations USING btree (delivery_status);


--
-- Name: idx_booklet_res_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_booklet_res_student ON public.booklet_reservations USING btree (student_id);


--
-- Name: idx_cancelled_sessions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cancelled_sessions_date ON public.cancelled_sessions USING btree (session_date);


--
-- Name: idx_cancelled_sessions_group; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cancelled_sessions_group ON public.cancelled_sessions USING btree (group_id);


--
-- Name: idx_classrooms_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classrooms_active ON public.classrooms USING btree (is_active);


--
-- Name: idx_enrollments_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_group_id ON public.group_enrollments USING btree (group_id);


--
-- Name: idx_enrollments_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enrollments_student_id ON public.group_enrollments USING btree (student_id);


--
-- Name: idx_grade_packages_edu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_grade_packages_edu ON public.grade_packages USING btree (education_type);


--
-- Name: idx_grade_packages_grade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_grade_packages_grade ON public.grade_packages USING btree (grade_id);


--
-- Name: idx_group_enrollments_group_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_group_enrollments_group_active ON public.group_enrollments USING btree (group_id, is_active) WHERE (is_active = true);


--
-- Name: idx_groups_classroom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_classroom ON public.groups USING btree (classroom_id);


--
-- Name: idx_groups_grade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_grade_id ON public.groups USING btree (grade_id);


--
-- Name: idx_groups_subject_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_subject_id ON public.groups USING btree (subject_id);


--
-- Name: idx_groups_teacher_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_groups_teacher_id ON public.groups USING btree (teacher_id);


--
-- Name: idx_pkg_groups_grp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pkg_groups_grp ON public.package_groups USING btree (group_id);


--
-- Name: idx_pkg_groups_pkg; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pkg_groups_pkg ON public.package_groups USING btree (package_id);


--
-- Name: idx_student_pkg_package; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_pkg_package ON public.student_package_enrollments USING btree (package_id);


--
-- Name: idx_student_pkg_student; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_pkg_student ON public.student_package_enrollments USING btree (student_id);


--
-- Name: idx_student_subscriptions_active_sessions; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_subscriptions_active_sessions ON public.student_subscriptions USING btree (student_id, status, remaining_sessions) WHERE (status = 'active'::public.subscription_status_enum);


--
-- Name: idx_student_subscriptions_group_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_student_subscriptions_group_active ON public.student_subscriptions USING btree (student_id, group_id, status) WHERE (status = 'active'::public.subscription_status_enum);


--
-- Name: idx_students_barcode_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_barcode_id ON public.students USING btree (barcode_id);


--
-- Name: idx_students_full_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_full_name ON public.students USING btree (full_name);


--
-- Name: idx_students_grade_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_grade_id ON public.students USING btree (grade_id);


--
-- Name: idx_students_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_is_active ON public.students USING btree (is_active);


--
-- Name: idx_students_parent_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_parent_phone ON public.students USING btree (parent_phone);


--
-- Name: idx_students_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_phone ON public.students USING btree (phone);


--
-- Name: idx_students_student_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_students_student_code ON public.students USING btree (student_code);


--
-- Name: idx_subscriptions_billing_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_billing_month ON public.student_subscriptions USING btree (billing_month);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.student_subscriptions USING btree (status);


--
-- Name: idx_subscriptions_student_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_student_id ON public.student_subscriptions USING btree (student_id);


--
-- Name: idx_treasury_transactions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treasury_transactions_created ON public.treasury_transactions USING btree (created_at DESC);


--
-- Name: idx_treasury_transactions_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treasury_transactions_reference ON public.treasury_transactions USING btree (reference_id) WHERE (reference_id IS NOT NULL);


--
-- Name: idx_treasury_transactions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treasury_transactions_type ON public.treasury_transactions USING btree (transaction_type);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: academic_grades set_academic_grades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_academic_grades_updated_at BEFORE UPDATE ON public.academic_grades FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: barcode_batches set_barcode_batches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_barcode_batches_updated_at BEFORE UPDATE ON public.barcode_batches FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: booklet_reservations set_booklet_reservations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_booklet_reservations_updated_at BEFORE UPDATE ON public.booklet_reservations FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: classrooms set_classrooms_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_classrooms_updated_at BEFORE UPDATE ON public.classrooms FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: grade_packages set_grade_packages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_grade_packages_updated_at BEFORE UPDATE ON public.grade_packages FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: group_enrollments set_group_enrollments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_group_enrollments_updated_at BEFORE UPDATE ON public.group_enrollments FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: groups set_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: inventory_items set_inventory_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: roles set_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: student_statuses set_student_statuses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_student_statuses_updated_at BEFORE UPDATE ON public.student_statuses FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: student_subscriptions set_student_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_student_subscriptions_updated_at BEFORE UPDATE ON public.student_subscriptions FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: students set_students_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: subjects set_subjects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: system_settings set_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: teachers set_teachers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: users set_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();


--
-- Name: attendance_logs attendance_logs_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: attendance_logs attendance_logs_scanned_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_scanned_by_user_id_fkey FOREIGN KEY (scanned_by_user_id) REFERENCES public.users(id);


--
-- Name: attendance_logs attendance_logs_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: attendance_logs attendance_logs_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.student_subscriptions(id);


--
-- Name: audit_log audit_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: barcode_batches barcode_batches_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barcode_batches
    ADD CONSTRAINT barcode_batches_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id);


--
-- Name: barcode_batches barcode_batches_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barcode_batches
    ADD CONSTRAINT barcode_batches_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id);


--
-- Name: barcode_items barcode_items_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barcode_items
    ADD CONSTRAINT barcode_items_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.students(id);


--
-- Name: barcode_items barcode_items_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.barcode_items
    ADD CONSTRAINT barcode_items_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.barcode_batches(id) ON DELETE CASCADE;


--
-- Name: booklet_groups booklet_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booklet_groups
    ADD CONSTRAINT booklet_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: booklet_groups booklet_groups_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booklet_groups
    ADD CONSTRAINT booklet_groups_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- Name: booklet_reservations booklet_reservations_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;


--
-- Name: booklet_reservations booklet_reservations_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE RESTRICT;


--
-- Name: booklet_reservations booklet_reservations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booklet_reservations
    ADD CONSTRAINT booklet_reservations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- Name: cancelled_sessions cancelled_sessions_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancelled_sessions
    ADD CONSTRAINT cancelled_sessions_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(id);


--
-- Name: cancelled_sessions cancelled_sessions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cancelled_sessions
    ADD CONSTRAINT cancelled_sessions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: daily_settlements daily_settlements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_settlements
    ADD CONSTRAINT daily_settlements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expenses expenses_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: grade_packages grade_packages_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grade_packages
    ADD CONSTRAINT grade_packages_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id) ON DELETE CASCADE;


--
-- Name: group_enrollments group_enrollments_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_enrollments
    ADD CONSTRAINT group_enrollments_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: group_enrollments group_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_enrollments
    ADD CONSTRAINT group_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: groups groups_classroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id);


--
-- Name: groups groups_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id);


--
-- Name: groups groups_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id);


--
-- Name: groups groups_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id);


--
-- Name: inventory_items inventory_items_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id) ON DELETE SET NULL;


--
-- Name: inventory_items inventory_items_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;


--
-- Name: inventory_items inventory_items_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: package_groups package_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.package_groups
    ADD CONSTRAINT package_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: package_groups package_groups_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.package_groups
    ADD CONSTRAINT package_groups_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.grade_packages(id) ON DELETE CASCADE;


--
-- Name: pos_sale_items pos_sale_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sale_items
    ADD CONSTRAINT pos_sale_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id);


--
-- Name: pos_sale_items pos_sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sale_items
    ADD CONSTRAINT pos_sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.pos_sales(id) ON DELETE CASCADE;


--
-- Name: pos_sales pos_sales_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sales
    ADD CONSTRAINT pos_sales_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.users(id);


--
-- Name: pos_sales pos_sales_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sales
    ADD CONSTRAINT pos_sales_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: student_package_enrollments student_package_enrollments_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_package_enrollments
    ADD CONSTRAINT student_package_enrollments_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.grade_packages(id) ON DELETE CASCADE;


--
-- Name: student_package_enrollments student_package_enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_package_enrollments
    ADD CONSTRAINT student_package_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_subscriptions student_subscriptions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subscriptions
    ADD CONSTRAINT student_subscriptions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: student_subscriptions student_subscriptions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_subscriptions
    ADD CONSTRAINT student_subscriptions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: students students_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.academic_grades(id);


--
-- Name: students students_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.student_statuses(id);


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: teachers teachers_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;


--
-- Name: treasury_transactions treasury_transactions_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treasury_transactions
    ADD CONSTRAINT treasury_transactions_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict eXbNH0wqPBWw82689zwx5A12UMQkJ7b3Zs98eKPZxrPnQgkGKoqB4rWtjkG71KS

