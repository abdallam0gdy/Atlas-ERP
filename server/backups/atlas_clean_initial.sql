--
-- PostgreSQL database dump
--

\restrict WHcmNTLiq252sSsa20HqX6J7jI3MsZicPaxxlfVB1aiR5NcvMGke65uFFkZ1SUT

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.treasury_transactions DROP CONSTRAINT IF EXISTS treasury_transactions_recorded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.teachers DROP CONSTRAINT IF EXISTS teachers_subject_id_fkey;
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_status_id_fkey;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_grade_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_subscriptions DROP CONSTRAINT IF EXISTS student_subscriptions_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_subscriptions DROP CONSTRAINT IF EXISTS student_subscriptions_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_package_enrollments DROP CONSTRAINT IF EXISTS student_package_enrollments_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.student_package_enrollments DROP CONSTRAINT IF EXISTS student_package_enrollments_package_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_fkey;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_permission_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sales DROP CONSTRAINT IF EXISTS pos_sales_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sales DROP CONSTRAINT IF EXISTS pos_sales_cashier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sale_items DROP CONSTRAINT IF EXISTS pos_sale_items_sale_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sale_items DROP CONSTRAINT IF EXISTS pos_sale_items_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.package_groups DROP CONSTRAINT IF EXISTS package_groups_package_id_fkey;
ALTER TABLE IF EXISTS ONLY public.package_groups DROP CONSTRAINT IF EXISTS package_groups_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_teacher_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_subject_id_fkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_grade_id_fkey;
ALTER TABLE IF EXISTS ONLY public.groups DROP CONSTRAINT IF EXISTS groups_teacher_id_fkey;
ALTER TABLE IF EXISTS ONLY public.groups DROP CONSTRAINT IF EXISTS groups_subject_id_fkey;
ALTER TABLE IF EXISTS ONLY public.groups DROP CONSTRAINT IF EXISTS groups_grade_id_fkey;
ALTER TABLE IF EXISTS ONLY public.groups DROP CONSTRAINT IF EXISTS groups_classroom_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_enrollments DROP CONSTRAINT IF EXISTS group_enrollments_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_enrollments DROP CONSTRAINT IF EXISTS group_enrollments_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.grade_packages DROP CONSTRAINT IF EXISTS grade_packages_grade_id_fkey;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_recorded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.daily_settlements DROP CONSTRAINT IF EXISTS daily_settlements_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cancelled_sessions DROP CONSTRAINT IF EXISTS cancelled_sessions_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cancelled_sessions DROP CONSTRAINT IF EXISTS cancelled_sessions_cancelled_by_fkey;
ALTER TABLE IF EXISTS ONLY public.booklet_reservations DROP CONSTRAINT IF EXISTS booklet_reservations_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.booklet_reservations DROP CONSTRAINT IF EXISTS booklet_reservations_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.booklet_reservations DROP CONSTRAINT IF EXISTS booklet_reservations_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.booklet_groups DROP CONSTRAINT IF EXISTS booklet_groups_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.booklet_groups DROP CONSTRAINT IF EXISTS booklet_groups_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.barcode_items DROP CONSTRAINT IF EXISTS barcode_items_batch_id_fkey;
ALTER TABLE IF EXISTS ONLY public.barcode_items DROP CONSTRAINT IF EXISTS barcode_items_assigned_to_fkey;
ALTER TABLE IF EXISTS ONLY public.barcode_batches DROP CONSTRAINT IF EXISTS barcode_batches_grade_id_fkey;
ALTER TABLE IF EXISTS ONLY public.barcode_batches DROP CONSTRAINT IF EXISTS barcode_batches_generated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_subscription_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_student_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_scanned_by_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_group_id_fkey;
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS set_teachers_updated_at ON public.teachers;
DROP TRIGGER IF EXISTS set_system_settings_updated_at ON public.system_settings;
DROP TRIGGER IF EXISTS set_subjects_updated_at ON public.subjects;
DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
DROP TRIGGER IF EXISTS set_student_subscriptions_updated_at ON public.student_subscriptions;
DROP TRIGGER IF EXISTS set_student_statuses_updated_at ON public.student_statuses;
DROP TRIGGER IF EXISTS set_roles_updated_at ON public.roles;
DROP TRIGGER IF EXISTS set_inventory_items_updated_at ON public.inventory_items;
DROP TRIGGER IF EXISTS set_groups_updated_at ON public.groups;
DROP TRIGGER IF EXISTS set_group_enrollments_updated_at ON public.group_enrollments;
DROP TRIGGER IF EXISTS set_grade_packages_updated_at ON public.grade_packages;
DROP TRIGGER IF EXISTS set_classrooms_updated_at ON public.classrooms;
DROP TRIGGER IF EXISTS set_booklet_reservations_updated_at ON public.booklet_reservations;
DROP TRIGGER IF EXISTS set_barcode_batches_updated_at ON public.barcode_batches;
DROP TRIGGER IF EXISTS set_academic_grades_updated_at ON public.academic_grades;
DROP INDEX IF EXISTS public.idx_users_username;
DROP INDEX IF EXISTS public.idx_users_role_id;
DROP INDEX IF EXISTS public.idx_treasury_transactions_type;
DROP INDEX IF EXISTS public.idx_treasury_transactions_reference;
DROP INDEX IF EXISTS public.idx_treasury_transactions_created;
DROP INDEX IF EXISTS public.idx_subscriptions_student_id;
DROP INDEX IF EXISTS public.idx_subscriptions_status;
DROP INDEX IF EXISTS public.idx_subscriptions_billing_month;
DROP INDEX IF EXISTS public.idx_students_student_code;
DROP INDEX IF EXISTS public.idx_students_phone;
DROP INDEX IF EXISTS public.idx_students_parent_phone;
DROP INDEX IF EXISTS public.idx_students_national_id;
DROP INDEX IF EXISTS public.idx_students_is_active;
DROP INDEX IF EXISTS public.idx_students_grade_id;
DROP INDEX IF EXISTS public.idx_students_full_name;
DROP INDEX IF EXISTS public.idx_students_barcode_id;
DROP INDEX IF EXISTS public.idx_student_subscriptions_group_active;
DROP INDEX IF EXISTS public.idx_student_subscriptions_active_sessions;
DROP INDEX IF EXISTS public.idx_student_pkg_student;
DROP INDEX IF EXISTS public.idx_student_pkg_package;
DROP INDEX IF EXISTS public.idx_pkg_groups_pkg;
DROP INDEX IF EXISTS public.idx_pkg_groups_grp;
DROP INDEX IF EXISTS public.idx_groups_teacher_id;
DROP INDEX IF EXISTS public.idx_groups_subject_id;
DROP INDEX IF EXISTS public.idx_groups_grade_id;
DROP INDEX IF EXISTS public.idx_groups_classroom;
DROP INDEX IF EXISTS public.idx_group_enrollments_group_active;
DROP INDEX IF EXISTS public.idx_grade_packages_grade;
DROP INDEX IF EXISTS public.idx_grade_packages_edu;
DROP INDEX IF EXISTS public.idx_enrollments_student_id;
DROP INDEX IF EXISTS public.idx_enrollments_group_id;
DROP INDEX IF EXISTS public.idx_classrooms_active;
DROP INDEX IF EXISTS public.idx_cancelled_sessions_group;
DROP INDEX IF EXISTS public.idx_cancelled_sessions_date;
DROP INDEX IF EXISTS public.idx_booklet_res_student;
DROP INDEX IF EXISTS public.idx_booklet_res_status;
DROP INDEX IF EXISTS public.idx_booklet_res_item;
DROP INDEX IF EXISTS public.idx_booklet_groups_item;
DROP INDEX IF EXISTS public.idx_booklet_groups_group;
DROP INDEX IF EXISTS public.idx_barcode_items_status;
DROP INDEX IF EXISTS public.idx_barcode_items_batch_id;
DROP INDEX IF EXISTS public.idx_barcode_items_barcode_value;
DROP INDEX IF EXISTS public.idx_audit_log_user_id;
DROP INDEX IF EXISTS public.idx_audit_log_entity;
DROP INDEX IF EXISTS public.idx_audit_log_created_at;
DROP INDEX IF EXISTS public.idx_attendance_student_id;
DROP INDEX IF EXISTS public.idx_attendance_session_date;
DROP INDEX IF EXISTS public.idx_attendance_scan_timestamp;
DROP INDEX IF EXISTS public.idx_attendance_logs_today;
DROP INDEX IF EXISTS public.idx_attendance_group_id;
DROP INDEX IF EXISTS public.idx_attendance_date_group;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.treasury_transactions DROP CONSTRAINT IF EXISTS treasury_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.teachers DROP CONSTRAINT IF EXISTS teachers_pkey;
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_key_key;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_pkey;
ALTER TABLE IF EXISTS ONLY public.subjects DROP CONSTRAINT IF EXISTS subjects_code_key;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_student_code_key;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_pkey;
ALTER TABLE IF EXISTS ONLY public.students DROP CONSTRAINT IF EXISTS students_barcode_id_key;
ALTER TABLE IF EXISTS ONLY public.student_subscriptions DROP CONSTRAINT IF EXISTS student_subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.student_statuses DROP CONSTRAINT IF EXISTS student_statuses_pkey;
ALTER TABLE IF EXISTS ONLY public.student_package_enrollments DROP CONSTRAINT IF EXISTS student_package_enrollments_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_name_key;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_role_id_permission_id_key;
ALTER TABLE IF EXISTS ONLY public.role_permissions DROP CONSTRAINT IF EXISTS role_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_sales DROP CONSTRAINT IF EXISTS pos_sales_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_sales DROP CONSTRAINT IF EXISTS pos_sales_invoice_number_key;
ALTER TABLE IF EXISTS ONLY public.pos_sale_items DROP CONSTRAINT IF EXISTS pos_sale_items_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.permissions DROP CONSTRAINT IF EXISTS permissions_code_key;
ALTER TABLE IF EXISTS ONLY public.package_groups DROP CONSTRAINT IF EXISTS package_groups_unique;
ALTER TABLE IF EXISTS ONLY public.package_groups DROP CONSTRAINT IF EXISTS package_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_barcode_key;
ALTER TABLE IF EXISTS ONLY public.groups DROP CONSTRAINT IF EXISTS groups_pkey;
ALTER TABLE IF EXISTS ONLY public.group_enrollments DROP CONSTRAINT IF EXISTS group_enrollments_student_id_group_id_key;
ALTER TABLE IF EXISTS ONLY public.group_enrollments DROP CONSTRAINT IF EXISTS group_enrollments_pkey;
ALTER TABLE IF EXISTS ONLY public.grade_packages DROP CONSTRAINT IF EXISTS grade_packages_pkey;
ALTER TABLE IF EXISTS ONLY public.grade_packages DROP CONSTRAINT IF EXISTS grade_packages_grade_id_education_type_key;
ALTER TABLE IF EXISTS ONLY public.expenses DROP CONSTRAINT IF EXISTS expenses_pkey;
ALTER TABLE IF EXISTS ONLY public.daily_settlements DROP CONSTRAINT IF EXISTS daily_settlements_pkey;
ALTER TABLE IF EXISTS ONLY public.classrooms DROP CONSTRAINT IF EXISTS classrooms_pkey;
ALTER TABLE IF EXISTS ONLY public.classrooms DROP CONSTRAINT IF EXISTS classrooms_name_key;
ALTER TABLE IF EXISTS ONLY public.cancelled_sessions DROP CONSTRAINT IF EXISTS cancelled_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.cancelled_sessions DROP CONSTRAINT IF EXISTS cancelled_sessions_group_id_session_date_key;
ALTER TABLE IF EXISTS ONLY public.booklet_reservations DROP CONSTRAINT IF EXISTS booklet_reservations_reservation_number_key;
ALTER TABLE IF EXISTS ONLY public.booklet_reservations DROP CONSTRAINT IF EXISTS booklet_reservations_pkey;
ALTER TABLE IF EXISTS ONLY public.booklet_groups DROP CONSTRAINT IF EXISTS booklet_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.booklet_groups DROP CONSTRAINT IF EXISTS booklet_groups_item_id_group_id_key;
ALTER TABLE IF EXISTS ONLY public.barcode_items DROP CONSTRAINT IF EXISTS barcode_items_pkey;
ALTER TABLE IF EXISTS ONLY public.barcode_items DROP CONSTRAINT IF EXISTS barcode_items_barcode_value_key;
ALTER TABLE IF EXISTS ONLY public.barcode_batches DROP CONSTRAINT IF EXISTS barcode_batches_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_log DROP CONSTRAINT IF EXISTS audit_log_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_student_id_group_id_session_date_key;
ALTER TABLE IF EXISTS ONLY public.attendance_logs DROP CONSTRAINT IF EXISTS attendance_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.academic_grades DROP CONSTRAINT IF EXISTS academic_grades_pkey;
ALTER TABLE IF EXISTS ONLY public.academic_grades DROP CONSTRAINT IF EXISTS academic_grades_grade_order_key;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.treasury_transactions;
DROP TABLE IF EXISTS public.teachers;
DROP TABLE IF EXISTS public.system_settings;
DROP TABLE IF EXISTS public.subjects;
DROP TABLE IF EXISTS public.students;
DROP TABLE IF EXISTS public.student_subscriptions;
DROP TABLE IF EXISTS public.student_statuses;
DROP TABLE IF EXISTS public.student_package_enrollments;
DROP SEQUENCE IF EXISTS public.student_code_seq;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.pos_sales;
DROP TABLE IF EXISTS public.pos_sale_items;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.package_groups;
DROP TABLE IF EXISTS public.inventory_items;
DROP TABLE IF EXISTS public.groups;
DROP TABLE IF EXISTS public.group_enrollments;
DROP TABLE IF EXISTS public.grade_packages;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.daily_settlements;
DROP TABLE IF EXISTS public.classrooms;
DROP TABLE IF EXISTS public.cancelled_sessions;
DROP TABLE IF EXISTS public.booklet_reservations;
DROP SEQUENCE IF EXISTS public.booklet_reservation_seq;
DROP TABLE IF EXISTS public.booklet_groups;
DROP TABLE IF EXISTS public.barcode_items;
DROP TABLE IF EXISTS public.barcode_batches;
DROP TABLE IF EXISTS public.audit_log;
DROP TABLE IF EXISTS public.attendance_logs;
DROP TABLE IF EXISTS public.academic_grades;
DROP FUNCTION IF EXISTS public.trigger_set_updated_at();
DROP TYPE IF EXISTS public.subscription_status_enum;
DROP TYPE IF EXISTS public.payment_status_enum;
DROP TYPE IF EXISTS public.group_status_enum;
DROP TYPE IF EXISTS public.day_of_week_enum;
DROP TYPE IF EXISTS public.billing_model_enum;
DROP TYPE IF EXISTS public.batch_status_enum;
DROP TYPE IF EXISTS public.barcode_item_status_enum;
DROP TYPE IF EXISTS public.attendance_status_enum;
DROP EXTENSION IF EXISTS pgcrypto;
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
    date_of_birth date,
    school_name character varying(150)
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
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;
0a908c31-eaa4-4c95-bd27-d7eaa8e33b89	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	a3161700-cbc7-48fe-917d-3795186f65b9	\N	{"id": "a3161700-cbc7-48fe-917d-3795186f65b9", "notes": null, "phone": "01224385098", "gender": "male", "address": null, "grade_id": "eab6184a-f010-48ea-9eee-a75a44ee9f7e", "full_name": "طالب اختبار", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G07-1001", "created_at": "2026-09-30T20:56:20.896Z", "updated_at": "2026-09-30T20:56:20.896Z", "national_id": null, "parent_name": "ولي أمر الطالب", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01224385098", "student_code": 1001, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-09-30 23:56:20.896131+03
d401e770-9b13-4d79-b244-3cae515a3ba6	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	97c2c81f-ec62-4178-9777-bd52e947269e	\N	{"id": "97c2c81f-ec62-4178-9777-bd52e947269e", "notes": null, "phone": "01099887766", "gender": "male", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تجريبي لاختبار الحذف", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1002", "created_at": "2026-10-01T11:13:00.655Z", "updated_at": "2026-10-01T11:13:00.655Z", "national_id": null, "parent_name": "ولي أمر تجريبي", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01011223344", "student_code": 1002, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-10-01 14:13:00.655142+03
9956a6cd-7f90-4189-b851-c60a6a8c939c	6c49cae8-988b-4bed-9f78-c069486f9f68	DELETE	student	97c2c81f-ec62-4178-9777-bd52e947269e	{"id": "97c2c81f-ec62-4178-9777-bd52e947269e", "full_name": "طالب تجريبي لاختبار الحذف", "barcode_id": "ATL-G01-1002", "grade_name": "الصف الأول الابتدائي", "student_code": 1002}	\N	\N	\N	2026-10-01 14:14:44.386177+03
8a7b3715-b755-475c-bd40-1fad7ef95c39	6c49cae8-988b-4bed-9f78-c069486f9f68	CREATE	student	a68a568e-dfb3-470b-a3ce-d2d6c6b1e3f4	\N	{"id": "a68a568e-dfb3-470b-a3ce-d2d6c6b1e3f4", "notes": null, "phone": "01011992288", "gender": "male", "address": null, "grade_id": "911c3cb2-c7f1-4a04-8ad7-82d62096a205", "full_name": "طالب تجريبي مع ارتباطات لاختبار الحذف الكامل", "is_active": true, "photo_url": null, "remote_id": null, "status_id": null, "barcode_id": "ATL-G01-1003", "created_at": "2026-10-01T11:14:44.503Z", "updated_at": "2026-10-01T11:14:44.503Z", "national_id": null, "parent_name": "ولي أمر مرتبط", "sync_status": "local", "father_phone": null, "full_name_ar": null, "mother_phone": null, "parent_phone": "01033445566", "student_code": 1003, "billing_model": "PACKAGE_BUNDLE", "date_of_birth": null, "education_type": "PUBLIC", "enrollment_type": "PACKAGE"}	\N	\N	2026-10-01 14:14:44.503152+03
3d7c1dac-b4ea-436d-9551-64a786f6b0c6	6c49cae8-988b-4bed-9f78-c069486f9f68	DELETE	student	a68a568e-dfb3-470b-a3ce-d2d6c6b1e3f4	{"id": "a68a568e-dfb3-470b-a3ce-d2d6c6b1e3f4", "full_name": "طالب تجريبي مع ارتباطات لاختبار الحذف الكامل", "barcode_id": "ATL-G01-1003", "grade_name": "الصف الأول الابتدائي", "student_code": 1003}	\N	\N	\N	2026-10-01 14:14:44.536078+03
cacfb59f-0ab9-417b-af8c-1e98b706b1bc	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 285, "totalSynced": 285, "existingCount": 0, "duplicatesDetected": 0}	\N	\N	2026-11-13 16:15:13.671852+02
5d474d0e-2bba-450a-a1fc-b6cd3ddf9096	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 1, "totalSynced": 286, "existingCount": 285, "duplicatesDetected": 0}	\N	\N	2026-11-14 17:44:44.202788+02
d477e4a8-f421-4ca0-9f08-c73250657080	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 0, "totalSynced": 286, "existingCount": 286, "duplicatesDetected": 0}	\N	\N	2026-11-14 17:44:59.418558+02
e1dead97-1429-4d28-a801-db37bef08c28	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 0, "totalSynced": 286, "existingCount": 286, "duplicatesDetected": 0}	\N	\N	2026-11-14 17:45:47.56695+02
1b246142-2de5-4221-911c-dff6e5ef680a	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 0, "totalSynced": 286, "existingCount": 286, "duplicatesDetected": 0}	\N	\N	2026-11-14 18:45:03.299814+02
f22741d2-e04d-4121-9d29-500bba77c595	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 0, "totalSynced": 286, "existingCount": 286, "duplicatesDetected": 0}	\N	\N	2026-11-14 19:00:33.993997+02
d850475f-1a64-4a2d-9cf0-2b9003b7275b	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 0, "totalSynced": 286, "existingCount": 286, "duplicatesDetected": 0}	\N	\N	2026-11-15 18:40:38.43855+02
6036cdf3-c02d-4ead-ad9f-a84faa8c252a	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 0, "totalSynced": 286, "existingCount": 286, "duplicatesDetected": 0}	\N	\N	2026-11-15 19:28:09.060934+02
af2cbd52-4db6-4262-91a1-c5a4df3bc170	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 0, "totalSynced": 286, "existingCount": 286, "duplicatesDetected": 0}	\N	\N	2026-11-18 14:16:17.659366+02
0ce47b3c-5c7d-4351-a8bb-bea082ca6e12	6c49cae8-988b-4bed-9f78-c069486f9f68	SYNC_ONLINE	student	\N	\N	{"newCount": 6, "totalSynced": 292, "existingCount": 286, "duplicatesDetected": 0}	\N	\N	2026-11-19 15:34:35.259525+02
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
\.


--
-- Data for Name: booklet_reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booklet_reservations (id, reservation_number, student_id, item_id, group_id, quantity, unit_price, total_price, paid_amount, payment_status, delivery_status, reserved_at, delivered_at, notes, created_at, updated_at) FROM stdin;
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
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, expense_category, amount, recipient_name, notes, voucher_no, recorded_by, expense_date, created_at) FROM stdin;
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
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, name, name_ar, teacher_id, subject_id, grade_id, classroom_id, schedule, price_per_month, price_per_session, max_students, status, sync_status, remote_id, created_at, updated_at, package_teacher_ratio, package_center_ratio, private_teacher_ratio, private_center_ratio) FROM stdin;
06d1f404-f92a-45f1-bee0-600f6e1e2deb	اللغة العربية (ازهر) - ميس/ ياسمين حسن	اللغة العربية (ازهر) - ميس/ ياسمين حسن	47a489df-7f51-460a-9d16-5f2e9016a73a	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "monday", "end_time": "19:00", "start_time": "18:00"}, {"day": "thursday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-17 21:11:55.102014+02	2026-11-17 21:19:25.087815+02	0.00	100.00	75.00	25.00
31b63135-9eb4-4cb8-9a4b-f1b6514f59af	اللغة العربية (ازهر) - ا/ محمد صلاح عربي	اللغة العربية (ازهر) - ا/ محمد صلاح عربي	3a7d1ee9-29d1-4783-bf60-acaf0637e908	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "wednesday", "end_time": "16:00", "start_time": "14:30"}]	0.00	0.00	9999	active	local	\N	2026-11-17 21:11:55.102014+02	2026-11-17 21:19:25.087815+02	0.00	100.00	75.00	25.00
093581ce-9284-4bb6-9e51-45c8fa117aa6	الشرعي (ازهر) - ا/ الاء محمد	الشرعي (ازهر) - ا/ الاء محمد	3d974419-1413-43b9-9a16-b0a96e51b4bd	3954d6f5-1bff-49b1-bb06-60c852e8910b	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "friday", "end_time": "10:00", "start_time": "09:00"}]	0.00	0.00	9999	active	local	\N	2026-11-17 17:07:25.55505+02	2026-11-17 17:10:22.041438+02	0.00	100.00	75.00	25.00
01afcf6c-368a-4614-9ee6-50315fb0fb93	الشرعي (ازهر) - ا/ اسلام جمال	الشرعي (ازهر) - ا/ اسلام جمال	e1813cfc-859d-4fe8-8ed7-57bb7b7bd3f6	3954d6f5-1bff-49b1-bb06-60c852e8910b	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "thursday", "end_time": "17:30", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-17 17:10:22.041438+02	2026-11-17 21:11:55.102014+02	0.00	100.00	75.00	25.00
b4544239-d137-4b61-97ba-b16dbc725d21	الرياضيات - ا/ احمد محمود	الرياضيات - ا/ احمد محمود	38e7c542-e70b-4581-86e4-7acad9a5af09	f4e734d7-0612-46bc-bfc0-1450fdc253f0	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "sunday", "end_time": "17:00", "start_time": "16:00"}, {"day": "wednesday", "end_time": "17:00", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
d87c197e-8ebd-4f24-ba07-c98de2a03d29	الرياضيات - ا/ ادهم هاني	الرياضيات - ا/ ادهم هاني	4e260ca1-b3b0-4263-843f-5377db71442e	f4e734d7-0612-46bc-bfc0-1450fdc253f0	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "sunday", "end_time": "17:00", "start_time": "16:00"}, {"day": "wednesday", "end_time": "17:00", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
add4ea62-0b85-4f6d-bc0c-56e19f9bcec0	Math (لغات) - ا/ احمد نبيل	Math (لغات) - ا/ احمد نبيل	b4fdc16f-30e3-4a79-ad99-f4396d9a9944	13e61af9-7072-46de-9141-d85e764dc20a	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "wednesday", "end_time": "18:30", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
9cc90cc7-3bfa-4f17-9c2e-cb258ca457c0	العلوم - ا/ حازم	العلوم - ا/ حازم	a359f7ea-fa56-44ca-a33a-b333008fe008	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "sunday", "end_time": "18:00", "start_time": "17:00"}, {"day": "wednesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
55169b33-c419-4821-96c9-87a2634da155	العلوم - ا/ احمد عثمان	العلوم - ا/ احمد عثمان	5db56b25-f2d2-4d12-be46-6fc4ecb45037	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "monday", "end_time": "19:00", "start_time": "18:00"}, {"day": "thursday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
86843dfe-9395-4b15-81d8-e2e046bd1f9e	اللغة العربية - ا/ مروان	اللغة العربية - ا/ مروان	b23b63fb-da7c-408b-adc2-ba1dc28ed0d5	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	9833561e-f6fb-43b9-b9d4-152b41863bc5	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "saturday", "end_time": "17:00", "start_time": "16:00"}, {"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b6cff436-bd18-4645-8117-b7c9de60f2bc	اللغة العربية - ميس/ دنيا	اللغة العربية - ميس/ دنيا	324d13d6-dd4d-4f9a-a890-0ab85fd7d05a	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	9833561e-f6fb-43b9-b9d4-152b41863bc5	7f9a4f98-d6b9-45f5-af05-a29c03d10932	[{"day": "saturday", "end_time": "17:00", "start_time": "16:00"}, {"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
c68d0155-7e0b-4e62-b780-b65072ba3353	Science (لغات) - ميس/ ايناس	Science (لغات) - ميس/ ايناس	ab99cb00-1ad0-406d-bc36-57ac15f1199c	cae85df3-e30e-4e9e-89e4-4645bf9918c4	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "sunday", "end_time": "18:30", "start_time": "17:00"}]	160.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
65bbd8fe-5262-4330-a873-1fb8b5af7dca	اللغة الانجليزية - ميس/ الاء علاء	اللغة الانجليزية - ميس/ الاء علاء	ad027524-540c-42f2-ad26-aa6a34267e70	37455367-fad4-4bb6-87d8-4b2d0ec9da10	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "friday", "end_time": "15:00", "start_time": "14:00"}, {"day": "saturday", "end_time": "19:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
54fff58b-567a-4173-86eb-d18f1c667a25	Science (لغات) - ا/ ادهم امبابي	Science (لغات) - ا/ ادهم امبابي	84256980-b857-4c45-985d-c6d18385eb58	cae85df3-e30e-4e9e-89e4-4645bf9918c4	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "sunday", "end_time": "16:30", "start_time": "15:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
6888e637-0d66-49fa-a265-6554895d30fe	الدراسات الاجتماعية - ميس/ شيماء	الدراسات الاجتماعية - ميس/ شيماء	170831a0-e73c-438f-8302-16513b9e8ef6	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "monday", "end_time": "18:00", "start_time": "17:00"}, {"day": "thursday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
425eefb0-92ba-43e6-8da7-c6581efc8099	الدراسات الاجتماعية - ا/ محمود رشاد	الدراسات الاجتماعية - ا/ محمود رشاد	19c3af70-b27c-4370-82ee-c2e31b83ca08	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "monday", "end_time": "18:00", "start_time": "17:00"}, {"day": "thursday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
bbcac0c6-3bc5-4b83-a6f9-900f087ae924	تكنولوجيا المعلومات (عربي) - ميس/ هبة	تكنولوجيا المعلومات (عربي) - ميس/ هبة	85bd995b-7f11-4f19-a521-ce3e5268bfeb	ce5b10c3-aed1-4564-97c1-720147137ae6	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "tuesday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
93551bc4-bb46-45e6-9dc5-97f85bad4a70	ICT (لغات) - ميس/ نهلة	ICT (لغات) - ميس/ نهلة	a97e99d1-d9dc-49f1-901a-32892ef6b418	b59175b2-1b28-4825-8179-8557160906dc	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "tuesday", "end_time": "17:00", "start_time": "16:00"}]	160.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
d2dcdc2d-f376-42f6-8dba-42b662bcbe1c	التربية الدينية - ا/ صفية	التربية الدينية - ا/ صفية	7bb1ba79-480f-4b9e-b9f9-dba553ea37e2	585a7c3b-1dec-474f-b4e0-167924033473	9833561e-f6fb-43b9-b9d4-152b41863bc5	8656d593-ece1-4946-af99-20073616771d	[{"day": "tuesday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
a7f578ba-eda7-4d38-a4cb-0a5b4b70de72	اللغة العربية - ا/ مروان	اللغة العربية - ا/ مروان	b23b63fb-da7c-408b-adc2-ba1dc28ed0d5	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	704bb3dd-1825-4de6-a4ba-45d462423c6c	[{"day": "saturday", "end_time": "18:00", "start_time": "17:00"}, {"day": "tuesday", "end_time": "19:00", "start_time": "18:00"}]	100.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
2b93444e-0c67-454c-8ac1-89870d317251	اللغة العربية - ميس/ دنيا	اللغة العربية - ميس/ دنيا	324d13d6-dd4d-4f9a-a890-0ab85fd7d05a	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "saturday", "end_time": "18:00", "start_time": "17:00"}, {"day": "tuesday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b7205b34-da71-4deb-9779-68cc7eab98d1	الرياضيات - ا/ احمد محمود	الرياضيات - ا/ احمد محمود	38e7c542-e70b-4581-86e4-7acad9a5af09	f4e734d7-0612-46bc-bfc0-1450fdc253f0	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "sunday", "end_time": "18:00", "start_time": "17:00"}, {"day": "wednesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
a4db3ae9-6050-4390-892c-8dbde84a32e1	الرياضيات - ا/ ادهم هاني	الرياضيات - ا/ ادهم هاني	4e260ca1-b3b0-4263-843f-5377db71442e	f4e734d7-0612-46bc-bfc0-1450fdc253f0	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "sunday", "end_time": "18:00", "start_time": "17:00"}, {"day": "wednesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0d80e757-bc1b-4f68-8a48-513c0e728e37	Math (لغات) - ا/ احمد نبيل	Math (لغات) - ا/ احمد نبيل	b4fdc16f-30e3-4a79-ad99-f4396d9a9944	13e61af9-7072-46de-9141-d85e764dc20a	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "wednesday", "end_time": "20:30", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
30474894-3ef8-4cc8-b73d-dadac2bf8256	العلوم - ا/ حازم	العلوم - ا/ حازم	a359f7ea-fa56-44ca-a33a-b333008fe008	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "sunday", "end_time": "19:00", "start_time": "18:00"}, {"day": "wednesday", "end_time": "19:00", "start_time": "18:00"}]	150.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
eed96ff6-e43b-4a75-a7fb-ef85ddab0a61	العلوم - ا/ احمد عثمان	العلوم - ا/ احمد عثمان	5db56b25-f2d2-4d12-be46-6fc4ecb45037	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "monday", "end_time": "21:00", "start_time": "20:00"}, {"day": "thursday", "end_time": "21:00", "start_time": "20:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
e45ac801-ec5e-4eb8-924a-a99c70eb4cd1	Science (لغات) - ميس/ ايناس	Science (لغات) - ميس/ ايناس	ab99cb00-1ad0-406d-bc36-57ac15f1199c	cae85df3-e30e-4e9e-89e4-4645bf9918c4	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "sunday", "end_time": "20:30", "start_time": "19:00"}]	160.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
036eaecb-8a73-4422-bd12-17495da1e619	Science (لغات) - ا/ ادهم امبابي	Science (لغات) - ا/ ادهم امبابي	84256980-b857-4c45-985d-c6d18385eb58	cae85df3-e30e-4e9e-89e4-4645bf9918c4	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "sunday", "end_time": "18:30", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
9de5c06a-8253-4f6d-b541-2ed1043d8f66	الدراسات الاجتماعية - ميس/ شيماء	الدراسات الاجتماعية - ميس/ شيماء	170831a0-e73c-438f-8302-16513b9e8ef6	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "monday", "end_time": "20:00", "start_time": "19:00"}, {"day": "thursday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
450e9507-6289-4154-b04f-f991a4871cea	الدراسات الاجتماعية - ا/ محمود رشاد	الدراسات الاجتماعية - ا/ محمود رشاد	19c3af70-b27c-4370-82ee-c2e31b83ca08	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "monday", "end_time": "20:00", "start_time": "19:00"}, {"day": "thursday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0c808508-a35e-487d-b4e7-af23f198315a	تكنولوجيا المعلومات (عربي) - ميس/ هبة	تكنولوجيا المعلومات (عربي) - ميس/ هبة	85bd995b-7f11-4f19-a521-ce3e5268bfeb	ce5b10c3-aed1-4564-97c1-720147137ae6	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
6dc8b27e-2fa2-4faa-bd40-d52e1a4ac704	ICT (لغات) - ميس/ نهلة	ICT (لغات) - ميس/ نهلة	a97e99d1-d9dc-49f1-901a-32892ef6b418	b59175b2-1b28-4825-8179-8557160906dc	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	160.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
2be1a59d-ff8f-47ff-af5f-e6554f4dfe9b	التربية الدينية - ا/ صفية	التربية الدينية - ا/ صفية	7bb1ba79-480f-4b9e-b9f9-dba553ea37e2	585a7c3b-1dec-474f-b4e0-167924033473	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "tuesday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
95dcce24-630b-4763-8436-7760b2d5796b	اللغة العربية - ا/ مروان	اللغة العربية - ا/ مروان	b23b63fb-da7c-408b-adc2-ba1dc28ed0d5	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "saturday", "end_time": "19:00", "start_time": "18:00"}, {"day": "tuesday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
5f8c9acb-3e78-41ec-8288-121e9564e13f	اللغة العربية - ميس/ دنيا	اللغة العربية - ميس/ دنيا	324d13d6-dd4d-4f9a-a890-0ab85fd7d05a	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "saturday", "end_time": "19:00", "start_time": "18:00"}, {"day": "tuesday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
231533ce-529a-4085-9bb6-1947c9fbe210	اللغة الانجليزية - ميس/ الاء علاء	اللغة الانجليزية - ميس/ الاء علاء	ad027524-540c-42f2-ad26-aa6a34267e70	37455367-fad4-4bb6-87d8-4b2d0ec9da10	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "friday", "end_time": "17:00", "start_time": "16:00"}, {"day": "saturday", "end_time": "21:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
d845e4da-d2a2-4027-b9d0-790b836ca8dc	اللغة الانجليزية - ا/ سالي	اللغة الانجليزية - ا/ سالي	3d7d9d9a-5c2c-41e4-b51f-7d40fb4b8ad5	37455367-fad4-4bb6-87d8-4b2d0ec9da10	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "monday", "end_time": "20:00", "start_time": "19:00"}, {"day": "thursday", "end_time": "21:00", "start_time": "20:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
eb5bc3ca-088d-4a62-829b-a6ee43e04527	الرياضيات - ا/ احمد محمود	الرياضيات - ا/ احمد محمود	38e7c542-e70b-4581-86e4-7acad9a5af09	f4e734d7-0612-46bc-bfc0-1450fdc253f0	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "sunday", "end_time": "19:00", "start_time": "18:00"}, {"day": "wednesday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
23762283-e63e-4b11-93e4-2aac11a81de3	الرياضيات - ا/ ادهم هاني	الرياضيات - ا/ ادهم هاني	4e260ca1-b3b0-4263-843f-5377db71442e	f4e734d7-0612-46bc-bfc0-1450fdc253f0	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "sunday", "end_time": "19:00", "start_time": "18:00"}, {"day": "wednesday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
c105f776-5e9e-4687-8419-aa049b79ab23	Math (لغات) - ميس/ اسماء	Math (لغات) - ميس/ اسماء	bf333932-7d20-4bb5-b444-e3f36db093a8	13e61af9-7072-46de-9141-d85e764dc20a	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "wednesday", "end_time": "16:30", "start_time": "15:00"}]	40.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
3ed283bc-bfe1-4a59-b43a-0af96e65c224	Math (لغات) - ا/ احمد نبيل	Math (لغات) - ا/ احمد نبيل	b4fdc16f-30e3-4a79-ad99-f4396d9a9944	13e61af9-7072-46de-9141-d85e764dc20a	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "sunday", "end_time": "20:30", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
9333a326-99e2-46d0-a059-e4cde8250579	العلوم - ا/ حازم	العلوم - ا/ حازم	a359f7ea-fa56-44ca-a33a-b333008fe008	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "sunday", "end_time": "20:00", "start_time": "19:00"}, {"day": "wednesday", "end_time": "20:00", "start_time": "19:00"}]	150.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
8fab74c0-09a5-4842-81fb-7a9cf46f2976	العلوم - ا/ احمد عثمان	العلوم - ا/ احمد عثمان	5db56b25-f2d2-4d12-be46-6fc4ecb45037	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "monday", "end_time": "18:00", "start_time": "17:00"}, {"day": "thursday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
04b32671-a387-4d22-a2b0-87023274361d	Science (لغات) - ميس/ ايناس	Science (لغات) - ميس/ ايناس	ab99cb00-1ad0-406d-bc36-57ac15f1199c	cae85df3-e30e-4e9e-89e4-4645bf9918c4	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "thursday", "end_time": "18:30", "start_time": "17:00"}]	160.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
f8e4df26-a15b-418e-89e0-f0c97889d785	الدراسات الاجتماعية - ميس/ شيماء	الدراسات الاجتماعية - ميس/ شيماء	170831a0-e73c-438f-8302-16513b9e8ef6	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "monday", "end_time": "19:00", "start_time": "18:00"}, {"day": "thursday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
dc8a2856-60a0-4fff-934f-24d782c62956	الدراسات الاجتماعية - ا/ محمود رشاد	الدراسات الاجتماعية - ا/ محمود رشاد	19c3af70-b27c-4370-82ee-c2e31b83ca08	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "monday", "end_time": "19:00", "start_time": "18:00"}, {"day": "thursday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
e0cc677f-c19e-4365-be59-a79865503e47	تكنولوجيا المعلومات (عربي) - ميس/ هبة	تكنولوجيا المعلومات (عربي) - ميس/ هبة	85bd995b-7f11-4f19-a521-ce3e5268bfeb	ce5b10c3-aed1-4564-97c1-720147137ae6	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "tuesday", "end_time": "21:00", "start_time": "20:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b569d992-e015-47ec-9cd8-d11fb4cde428	اللغة العربية (أزهر) - ميس/ ياسمين حسن	اللغة العربية (أزهر) - ميس/ ياسمين حسن	47a489df-7f51-460a-9d16-5f2e9016a73a	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "thursday", "end_time": "17:30", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
beea2923-5bae-4898-ac34-cf71be18406e	الشرعي (أزهر) - ا/ الاء محمد	الشرعي (أزهر) - ا/ الاء محمد	3d974419-1413-43b9-9a16-b0a96e51b4bd	3954d6f5-1bff-49b1-bb06-60c852e8910b	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "friday", "end_time": "10:00", "start_time": "09:00"}]	0.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
bfa9a5fd-0011-4c61-b080-e498fd4bb830	اللغة الانجليزية (عام) - ا/ محمد علاء	اللغة الانجليزية (عام) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "saturday", "end_time": "19:00", "start_time": "18:00"}, {"day": "tuesday", "end_time": "19:00", "start_time": "18:00"}]	210.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ff8f6af8-007f-439c-a9f7-1fc93729c6fa	اللغة الانجليزية (لغات) - ا/ محمد علاء	اللغة الانجليزية (لغات) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "friday", "end_time": "11:00", "start_time": "10:00"}, {"day": "saturday", "end_time": "19:00", "start_time": "18:00"}, {"day": "tuesday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
4a397318-a4c5-4996-8d72-f6d4b3239e00	اللغة الانجليزية - ا/ صبحي محمد	اللغة الانجليزية - ا/ صبحي محمد	a2069239-3646-4e1b-92e0-3b4759f21934	37455367-fad4-4bb6-87d8-4b2d0ec9da10	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "saturday", "end_time": "19:00", "start_time": "18:00"}, {"day": "tuesday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
c4168241-b98d-49d2-8fb0-73cbf7967274	اللغة الفرنسية - مسيو/ خالد النصيري	اللغة الفرنسية - مسيو/ خالد النصيري	ddf47e11-3e05-4112-b3dd-0f99c471c62a	640f4d8d-69e4-47ad-9682-863a1c9158b7	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "tuesday", "end_time": "21:00", "start_time": "20:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b30e7ef1-5c8f-4484-b82b-8cbddcf87931	الرياضيات - ا/ محمد بكير	الرياضيات - ا/ محمد بكير	03392b62-ead6-4b3b-964d-7741605b12a0	f4e734d7-0612-46bc-bfc0-1450fdc253f0	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "monday", "end_time": "20:00", "start_time": "19:00"}, {"day": "thursday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
cf255a7b-7d18-41e0-b574-4ca1384ec53c	الرياضيات - ا/ محمد عادل	الرياضيات - ا/ محمد عادل	3e261e27-224b-4bc1-a2de-ebe1c2ee4ce6	f4e734d7-0612-46bc-bfc0-1450fdc253f0	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "monday", "end_time": "20:00", "start_time": "19:00"}, {"day": "thursday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
d7519a6c-9fdd-4d4f-8e07-2cdbff1d9391	Math (لغات) - ميس/ اسماء	Math (لغات) - ميس/ اسماء	bf333932-7d20-4bb5-b444-e3f36db093a8	13e61af9-7072-46de-9141-d85e764dc20a	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "monday", "end_time": "18:30", "start_time": "17:00"}]	40.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
3ddfc147-77b6-4d7d-a110-6659f19c4bf8	Math (لغات) - ا/ احمد نبيل	Math (لغات) - ا/ احمد نبيل	b4fdc16f-30e3-4a79-ad99-f4396d9a9944	13e61af9-7072-46de-9141-d85e764dc20a	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "wednesday", "end_time": "17:30", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0196dcce-65ef-434a-bc57-f043e594d6ba	العلوم - ميس/ اية ادم	العلوم - ميس/ اية ادم	8bd35926-4cc3-445a-901b-3a5304ab2c4a	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "saturday", "end_time": "20:00", "start_time": "19:00"}, {"day": "tuesday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
3bd5de3e-c432-489f-99b9-3dec1b72c0c6	العلوم - ا/ احمد عثمان	العلوم - ا/ احمد عثمان	5db56b25-f2d2-4d12-be46-6fc4ecb45037	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "saturday", "end_time": "20:00", "start_time": "19:00"}, {"day": "tuesday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
7a19710e-6223-45fa-8fee-75141581d88f	العلوم - ا/ احمد عبد الله	العلوم - ا/ احمد عبد الله	b8d04a31-a402-41b7-89ea-d3da56e01ec0	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "saturday", "end_time": "20:00", "start_time": "19:00"}, {"day": "tuesday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
383c3d4f-18ce-461c-ae97-ee865e6277fd	Science (لغات) - ا/ اسلام عبد الجليل	Science (لغات) - ا/ اسلام عبد الجليل	4724ea44-2b86-4d5a-a4f0-57c0f44471ec	cae85df3-e30e-4e9e-89e4-4645bf9918c4	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "saturday", "end_time": "20:30", "start_time": "19:00"}]	10.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
92583748-dd9f-4878-a685-aae118bf841d	Science (لغات) - ا/ محمد العربي	Science (لغات) - ا/ محمد العربي	6b63da64-5097-4ed3-9b0e-7029a9ee608a	cae85df3-e30e-4e9e-89e4-4645bf9918c4	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "saturday", "end_time": "16:30", "start_time": "15:00"}]	210.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
03216a48-cec9-424a-8306-13f9b89d6fcc	الدراسات الاجتماعية - ا/ محمود طارق	الدراسات الاجتماعية - ا/ محمود طارق	c5d59e81-692c-4cb4-b725-9d804c06e942	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "sunday", "end_time": "20:30", "start_time": "19:30"}, {"day": "wednesday", "end_time": "20:30", "start_time": "19:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ed59c4e1-b754-4a70-92c8-01e492e4e681	ICT - ميس/ نهلة	ICT - ميس/ نهلة	a97e99d1-d9dc-49f1-901a-32892ef6b418	b59175b2-1b28-4825-8179-8557160906dc	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "tuesday", "end_time": "20:00", "start_time": "19:00"}]	160.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
4a65abf2-2c78-4985-8fa8-f93f7ea21288	اللغة العربية (عام) - ا/ محمد صلاح عربي	اللغة العربية (عام) - ا/ محمد صلاح عربي	3a7d1ee9-29d1-4783-bf60-acaf0637e908	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "sunday", "end_time": "18:30", "start_time": "17:30"}, {"day": "wednesday", "end_time": "18:30", "start_time": "17:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
c27c485d-9c95-41d8-a620-475f0292e198	اللغة العربية (أزهر) - ميس/ ياسمين حسن	اللغة العربية (أزهر) - ميس/ ياسمين حسن	47a489df-7f51-460a-9d16-5f2e9016a73a	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "monday", "end_time": "19:00", "start_time": "18:00"}, {"day": "thursday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
7211e4f8-8a05-4ec2-969e-f4116a6e35b2	الشرعي (أزهر) - ا/ الاء محمد	الشرعي (أزهر) - ا/ الاء محمد	3d974419-1413-43b9-9a16-b0a96e51b4bd	3954d6f5-1bff-49b1-bb06-60c852e8910b	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "friday", "end_time": "11:00", "start_time": "10:00"}]	0.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
fdaa1949-f17d-49ab-b7f1-961018249077	اللغة الانجليزية (عام) - ا/ محمد علاء	اللغة الانجليزية (عام) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "saturday", "end_time": "18:00", "start_time": "17:00"}, {"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	210.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0305ae3d-9489-4a6f-aaa4-33b5572150ff	اللغة الانجليزية (لغات) - ا/ محمد علاء	اللغة الانجليزية (لغات) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "friday", "end_time": "12:00", "start_time": "11:00"}, {"day": "saturday", "end_time": "18:00", "start_time": "17:00"}, {"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
57c74101-2830-4264-854f-237f5120b9c3	اللغة الانجليزية - ا/ صبحي محمد	اللغة الانجليزية - ا/ صبحي محمد	a2069239-3646-4e1b-92e0-3b4759f21934	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "saturday", "end_time": "18:00", "start_time": "17:00"}, {"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
4b82702f-492e-40d2-a725-d564e5fd2b2f	اللغة الفرنسية - مسيو/ خالد النصيري	اللغة الفرنسية - مسيو/ خالد النصيري	ddf47e11-3e05-4112-b3dd-0f99c471c62a	640f4d8d-69e4-47ad-9682-863a1c9158b7	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "tuesday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
16140c73-feed-4b2b-94d6-4bf78968a8a3	الرياضيات - ا/ محمد عادل	الرياضيات - ا/ محمد عادل	3e261e27-224b-4bc1-a2de-ebe1c2ee4ce6	f4e734d7-0612-46bc-bfc0-1450fdc253f0	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "monday", "end_time": "21:00", "start_time": "20:00"}, {"day": "thursday", "end_time": "21:00", "start_time": "20:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
d9c66a5b-6b6b-4ce8-9e88-7ecc3c7df14d	الرياضيات - ا/ محمد بكير	الرياضيات - ا/ محمد بكير	03392b62-ead6-4b3b-964d-7741605b12a0	f4e734d7-0612-46bc-bfc0-1450fdc253f0	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "monday", "end_time": "21:00", "start_time": "20:00"}, {"day": "thursday", "end_time": "21:00", "start_time": "20:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b199cf41-3105-4989-91d7-10e55e862c62	Math (لغات) - ا/ محمود الرفاعي	Math (لغات) - ا/ محمود الرفاعي	9f7fd802-4ed5-447d-a832-132fc6782b02	13e61af9-7072-46de-9141-d85e764dc20a	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "wednesday", "end_time": "20:30", "start_time": "19:00"}]	260.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
7f2affc7-5540-47ba-bf8c-569af50056c0	العلوم - ميس/ اية ادم	العلوم - ميس/ اية ادم	8bd35926-4cc3-445a-901b-3a5304ab2c4a	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "saturday", "end_time": "19:00", "start_time": "18:00"}, {"day": "tuesday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
661561bc-ef0c-4f5f-bc45-3e017908bf81	العلوم - ا/ احمد عبد الله	العلوم - ا/ احمد عبد الله	b8d04a31-a402-41b7-89ea-d3da56e01ec0	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "saturday", "end_time": "19:00", "start_time": "18:00"}, {"day": "tuesday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
666aa3b3-cd9a-426f-9b19-9e9c37899f5d	العلوم - ا/ احمد عثمان	العلوم - ا/ احمد عثمان	5db56b25-f2d2-4d12-be46-6fc4ecb45037	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "monday", "end_time": "20:00", "start_time": "19:00"}, {"day": "thursday", "end_time": "20:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
7194e321-77b2-44a8-b100-aa59b5a055e2	Science (لغات) - ا/ اسلام عبد الجليل	Science (لغات) - ا/ اسلام عبد الجليل	4724ea44-2b86-4d5a-a4f0-57c0f44471ec	cae85df3-e30e-4e9e-89e4-4645bf9918c4	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "saturday", "end_time": "16:30", "start_time": "15:00"}]	10.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b8eeefa3-3cb8-4aca-9d23-97b5b3fad8ac	الدراسات الاجتماعية - ا/ محمد سعيد دراسات	الدراسات الاجتماعية - ا/ محمد سعيد دراسات	055351d1-280c-4beb-950b-9e1bfa752847	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "sunday", "end_time": "17:30", "start_time": "16:30"}, {"day": "wednesday", "end_time": "17:30", "start_time": "16:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
952fbe87-9d84-4040-9217-5338af7cb593	الدراسات الاجتماعية - ا/ محمود طارق	الدراسات الاجتماعية - ا/ محمود طارق	c5d59e81-692c-4cb4-b725-9d804c06e942	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "sunday", "end_time": "19:30", "start_time": "18:30"}, {"day": "wednesday", "end_time": "19:30", "start_time": "18:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
96029fec-32f1-4c3f-b28c-d4e88550c9ef	ICT - ميس/ نهلة	ICT - ميس/ نهلة	a97e99d1-d9dc-49f1-901a-32892ef6b418	b59175b2-1b28-4825-8179-8557160906dc	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "tuesday", "end_time": "19:00", "start_time": "18:00"}]	160.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
97a8301c-221b-402c-99a5-9e2d081a73e0	اللغة العربية (عام) - ا/ محمد صلاح عربي	اللغة العربية (عام) - ا/ محمد صلاح عربي	3a7d1ee9-29d1-4783-bf60-acaf0637e908	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "sunday", "end_time": "17:30", "start_time": "16:30"}, {"day": "wednesday", "end_time": "17:30", "start_time": "16:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
acbb5a1a-bdac-4469-9fd0-266df8a28862	اللغة العربية (أزهر) - ا/ محمد صلاح عربي	اللغة العربية (أزهر) - ا/ محمد صلاح عربي	3a7d1ee9-29d1-4783-bf60-acaf0637e908	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "wednesday", "end_time": "16:00", "start_time": "14:30"}]	0.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b92c3a73-0f72-42df-85a0-40acb57261c5	الشرعي (أزهر) - ا/ اسلام جمال	الشرعي (أزهر) - ا/ اسلام جمال	e1813cfc-859d-4fe8-8ed7-57bb7b7bd3f6	3954d6f5-1bff-49b1-bb06-60c852e8910b	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "thursday", "end_time": "17:30", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ba1a46dc-a5f9-4ddc-8107-ca105fecd87f	اللغة الانجليزية (عام) - ا/ محمد علاء	اللغة الانجليزية (عام) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "saturday", "end_time": "17:00", "start_time": "16:00"}, {"day": "tuesday", "end_time": "17:00", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
8211d7b3-3984-4dbc-bf70-45884ea4a445	اللغة الانجليزية (لغات) - ا/ محمد علاء	اللغة الانجليزية (لغات) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "friday", "end_time": "13:00", "start_time": "12:00"}, {"day": "saturday", "end_time": "17:00", "start_time": "16:00"}, {"day": "tuesday", "end_time": "17:00", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
24ecab19-6367-4e2d-bedb-9ac501373827	اللغة الانجليزية - ا/ صبحي محمد	اللغة الانجليزية - ا/ صبحي محمد	a2069239-3646-4e1b-92e0-3b4759f21934	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "saturday", "end_time": "17:00", "start_time": "16:00"}, {"day": "tuesday", "end_time": "17:00", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
c6cee59f-0008-448f-8ce9-c11b54fffceb	اللغة الفرنسية - مسيو/ خالد النصيري	اللغة الفرنسية - مسيو/ خالد النصيري	ddf47e11-3e05-4112-b3dd-0f99c471c62a	640f4d8d-69e4-47ad-9682-863a1c9158b7	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "saturday", "end_time": "16:00", "start_time": "15:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
cd23564b-9deb-4932-8a66-c2a21b224c74	الرياضيات - ا/ محمد عادل	الرياضيات - ا/ محمد عادل	3e261e27-224b-4bc1-a2de-ebe1c2ee4ce6	f4e734d7-0612-46bc-bfc0-1450fdc253f0	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "monday", "end_time": "19:00", "start_time": "18:00"}, {"day": "thursday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
85bc7861-efdb-4a84-9ff6-c936b75cd0ca	الرياضيات - ا/ محمد بكير	الرياضيات - ا/ محمد بكير	03392b62-ead6-4b3b-964d-7741605b12a0	f4e734d7-0612-46bc-bfc0-1450fdc253f0	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "monday", "end_time": "19:00", "start_time": "18:00"}, {"day": "thursday", "end_time": "19:00", "start_time": "18:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
4d28d25d-b512-4c75-9520-0ddef1a1c5b6	Math (لغات) - ا/ محمود الرفاعي	Math (لغات) - ا/ محمود الرفاعي	9f7fd802-4ed5-447d-a832-132fc6782b02	13e61af9-7072-46de-9141-d85e764dc20a	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "wednesday", "end_time": "15:00", "start_time": "13:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
89fd14a4-5f90-4746-974f-c36d21809d3d	العلوم - ميس/ اية ادم	العلوم - ميس/ اية ادم	8bd35926-4cc3-445a-901b-3a5304ab2c4a	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "saturday", "end_time": "18:00", "start_time": "17:00"}, {"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b468ae9a-a5a4-456a-a13e-25cfe83bc35c	العلوم - ا/ احمد عبد الله	العلوم - ا/ احمد عبد الله	b8d04a31-a402-41b7-89ea-d3da56e01ec0	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "saturday", "end_time": "18:00", "start_time": "17:00"}, {"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
5182823a-1759-4a35-80b7-3b77ae2224c5	Science (لغات) - ا/ اسلام عبد الجليل	Science (لغات) - ا/ اسلام عبد الجليل	4724ea44-2b86-4d5a-a4f0-57c0f44471ec	cae85df3-e30e-4e9e-89e4-4645bf9918c4	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
7015bf78-aac4-4ea9-8821-b61fee5e3796	Science (لغات) - ا/ محمد العربي	Science (لغات) - ا/ محمد العربي	6b63da64-5097-4ed3-9b0e-7029a9ee608a	cae85df3-e30e-4e9e-89e4-4645bf9918c4	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "thursday", "end_time": "17:00", "start_time": "15:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
c373356e-2cfd-4e22-b887-e1f250872d44	الدراسات الاجتماعية (عام) - ا/ محمد سعيد دراسات	الدراسات الاجتماعية (عام) - ا/ محمد سعيد دراسات	055351d1-280c-4beb-950b-9e1bfa752847	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "sunday", "end_time": "16:30", "start_time": "15:30"}, {"day": "wednesday", "end_time": "16:30", "start_time": "15:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
8fce9dce-f56a-4d30-9b8d-1ea06c58407b	الدراسات الاجتماعية (عام) - ا/ محمود طارق	الدراسات الاجتماعية (عام) - ا/ محمود طارق	c5d59e81-692c-4cb4-b725-9d804c06e942	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "sunday", "end_time": "18:30", "start_time": "17:30"}, {"day": "wednesday", "end_time": "18:30", "start_time": "17:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
a5d46b36-72cc-454c-bb5b-1f56c1e821d3	ICT - ميس/ نهلة	ICT - ميس/ نهلة	a97e99d1-d9dc-49f1-901a-32892ef6b418	b59175b2-1b28-4825-8179-8557160906dc	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "tuesday", "end_time": "16:00", "start_time": "15:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0ca75c0c-674f-41a7-8ae1-3fdd3d442954	اللغة العربية - ا/ الغزالي	اللغة العربية - ا/ الغزالي	e2088d15-5449-491a-aeed-f856044f00c8	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "tuesday", "end_time": "19:00", "start_time": "17:00"}]	160.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
47bdfa64-e83b-4b21-9e8d-8f8fe41d0a13	اللغة الانجليزية - ا/ الشاذلي	اللغة الانجليزية - ا/ الشاذلي	64d5b53b-948e-426b-924b-63f0e1971219	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "sunday", "end_time": "19:00", "start_time": "17:00"}]	210.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
175a0f1b-7f93-4994-93b1-c60ba90c795e	اللغة الانجليزية - ا/ ادهم ابو الصفا	اللغة الانجليزية - ا/ ادهم ابو الصفا	601b0bc0-bfbe-4e96-be03-bbab9a7f011a	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "tuesday", "end_time": "21:00", "start_time": "19:00"}]	260.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0d704416-9b72-4865-9987-086535497060	اللغة الانجليزية - ا/ صبحي محمد	اللغة الانجليزية - ا/ صبحي محمد	a2069239-3646-4e1b-92e0-3b4759f21934	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "tuesday", "end_time": "21:00", "start_time": "19:00"}]	210.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
cfa90b96-b4d0-4c8e-87a5-58fc55934d7c	اللغة الفرنسية - مسيو/ خالد النصيري	اللغة الفرنسية - مسيو/ خالد النصيري	ddf47e11-3e05-4112-b3dd-0f99c471c62a	640f4d8d-69e4-47ad-9682-863a1c9158b7	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "monday", "end_time": "21:00", "start_time": "19:00"}]	210.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
a32c09d5-2594-4103-8364-a93fbd01e526	الرياضيات - ا/ محمد يوسف	الرياضيات - ا/ محمد يوسف	054ac3aa-69dd-4248-92a6-998a5682f97d	f4e734d7-0612-46bc-bfc0-1450fdc253f0	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "wednesday", "end_time": "21:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b7e8c00b-8416-4c51-b7ea-ec7c7b1d773e	Math (لغات) - ا/ عمر جمال	Math (لغات) - ا/ عمر جمال	9f2f9160-96dc-4d52-9dd6-932ab8c48ed9	13e61af9-7072-46de-9141-d85e764dc20a	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "thursday", "end_time": "19:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
6d7ea2c7-38a4-4863-8b67-79227412fadf	العلوم المتكاملة (عربي) - ميس/ اية ادم	العلوم المتكاملة (عربي) - ميس/ اية ادم	8bd35926-4cc3-445a-901b-3a5304ab2c4a	a30f912c-914f-4a2a-87cb-c998dd144a0c	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "wednesday", "end_time": "19:00", "start_time": "17:00"}]	240.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
99262e7a-2040-430d-b0e2-0159f18e595e	Integrated Science (لغات) - ا/ محمد العربي	Integrated Science (لغات) - ا/ محمد العربي	6b63da64-5097-4ed3-9b0e-7029a9ee608a	7ffeeb0e-fc7d-4602-8bdb-82dfa1f1dd4c	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "wednesday", "end_time": "19:00", "start_time": "17:00"}]	310.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
33a373eb-c441-4c93-b771-4f94554ff8a9	البرمجة (لغات) - ا/ محمد عاشور	البرمجة (لغات) - ا/ محمد عاشور	3dd07ede-7090-44a3-bedc-867ca7c1a0f8	4815ecec-0d9f-466f-a6c6-b88364951f89	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "monday", "end_time": "19:00", "start_time": "17:00"}]	210.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ff4eaac1-ce58-4aa9-a14f-202e937d15ed	البرمجة (عربي) - ا/ محمد عاشور	البرمجة (عربي) - ا/ محمد عاشور	3dd07ede-7090-44a3-bedc-867ca7c1a0f8	4815ecec-0d9f-466f-a6c6-b88364951f89	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "thursday", "end_time": "19:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
35bfd896-359f-4e2f-865b-d0a9af387482	الفلسفة والمنطق - ا/ محمد صلاح فلسفة	الفلسفة والمنطق - ا/ محمد صلاح فلسفة	68ddc058-d0c1-4802-9f97-0d5c8bcc158b	9f9b6f17-3ad9-459f-b640-0d3d2f988ea8	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "saturday", "end_time": "21:00", "start_time": "19:00"}]	210.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
2b82c9c6-c741-4832-9386-94833f021273	الفلسفة والمنطق - ا/ علي فؤاد	الفلسفة والمنطق - ا/ علي فؤاد	3e2a7683-742e-45bb-9494-5e91bebc928d	9f9b6f17-3ad9-459f-b640-0d3d2f988ea8	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "saturday", "end_time": "21:00", "start_time": "19:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
8eccbeb7-decc-41d7-8d63-fccf96618bd2	التاريخ - ا/ ايمن سليمان	التاريخ - ا/ ايمن سليمان	8a8afd20-f129-44f4-a078-196b5523368b	53e7da3c-8cdc-4c19-9747-72c6cd90001d	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "thursday", "end_time": "21:00", "start_time": "19:00"}]	250.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
3afa7303-0b02-46a5-b023-7e171aaa6238	اللغة الانجليزية (برايفت - الجمعة) - ا/ صبحي محمد	اللغة الانجليزية (برايفت - الجمعة) - ا/ صبحي محمد	a2069239-3646-4e1b-92e0-3b4759f21934	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "friday", "end_time": "13:30", "start_time": "12:00"}]	210.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
06e074b5-a6ab-44bb-9919-1d96d620ed6b	اللغة الانجليزية (2 ث بكالوريا - برايفت - السبت 8:00) - ا/ محمد علاء	اللغة الانجليزية (2 ث بكالوريا - برايفت - السبت 8:00) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "saturday", "end_time": "10:00", "start_time": "08:00"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
2b3abea6-8591-4341-b6f2-12f4030a1778	اللغة الانجليزية (2 ث عام - برايفت - السبت 12:00 ظ) - ا/ محمد علاء	اللغة الانجليزية (2 ث عام - برايفت - السبت 12:00 ظ) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "saturday", "end_time": "14:00", "start_time": "12:00"}]	260.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
1321c0df-7e5b-457f-aa06-9d4eab15191d	اللغة الانجليزية (برايفت - السبت 2:00 ظ) - ا/ محمد علاء	اللغة الانجليزية (برايفت - السبت 2:00 ظ) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "saturday", "end_time": "16:00", "start_time": "14:00"}]	240.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
9af7baa8-2404-4b1e-93c3-29b60f7deee9	اللغة الانجليزية (برايفت - السبت 8:00) - ا/ محمد سعيد انجليزي	اللغة الانجليزية (برايفت - السبت 8:00) - ا/ محمد سعيد انجليزي	05e1d74a-7825-4d96-a32e-578a7615e19d	37455367-fad4-4bb6-87d8-4b2d0ec9da10	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "saturday", "end_time": "10:00", "start_time": "08:00"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
50e58973-1cd3-4e22-be97-787ad8332f4b	اللغة الانجليزية (برايفت - السبت 1:00 ظ) - ا/ محمد سعيد انجليزي	اللغة الانجليزية (برايفت - السبت 1:00 ظ) - ا/ محمد سعيد انجليزي	05e1d74a-7825-4d96-a32e-578a7615e19d	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "saturday", "end_time": "15:00", "start_time": "13:00"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0a02263c-867f-4d6b-8f95-2a1b6109a2c5	أحياء (Bio - 3 ث - برايفت - السبت 10:00 ص) - ا/ محمد العربي	أحياء (Bio - 3 ث - برايفت - السبت 10:00 ص) - ا/ محمد العربي	6b63da64-5097-4ed3-9b0e-7029a9ee608a	af504fc9-7db3-4e00-9b78-5eb2a73f32c8	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "saturday", "end_time": "12:00", "start_time": "10:00"}]	550.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
c062d9b2-518b-488c-a1db-9ec530ffab00	اللغة العربية (برايفت) - ا/ الزنكلوني	اللغة العربية (برايفت) - ا/ الزنكلوني	e8617785-19e0-4679-9067-02ba1af709de	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "saturday", "end_time": "15:00", "start_time": "13:30"}]	160.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
2786c0ce-a483-417a-91f1-d2a00c46e27e	اللغة العربية (برايفت) - ا/ الزنكلوني	اللغة العربية (برايفت) - ا/ الزنكلوني	e8617785-19e0-4679-9067-02ba1af709de	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "saturday", "end_time": "13:30", "start_time": "12:00"}]	170.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
7d5426b4-2751-45d8-ab57-ce66d8ef6797	اللغة العربية (برايفت) - ا/ محمد صلاح عربي	اللغة العربية (برايفت) - ا/ محمد صلاح عربي	3a7d1ee9-29d1-4783-bf60-acaf0637e908	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "saturday", "end_time": "12:00", "start_time": "10:00"}]	190.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ad764f72-08ec-45bf-910f-f1020759f0a6	اللغة الانجليزية (برايفت - السبت 1:00 ظ) - ا/ محمد علام انجليزي	اللغة الانجليزية (برايفت - السبت 1:00 ظ) - ا/ محمد علام انجليزي	613810f2-76fa-45d4-8561-2a6b01b2944e	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "saturday", "end_time": "15:00", "start_time": "13:00"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
1282a8ec-5b97-4870-8d7d-31b64f1759fb	الشرعي (أزهر - برايفت - 8 حصص) - ا/ اسلام جمال	الشرعي (أزهر - برايفت - 8 حصص) - ا/ اسلام جمال	e1813cfc-859d-4fe8-8ed7-57bb7b7bd3f6	3954d6f5-1bff-49b1-bb06-60c852e8910b	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "saturday", "end_time": "16:30", "start_time": "15:00"}, {"day": "tuesday", "end_time": "16:30", "start_time": "15:00"}]	330.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
2fc5c97f-5bcb-48a4-a1b0-e42e43330a11	اللغة العربية (برايفت) - ا/ مروان	اللغة العربية (برايفت) - ا/ مروان	b23b63fb-da7c-408b-adc2-ba1dc28ed0d5	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "saturday", "end_time": "15:00", "start_time": "13:30"}]	100.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b33649b7-764f-4cc0-952d-3348e721f716	اللغة العربية (برايفت - 8 حصص) - ا/ مروان	اللغة العربية (برايفت - 8 حصص) - ا/ مروان	b23b63fb-da7c-408b-adc2-ba1dc28ed0d5	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "saturday", "end_time": "19:00", "start_time": "18:00"}, {"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	100.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b3eed335-b161-4f0f-964c-05ec7e3ac73a	Science (برايفت) - ا/ اسلام عبد الجليل	Science (برايفت) - ا/ اسلام عبد الجليل	4724ea44-2b86-4d5a-a4f0-57c0f44471ec	cae85df3-e30e-4e9e-89e4-4645bf9918c4	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "saturday", "end_time": "18:00", "start_time": "16:30"}]	10.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
de749a96-dd0a-47c6-9a62-a99d8be4c162	الدراسات الاجتماعية (برايفت - السبت 1:00 ظ) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - السبت 1:00 ظ) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "saturday", "end_time": "14:00", "start_time": "13:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
23b331c9-7d74-4fe5-9518-a5adcf837997	الدراسات الاجتماعية (برايفت - السبت 3:00 ع) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - السبت 3:00 ع) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "saturday", "end_time": "16:00", "start_time": "15:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b8b3f569-e312-4cc2-a409-d9fbaeb55f64	الدراسات الاجتماعية (برايفت - السبت 5:00 م) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - السبت 5:00 م) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "saturday", "end_time": "18:30", "start_time": "17:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
1af8bab6-516a-4a4b-acab-021a5e950bde	الفلسفة والمنطق (برايفت) - ا/ محمد صلاح فلسفة	الفلسفة والمنطق (برايفت) - ا/ محمد صلاح فلسفة	68ddc058-d0c1-4802-9f97-0d5c8bcc158b	9f9b6f17-3ad9-459f-b640-0d3d2f988ea8	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "saturday", "end_time": "19:00", "start_time": "17:30"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
d6ae7637-d7c3-49a8-a059-9db478d78b7f	الدراسات الاجتماعية (برايفت - 8 حصص) - ا/ محمد سعيد دراسات	الدراسات الاجتماعية (برايفت - 8 حصص) - ا/ محمد سعيد دراسات	055351d1-280c-4beb-950b-9e1bfa752847	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "saturday", "end_time": "19:30", "start_time": "18:30"}, {"day": "tuesday", "end_time": "19:30", "start_time": "18:30"}]	170.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
26b87546-5f2b-4c28-88e6-45331ae3db16	الدراسات الاجتماعية (برايفت - 8 حصص - سبت وثلاثاء) - ا/ محمد سعيد دراسات	الدراسات الاجتماعية (برايفت - 8 حصص - سبت وثلاثاء) - ا/ محمد سعيد دراسات	055351d1-280c-4beb-950b-9e1bfa752847	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "saturday", "end_time": "21:00", "start_time": "20:00"}, {"day": "tuesday", "end_time": "20:30", "start_time": "19:30"}]	170.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
cf17c241-9ed4-47c8-ac47-48203b0eea9d	البرمجة (2 ث عربي - برايفت) - ا/ محمد عاشور	البرمجة (2 ث عربي - برايفت) - ا/ محمد عاشور	3dd07ede-7090-44a3-bedc-867ca7c1a0f8	4815ecec-0d9f-466f-a6c6-b88364951f89	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "sunday", "end_time": "12:00", "start_time": "10:00"}]	325.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b438d741-8ddb-4504-aba6-7e0a10980bc9	البرمجة (1 ث لغات - برايفت - الأحد 12:00 ظ) - ا/ محمد عاشور	البرمجة (1 ث لغات - برايفت - الأحد 12:00 ظ) - ا/ محمد عاشور	3dd07ede-7090-44a3-bedc-867ca7c1a0f8	4815ecec-0d9f-466f-a6c6-b88364951f89	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "sunday", "end_time": "14:00", "start_time": "12:00"}]	385.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
7ece3f7d-57b9-4ce8-a204-c4f5bedf6cf1	اللغة الانجليزية (3 ث - برايفت - الأحد 12:00 ظ) - ميس/ اميرة انجليزي	اللغة الانجليزية (3 ث - برايفت - الأحد 12:00 ظ) - ميس/ اميرة انجليزي	fee832a2-408c-43bb-af5e-695f22a98e32	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "sunday", "end_time": "14:00", "start_time": "12:00"}]	400.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
c88001a6-0bf3-4e26-aa96-6fdc694c8280	اللغة الانجليزية (برايفت - الأحد 3:00 ع) - ميس/ اميرة انجليزي	اللغة الانجليزية (برايفت - الأحد 3:00 ع) - ميس/ اميرة انجليزي	fee832a2-408c-43bb-af5e-695f22a98e32	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "sunday", "end_time": "17:00", "start_time": "15:00"}]	400.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
1ba68f6f-56f5-4bca-9e34-28aec4865a9f	اللغة الانجليزية (3 ث - برايفت - الأحد 1:00 ظ) - ا/ الشاذلي	اللغة الانجليزية (3 ث - برايفت - الأحد 1:00 ظ) - ا/ الشاذلي	64d5b53b-948e-426b-924b-63f0e1971219	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "sunday", "end_time": "15:00", "start_time": "13:00"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
cf58f565-c888-4c7c-beb3-5576bd86a49d	اللغة الانجليزية (برايفت - الأحد 3:30 ع) - ا/ محمد علام انجليزي	اللغة الانجليزية (برايفت - الأحد 3:30 ع) - ا/ محمد علام انجليزي	613810f2-76fa-45d4-8561-2a6b01b2944e	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "sunday", "end_time": "17:30", "start_time": "15:30"}]	220.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
4b9d74cd-90a4-4e41-86a4-b91af8b581bf	اللغة الانجليزية (برايفت - الأحد 7:00 م) - ا/ محمد سعيد انجليزي	اللغة الانجليزية (برايفت - الأحد 7:00 م) - ا/ محمد سعيد انجليزي	05e1d74a-7825-4d96-a32e-578a7615e19d	37455367-fad4-4bb6-87d8-4b2d0ec9da10	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	[{"day": "sunday", "end_time": "21:00", "start_time": "19:00"}]	230.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ce56b5f0-9ad8-4852-a2a8-ffc392d44450	العلوم (برايفت) - ا/ حازم	العلوم (برايفت) - ا/ حازم	a359f7ea-fa56-44ca-a33a-b333008fe008	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "sunday", "end_time": "18:00", "start_time": "17:00"}]	150.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
cf68ee44-8c0a-4ce3-a172-3c631a4a3b55	اللغة العربية (برايفت) - ميس/ دنيا	اللغة العربية (برايفت) - ميس/ دنيا	324d13d6-dd4d-4f9a-a890-0ab85fd7d05a	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "sunday", "end_time": "21:00", "start_time": "20:00"}, {"day": "tuesday", "end_time": "21:00", "start_time": "20:00"}]	170.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b7af23a7-0eb1-4037-ae84-282d0828470a	اللغة الانجليزية (3 ث - برايفت - الاثنين 8:30 ص) - ا/ محمد علاء	اللغة الانجليزية (3 ث - برايفت - الاثنين 8:30 ص) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "monday", "end_time": "10:30", "start_time": "08:30"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
771670ea-d3df-4579-b4a1-4dbd674f19fa	اللغة الانجليزية (3 ث - برايفت - الاثنين 10:00 ص) - ميس/ اميرة انجليزي	اللغة الانجليزية (3 ث - برايفت - الاثنين 10:00 ص) - ميس/ اميرة انجليزي	fee832a2-408c-43bb-af5e-695f22a98e32	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "monday", "end_time": "12:00", "start_time": "10:00"}]	400.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
4b9bfd79-b9fc-4f63-9cc5-df72f6201959	اللغة الانجليزية (برايفت - الاثنين 12:30 ظ) - ا/ محمد علام انجليزي	اللغة الانجليزية (برايفت - الاثنين 12:30 ظ) - ا/ محمد علام انجليزي	613810f2-76fa-45d4-8561-2a6b01b2944e	37455367-fad4-4bb6-87d8-4b2d0ec9da10	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "monday", "end_time": "14:30", "start_time": "12:30"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
a4716eb4-9e84-4ec8-a8c5-e1d312c9227c	Math (برايفت - الاثنين 12:30 ظ) - ميس/ ياسمين ماث	Math (برايفت - الاثنين 12:30 ظ) - ميس/ ياسمين ماث	956f484a-24bf-4eaa-ad86-fc67ff856968	13e61af9-7072-46de-9141-d85e764dc20a	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "monday", "end_time": "14:00", "start_time": "12:30"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0c2930ab-9131-46d0-8eae-09af1043d2d3	الدراسات الاجتماعية (برايفت - 8 حصص) - ا/ محمد سعيد دراسات	الدراسات الاجتماعية (برايفت - 8 حصص) - ا/ محمد سعيد دراسات	055351d1-280c-4beb-950b-9e1bfa752847	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "monday", "end_time": "14:30", "start_time": "13:30"}, {"day": "thursday", "end_time": "14:30", "start_time": "13:30"}]	170.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
72aee8f0-9c71-44ba-9883-2734c2409ed8	الدراسات الاجتماعية (برايفت - الاثنين 6:00 م) - ا/ محمد سعيد دراسات	الدراسات الاجتماعية (برايفت - الاثنين 6:00 م) - ا/ محمد سعيد دراسات	055351d1-280c-4beb-950b-9e1bfa752847	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "monday", "end_time": "19:30", "start_time": "18:00"}]	210.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ba39df6f-9164-4655-b7f5-2282ff16a0c4	الدراسات الاجتماعية (برايفت - الاثنين 3:00 ع) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - الاثنين 3:00 ع) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "monday", "end_time": "16:00", "start_time": "15:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
4b7521e0-7041-4996-ab64-70f8397cd620	الدراسات الاجتماعية (برايفت - الاثنين 5:00 م) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - الاثنين 5:00 م) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "monday", "end_time": "18:00", "start_time": "17:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0b8d0119-9d8b-4a17-85b1-4d0f4bf64c17	العلوم (3 ع - برايفت - الاثنين 7:00 م) - ا/ حازم	العلوم (3 ع - برايفت - الاثنين 7:00 م) - ا/ حازم	a359f7ea-fa56-44ca-a33a-b333008fe008	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "monday", "end_time": "20:30", "start_time": "19:00"}]	190.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ce788c30-8cde-4223-b678-5b34b514bb41	الدراسات الاجتماعية (برايفت) - ا/ محمود رشاد	الدراسات الاجتماعية (برايفت) - ا/ محمود رشاد	19c3af70-b27c-4370-82ee-c2e31b83ca08	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "monday", "end_time": "18:00", "start_time": "17:00"}, {"day": "thursday", "end_time": "18:00", "start_time": "17:00"}]	180.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
78148522-e979-4951-8a7b-df54badd743a	اللغة العربية (3 ث - برايفت - الثلاثاء 8:00 ص) - ا/ الغزالي	اللغة العربية (3 ث - برايفت - الثلاثاء 8:00 ص) - ا/ الغزالي	e2088d15-5449-491a-aeed-f856044f00c8	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "tuesday", "end_time": "10:00", "start_time": "08:00"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
b99bd325-1dd3-446d-b2df-3abf36dd67de	اللغة العربية (2 ث - برايفت - الثلاثاء 12:00 ظ) - ا/ الغزالي	اللغة العربية (2 ث - برايفت - الثلاثاء 12:00 ظ) - ا/ الغزالي	e2088d15-5449-491a-aeed-f856044f00c8	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "tuesday", "end_time": "14:00", "start_time": "12:00"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
40265158-b608-4de1-83f3-3d4236a2ef6f	اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ا/ محمد علاء	اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ا/ محمد علاء	d363fcfd-a2d4-4e98-863b-150b0c2782fd	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "tuesday", "end_time": "13:30", "start_time": "12:00"}]	210.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
8bf96c9e-52d8-4e95-8c07-5820cd860d57	اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ا/ ادهم ابو الصفا	اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ا/ ادهم ابو الصفا	601b0bc0-bfbe-4e96-be03-bbab9a7f011a	37455367-fad4-4bb6-87d8-4b2d0ec9da10	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "tuesday", "end_time": "14:00", "start_time": "12:00"}]	320.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ae8a919d-2dad-44e0-bb61-ff0a451ffdb0	اللغة الانجليزية (برايفت - الثلاثاء 3:00 ع) - ا/ ادهم ابو الصفا	اللغة الانجليزية (برايفت - الثلاثاء 3:00 ع) - ا/ ادهم ابو الصفا	601b0bc0-bfbe-4e96-be03-bbab9a7f011a	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "tuesday", "end_time": "17:00", "start_time": "15:00"}]	330.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
21af347b-cbfe-45f1-abff-b20e55f9e253	اللغة الانجليزية (برايفت - الثلاثاء 5:00 م) - ا/ ادهم ابو الصفا	اللغة الانجليزية (برايفت - الثلاثاء 5:00 م) - ا/ ادهم ابو الصفا	601b0bc0-bfbe-4e96-be03-bbab9a7f011a	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "tuesday", "end_time": "19:00", "start_time": "17:00"}]	330.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
d7f04f6d-41eb-4055-a965-ba2e316166b4	اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ميس/ اميرة انجليزي	اللغة الانجليزية (برايفت - الثلاثاء 12:00 ظ) - ميس/ اميرة انجليزي	fee832a2-408c-43bb-af5e-695f22a98e32	37455367-fad4-4bb6-87d8-4b2d0ec9da10	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "tuesday", "end_time": "14:00", "start_time": "12:00"}]	400.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
ef0fa3c4-4e85-4bed-85d8-dcd54b648812	Math (برايفت - الثلاثاء 12:00 ظ) - ميس/ ياسمين ماث	Math (برايفت - الثلاثاء 12:00 ظ) - ميس/ ياسمين ماث	956f484a-24bf-4eaa-ad86-fc67ff856968	13e61af9-7072-46de-9141-d85e764dc20a	80738b37-47bd-4ced-9ef9-805c6c6dc06c	\N	[{"day": "tuesday", "end_time": "13:30", "start_time": "12:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
e7bc8d24-0edc-4ab9-99b4-5626255f2ae8	Math (برايفت - الثلاثاء 2:00 ظ) - ميس/ ياسمين ماث	Math (برايفت - الثلاثاء 2:00 ظ) - ميس/ ياسمين ماث	956f484a-24bf-4eaa-ad86-fc67ff856968	13e61af9-7072-46de-9141-d85e764dc20a	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "tuesday", "end_time": "15:30", "start_time": "14:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
2dc86952-c99f-4ff0-ad81-ae13419fcf39	Math (برايفت - الثلاثاء 5:00 م) - ميس/ ياسمين ماث	Math (برايفت - الثلاثاء 5:00 م) - ميس/ ياسمين ماث	956f484a-24bf-4eaa-ad86-fc67ff856968	13e61af9-7072-46de-9141-d85e764dc20a	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "tuesday", "end_time": "18:30", "start_time": "17:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
87753a2d-d614-46f0-8348-255a9adaaf9a	الدراسات الاجتماعية (برايفت - الثلاثاء 1:00 ظ) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - الثلاثاء 1:00 ظ) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "tuesday", "end_time": "14:00", "start_time": "13:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
40ffa21c-4d1a-40cb-8d80-d8331011c437	الدراسات الاجتماعية (برايفت - الثلاثاء 3:00 ع) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - الثلاثاء 3:00 ع) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "tuesday", "end_time": "16:00", "start_time": "15:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
55569207-9822-43a0-8133-8bed62af9d0b	الدراسات الاجتماعية (برايفت - الثلاثاء 5:00 م) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - الثلاثاء 5:00 م) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "tuesday", "end_time": "18:00", "start_time": "17:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
156a24bf-ece9-4ce2-929d-b47900ec8958	Science / Bio (3 ث برايفت - الأربعاء 10:00 ص) - ا/ محمد العربي	Science / Bio (3 ث برايفت - الأربعاء 10:00 ص) - ا/ محمد العربي	6b63da64-5097-4ed3-9b0e-7029a9ee608a	cae85df3-e30e-4e9e-89e4-4645bf9918c4	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "wednesday", "end_time": "12:00", "start_time": "10:00"}]	550.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
fa2f997e-7a0a-4868-a881-43ae8c3a8fc4	الجغرافيا (برايفت - الأربعاء 1:30 ظ) - ا/ محمود طارق	الجغرافيا (برايفت - الأربعاء 1:30 ظ) - ا/ محمود طارق	c5d59e81-692c-4cb4-b725-9d804c06e942	bd95b9c0-f032-4a71-aaa6-a130bac5c8af	5d478a7c-0e54-4992-a27e-4ff1677b7679	\N	[{"day": "wednesday", "end_time": "15:30", "start_time": "13:30"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
de1123e0-949a-416b-a210-d9b696a27eb7	Math (3 ب - برايفت - الأربعاء 12:00 ظ) - ميس/ ياسمين ماث	Math (3 ب - برايفت - الأربعاء 12:00 ظ) - ميس/ ياسمين ماث	956f484a-24bf-4eaa-ad86-fc67ff856968	13e61af9-7072-46de-9141-d85e764dc20a	23a6b0ab-07a5-4d0e-9b52-e58493982829	\N	[{"day": "wednesday", "end_time": "13:30", "start_time": "12:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
8f4857ba-5948-439d-9dda-82b65f67fd35	Math (برايفت - الأربعاء 4:30 ع) - ميس/ ياسمين ماث	Math (برايفت - الأربعاء 4:30 ع) - ميس/ ياسمين ماث	956f484a-24bf-4eaa-ad86-fc67ff856968	13e61af9-7072-46de-9141-d85e764dc20a	80738b37-47bd-4ced-9ef9-805c6c6dc06c	\N	[{"day": "wednesday", "end_time": "18:00", "start_time": "16:30"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
5d4a84b1-1559-48d3-9e0f-09bf3edda9b0	اللغة الانجليزية (2 ث بكالوريا - برايفت - الأربعاء 12:30 ظ) - ميس/ اميرة انجليزي	اللغة الانجليزية (2 ث بكالوريا - برايفت - الأربعاء 12:30 ظ) - ميس/ اميرة انجليزي	fee832a2-408c-43bb-af5e-695f22a98e32	37455367-fad4-4bb6-87d8-4b2d0ec9da10	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "wednesday", "end_time": "14:30", "start_time": "12:30"}]	400.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
dd83ddab-01b1-4f91-a3c6-d29de1ff88f0	الدراسات الاجتماعية (برايفت - الأربعاء 1:00 ظ) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - الأربعاء 1:00 ظ) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "wednesday", "end_time": "14:00", "start_time": "13:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
aa38673d-60ce-42e0-8768-ef0fb8cd72e9	الدراسات الاجتماعية (3 ع - برايفت - الأربعاء 3:00 ع) - ا/ اسلام موسى	الدراسات الاجتماعية (3 ع - برايفت - الأربعاء 3:00 ع) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "wednesday", "end_time": "16:00", "start_time": "15:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
a3cd3eba-83e5-4019-8d70-88571d66e22e	الدراسات الاجتماعية (برايفت - الأربعاء 5:00 م) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - الأربعاء 5:00 م) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "wednesday", "end_time": "18:00", "start_time": "17:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
5ea640bb-b1de-4f8d-9168-714f0a0fa26a	اللغة الانجليزية (برايفت - الأربعاء 1:00 ظ) - ا/ الشاذلي	اللغة الانجليزية (برايفت - الأربعاء 1:00 ظ) - ا/ الشاذلي	64d5b53b-948e-426b-924b-63f0e1971219	37455367-fad4-4bb6-87d8-4b2d0ec9da10	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "wednesday", "end_time": "15:00", "start_time": "13:00"}]	310.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
4e239236-68fd-46a3-ad42-c63db700af90	اللغة الانجليزية (برايفت - الأربعاء 4:00 ع) - ا/ محمد سعيد انجليزي	اللغة الانجليزية (برايفت - الأربعاء 4:00 ع) - ا/ محمد سعيد انجليزي	05e1d74a-7825-4d96-a32e-578a7615e19d	37455367-fad4-4bb6-87d8-4b2d0ec9da10	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "wednesday", "end_time": "17:30", "start_time": "16:00"}]	210.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
0aa496cc-0c91-44dd-a301-3c3c0c035393	العلوم (برايفت) - ا/ حازم	العلوم (برايفت) - ا/ حازم	a359f7ea-fa56-44ca-a33a-b333008fe008	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "thursday", "end_time": "21:00", "start_time": "19:30"}]	190.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
e942eb4e-c43c-454c-99c3-06693bbc2886	اللغة الانجليزية (2 ع - برايفت - الخميس 6:00 م) - ا/ محمد سعيد انجليزي	اللغة الانجليزية (2 ع - برايفت - الخميس 6:00 م) - ا/ محمد سعيد انجليزي	05e1d74a-7825-4d96-a32e-578a7615e19d	37455367-fad4-4bb6-87d8-4b2d0ec9da10	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	210.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
dd4adfa6-5821-4130-a9f5-03e2136981ff	الفيزياء / Physics (برايفت - الخميس 2:30 ظ) - ا/ محمد سالم	الفيزياء / Physics (برايفت - الخميس 2:30 ظ) - ا/ محمد سالم	bdbe67a9-4a46-4bab-885d-ff8ae7938d10	3842cd93-85b7-46d0-a334-47d007f9c936	c206e817-623a-495c-9a9a-a07eb25c401e	\N	[{"day": "thursday", "end_time": "16:30", "start_time": "14:30"}]	450.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
4482b71f-112e-42d8-b7b5-76c8f17d9dd6	الدراسات الاجتماعية (برايفت - الخميس 3:00 ع) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - الخميس 3:00 ع) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "thursday", "end_time": "16:00", "start_time": "15:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
eb3e99ea-9229-4c99-8bb3-44ab38473830	الدراسات الاجتماعية (برايفت - الخميس 5:00 م) - ا/ اسلام موسى	الدراسات الاجتماعية (برايفت - الخميس 5:00 م) - ا/ اسلام موسى	542e2b4a-2ec5-4af4-aa56-af5f062cff6c	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "thursday", "end_time": "18:00", "start_time": "17:00"}]	35.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
7ef55461-24de-4ab4-8454-104247fdc589	Science (برايفت - الخميس 3:00 ع - الحصة 70 ج) - ا/ محمد العربي	Science (برايفت - الخميس 3:00 ع - الحصة 70 ج) - ا/ محمد العربي	6b63da64-5097-4ed3-9b0e-7029a9ee608a	cae85df3-e30e-4e9e-89e4-4645bf9918c4	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	[{"day": "thursday", "end_time": "16:30", "start_time": "15:00"}]	280.00	70.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
92dfba02-c19a-44ca-ac55-f961af06735f	الشرعي (أزهر - برايفت) - ميس/ ياسمين حسن	الشرعي (أزهر - برايفت) - ميس/ ياسمين حسن	47a489df-7f51-460a-9d16-5f2e9016a73a	3954d6f5-1bff-49b1-bb06-60c852e8910b	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "thursday", "end_time": "19:30", "start_time": "18:00"}]	210.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
d02fc591-201b-4582-8646-7a5c4a95513f	الشرعي (أزهر - برايفت) - ميس/ ياسمين حسن	الشرعي (أزهر - برايفت) - ميس/ ياسمين حسن	47a489df-7f51-460a-9d16-5f2e9016a73a	3954d6f5-1bff-49b1-bb06-60c852e8910b	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "thursday", "end_time": "17:30", "start_time": "16:00"}]	160.00	0.00	9999	active	local	\N	2026-11-18 20:12:58.081451+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
15068823-e8f2-4d38-ae05-81c21086f664	اللغة العربية (ازهر) - ميس/ ياسمين حسن	اللغة العربية (ازهر) - ميس/ ياسمين حسن	47a489df-7f51-460a-9d16-5f2e9016a73a	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "thursday", "end_time": "17:30", "start_time": "16:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-15 20:06:57.933049+02	0.00	100.00	75.00	25.00
603c0479-1cb8-4939-a104-e00cb532838d	ICT (لغات) - ميس/ نهلة	ICT (لغات) - ميس/ نهلة	a97e99d1-d9dc-49f1-901a-32892ef6b418	b59175b2-1b28-4825-8179-8557160906dc	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "tuesday", "end_time": "21:00", "start_time": "20:00"}]	160.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
192b8b51-e6df-439f-be59-322bd4cf0d93	التربية الدينية (عام) - ا/ صفية	التربية الدينية (عام) - ا/ صفية	7bb1ba79-480f-4b9e-b9f9-dba553ea37e2	585a7c3b-1dec-474f-b4e0-167924033473	59141280-1c86-41bc-a284-6d05d555f457	\N	[{"day": "wednesday", "end_time": "18:00", "start_time": "17:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
062539ac-5d5a-4c7a-9b1e-4adb2fcd4c36	اللغة العربية (عام) - ا/ محمد صلاح عربي	اللغة العربية (عام) - ا/ محمد صلاح عربي	3a7d1ee9-29d1-4783-bf60-acaf0637e908	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "sunday", "end_time": "19:30", "start_time": "18:30"}, {"day": "wednesday", "end_time": "19:30", "start_time": "18:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
02ead4e6-4daf-4676-92f9-78a2227155bf	الشرعي (ازهر) - ا/ الاء محمد	الشرعي (ازهر) - ا/ الاء محمد	3d974419-1413-43b9-9a16-b0a96e51b4bd	3954d6f5-1bff-49b1-bb06-60c852e8910b	79842e52-6787-4773-b13f-5d8abf4c5043	\N	[{"day": "friday", "end_time": "11:00", "start_time": "10:00"}]	0.00	0.00	9999	active	local	\N	2026-11-17 17:10:22.041438+02	2026-11-17 21:11:55.102014+02	0.00	100.00	75.00	25.00
f06858e0-abf8-428e-926c-46c887c7956c	الدراسات الاجتماعية - ا/ محمد سعيد دراسات	الدراسات الاجتماعية - ا/ محمد سعيد دراسات	055351d1-280c-4beb-950b-9e1bfa752847	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	[{"day": "sunday", "end_time": "18:30", "start_time": "17:30"}, {"day": "wednesday", "end_time": "18:30", "start_time": "17:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
f5ad4437-6240-4044-8a99-f3f1bd6fdf3f	Math (لغات) - ميس/ اسماء	Math (لغات) - ميس/ اسماء	bf333932-7d20-4bb5-b444-e3f36db093a8	13e61af9-7072-46de-9141-d85e764dc20a	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	[{"day": "monday", "end_time": "16:30", "start_time": "15:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
f67635d0-32c6-4e53-9710-701e5884bb23	اللغة الانجليزية - ميس/ الاء علاء	اللغة الانجليزية - ميس/ الاء علاء	ad027524-540c-42f2-ad26-aa6a34267e70	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "friday", "end_time": "16:00", "start_time": "15:00"}, {"day": "saturday", "end_time": "17:00", "start_time": "15:00"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
af52ffa4-76df-4da1-9de0-65986a8a3281	اللغة الانجليزية - ا/ سالي	اللغة الانجليزية - ا/ سالي	3d7d9d9a-5c2c-41e4-b51f-7d40fb4b8ad5	37455367-fad4-4bb6-87d8-4b2d0ec9da10	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "monday", "end_time": "19:00", "start_time": "18:00"}, {"day": "thursday", "end_time": "19:30", "start_time": "18:30"}]	0.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
e2cc2b10-4eed-4b51-bf87-caea5d6c1f2e	Math (لغات) - ميس/ اسماء	Math (لغات) - ميس/ اسماء	bf333932-7d20-4bb5-b444-e3f36db093a8	13e61af9-7072-46de-9141-d85e764dc20a	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	[{"day": "wednesday", "end_time": "18:30", "start_time": "17:00"}]	40.00	0.00	9999	active	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	0.00	100.00	75.00	25.00
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_items (id, name, category, barcode, subject_id, grade_id, cost_price, selling_price, current_stock, min_stock_alert, is_active, created_at, updated_at, teacher_id) FROM stdin;
\.


--
-- Data for Name: package_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.package_groups (id, package_id, group_id, created_at) FROM stdin;
554a0e91-cada-4486-ae47-abdf188f10f2	5f5ea76a-df23-4077-a009-87cb90a1d3b4	86843dfe-9395-4b15-81d8-e2e046bd1f9e	2026-11-14 20:30:41.202827+02
3cef706e-fe38-49bd-b64a-ab0ba93ade99	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	86843dfe-9395-4b15-81d8-e2e046bd1f9e	2026-11-14 20:30:41.202827+02
8342abb5-fe3c-4afd-a1d2-e8dd9f728490	5f5ea76a-df23-4077-a009-87cb90a1d3b4	b6cff436-bd18-4645-8117-b7c9de60f2bc	2026-11-14 20:30:41.202827+02
f7694727-194e-441c-80b3-3680b6f1b4f9	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	b6cff436-bd18-4645-8117-b7c9de60f2bc	2026-11-14 20:30:41.202827+02
6536acd8-7223-4a7a-ba0a-935c33c97a96	5f5ea76a-df23-4077-a009-87cb90a1d3b4	65bbd8fe-5262-4330-a873-1fb8b5af7dca	2026-11-14 20:30:41.202827+02
8dcd9d76-de29-4dc9-9d86-5fb53401221e	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	65bbd8fe-5262-4330-a873-1fb8b5af7dca	2026-11-14 20:30:41.202827+02
281da483-25a0-4f5d-9f36-49134fa026fb	5f5ea76a-df23-4077-a009-87cb90a1d3b4	b4544239-d137-4b61-97ba-b16dbc725d21	2026-11-14 20:30:41.202827+02
517e3e92-8846-47f1-b796-43ee8914f98a	5f5ea76a-df23-4077-a009-87cb90a1d3b4	d87c197e-8ebd-4f24-ba07-c98de2a03d29	2026-11-14 20:30:41.202827+02
6e7ae270-1551-443c-addb-0caa48c354e7	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	f5ad4437-6240-4044-8a99-f3f1bd6fdf3f	2026-11-14 20:30:41.202827+02
15ad03fe-8be8-4450-9d71-3c688f4699e8	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	add4ea62-0b85-4f6d-bc0c-56e19f9bcec0	2026-11-14 20:30:41.202827+02
b6ad34fa-4adb-4da2-a7de-30d9fdd408f8	5f5ea76a-df23-4077-a009-87cb90a1d3b4	9cc90cc7-3bfa-4f17-9c2e-cb258ca457c0	2026-11-14 20:30:41.202827+02
a7217e61-7069-48c5-9d1a-ed397957d717	5f5ea76a-df23-4077-a009-87cb90a1d3b4	55169b33-c419-4821-96c9-87a2634da155	2026-11-14 20:30:41.202827+02
073dfc59-bab4-43ca-8d05-4b440b2148b9	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	c68d0155-7e0b-4e62-b780-b65072ba3353	2026-11-14 20:30:41.202827+02
64daf8ff-db69-4a45-bc72-957d67487b2c	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	54fff58b-567a-4173-86eb-d18f1c667a25	2026-11-14 20:30:41.202827+02
a0750a53-5ec2-4bc6-b114-0c44d23bff65	5f5ea76a-df23-4077-a009-87cb90a1d3b4	6888e637-0d66-49fa-a265-6554895d30fe	2026-11-14 20:30:41.202827+02
047eb4b3-1395-4a49-8c4b-8f7c2a4f0481	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	6888e637-0d66-49fa-a265-6554895d30fe	2026-11-14 20:30:41.202827+02
6941aa5a-0bde-4955-84cc-a97105387118	5f5ea76a-df23-4077-a009-87cb90a1d3b4	425eefb0-92ba-43e6-8da7-c6581efc8099	2026-11-14 20:30:41.202827+02
9d9fd56f-8e77-4969-aca4-485b47a116fe	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	425eefb0-92ba-43e6-8da7-c6581efc8099	2026-11-14 20:30:41.202827+02
94af9f36-a303-4b49-8307-f536e41b09ba	5f5ea76a-df23-4077-a009-87cb90a1d3b4	bbcac0c6-3bc5-4b83-a6f9-900f087ae924	2026-11-14 20:30:41.202827+02
a362f363-e0b4-40a3-9547-5466a60c0ddc	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	93551bc4-bb46-45e6-9dc5-97f85bad4a70	2026-11-14 20:30:41.202827+02
2ab2bd37-841b-431c-bfcb-c05466657da2	5f5ea76a-df23-4077-a009-87cb90a1d3b4	d2dcdc2d-f376-42f6-8dba-42b662bcbe1c	2026-11-14 20:30:41.202827+02
dd496961-66f3-4eb8-a3c6-fa3f1d67f472	84fbb3e7-fdef-4113-b6e3-eb6dfb979336	d2dcdc2d-f376-42f6-8dba-42b662bcbe1c	2026-11-14 20:30:41.202827+02
7146478f-4796-4c74-a37f-9b4ee0b45c31	16c2439b-b03c-4bb6-958a-5a078f528672	a7f578ba-eda7-4d38-a4cb-0a5b4b70de72	2026-11-14 20:30:41.202827+02
cd87695f-834e-4d67-a1dc-7c52a0f3ed48	c21045fb-6477-4885-b9db-8987a117663e	a7f578ba-eda7-4d38-a4cb-0a5b4b70de72	2026-11-14 20:30:41.202827+02
f69f38ac-5283-424e-964c-0142f8d174e7	16c2439b-b03c-4bb6-958a-5a078f528672	2b93444e-0c67-454c-8ac1-89870d317251	2026-11-14 20:30:41.202827+02
2fd6c89d-f82d-4bbd-a68c-5a7f41534e2a	c21045fb-6477-4885-b9db-8987a117663e	2b93444e-0c67-454c-8ac1-89870d317251	2026-11-14 20:30:41.202827+02
d57cd620-c751-4d90-8f28-6b30edb1d2dc	16c2439b-b03c-4bb6-958a-5a078f528672	f67635d0-32c6-4e53-9710-701e5884bb23	2026-11-14 20:30:41.202827+02
0a656515-9759-483f-acd7-9ca07e037e0f	c21045fb-6477-4885-b9db-8987a117663e	f67635d0-32c6-4e53-9710-701e5884bb23	2026-11-14 20:30:41.202827+02
8ba43140-fc38-4f55-92d3-c5733f156a05	16c2439b-b03c-4bb6-958a-5a078f528672	af52ffa4-76df-4da1-9de0-65986a8a3281	2026-11-14 20:30:41.202827+02
9ce904cc-bfc8-4f08-9e9b-77d2b031f261	c21045fb-6477-4885-b9db-8987a117663e	af52ffa4-76df-4da1-9de0-65986a8a3281	2026-11-14 20:30:41.202827+02
c74ee51a-9497-4420-a1c6-94c978863d6c	16c2439b-b03c-4bb6-958a-5a078f528672	b7205b34-da71-4deb-9779-68cc7eab98d1	2026-11-14 20:30:41.202827+02
f738daa8-505d-47fb-b518-c412fd907b6d	16c2439b-b03c-4bb6-958a-5a078f528672	a4db3ae9-6050-4390-892c-8dbde84a32e1	2026-11-14 20:30:41.202827+02
cd0af5d0-0415-44ba-8c73-15a8a199daf9	c21045fb-6477-4885-b9db-8987a117663e	e2cc2b10-4eed-4b51-bf87-caea5d6c1f2e	2026-11-14 20:30:41.202827+02
808e9938-5c68-45a0-a7ad-e0d2769ea71d	c21045fb-6477-4885-b9db-8987a117663e	0d80e757-bc1b-4f68-8a48-513c0e728e37	2026-11-14 20:30:41.202827+02
fa7acd81-6ac6-41fd-afba-0afad6264141	16c2439b-b03c-4bb6-958a-5a078f528672	30474894-3ef8-4cc8-b73d-dadac2bf8256	2026-11-14 20:30:41.202827+02
383a04f2-451c-4da3-8f7e-12a9f75f38a7	16c2439b-b03c-4bb6-958a-5a078f528672	eed96ff6-e43b-4a75-a7fb-ef85ddab0a61	2026-11-14 20:30:41.202827+02
32b06d63-8715-4dca-a6b1-34984de191a7	c21045fb-6477-4885-b9db-8987a117663e	e45ac801-ec5e-4eb8-924a-a99c70eb4cd1	2026-11-14 20:30:41.202827+02
31485649-81d4-4313-bf25-6bb2ba70abb5	c21045fb-6477-4885-b9db-8987a117663e	036eaecb-8a73-4422-bd12-17495da1e619	2026-11-14 20:30:41.202827+02
71ba445e-26c9-4214-8bdd-84ea29a21d53	16c2439b-b03c-4bb6-958a-5a078f528672	9de5c06a-8253-4f6d-b541-2ed1043d8f66	2026-11-14 20:30:41.202827+02
6e5c1140-efe7-435d-aee1-0f8d55068787	c21045fb-6477-4885-b9db-8987a117663e	9de5c06a-8253-4f6d-b541-2ed1043d8f66	2026-11-14 20:30:41.202827+02
0abbfb1e-417a-4a16-8361-1d5b22c4eebb	16c2439b-b03c-4bb6-958a-5a078f528672	450e9507-6289-4154-b04f-f991a4871cea	2026-11-14 20:30:41.202827+02
6c85d240-a427-40ad-a377-f2f88f31422c	c21045fb-6477-4885-b9db-8987a117663e	450e9507-6289-4154-b04f-f991a4871cea	2026-11-14 20:30:41.202827+02
fd1c9f15-8875-4453-8ee8-b0d2a400d546	16c2439b-b03c-4bb6-958a-5a078f528672	0c808508-a35e-487d-b4e7-af23f198315a	2026-11-14 20:30:41.202827+02
67448382-196f-4dae-92ee-bc3335b02de1	c21045fb-6477-4885-b9db-8987a117663e	6dc8b27e-2fa2-4faa-bd40-d52e1a4ac704	2026-11-14 20:30:41.202827+02
50d3e9c8-3f2d-445e-a00c-37fba97ef5f0	16c2439b-b03c-4bb6-958a-5a078f528672	2be1a59d-ff8f-47ff-af5f-e6554f4dfe9b	2026-11-14 20:30:41.202827+02
13350a7d-a0e6-45dc-909e-84a5710d627f	c21045fb-6477-4885-b9db-8987a117663e	2be1a59d-ff8f-47ff-af5f-e6554f4dfe9b	2026-11-14 20:30:41.202827+02
0f09a6fa-1a12-404c-9aaa-8a6a2124086e	714a2b7b-761a-4908-8642-cfa8bddf98a7	95dcce24-630b-4763-8436-7760b2d5796b	2026-11-14 20:30:41.202827+02
7c8841b6-6d16-4523-bfa3-e5b335c97d64	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	95dcce24-630b-4763-8436-7760b2d5796b	2026-11-14 20:30:41.202827+02
64fb04de-3fb9-4d11-90a8-6588e359a1d5	714a2b7b-761a-4908-8642-cfa8bddf98a7	5f8c9acb-3e78-41ec-8288-121e9564e13f	2026-11-14 20:30:41.202827+02
310123e4-7e40-4912-833e-e98b0d5d9c91	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	5f8c9acb-3e78-41ec-8288-121e9564e13f	2026-11-14 20:30:41.202827+02
16dc6f7b-18a4-408e-b945-714cf88abd56	714a2b7b-761a-4908-8642-cfa8bddf98a7	231533ce-529a-4085-9bb6-1947c9fbe210	2026-11-14 20:30:41.202827+02
20c74bea-ff32-4f76-a57c-67967e0245df	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	231533ce-529a-4085-9bb6-1947c9fbe210	2026-11-14 20:30:41.202827+02
82218dc4-3979-424b-bc88-056abef4c536	714a2b7b-761a-4908-8642-cfa8bddf98a7	d845e4da-d2a2-4027-b9d0-790b836ca8dc	2026-11-14 20:30:41.202827+02
7e6c002a-a551-40b5-9373-d4e4811a4787	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	d845e4da-d2a2-4027-b9d0-790b836ca8dc	2026-11-14 20:30:41.202827+02
01cf9f29-b539-494c-b445-31ec2d24529f	714a2b7b-761a-4908-8642-cfa8bddf98a7	eb5bc3ca-088d-4a62-829b-a6ee43e04527	2026-11-14 20:30:41.202827+02
b4ed2517-e213-4673-89cf-8bb3ca051ea5	714a2b7b-761a-4908-8642-cfa8bddf98a7	23762283-e63e-4b11-93e4-2aac11a81de3	2026-11-14 20:30:41.202827+02
09f931ad-7c64-42fd-9fbc-c92c9798bf44	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	c105f776-5e9e-4687-8419-aa049b79ab23	2026-11-14 20:30:41.202827+02
b7425809-144b-4a99-8b3d-513ed14a0703	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	3ed283bc-bfe1-4a59-b43a-0af96e65c224	2026-11-14 20:30:41.202827+02
2f4144ea-cbbf-4a6e-bcc8-288dc24ad792	714a2b7b-761a-4908-8642-cfa8bddf98a7	9333a326-99e2-46d0-a059-e4cde8250579	2026-11-14 20:30:41.202827+02
7e4914bc-fddb-4e01-8bc9-0bdd4cf1f7c7	714a2b7b-761a-4908-8642-cfa8bddf98a7	8fab74c0-09a5-4842-81fb-7a9cf46f2976	2026-11-14 20:30:41.202827+02
9b9854f3-1626-43eb-9a76-2434b0242757	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	04b32671-a387-4d22-a2b0-87023274361d	2026-11-14 20:30:41.202827+02
2f3b4f33-4dae-4caa-bc80-62fdb46c3e0f	714a2b7b-761a-4908-8642-cfa8bddf98a7	f8e4df26-a15b-418e-89e0-f0c97889d785	2026-11-14 20:30:41.202827+02
228705fa-52e8-4171-ae7b-6aa5274037c7	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	f8e4df26-a15b-418e-89e0-f0c97889d785	2026-11-14 20:30:41.202827+02
a25fb55c-3e3c-4fa3-9ccc-317671ada4f9	714a2b7b-761a-4908-8642-cfa8bddf98a7	dc8a2856-60a0-4fff-934f-24d782c62956	2026-11-14 20:30:41.202827+02
4b3a45b8-c9a5-4089-a3a2-28eef80fe338	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	dc8a2856-60a0-4fff-934f-24d782c62956	2026-11-14 20:30:41.202827+02
9b7373bf-76a5-442e-b83d-2b41ad4957c7	714a2b7b-761a-4908-8642-cfa8bddf98a7	e0cc677f-c19e-4365-be59-a79865503e47	2026-11-14 20:30:41.202827+02
725fa4db-af40-4dd4-897d-34d747901f18	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	603c0479-1cb8-4939-a104-e00cb532838d	2026-11-14 20:30:41.202827+02
2fc18b98-9e64-4571-944d-793782b4b513	714a2b7b-761a-4908-8642-cfa8bddf98a7	192b8b51-e6df-439f-be59-322bd4cf0d93	2026-11-14 20:30:41.202827+02
9856221a-3659-4b73-8312-b01f43d4fea8	0f1cfcd8-f70a-41a6-a13a-1ee185e59b1d	192b8b51-e6df-439f-be59-322bd4cf0d93	2026-11-14 20:30:41.202827+02
036f3bb0-072b-4abc-8b67-f300873bb62f	14bac981-e410-43c7-9bb6-0b873749cc20	062539ac-5d5a-4c7a-9b1e-4adb2fcd4c36	2026-11-14 20:30:41.202827+02
caf950cd-e924-40ff-97b0-e324366c1d40	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	062539ac-5d5a-4c7a-9b1e-4adb2fcd4c36	2026-11-14 20:30:41.202827+02
f75afa6f-aac6-4b76-915d-ac951a0b0355	14bac981-e410-43c7-9bb6-0b873749cc20	15068823-e8f2-4d38-ae05-81c21086f664	2026-11-14 20:30:41.202827+02
67b0c0a0-5011-4640-a234-2a4544dcbdfe	14bac981-e410-43c7-9bb6-0b873749cc20	bfa9a5fd-0011-4c61-b080-e498fd4bb830	2026-11-14 20:30:41.202827+02
cefb6046-0e71-4a2a-a25e-3235fe087311	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	ff8f6af8-007f-439c-a9f7-1fc93729c6fa	2026-11-14 20:30:41.202827+02
e09f4778-0858-4082-b838-5df2f5fa8ee6	14bac981-e410-43c7-9bb6-0b873749cc20	4a397318-a4c5-4996-8d72-f6d4b3239e00	2026-11-14 20:30:41.202827+02
2d8f10f1-82fd-4553-8114-f5117942ac04	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	4a397318-a4c5-4996-8d72-f6d4b3239e00	2026-11-14 20:30:41.202827+02
f332c56b-39e5-4730-bf4e-a581b024f2ee	14bac981-e410-43c7-9bb6-0b873749cc20	c4168241-b98d-49d2-8fb0-73cbf7967274	2026-11-14 20:30:41.202827+02
9b756402-c4f0-46be-85e0-28bf6d96a933	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	c4168241-b98d-49d2-8fb0-73cbf7967274	2026-11-14 20:30:41.202827+02
49774f75-eea5-4d72-8a62-bdfb285caa64	14bac981-e410-43c7-9bb6-0b873749cc20	b30e7ef1-5c8f-4484-b82b-8cbddcf87931	2026-11-14 20:30:41.202827+02
a862b2fb-4f11-495d-a903-e99f7d4ba9ae	14bac981-e410-43c7-9bb6-0b873749cc20	cf255a7b-7d18-41e0-b574-4ca1384ec53c	2026-11-14 20:30:41.202827+02
a0803c22-5b5c-4be0-a3b9-cbcd5577574c	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	d7519a6c-9fdd-4d4f-8e07-2cdbff1d9391	2026-11-14 20:30:41.202827+02
f8f79351-2f8a-400a-aaf7-90a490e4b285	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	3ddfc147-77b6-4d7d-a110-6659f19c4bf8	2026-11-14 20:30:41.202827+02
26c3d321-c24c-4646-ad79-34e5e5feecfe	14bac981-e410-43c7-9bb6-0b873749cc20	0196dcce-65ef-434a-bc57-f043e594d6ba	2026-11-14 20:30:41.202827+02
aac9a92b-ce8a-4476-9052-b583da84eec4	14bac981-e410-43c7-9bb6-0b873749cc20	3bd5de3e-c432-489f-99b9-3dec1b72c0c6	2026-11-14 20:30:41.202827+02
7671d8cc-cb1e-4aca-9f32-d9b3f2308ccb	14bac981-e410-43c7-9bb6-0b873749cc20	7a19710e-6223-45fa-8fee-75141581d88f	2026-11-14 20:30:41.202827+02
4c0d82af-12d4-4f7e-9ae3-26a9a2af6c08	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	383c3d4f-18ce-461c-ae97-ee865e6277fd	2026-11-14 20:30:41.202827+02
e2d35ed8-7853-4b4c-bd95-faef461132f2	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	92583748-dd9f-4878-a685-aae118bf841d	2026-11-14 20:30:41.202827+02
8ef528ab-fe61-4664-a8b3-74947aa601c7	14bac981-e410-43c7-9bb6-0b873749cc20	f06858e0-abf8-428e-926c-46c887c7956c	2026-11-14 20:30:41.202827+02
8caea7b9-726f-4f28-886f-34d98711bc8e	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	f06858e0-abf8-428e-926c-46c887c7956c	2026-11-14 20:30:41.202827+02
ea04c327-7065-4a7e-a497-9dbdf29e6b18	14bac981-e410-43c7-9bb6-0b873749cc20	03216a48-cec9-424a-8306-13f9b89d6fcc	2026-11-14 20:30:41.202827+02
384dd2af-97f6-4e99-9070-686d3625502f	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	03216a48-cec9-424a-8306-13f9b89d6fcc	2026-11-14 20:30:41.202827+02
f2a82555-9dbd-4f94-aecd-e76aa77d49a9	14bac981-e410-43c7-9bb6-0b873749cc20	ed59c4e1-b754-4a70-92c8-01e492e4e681	2026-11-14 20:30:41.202827+02
ef1fbc75-76fc-4b54-8956-96d3d8607c00	6af9a9f1-0bbf-44c1-9fdd-8cf3ff06f65e	ed59c4e1-b754-4a70-92c8-01e492e4e681	2026-11-14 20:30:41.202827+02
82dbd129-7c61-49bc-ab35-91902b0a1695	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	4a65abf2-2c78-4985-8fa8-f93f7ea21288	2026-11-14 20:30:41.202827+02
2a488a0f-b22f-4e04-8776-33ac89fc8c26	7094c844-980b-4399-8b18-306d8bbabac8	4a65abf2-2c78-4985-8fa8-f93f7ea21288	2026-11-14 20:30:41.202827+02
bdb7773d-79d5-4acd-9e6e-32ff206a9d8a	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	fdaa1949-f17d-49ab-b7f1-961018249077	2026-11-14 20:30:41.202827+02
71d06051-3f2d-4168-8b1e-95d49ee5d917	7094c844-980b-4399-8b18-306d8bbabac8	0305ae3d-9489-4a6f-aaa4-33b5572150ff	2026-11-14 20:30:41.202827+02
9469299a-aafc-459a-a88f-8aba0222ab49	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	57c74101-2830-4264-854f-237f5120b9c3	2026-11-14 20:30:41.202827+02
ce7c9744-07bc-461d-a53a-3fc9e0981384	7094c844-980b-4399-8b18-306d8bbabac8	57c74101-2830-4264-854f-237f5120b9c3	2026-11-14 20:30:41.202827+02
d2179eb2-73e7-4fd0-8774-9e98e4da2160	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	4b82702f-492e-40d2-a725-d564e5fd2b2f	2026-11-14 20:30:41.202827+02
505c2895-bc11-4532-819c-d906d40a1067	7094c844-980b-4399-8b18-306d8bbabac8	4b82702f-492e-40d2-a725-d564e5fd2b2f	2026-11-14 20:30:41.202827+02
bf58f300-e15d-4a8c-b061-d9b0c5fb8ebb	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	16140c73-feed-4b2b-94d6-4bf78968a8a3	2026-11-14 20:30:41.202827+02
75ec797c-f57e-4865-95d0-a5b395d573bd	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	d9c66a5b-6b6b-4ce8-9e88-7ecc3c7df14d	2026-11-14 20:30:41.202827+02
7066f34c-a4e6-49b8-b2eb-1afb9fce5716	7094c844-980b-4399-8b18-306d8bbabac8	b199cf41-3105-4989-91d7-10e55e862c62	2026-11-14 20:30:41.202827+02
92c4d9f7-46a3-4c73-80e7-42f811545b98	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	7f2affc7-5540-47ba-bf8c-569af50056c0	2026-11-14 20:30:41.202827+02
433e5b59-c855-42bf-977c-45a871371314	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	661561bc-ef0c-4f5f-bc45-3e017908bf81	2026-11-14 20:30:41.202827+02
41cdbf42-67d6-4570-9e4d-98e84cf84f57	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	666aa3b3-cd9a-426f-9b19-9e9c37899f5d	2026-11-14 20:30:41.202827+02
2d54ac0e-9e5c-4c2e-b8fb-756603a5acea	7094c844-980b-4399-8b18-306d8bbabac8	7194e321-77b2-44a8-b100-aa59b5a055e2	2026-11-14 20:30:41.202827+02
cae69a42-4030-4de0-b9db-0b6a2d4658d7	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	b8eeefa3-3cb8-4aca-9d23-97b5b3fad8ac	2026-11-14 20:30:41.202827+02
ba423066-6b75-4b47-9201-55a6c2f164a5	7094c844-980b-4399-8b18-306d8bbabac8	b8eeefa3-3cb8-4aca-9d23-97b5b3fad8ac	2026-11-14 20:30:41.202827+02
5c68c56c-8496-4d10-91a5-191ce775b260	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	952fbe87-9d84-4040-9217-5338af7cb593	2026-11-14 20:30:41.202827+02
a4ae94f9-1d42-46c6-bfea-a3c6ae9674e5	7094c844-980b-4399-8b18-306d8bbabac8	952fbe87-9d84-4040-9217-5338af7cb593	2026-11-14 20:30:41.202827+02
29c344a0-2ced-4acf-a8ed-2bab1ee4e738	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	96029fec-32f1-4c3f-b28c-d4e88550c9ef	2026-11-14 20:30:41.202827+02
09a7ba7b-57eb-4268-9b80-8150346b38e9	7094c844-980b-4399-8b18-306d8bbabac8	96029fec-32f1-4c3f-b28c-d4e88550c9ef	2026-11-14 20:30:41.202827+02
321f4cee-37fc-45c7-99cd-9f6b3337f9b8	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	97a8301c-221b-402c-99a5-9e2d081a73e0	2026-11-14 20:30:41.202827+02
afd4accf-e79d-4fac-9860-f038d1abfe0d	28705c72-d15e-44c6-92f8-a347b86a5e65	97a8301c-221b-402c-99a5-9e2d081a73e0	2026-11-14 20:30:41.202827+02
0614ad6f-9884-452c-ab86-af391996cc3a	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	ba1a46dc-a5f9-4ddc-8107-ca105fecd87f	2026-11-14 20:30:41.202827+02
573d085d-3c68-4805-8aaa-75b16024b931	28705c72-d15e-44c6-92f8-a347b86a5e65	8211d7b3-3984-4dbc-bf70-45884ea4a445	2026-11-14 20:30:41.202827+02
b24d8783-0c13-44c2-9135-c40983f3c94d	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	24ecab19-6367-4e2d-bedb-9ac501373827	2026-11-14 20:30:41.202827+02
ad1db9f4-9959-4b67-9a41-828b1778463c	28705c72-d15e-44c6-92f8-a347b86a5e65	24ecab19-6367-4e2d-bedb-9ac501373827	2026-11-14 20:30:41.202827+02
f5ace9be-cd9b-4808-9708-98315eeb87fe	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	c6cee59f-0008-448f-8ce9-c11b54fffceb	2026-11-14 20:30:41.202827+02
ebf5b76d-252f-4973-8d3a-247272f8f0f5	28705c72-d15e-44c6-92f8-a347b86a5e65	c6cee59f-0008-448f-8ce9-c11b54fffceb	2026-11-14 20:30:41.202827+02
95cd5a17-4c16-47ad-9bdc-45a352b68b52	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	cd23564b-9deb-4932-8a66-c2a21b224c74	2026-11-14 20:30:41.202827+02
e061ceb5-936d-45d1-8a13-213800de74e9	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	85bc7861-efdb-4a84-9ff6-c936b75cd0ca	2026-11-14 20:30:41.202827+02
6238d5d3-6109-44b1-b825-efd8457a5dfe	28705c72-d15e-44c6-92f8-a347b86a5e65	4d28d25d-b512-4c75-9520-0ddef1a1c5b6	2026-11-14 20:30:41.202827+02
98504443-d25f-42b4-852d-8f250f26d329	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	89fd14a4-5f90-4746-974f-c36d21809d3d	2026-11-14 20:30:41.202827+02
b5b5ef96-e9df-426b-85d1-23f74f711abd	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	b468ae9a-a5a4-456a-a13e-25cfe83bc35c	2026-11-14 20:30:41.202827+02
a20148bd-503e-4fab-ba06-6dfe71f5d2d9	28705c72-d15e-44c6-92f8-a347b86a5e65	5182823a-1759-4a35-80b7-3b77ae2224c5	2026-11-14 20:30:41.202827+02
26915444-4b9e-4261-b9c4-7a21af00f851	28705c72-d15e-44c6-92f8-a347b86a5e65	7015bf78-aac4-4ea9-8821-b61fee5e3796	2026-11-14 20:30:41.202827+02
409f2a14-6bd9-4bf0-b776-81add8ce3d5c	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	c373356e-2cfd-4e22-b887-e1f250872d44	2026-11-14 20:30:41.202827+02
86f232bf-5fca-44dc-9058-ce300dc7b183	28705c72-d15e-44c6-92f8-a347b86a5e65	c373356e-2cfd-4e22-b887-e1f250872d44	2026-11-14 20:30:41.202827+02
b27d7c38-4066-472b-896d-c13ae37c7697	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	8fce9dce-f56a-4d30-9b8d-1ea06c58407b	2026-11-14 20:30:41.202827+02
cfa3a467-5d88-42a8-8756-1d37d4dd8c4a	28705c72-d15e-44c6-92f8-a347b86a5e65	8fce9dce-f56a-4d30-9b8d-1ea06c58407b	2026-11-14 20:30:41.202827+02
1c50bf05-925d-4eb1-a41b-040c48e0ca8d	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	a5d46b36-72cc-454c-bb5b-1f56c1e821d3	2026-11-14 20:30:41.202827+02
e7acab57-c4c3-4197-bfaf-945590df1297	28705c72-d15e-44c6-92f8-a347b86a5e65	a5d46b36-72cc-454c-bb5b-1f56c1e821d3	2026-11-14 20:30:41.202827+02
ea51a454-6fc9-4dd5-a3af-7ad1169505dc	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	0ca75c0c-674f-41a7-8ae1-3fdd3d442954	2026-11-14 20:30:41.202827+02
215304e8-5ca3-4925-aff0-eb2dea241c32	03f04240-4980-43dc-992d-0811f17edf25	0ca75c0c-674f-41a7-8ae1-3fdd3d442954	2026-11-14 20:30:41.202827+02
02f9ae7e-7978-4d61-b7ba-71bfbc3aac3a	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	47bdfa64-e83b-4b21-9e8d-8f8fe41d0a13	2026-11-14 20:30:41.202827+02
56da284c-f964-4402-9f25-ee5796e54c12	03f04240-4980-43dc-992d-0811f17edf25	47bdfa64-e83b-4b21-9e8d-8f8fe41d0a13	2026-11-14 20:30:41.202827+02
e3bf2e27-d3c0-4256-968c-5853fe555e7e	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	175a0f1b-7f93-4994-93b1-c60ba90c795e	2026-11-14 20:30:41.202827+02
ac883a6d-bbd6-4c47-b4e3-456ede08a90b	03f04240-4980-43dc-992d-0811f17edf25	175a0f1b-7f93-4994-93b1-c60ba90c795e	2026-11-14 20:30:41.202827+02
aa38c80c-90c8-4263-b99c-63f0a1aa2209	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	0d704416-9b72-4865-9987-086535497060	2026-11-14 20:30:41.202827+02
7df7b78f-f6e6-477c-90f9-0d4f5e293e6c	03f04240-4980-43dc-992d-0811f17edf25	0d704416-9b72-4865-9987-086535497060	2026-11-14 20:30:41.202827+02
9ba12631-4359-49cc-8651-282c6bf9ea86	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	cfa90b96-b4d0-4c8e-87a5-58fc55934d7c	2026-11-14 20:30:41.202827+02
269efc5c-ee47-4ca3-890b-3ea7ed42f515	03f04240-4980-43dc-992d-0811f17edf25	cfa90b96-b4d0-4c8e-87a5-58fc55934d7c	2026-11-14 20:30:41.202827+02
9bdb7b99-7ed5-4c15-b33a-57905a10de0e	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	a32c09d5-2594-4103-8364-a93fbd01e526	2026-11-14 20:30:41.202827+02
a3d75094-ac62-495c-842c-22e257e92743	03f04240-4980-43dc-992d-0811f17edf25	b7e8c00b-8416-4c51-b7ea-ec7c7b1d773e	2026-11-14 20:30:41.202827+02
7a70716b-bbfb-4761-95ba-8143ba0cbaf0	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	6d7ea2c7-38a4-4863-8b67-79227412fadf	2026-11-14 20:30:41.202827+02
c72d41d3-a3f0-4633-9905-904812357bca	03f04240-4980-43dc-992d-0811f17edf25	99262e7a-2040-430d-b0e2-0159f18e595e	2026-11-14 20:30:41.202827+02
e9bd55fc-97af-4f1f-a7fe-ad8ebbf1debb	03f04240-4980-43dc-992d-0811f17edf25	33a373eb-c441-4c93-b771-4f94554ff8a9	2026-11-14 20:30:41.202827+02
4d5e1255-f22a-46fb-ac71-df549620e212	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	ff4eaac1-ce58-4aa9-a14f-202e937d15ed	2026-11-14 20:30:41.202827+02
9269f660-5395-443b-aeaa-8b5bb1fbf17f	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	35bfd896-359f-4e2f-865b-d0a9af387482	2026-11-14 20:30:41.202827+02
4bd4edce-2566-4e42-b521-be6da1af8775	03f04240-4980-43dc-992d-0811f17edf25	35bfd896-359f-4e2f-865b-d0a9af387482	2026-11-14 20:30:41.202827+02
5e7f5c76-7c37-468a-b46d-19a9a2c088a7	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	2b82c9c6-c741-4832-9386-94833f021273	2026-11-14 20:30:41.202827+02
b91e3941-4052-4c2d-a065-0be3eb4bcc40	03f04240-4980-43dc-992d-0811f17edf25	2b82c9c6-c741-4832-9386-94833f021273	2026-11-14 20:30:41.202827+02
56cedcd8-714e-4ac4-be05-f2de60046af7	94b1c202-9c96-48ba-9ea0-a9a4a89d34e9	8eccbeb7-decc-41d7-8d63-fccf96618bd2	2026-11-14 20:30:41.202827+02
920c32e7-db13-48a3-a52a-70eab4a1c8be	03f04240-4980-43dc-992d-0811f17edf25	8eccbeb7-decc-41d7-8d63-fccf96618bd2	2026-11-14 20:30:41.202827+02
f033d9ba-fbd6-4f60-9abc-7b3ee0fab325	14bac981-e410-43c7-9bb6-0b873749cc20	093581ce-9284-4bb6-9e51-45c8fa117aa6	2026-11-17 17:07:25.55505+02
78afd65a-ff9e-407b-8b30-5b10607a94ba	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	02ead4e6-4daf-4676-92f9-78a2227155bf	2026-11-17 17:10:22.041438+02
0358e24d-f41f-41d4-b01e-25123c5cd38e	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	01afcf6c-368a-4614-9ee6-50315fb0fb93	2026-11-17 17:10:22.041438+02
041002aa-820a-43c5-a52c-8df3de7db70d	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	06d1f404-f92a-45f1-bee0-600f6e1e2deb	2026-11-17 21:11:55.102014+02
e2acdf11-b670-4036-be9e-fae99a30f837	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	31b63135-9eb4-4cb8-9a4b-f1b6514f59af	2026-11-17 21:11:55.102014+02
2c245c03-3407-43dc-af60-9bebefcfe4fb	14bac981-e410-43c7-9bb6-0b873749cc20	b569d992-e015-47ec-9cd8-d11fb4cde428	2026-11-18 20:12:58.081451+02
fa5fd057-6244-4000-8837-fae2b2739cb9	14bac981-e410-43c7-9bb6-0b873749cc20	beea2923-5bae-4898-ac34-cf71be18406e	2026-11-18 20:12:58.081451+02
0346cf7e-aea0-4ab3-8738-bcf5c981b989	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	c27c485d-9c95-41d8-a620-475f0292e198	2026-11-18 20:12:58.081451+02
dc9ae5c9-0dac-4d2e-bc04-9971a63e5804	753299b8-25bc-4eaf-b1c4-aad1a6acabaa	7211e4f8-8a05-4ec2-969e-f4116a6e35b2	2026-11-18 20:12:58.081451+02
8cae01eb-cb29-4eb9-98c0-fed7bcdf8a88	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	acbb5a1a-bdac-4469-9fd0-266df8a28862	2026-11-18 20:12:58.081451+02
90793e9f-c6c0-46cc-a188-43d7490efc79	9e91058c-e3d6-4efb-8faf-7596b0bf6f61	b92c3a73-0f72-42df-85a0-40acb57261c5	2026-11-18 20:12:58.081451+02
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
\.


--
-- Data for Name: pos_sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pos_sales (id, invoice_number, cashier_id, student_id, subtotal, discount, total_amount, paid_amount, change_amount, payment_method, notes, created_at) FROM stdin;
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
43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	CENTER_MANAGER	مدير السنتر	Center Manager	Schedules, Teachers, Students, General Operations & Reports	t	2026-09-15 14:29:44.386261+03	2026-09-30 21:50:56.614959+03	["dashboard", "students", "teachers", "groups", "subjects", "packages", "booklets", "qrcode", "gate", "finance", "subscriptions"]
\.


--
-- Data for Name: student_package_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_package_enrollments (id, student_id, package_id, selected_group_ids, total_price, status, enrolled_at, notes) FROM stdin;
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
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, barcode_id, full_name, full_name_ar, phone, parent_phone, parent_name, grade_id, status_id, billing_model, photo_url, address, notes, is_active, sync_status, remote_id, created_at, updated_at, student_code, education_type, enrollment_type, father_phone, mother_phone, gender, national_id, date_of_birth, school_name) FROM stdin;
a3161700-cbc7-48fe-917d-3795186f65b9	ATL-G07-1001	طالب اختبار	\N	01224385098	01224385098	ولي أمر الطالب	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	\N	\N	\N	t	local	\N	2026-09-30 23:56:20.896131+03	2026-09-30 23:56:20.896131+03	1001	PUBLIC	PACKAGE	\N	\N	male	\N	\N	\N
1a1ca3c2-ecb9-48ae-b642-8238e8af678a	ATL-G07-1290	ايمان احمد رجب محمد	ايمان احمد رجب محمد	01287380109	01287380109	ولي الأمر (عامل)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/Hc2d38P/IMG-20261119-WA2990.jpg	العجمي شارع خيرالله بجوار قهوه فهد	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-19 15:34:35.259525+02	2026-11-19 15:34:35.259525+02	1290	PUBLIC	PACKAGE	01287380109	01281883454	female	31408190203848	2014-08-19	الشهيد النقيب بسام جابر محمد احمد ص٠ب
18640d9a-c3eb-4262-b09c-6a3bd3d1f1e1	ATL-G07-1291	نور الدين حسين طه	نور الدين حسين طه	01277838511	01226016813	ولي الأمر (بأسواق فتح الله)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/xSTm0mJX/1000019161.jpg	الإسكندرية العجمي الهنوفيل شارع ورشة البلاط خلف مدرسة الحياة	\N	t	local	\N	2026-11-19 15:34:35.259525+02	2026-11-19 15:34:35.259525+02	1291	LANGUAGES	PACKAGE	01226016813	01270335082	male	31301230202514	2013-01-23	زيد بن حارثة
82b02476-78eb-424f-8f89-5805af7faa0b	ATL-G05-1292	براء السيد علي النحراوي	براء السيد علي النحراوي	01095034603	01211215422	ولي الأمر (اعمال حره)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/YFt6z59Y/1000186703.jpg	الهانوفيل 19 شارع خليل خير الله	[تعليم أزهري]	t	local	\N	2026-11-19 15:34:35.259525+02	2026-11-19 15:34:35.259525+02	1292	PUBLIC	PACKAGE	01211215422	01065978586	male	31608081605137	2016-08-08	طاهر القويرى الابتدائيه
8037a820-b12a-4821-8cb4-a36972564005	ATL-G07-1293	احمد مدحت احمد	احمد مدحت احمد	01274964157	01274964157	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/zhcgCjFW/IMG-20260717-WA0018.jpg	العجمي الهانوفيل شارع الكومي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-19 15:34:35.259525+02	2026-11-19 15:34:35.259525+02	1293	LANGUAGES	PACKAGE	01274964157	01271915001	male	31309140200459	2013-09-14	مدرسه اجيال الغد
46b7f721-68c6-4b66-9051-e26b6947f91b	ATL-G09-1294	مازن محمد عبد الحليم حافظ	مازن محمد عبد الحليم حافظ	01272001785	01281638646	ولي الأمر (مهندس سيارات)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/FbLYMYB8/1000063786.jpg	مدينه الاسكندريه شارع العطار الذي متفرع من شارع الاصدقاء	\N	t	local	\N	2026-11-19 15:34:35.259525+02	2026-11-19 15:34:35.259525+02	1294	PUBLIC	PACKAGE	01281638646	01274107870	male	31206160201393	2012-06-16	مدرسه الادريسي الحكوميه
4eadc2e5-1548-441a-a4ba-14df1ec37875	ATL-G10-1295	مريم محمد ابراهيم رمضان	مريم محمد ابراهيم رمضان	01060605257	01226667382	ولي الأمر (مهندس)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/gZ9yVYsX/Snapchat-1358339947.jpg	شارع الحي	\N	t	local	\N	2026-11-19 15:34:35.259525+02	2026-11-19 15:34:35.259525+02	1295	LANGUAGES	PACKAGE	01226667382	01023143085	female	31106260204425	2011-06-26	الشهيد محمد علي المسيري
74fc500d-0588-4a83-8bce-29e144aac605	ATL-G07-1010	احمد جمعه رجب محمد حسين	احمد جمعه رجب محمد حسين	01211880419	01203751841	ولي الأمر (معلم لغه انجليزيه)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/B24QP4D9/17935282051706594441695114782139.jpg	العجمي الهانوفيل مسجد مالك الملك متفرع من شارع الكومي	لا اريد شيء	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1010	LANGUAGES	PACKAGE	01203751841	01201393025	male	30805130112324	2008-05-13	طلائع العجمي
15e72b9e-8de9-4269-8cc4-54a5a8be2cee	ATL-G07-1011	لارا امين جمال امين	لارا امين جمال امين	01070479720	01070479720	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/QFxPJYcm/Screenshot-Gallery.jpg	مدينه الاسكندريه حي العجمي شارع الخلافاء الراشدين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1011	PUBLIC	PACKAGE	01070479720	01280822588	female	31307061302367	2013-07-06	شباب الميتقبل
77e880f3-e852-4127-857c-cf989c9291ce	ATL-G05-1012	أحمد عبد الرؤوف خيرى السيد	أحمد عبد الرؤوف خيرى السيد	01206330422	01206330422	ولي الأمر (أعمال حرة)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/fVC93x7c/1000174829.jpg	الهانوفيل شارع الرضوان	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1012	PUBLIC	PACKAGE	01206330422	01286289502	male	31604110203153	2016-04-11	مدرسة شباب المستقبل
efdf7e36-2ec0-46a2-8ae8-6d21ea5e8f3e	ATL-G07-1013	علياء محمد ابراهيم على حسن	علياء محمد ابراهيم على حسن	01214861768	01273596950	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/kV8PtFXP/bbe9e4ac-f827-4b2c-b21d-94c120d537d5-1-all-1231.jpg	العجمي الهانوفيل شارع السلام امام مدرسه الفرسان	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1013	PUBLIC	PACKAGE	01273596950	01226952210	female	31403020204066	2014-03-02	مدرسه مجدي ابن حليم
02fd4010-b3bf-4e34-96d3-2db4ab0460b5	ATL-G07-1014	علا محمد ابراهيم علي حسن	علا محمد ابراهيم علي حسن	01206903300	01273596950	ولي الأمر (اعمال حرة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/5WpJnh7H/IMG-20261001-231059-668.jpg	العجمي الهانوفيل شارع السلام امام مدرسه الفرسان	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1014	PUBLIC	PACKAGE	01273596950	01226952210	female	31403020204082	2014-03-02	مدرسة مجدي ابن حليم
ee15f065-a5ad-4cd0-a895-d961bcb91c15	ATL-G06-1015	محمد فتح الباب حمدى محمود	محمد فتح الباب حمدى محمود	01289330806	01289330806	ولي الأمر (موضف في شركة المجمعات الاستهلاكية)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/C5hBWFc2/1000074111.jpg	شارع حمدى عثمان متفرع من الخلفاء الراشدين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1015	LANGUAGES	PACKAGE	01289330806	01201243720	male	31401010203492	2014-01-01	مجمع الدخيله لغات
91e94cb0-7ed0-4c61-8c2f-c3ced41ba8a0	ATL-G05-1016	محمد وصفي عبد اللطيف	محمد وصفي عبد اللطيف	01201229931	01201229931	ولي الأمر (مهندس)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/7dSFwShC/Gemini-Generated-Image-s5k96ps5k96ps5k9.jpg	الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1016	PUBLIC	PACKAGE	01201229931	01275958933	male	31501316784646	2015-01-31	مجدي بن حليم الابتدائيه
d93c772d-12c2-4a66-8da3-3cc607630b37	ATL-G08-1017	عمر وصفي عبد اللطيف	عمر وصفي عبد اللطيف	01201229931	01201229931	ولي الأمر (مهندس)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/TqbGJq9R/Gemini-Generated-Image-duuu3rduuu3rduuu.jpg	الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1017	PUBLIC	PACKAGE	01201229931	01275958933	male	31212315650246	2012-12-31	الادريسي الاعداديه بنين
fb53621b-3445-4339-9fd0-9c982e46f558	ATL-G09-1018	احمد ابراهيم سعد عبدالجواد	احمد ابراهيم سعد عبدالجواد	01111797789	01111797789	ولي الأمر (صاحب مكتب مقاولات وتشطيبات)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/233VZnxf/17934773262081921067360755507094.jpg	العجمى الهانوفيل أمام كارفور خلف كافتيريا الأمل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1018	PUBLIC	PACKAGE	01111797789	01157567752	male	31202271804253	2012-02-27	مدرسة الشهيد بسام جابر الاعداديه بنين
cebf6dbb-65a8-47d6-9c72-ae6a42ace48a	ATL-G06-1019	جنى وليد فتوح	جنى وليد فتوح	01204180808	01204180808	ولي الأمر (اعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/m5Hpg6LP/IMG-20261031-WA0063.jpg	شارع معاذ بن جبل متفرع من شارع حسني مبارك	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1019	LANGUAGES	PACKAGE	01204180808	01212029459	female	31401280203303	2014-01-28	مدرسه طلائع العجمي الرسميه لغات
af96e9d5-1b43-4ec3-b6ae-8a868d65ddfb	ATL-G04-1020	إبراهيم محمد إبراهيم محمود	إبراهيم محمد إبراهيم محمود	01143596082	01143596082	ولي الأمر (إداري في مدرسه)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/5hX6vj8C/17934735906997585775437034335789.jpg	الإسكندرية العجمي الهانوفيل شارع خليل خيرله بجوار مسجد محمد موسي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1020	LANGUAGES	PACKAGE	01143596082	01115944276	male	31605248801112	2016-05-24	طلائع العجمي
6e180c85-c6dd-4621-b1b9-046d817079f4	ATL-G07-1021	أشرقت محمد إبراهيم محمود	أشرقت محمد إبراهيم محمود	01143096755	01143096755	ولي الأمر (إداري في مدرسه)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/1GvmCrzw/1000068331.jpg	الاسكندريه العجمي. الهانوفيل شارع خليل خيرله بجوار مسجد محمد موسي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1021	PUBLIC	PACKAGE	01143096755	01115944276	female	31405108800443	2014-05-10	أجيال الغد
08d4b75d-fe3b-4d7e-9573-b65a0650eb89	ATL-G09-1022	عبدالرحمن تامر محمد ابراهيم مصطفى	عبدالرحمن تامر محمد ابراهيم مصطفى	01283882420	01223095130	ولي الأمر (موظف)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/7JCkd9cc/57860.png	العجمي_الهانوفيل_شارع_الخلفاء_الراشدبن	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1022	LANGUAGES	PACKAGE	01223095130	01030944232	male	31203090201855	2012-03-09	دكتور حسن صبحي
ccecb146-d81c-4476-b2c0-1c42add3a532	ATL-G06-1023	ياسين ايهاب محمد عبد النبى	ياسين ايهاب محمد عبد النبى	01229917414	01229917414	ولي الأمر (فرد امن)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/VWT4Ptyg/FB-IMG-1774284569944.jpg	العجمى الهانوفيل ش 8 عمرالمختار	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1023	PUBLIC	PACKAGE	01229917414	01276735453	male	31504050202573	2015-04-05	مدرسه حفصه بنت عمر
5867f069-22df-48a5-9e81-b4c69a83de97	ATL-G07-1024	يوسف عاصم محمد يوسف	يوسف عاصم محمد يوسف	01220074993	01220074993	ولي الأمر (أعمال حرة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/sdB57QFM/117436.jpg	الاسكندرية _الهانوفيل _العجمي _اخر شارع أبو بكر _عمارة ابراهيم جمعة الدور 1	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1024	PUBLIC	PACKAGE	01220074993	01201074560	male	31404270200593	2014-04-27	مدرسة الشهيد النقيب بسام جابر الاعدادي بنين
197c2007-16ec-44c1-941a-6c5561672e10	ATL-G08-1025	إياد محمد أحمد دسوقي	إياد محمد أحمد دسوقي	01282424286	01202024214	ولي الأمر (موظف شركة حاويات الدخيلة)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/HfFnCmpv/17093.jpg	١شارع الروبي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1025	PUBLIC	PACKAGE	01202024214	01204899424	male	31306220203115	2013-06-22	الضوي١
9e5fdcb3-2693-4f15-b0aa-57c3638d7917	ATL-G08-1026	يوسف محمد علي محمد	يوسف محمد علي محمد	01208663668	01287290470	ولي الأمر (فني تركيبات)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/7dc1vPjb/file-00000000df0881f49c1d00223e1c13c0.png	الهانوفيل شارع الإسكندرية مطروح بجانب حلواني لي روا	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1026	PUBLIC	PACKAGE	01287290470	01287294574	male	31212220201614	2012-12-22	الشهيد بسام جابر الإعدادية
676c5996-904e-4a4d-a084-491788ab1b14	ATL-G11-1027	حبيبة عيد محمد احمد	حبيبة عيد محمد احمد	01273197515	01277011304	ولي الأمر (بدون عمل)	c206e817-623a-495c-9a9a-a07eb25c401e	\N	PACKAGE_BUNDLE	https://i.ibb.co/mV2ypjF9/1000049234.jpg	الإسكندرية العجمي الهانوفيل شارع الورشة	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1027	PUBLIC	PACKAGE	01277011304	01220570259	female	30910220201024	2009-10-22	مدرسة عباس حلمي
c9a90dec-a746-4f9f-b95e-2ebea27a2385	ATL-G07-1028	عمر طارق إبراهيم القرشي	عمر طارق إبراهيم القرشي	01223470967	01228898728	ولي الأمر (موظف)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/k2dv9Mw0/Snapchat-151034782.jpg	شارع الخلفاء الراشدين الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1028	PUBLIC	PACKAGE	01228898728	01225803782	male	31404080201194	2014-04-08	الشهيد بسام جابر الإعدادية
0be907e0-a23c-40c4-a2d0-e6f8ba98d8a6	ATL-G06-1029	يحيي سامح محمود عبد العزيز	يحيي سامح محمود عبد العزيز	01205573407	01002516112	ولي الأمر (مفتش بحرى)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/ffB6YP5/1000002320.jpg	العجمى الهانوفيل ش الكومى نمره 3	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1029	LANGUAGES	PACKAGE	01002516112	01556094923	male	31402180202136	2014-02-18	مدرسة التنوير
b429d388-b581-42c2-9d76-a90f0e6af54a	ATL-G06-1030	احمد وليد فتوح	احمد وليد فتوح	01221752506	01204180808	ولي الأمر (اعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/ccjCLhBH/IMG20260120235302-01.jpg	مدينه الاسكندريه حي العجمي شارع معاذ بن جبل متفرع من شارع حسني مبارك	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1030	LANGUAGES	PACKAGE	01204180808	01212029459	male	31401280203656	2014-01-28	مدرسه طلائع العجمي لغات
9870c4bf-36f6-4384-925b-e6ae2be36e03	ATL-G05-1031	نديم مصطفى محمود عبد اللطيف	نديم مصطفى محمود عبد اللطيف	01204698986	01277776266	ولي الأمر (أعمال حره)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/4w7bYfBj/1000410777.jpg	العجمي الهانوفيل امام شركه الكهرباء بجوار فتح الله	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1031	LANGUAGES	PACKAGE	01277776266	01280205528	male	31509190201293	2015-09-19	اللواء محمد نجيب التجريبية لغات
5f7a324c-160e-436a-9b05-320e0b1f0bd9	ATL-G07-1032	جودي مصطفى محمود عبد اللطيف	جودي مصطفى محمود عبد اللطيف	01277776266	01277776266	ولي الأمر (أعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/HT6ppSjs/1000410694.jpg	العجمي الهانوفيل امام شركه الكهرباء بجوار فتح الله	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1032	LANGUAGES	PACKAGE	01277776266	01280205528	female	31308050204769	2013-08-05	اللواء محمد نجيب التجريبية لغات
64f0bf7c-7f82-4c3f-b472-ecbf6a490dd3	ATL-G07-1033	يس محمد العزباوي صادق	يس محمد العزباوي صادق	01066258737	01151544496	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/xKyHmrpN/1000621843.jpg	الاسكندريه الهانوفيل شارع مدرسه النموذجيه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1033	PUBLIC	PACKAGE	01151544496	01229964432	male	31410010216577	2014-10-01	مدرسه الهانوفيل الخاصه الضوي 2
ef8bfec8-c01c-4847-9697-2a8589ec3586	ATL-G05-1034	أحمد محمد أحمد صالح	أحمد محمد أحمد صالح	01221114653	01221114653	ولي الأمر (مساعد ملاحظ لدي عز الدخيلة)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/qV8H9bt/image.jpg	الهانوفيل خلف السنترال بجوار النموذجيه بجوار مسجد العوامي أمام محل أبو عمر السوري	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1034	PUBLIC	PACKAGE	01221114653	01277259984	male	31608270203295	2016-08-27	الضو
7c593c3c-0069-42de-b302-48b0bd7f6d65	ATL-G06-1035	عمار محمد علي عبد العزيز	عمار محمد علي عبد العزيز	01270560505	01270560505	ولي الأمر (أعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/DDxwvfQF/1000186189.jpg	الخلفاء الراشدين أمام بنك مصر خلف مساكن النقل والهندسة	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1035	LANGUAGES	PACKAGE	01270560505	01025026055	male	31401300202074	2014-01-30	زيد بن حارثة لغات
d1ef5472-2f79-4fdd-9c1b-846cb2789fee	ATL-G08-1036	اسماء خالد ابراهيم محمد	اسماء خالد ابراهيم محمد	01503706910	01061211706	ولي الأمر (أعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/5x4NhYmG/Snapchat-1619654985.jpg	اسكندريه العجمي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1036	PUBLIC	PACKAGE	01061211706	01265637160	female	31309030203016	2013-09-03	مجدي ابن حليم
947408e5-f6e2-48d8-9cf4-41a807b61295	ATL-G08-1038	MAZEN helal farouk	MAZEN helal farouk	01223634490	01273486305	ولي الأمر (مهندس)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/V0XTGnSC/IMG-20260831-WA0009-1.jpg	الاسكندرية	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1038	LANGUAGES	PACKAGE	01273486305	01205894669	male	31202190200191	2012-02-19	اللواء محمد نجيب
17426ec4-d1ab-4a24-92a9-adb56ccb4855	ATL-G10-1039	مريم محمد السيد الشافعي	مريم محمد السيد الشافعي	01286445626	01107525760	ولي الأمر (محامي)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/354DfDgn/IMG-20261030-WA0051.jpg	دراسه بحري طريق اسكندريه مطروح أمام معمل الفا	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1039	PUBLIC	PACKAGE	01107525760	01285035544	female	30912140202626	2009-12-14	عباس حلمي ثانوي بنات
807adc90-7c26-40cb-9379-afa74724326d	ATL-G10-1040	سلمى عادل محمد ابراهيم	سلمى عادل محمد ابراهيم	01200064534	01019370509	ولي الأمر (أعمال حرة)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/gbscP1Fw/1000001055.jpg	الهانوفيل-مساكن اي جي كاب	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1040	PUBLIC	PACKAGE	01019370509	01013753603	female	31111180202808	2011-11-18	عباس حلمي بنات
4fa8dab2-83c8-44f4-8605-3c772838222c	ATL-G08-1041	ادم محمد محمود زيان	ادم محمد محمود زيان	01283111531	01274228154	ولي الأمر (اعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/9mRL65mw/1000107663.png	الهانوفيل شارع ابوراوية	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1041	PUBLIC	PACKAGE	01274228154	01284903981	male	31309190204315	2013-09-19	مدرسه بسام جابر
82ba5930-5a5d-4642-9026-fff8b661da1b	ATL-G08-1042	يوسف جابر سعد محمد	يوسف جابر سعد محمد	01270865981	01152854452	ولي الأمر (محامي)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/kgNBkDQV/IMG-20260713-124035.jpg	واحد و عشرين شارع نور الاسلام الدرايسه قبلي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1042	LANGUAGES	PACKAGE	01152854452	01202875660	male	31204170202077	2012-04-17	مجمع الدخيله الجديده مميز
dece0b71-0aa2-46ae-a1f4-dd4f6fb9375b	ATL-G09-1043	سلمى علي محمد مرشدي جادو	سلمى علي محمد مرشدي جادو	01273393131	01009638922	ولي الأمر (الاب /سواق)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/FqbJy99z/1000000952.jpg	الهانوفيل شارع قصر القويري	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1043	PUBLIC	PACKAGE	01009638922	01009206029	female	27310181500833	1973-10-18	مجدي ابن حليم
d7761f7a-4b0c-44a0-98aa-7878dcf13e1f	ATL-G09-1044	محمد ياسر فيصل ابراهبم	محمد ياسر فيصل ابراهبم	01002447039	01030803596	ولي الأمر (اعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/t0Y4H17/1000022859.jpg	الاسكندريه العجمي الهنوفيل شارع شارع الرضوان	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1044	PUBLIC	PACKAGE	01030803596	01007244181	male	31204221501597	2012-04-22	مدرسة حفصه
98ca4c82-6510-4c7b-8d8c-131788ea8fed	ATL-G10-1045	ريتاج أحمد مصطفى عبد الرازق	ريتاج أحمد مصطفى عبد الرازق	01285239424	01286591442	ولي الأمر (باحث اول علاقات عامة)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/LXdJ9cz6/53dd5fad-a5e2-49a5-b37a-68f2365c5893-1-all-246.jpg	العجمي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1045	LANGUAGES	PACKAGE	01286591442	01202621337	female	31109290206286	2011-09-29	اللواء محمد نجيب الرسمية لغات
115c06ce-cc8b-4c2e-a1de-4ff41bbf2981	ATL-G04-1048	ريماس طارق علي ابراهيم	ريماس طارق علي ابراهيم	01289061716	01208123885	ولي الأمر (اعمال حرة)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/S41pPmSx/IMG-20260604-WA0029.jpg	الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1048	LANGUAGES	PACKAGE	01208123885	01274579764	female	31511210203667	2015-11-21	حمزة بن عبد المطلب
716de7f9-3d39-47b3-8f11-31416141008e	ATL-G09-1050	جنى احمد فتحي محمد	جنى احمد فتحي محمد	01220271550	01283177107	ولي الأمر (رايس مكينه على المراكب)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/F4p17wQS/1000126731.jpg	الهانوفيل شارع الريتش هوم	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1050	LANGUAGES	PACKAGE	01283177107	01229183499	female	31101260200827	2011-01-26	مدرسه التنوير الرسميه لغات
077810dc-9276-4b0f-b762-113d3c1015a3	ATL-G08-1051	عمرو عيسى عبد الرازق عيسى	عمرو عيسى عبد الرازق عيسى	01150628605	01144590946	ولي الأمر (معلم اول لغه عربيه)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/JRGDr3Tn/17933597433655093434630683061394.jpg	الاسكندريه العجمي الهنوفيل الشامي	من اول5:00	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1051	LANGUAGES	PACKAGE	01144590946	01222265736	male	27001202602698	1970-01-20	اللؤ محمد نجيب الهانوفيل
d4fd811c-8532-40c3-9baf-1e6074c0d26a	ATL-G07-1049	ريتاج محمد السيد أحمد	ريتاج محمد السيد أحمد	01206877702	01206877702	ولي الأمر (مدير شؤون عاملين بالسكه الحديد)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/yFW8GW49/image.jpg	الإسكندرية الهانوفيل شارع الخلفاء الراشدين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1049	LANGUAGES	PACKAGE	01206877702	01286852261	male	31302150202323	2013-02-15	التنوير الرسميه لغات
5b4b2699-4d97-4bcc-9cb0-fecdd690228f	ATL-G02-1052	ادم احمد السيد خليل	ادم احمد السيد خليل	01276419788	01276419788	ولي الأمر (اعمال حره)	80738b37-47bd-4ced-9ef9-805c6c6dc06c	\N	PACKAGE_BUNDLE	https://i.ibb.co/nMbr4zdc/1000257257.png	مدينه الاسكندريه حي العجمي الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1052	PUBLIC	PACKAGE	01276419788	01270664641	male	31212010204599	2012-12-01	مدرسه الشهيد بسام جابر
60cee8ff-be48-4e20-b1c4-7c939594b81d	ATL-G01-1053	اياد احمد السيد خليل	اياد احمد السيد خليل	01276463237	01276463237	ولي الأمر (اعمال حره)	911c3cb2-c7f1-4a04-8ad7-82d62096a205	\N	PACKAGE_BUNDLE	https://i.ibb.co/d0XbDfcX/1000257256.png	مدينه الاسكندريه حي العجمي الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1053	PUBLIC	PACKAGE	01276463237	01270664641	male	31408080203893	2014-08-08	مدرسه الشهيد بسام جابر
1559f69a-9f27-405f-a863-8d12c4cd5c1e	ATL-G06-1054	نور احمد فتحي احمد	نور احمد فتحي احمد	01279718230	01280226728	ولي الأمر (اعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/N69QJ2VN/1000130397.jpg	ش ابو الشوارب من مسجد الرضوان هانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1054	PUBLIC	PACKAGE	01280226728	01228560467	female	31406260203708	2014-06-26	مدرسه شباب المستقبل ص
638e536e-a4f2-487b-a33d-4b121e1df18a	ATL-G04-1055	سيليا اشرف اسماعيل صبحي	سيليا اشرف اسماعيل صبحي	01228096553	01228096553	ولي الأمر (محامي)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/Xry33DrW/IMG.jpg	متفرع من شارع الكومي خلف مدرسة الضوي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1055	LANGUAGES	PACKAGE	01228096553	01228096841	female	31605110201467	2016-05-11	خديجه بنت خويلد
faa242f3-2656-4c62-ad17-da49d46b15d7	ATL-G08-1056	ادم محمود نبوي السيد	ادم محمود نبوي السيد	01208797930	01228806310	ولي الأمر (اعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/xtc8Rhfp/17933444775546610657331926778781.jpg	الاسكندريه العجمي ك21 الهانوفيل شارع الشامي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1056	LANGUAGES	PACKAGE	01228806310	01274204385	male	31205270202135	2012-05-27	اللواء محمد نجيب
1419c351-40a4-41ea-9c41-f3cec1b733be	ATL-G09-1057	محمود عماد سعيد محمد	محمود عماد سعيد محمد	01288269213	01233381265	ولي الأمر (اعماال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/zhv269wt/IMG20261029190556.jpg	محافظة اسكندريه العجمي الهانوفيل شارع اسيد	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1057	PUBLIC	PACKAGE	01233381265	01210000288	male	31201250203512	2012-01-25	مدرسة الشهيد بسام جابر الاعداديه بنين
3d016605-52d5-486f-973e-6fee0fcc874e	ATL-G07-1058	مخمد احمد مصطفى محمد	مخمد احمد مصطفى محمد	01007916290	01002548456	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/FqfJ0hmz/17933113472289103393955605480618.jpg	الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1058	LANGUAGES	PACKAGE	01002548456	01009986573	male	31211060203813	2012-11-06	اللواء محمد نجيب
2130e580-93c7-4426-89b1-e1c28c1b3b4d	ATL-G09-1059	ادم احمد مصطفى محمد	ادم احمد مصطفى محمد	01020152243	01002548456	ولي الأمر (اعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/0jMCJxdN/17933110845352469753876535556246.jpg	الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1059	LANGUAGES	PACKAGE	01002548456	01009986573	male	31104060202476	2011-04-06	اللواء محمد نجيب
3658f3e4-45ca-4319-ad22-ccd3c3fc96d3	ATL-G07-1060	رقية عبد الرؤوف خيرى السيد	رقية عبد الرؤوف خيرى السيد	01276689065	01206330422	ولي الأمر (أعمال حرة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/Myg6wgqd/1000173509.jpg	الهانوفيل شارع الرضوان	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1060	PUBLIC	PACKAGE	01206330422	01286289502	female	31407030202423	2014-07-03	شباب المستقبل
690b57bb-8b7f-45a0-af87-6b7e8a081653	ATL-G10-1061	ملك محمد سيد مكي	ملك محمد سيد مكي	01041845067	01206307678	ولي الأمر (اعمال حرة)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/Lhhhcqg1/IMG-20261030-WA0005.jpg	الهانوفيل شارع الخلفاء الراشدين	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1061	PUBLIC	PACKAGE	01206307678	01204430893	female	30808300202669	2008-08-30	سميره موسي
00a67f49-bb9a-4cb1-8fbd-c2e9a3a1ca8b	ATL-G10-1062	نورا درويش علي درويش	نورا درويش علي درويش	01225102719	01281871916	ولي الأمر (أعمال حره)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/sTyWR9n/17933044214813389617403302635451.jpg	الاسكندريه العجمي امام مدرسه شباب المستقبل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1062	PUBLIC	PACKAGE	01281871916	01276570714	female	31012230201265	2010-12-23	مدرسة سميره موسي بنات ثانوي
9c0ad8fa-992f-4012-8896-618413e6c56b	ATL-G10-1063	آدم وصفي عبد اللطيف	آدم وصفي عبد اللطيف	01029681866	01201229931	ولي الأمر (مهندس)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/Jj83dvhB/Screenshot-Gallery.jpg	الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1063	PUBLIC	PACKAGE	01201229931	01275958933	male	31012062002028	2010-12-06	عباس حلمي بنين
5687c0a3-70f7-42ce-9774-db208c9c90d5	ATL-G05-1064	عمرو الطيب مصطفي يوسف	عمرو الطيب مصطفي يوسف	01022556683	01022556683	ولي الأمر (موظف في شركه بترول)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/r2BPCPyQ/22281.jpg	الهانوفيل دوران كلاسيك عماره ابو هنديه دريم اول عماره في شارع معهد فاروس	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1064	PUBLIC	PACKAGE	01022556683	01000567296	male	31412010205659	2014-12-01	مدرسه الفرسان الخاصه
f794dc3a-e6f0-45b8-ac40-2620fe64b717	ATL-G08-1065	بولا إسحاق إبراهيم سليمان	بولا إسحاق إبراهيم سليمان	01283832620	01283832620	ولي الأمر (أعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/RGmFYBsp/IMG-20261029-WA3788.jpg	العجمي هانوفيل شارع جمعه مفتاح	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1065	PUBLIC	PACKAGE	01283832620	01205733214	male	31210220203215	2012-10-22	الشهيد بسام جابر
5e232731-8fcf-483b-80c7-d5b3f97e6c89	ATL-G07-1066	محمد السيد محمد	محمد السيد محمد	01550433760	01271992266	ولي الأمر (رئيس حسابات)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/5h2JCq5N/2850.jpg	الاسكندرية العجمي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1066	LANGUAGES	PACKAGE	01271992266	01222337403	male	31309230203872	2013-09-23	مدرسة محمد نجيب الرسمية لغات
fac50933-725b-4fc4-9b91-7ef3d7d90488	ATL-G07-1067	منار محمد أحمد محمد عبد الرحمن	منار محمد أحمد محمد عبد الرحمن	01116953881	01556376668	ولي الأمر (مدير انتاج)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/Rp6bMYB6/103407.jpg	العجمى_الهانوفيل_١٦ ش الخلفاء الراشدين	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1067	LANGUAGES	PACKAGE	01556376668	01203423960	female	31309260201408	2013-09-26	مدرسة خديجة بنت خويلد الرسمية لغات
5d8117e3-5185-4cbe-8e75-7bf363376a72	ATL-G07-1068	عائشة وليد محمد عبدالرشيد	عائشة وليد محمد عبدالرشيد	01032957374	01012262824	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/bgskdWKJ/1000302925.jpg	الهانوفيل ابو شوارب	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1068	PUBLIC	PACKAGE	01012262824	01093371318	female	31312291801269	2013-12-29	الشهيد بسام جابر
87270328-3b18-4946-a076-eca86366813a	ATL-G05-1069	إبراهيم محمد عادل محمد	إبراهيم محمد عادل محمد	01275800815	01203079931	ولي الأمر (خياط)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/RTNyP0Z3/5186.jpg	العجمى الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1069	LANGUAGES	PACKAGE	01203079931	01039734577	male	31504090202037	2015-04-09	مجمع الدخيله التجريبي المتميز
a80c650b-2493-4a6c-93b8-e5fd2baab44a	ATL-G06-1070	يوسف محمد حسني عبد الباقي	يوسف محمد حسني عبد الباقي	01029861148	01029861148	ولي الأمر (العامريه بترول)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/QvMqrB06/1793283622335568635383704903473.jpg	نهايه الفردي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1070	PUBLIC	PACKAGE	01029861148	01024246333	male	31506250204638	2015-06-25	مدرسه اعمار الخاصه
e6b0f519-86de-45fc-b57c-8c6492b89bad	ATL-G04-1071	نور محمد حسني عبد الباقي	نور محمد حسني عبد الباقي	01029861148	01029861148	ولي الأمر (عامريه البترول)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/DPzcq3pw/49996.jpg	نهايه الفردي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1071	PUBLIC	PACKAGE	01029861148	01024246333	female	28002081700255	1980-02-08	مدرسه الاوائل الخاصه
fe5ac086-ea70-4e12-8c47-818e00fd2676	ATL-G07-1072	جني اسماعيل جابر السيد	جني اسماعيل جابر السيد	01280905637	01280905637	ولي الأمر (اعمال حرة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/HT9dydbp/IMG-20261029-WA0410.jpg	اسكندريه العجمي شارع الكومي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1072	PUBLIC	PACKAGE	01280905637	01208453447	female	30810010204522	2008-10-01	مدرسة النور الخاصه
e1635b00-a838-4099-b3b3-9b7ad65db7a9	ATL-G05-1073	فارس محمد صبحي محمد	فارس محمد صبحي محمد	01203332617	01224626565	ولي الأمر (موظف في شركة بتروجيت)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/yFW9KRqn/1000342673.jpg	ش خليل خير الله الهانوفيل الاسكندرية	ميس دنيا عيد عربي /ميس الاء علاء انجليزي /مستر حازم عطية علوم	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1073	PUBLIC	PACKAGE	01224626565	01203332629	male	31509070201273	2015-09-07	مدرسة الفيروز الخاصة
21ef9019-d3ed-463f-ac3c-ed2bbd9ef56f	ATL-G06-1074	حمزه هشام صابر	حمزه هشام صابر	01277377050	01277377050	ولي الأمر (بائع في محل)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/Ps1dwMrf/IMG-20261029-WA0021.jpg	أمام مساكن طلعت مصطفى العجمي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1074	PUBLIC	PACKAGE	01277377050	01283249116	male	31502180202394	2015-02-18	موسي بن نصير
47fc78b0-e90d-4a34-925d-1b709f5ff466	ATL-G09-1075	كريمة جابر احمد عرابي	كريمة جابر احمد عرابي	01095194852	01067562267	ولي الأمر (اعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/391DLk46/Snapchat-1882345669.jpg	الهانوفيل شارع ابو الشوارب صوبر ماركت نور السلام	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1075	PUBLIC	PACKAGE	01067562267	01014809804	female	31207230201562	2012-07-23	الشهيد النقيب بسام جابر
b207e9f8-5ceb-495a-84d1-608d33de2c1e	ATL-G09-1076	مريم عبدالله على الشريف	مريم عبدالله على الشريف	01017633654	01008147104	ولي الأمر (اعمال خره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/XZJ4GVcB/384.jpg	الهانوفيل قصر القويري شارع الأصدقاء	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1076	PUBLIC	PACKAGE	01008147104	01091473440	female	31112011805087	2011-12-01	شباب المستقبل
c4451f69-e118-49de-bdf5-1d8a619f0af9	ATL-G07-1077	شدوى عماد صلاح الفخراني	شدوى عماد صلاح الفخراني	01000634020	01000634020	ولي الأمر (سائق)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/HMPhd1q/IMG20261027232210.jpg	الهانوفيل شارع خليل خير الله	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1077	PUBLIC	PACKAGE	01000634020	01098837053	female	31311211803626	2013-11-21	الشهيد بسام جابر
eda06a0e-a389-46ef-93a6-dde2ec61f07b	ATL-G05-1078	ياسين سامح ناجي علي	ياسين سامح ناجي علي	01222256165	01222256165	ولي الأمر (قوات مسلحه)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/FkTjZDsM/IMG.jpg	العجمي الهانوفيل شارع الخلفاء الراشدين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1078	PUBLIC	PACKAGE	01222256165	01221424607	male	31609160201498	2016-09-16	الفتوح الاسلاميه
7852a56b-840b-4cba-9207-56b645c1cb5b	ATL-G05-1079	محمد تامر محمد ابراهيم	محمد تامر محمد ابراهيم	01280322915	01223095130	ولي الأمر (موظف)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/99mvLyTv/IMG20261029140158.jpg	اسكندريه _الهانوفيل_شارع الخلفاء الراشدين	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1079	LANGUAGES	PACKAGE	01223095130	01030944232	male	31411060205211	2014-11-06	اللواء محمد نجيب
c8432337-211d-4d0d-9df5-9af34095a5fb	ATL-G06-1080	همس سامح ناجي علي	همس سامح ناجي علي	01222256165	01222256165	ولي الأمر (قوات مسلحه)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/DfQJ8Lk4/IMG.jpg	العجمي الهانوفيل شارع الخلفاء الراشدين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1080	PUBLIC	PACKAGE	01222256165	01221424607	female	31508180203267	2015-08-18	الفتوح الاسلاميه
7692d8fa-dce8-4b7f-b3ef-9e2e860cd8a6	ATL-G05-1081	عبدااله عمر الفاروق حناوي عبدالحليم ابو النجه	عبدااله عمر الفاروق حناوي عبدالحليم ابو النجه	01035699363	01014499393	ولي الأمر (اعمال اخرى)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/LdCg4Zqy/17932712066015552166975450666835.jpg	ش الهانوفيل الرئيسي الهانوفيل الاسكندرية	..	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1081	LANGUAGES	PACKAGE	01014499393	01006851947	male	31504150202791	2015-04-15	طلائع العجمي
61d89f0d-bef9-4f48-98aa-24c207913fc1	ATL-G07-1082	سيف محمود أدهم	سيف محمود أدهم	01224183963	01223887736	ولي الأمر (اعمال حرة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/PGfH8w9K/1000379309.jpg	5 شارع رضوان	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1082	LANGUAGES	PACKAGE	01223887736	01226761996	male	31305260203359	2013-05-26	طلائع العجمي الرسميه لغات
7b7ba8d9-161a-4a3d-ad6e-03ebf15c89cb	ATL-G07-1083	علي تامر علي عبده	علي تامر علي عبده	01122934544	01227374573	ولي الأمر (ميكانيكي)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/WWHjY9v9/1000111694.jpg	مدينه اسكندريه-العجمي في شارع ابو زيد	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1083	PUBLIC	PACKAGE	01227374573	01202172992	male	31407130201351	2014-07-13	بسام جابر
a8fd1b73-c636-4b3f-a3fc-09e306069c2e	ATL-G08-1084	ياسين محمد اسناعيل محمد	ياسين محمد اسناعيل محمد	01223290649	01210179795	ولي الأمر (فني شركه فواز الكويتيه)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/G4Gzj7BP/1000033502.jpg	هانوفيل شارع قصر القويري	محمد صلاح ومستر محمود طارق	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1084	LANGUAGES	PACKAGE	01210179795	01287675267	male	31111270201274	2011-11-27	مجمع الدخيله
552f41dc-805b-4a3d-b495-54898fdee32d	ATL-G07-1085	احمد رضا سليمان المسلماني	احمد رضا سليمان المسلماني	01211102428	01211102428	ولي الأمر (أمين شرطة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/N6mJVssB/96260.jpg	الهانوفيل مساكن طلعت مصطفى	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1085	LANGUAGES	PACKAGE	01211102428	01211101688	male	31309270203077	2013-09-27	اجيال الغد الرسميه لغات
42cf6108-2398-4fc6-aba3-01fe02ec0d21	ATL-G04-1086	جويرية السيد حامد عبد النبى	جويرية السيد حامد عبد النبى	01507247355	01208359357	ولي الأمر (أعمال حرة)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/RG64vJJV/1000033882.jpg	الهانوفيل امام مستشفى عبد المنعم جابر	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1086	LANGUAGES	PACKAGE	01208359357	01273103430	female	31604050200141	2016-04-05	زيد بن حارثة
0a40ca9c-aec4-4589-a89b-d52793039159	ATL-G05-1087	مالك السيد حامد عبد النبى	مالك السيد حامد عبد النبى	01507247774	01273103430	ولي الأمر (اعمال حرة)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/WNvQLnG5/1000137763.jpg	الهانوفيل امام مستشفى عبد المنعم جابر	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1087	LANGUAGES	PACKAGE	01273103430	01208359357	male	31412170201155	2014-12-17	مجمع الدخيلة الجديد
0314449e-3bf3-4748-aeb0-9276abcb54bb	ATL-G08-1088	انس محمد عبده عثمان	انس محمد عبده عثمان	01270547193	01270545855	ولي الأمر (اعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/HfCTLRmR/1000145850.jpg	72شارع الكومي الهانوفيل الاسكندريه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1088	LANGUAGES	PACKAGE	01270545855	01068347651	male	31208270400211	2012-08-27	أجيال الغد الرسمية لغات
a26e30dd-61ad-4b1b-976e-ed315948e765	ATL-G10-1089	محمود ابراهيم محمود	محمود ابراهيم محمود	01037918797	01037918797	ولي الأمر (محام)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/x8CWvBj3/17932419787037418021079459081246.jpg	العجمى الهانوفيل شارع محمد موسى	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1089	PUBLIC	PACKAGE	01037918797	01211561872	male	31007181501653	2010-07-18	مدرسة حسان بن ثابت
1b2146d9-4758-449f-989b-74a4f15a344a	ATL-G09-1090	منه الله أشرف حلمي	منه الله أشرف حلمي	01207197963	01280305213	ولي الأمر (اعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/jvwfQb2f/32680.jpg	العجمي البيطاش	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1090	LANGUAGES	PACKAGE	01280305213	01224352700	female	31107120203964	2011-07-12	خديجه بنت خويلد
a81d2a43-1da1-4a38-b396-632106f040a5	ATL-G08-1091	فارس ثابت ابراهيم مصطفي	فارس ثابت ابراهيم مصطفي	01147671148	01021329142	ولي الأمر (صف ضابط بالقوات المسلحه)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/G30BysqB/1000255783.jpg	الاسكندريه-الهانوفيل- شارع الجمعيه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1091	PUBLIC	PACKAGE	01021329142	01011892607	male	31308011810872	2013-08-01	مدرسه التنوير الاعداديه
c8e60f96-b494-4026-bd18-a16290e1a03d	ATL-G08-1092	جنه احمد ماهر فتحي صديق	جنه احمد ماهر فتحي صديق	01200819164	01033733353	ولي الأمر (أعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/nNFQTtmC/image.jpg	ابو يوسف أمام مشويات ابو حجاج	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1092	LANGUAGES	PACKAGE	01033733353	01220669471	female	31202040201904	2012-02-04	اجيال الغد الرسميه اللغات
744d88e0-463d-4062-8e2c-88a6ef6d6726	ATL-G07-1093	Hassan Aly Hassan mansoure	Hassan Aly Hassan mansoure	01007227357	01007227357	ولي الأمر (ليسانس حقوق)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/Ts4C0x8/17932257649491985733366149830211.jpg	الهانوفيل شارع ابو زيد	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1093	LANGUAGES	PACKAGE	01007227357	01201561530	male	31308200202638	2013-08-20	طلائع العجمي
955c9eba-3ea5-41dc-991e-59145a7aa7a0	ATL-G08-1094	يوسف شوقي لطفي محمد	يوسف شوقي لطفي محمد	01003149609	01007548906	ولي الأمر (معاش)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/C34K5rM0/17932226965872424040399818159517.jpg	الهانوفيل خلف مسجد محمد موسي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1094	LANGUAGES	PACKAGE	01007548906	01064651084	male	25408090200457	1954-08-09	مدرسه حمذه بن عبد المطلب
eb56a061-e02a-4b4f-b3c6-216695a22777	ATL-G06-1095	ساندي جابر محمد محمود	ساندي جابر محمد محمود	01287857615	01287857615	ولي الأمر (متوفي)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/d01HVML5/IMG.jpg	هانوفيل شرع بنك مصر	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1095	PUBLIC	PACKAGE	01287857615	01208342323	female	31504260202428	2015-04-26	مدرسه الدخيله المشتركه
f5894eb0-8894-473a-9c64-5b0deb786458	ATL-G06-1096	سما محمود احمد عبدالنعيم	سما محمود احمد عبدالنعيم	01272595166	01272595166	ولي الأمر (اعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/Q706RYYJ/17932167356605818895207133352883.jpg	الاسكندريه شارع محمد موسى	ميس دنيا و مستر احمد و مستر محمود و مستر ادهم [طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1096	PUBLIC	PACKAGE	01272595166	01280707373	female	30805120101234	2008-05-12	ميس دنيا و مستر محمود و مستر ادهم و مستر احمد
1b8fc43d-8e15-47d2-9dfa-f5c276722d76	ATL-G09-1098	فاطمة عاطف محمد	فاطمة عاطف محمد	01119475616	01119475616	ولي الأمر (لا يوجد عمل الان)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/KcgcBtzk/IMG-20261028-WA9871.jpg	السكندرية حي العجمي شارع الشيوخ	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1098	PUBLIC	PACKAGE	01119475616	01149285528	female	31203270203244	2012-03-27	مجدي محمود بن حليم
d949bb37-299c-49d7-91d0-bfff8d14cba6	ATL-G06-1099	جونير فادى شهدى ايوب	جونير فادى شهدى ايوب	01554901914	01225676300	ولي الأمر (امين مخزن)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/R47yKX35/1000054432.jpg	الهانوفيل/شارع متفرع من جابر حافظ بجوار صيدليه مينا سابقآ	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1099	LANGUAGES	PACKAGE	01225676300	01550803326	female	31310190202884	2013-10-19	مدرسه اللواء محمد نجيب
16597a0e-b536-4225-bf1b-e1c5860f5a80	ATL-G07-1100	بسمله حافظ عبد الحليم محمد	بسمله حافظ عبد الحليم محمد	01207850920	01282155546	ولي الأمر (موظف في العمريه)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/Q3rjzkcF/17932104056676634982750819638658.jpg	اسكندرية/العجمي/هنوفيل/شارع الكومي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1100	PUBLIC	PACKAGE	01282155546	01282155537	female	27704190200913	1977-04-19	مدرسه الضوي ١الخاصه هنوفيل
51161fde-fa95-4117-9698-9e67cef8fdc0	ATL-G07-1101	مازن اشرف عبد الستار محمد	مازن اشرف عبد الستار محمد	01220503556	01220503556	ولي الأمر (أعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/1WSWGVN/1000301203.jpg	العجمي الهانوفيل شارع مسجد محمد موسى	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1101	PUBLIC	PACKAGE	01220503556	01221249935	male	31312220202194	2013-12-22	مدرسة الشهيد بسام جابر
ab79fe8e-5fe3-4bdf-918d-189669f90d5f	ATL-G04-1102	حمزة أحمد محمد مصطفى	حمزة أحمد محمد مصطفى	01145509210	01228107993	ولي الأمر (أعمال حرة)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/jvnz84Zf/814.jpg	مدينة الإسكندرية العجمي الهانوفيل جابر حافظ	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1102	LANGUAGES	PACKAGE	01228107993	01279564240	male	31511210203535	2015-11-21	اللواء محمد نجيب
8ce50825-bd1e-4df2-8ca9-84ba29dd7dfa	ATL-G07-1103	ملك محمود محمد عبد العزيز	ملك محمود محمد عبد العزيز	01205971299	01205971299	ولي الأمر (أعمال حرة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/23PP2ygw/17931933328345106597364717458683.jpg	مدينه الاسكندريه /حاى العجمي/شارع الإسراء	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1103	PUBLIC	PACKAGE	01205971299	01227004049	female	29001012630447	1990-01-01	مجدي إبن حليم
fe95c7cb-77f2-47bd-b1a1-7381d05e088d	ATL-G08-1104	كنزي محمد حسن محمد	كنزي محمد حسن محمد	01274363231	01224223026	ولي الأمر (مهندس)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/CK5w0Zgp/Snapchat-1210365661.jpg	الإسكندرية _الهنوفيل _شارع مسجد الانوار	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1104	PUBLIC	PACKAGE	01224223026	01276309511	female	31301030203141	2013-01-03	وادي الملوك
d711f587-75b0-4713-a9d4-6497465667c5	ATL-G08-1105	ياسين خميس محمد حسن	ياسين خميس محمد حسن	01282101341	01204057141	ولي الأمر (طبيب)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/7tNJcwzQ/1793205144513.jpg	العجمى الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1105	PUBLIC	PACKAGE	01204057141	01069760796	male	31204280202121	2012-04-28	حفصة
41be2d07-08f4-4e81-abaa-4e808fb34e56	ATL-G04-1106	تيم احمد حسين	تيم احمد حسين	01222671274	01222671274	ولي الأمر (مدير فرع)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/sdj5Ggwn/IMG-20260920-004015.jpg	ابو يوسف الروضه الخضراء	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1106	LANGUAGES	PACKAGE	01222671274	01228443607	male	31602200201351	2016-02-20	مدرسة طلائع العجمي الرسميه للغات
73d78b38-6c28-41e5-b618-e40a71bcc6fa	ATL-G06-1107	هيا احمد محمد احمد	هيا احمد محمد احمد	01276771324	01222985380	ولي الأمر (معلم)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/7tm01PPY/17932003556714569046439158291927.jpg	الهانوفيل شارع الهانوفيل 2000 رابع شارع شمال عماره رقم سته	مستر مروان عربي ميس ألاء انجليزي	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1107	LANGUAGES	PACKAGE	01222985380	01205087374	female	31402150202549	2014-02-15	جديجه بنت خويلد الرسميه لغات بنات فقط
4e10b616-1efd-4c31-a4b9-8962cd364852	ATL-G04-1108	احمد مهدي عباس الفولي	احمد مهدي عباس الفولي	01208665781	01220272229	ولي الأمر (أعمال حره)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/JRLQ2KX3/IMG-20260809-161050-304.jpg	ش عمر المختار بجوار مسجد ملك الملك	لا	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1108	PUBLIC	PACKAGE	01220272229	01273137352	male	31703030202596	2017-03-03	مدرسه زهره الاوائل الخاصة
f8cc1b9d-9422-4da2-9a29-1feb97ceb951	ATL-G07-1109	يوسف حسين محمد موسى	يوسف حسين محمد موسى	01276233189	01005818410	ولي الأمر (أعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/ksKwvtrq/IMG-20261028-WA0056.jpg	العجمى الهانوفيل امام المدرسه النموذجيه برج الصابرين	انتظام مواعيد المعهد وتوفير قاعات للمدرسين	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1109	LANGUAGES	PACKAGE	01005818410	01220214880	male	31411240201451	2014-11-24	مجمع الدخيله الجديده
9e6fa36c-c173-4573-a826-449ee61aafbf	ATL-G08-1110	ياسين حسن فتح الله حسن عبد العاطي	ياسين حسن فتح الله حسن عبد العاطي	01067637334	01067637334	ولي الأمر (أعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/mV5YVyWY/1793193431208190686577819121557.jpg	ابو يوسف شارع عبير الزهور بعد دار الفاروق	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1110	LANGUAGES	PACKAGE	01067637334	01208156125	male	31205060202159	2012-05-06	طلائع العجمي الرسميه لغات
4270b259-e1c5-47d1-b829-f33b4b7d1565	ATL-G04-1111	محمد احمد ابراهيم حسين	محمد احمد ابراهيم حسين	01284495852	01284495852	ولي الأمر (أعمال حرة)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/dsrJDwrB/1000123610.jpg	الهنوفيل	اي موعد [طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1111	PUBLIC	PACKAGE	01284495852	01271102301	male	31611220201594	2016-11-22	الفتوح الإسلامية
cf23d138-f27a-4c75-b59a-ee180d0a14b8	ATL-G08-1112	فرحه احمد ابراهيم حسين	فرحه احمد ابراهيم حسين	01271102301	01284495852	ولي الأمر (جزار)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/bjSP4HNT/1000122522.jpg	الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1112	PUBLIC	PACKAGE	01284495852	01228915753	female	31308260201142	2013-08-26	مجدي ابن حليم
c55bb2fc-4e77-4bbe-8be5-583e5934e9ab	ATL-G04-1113	حمزه اسلام محمد عبد النبى	حمزه اسلام محمد عبد النبى	01223297933	01223297933	ولي الأمر (فنى تشغيل فى شركه لورد)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/ycv8g4RR/1000340862.png	8ش عمر المختار الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1113	LANGUAGES	PACKAGE	01223297933	01225995696	male	31510100202375	2015-10-10	اللواء محمد نجيب الرسميه لغات
f5ec8266-7a79-48e1-b095-2f7cf1827403	ATL-G08-1114	عمر مصطفى كمال مصطفى	عمر مصطفى كمال مصطفى	01064807509	01002704037	ولي الأمر (موظف)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/271Ywx04/17931899921696239550193147814666.jpg	الاسكندريه الهانوفيل شارع مسجد محمد موسى	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1114	PUBLIC	PACKAGE	01002704037	01061168990	male	31304251502053	2013-04-25	مدرسه الهانوفيل الخاصه الضوي 1
2d359976-33aa-45b0-aaca-9cb335726508	ATL-G05-1115	علا مصطفى كمال مصطفى	علا مصطفى كمال مصطفى	01002704037	01002704037	ولي الأمر (موظف)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/LdPLWMSs/17931892877032372295373111313176.jpg	الإسكندرية الهانوفيل شارع محمد موسى	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1115	PUBLIC	PACKAGE	01002704037	01061168990	female	31603301500747	2016-03-30	مدرسه الهانوفيل الخاصه الضوي ١
c3591bd0-4fed-4653-83c9-44fdb9530620	ATL-G06-1116	صهيب محمد إدريس عبدالله	صهيب محمد إدريس عبدالله	01037437529	01128527772	ولي الأمر (محاسب)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/RpPgrtRQ/1000004042.png	العجمي الهانفيل. شارع مكه.	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1116	PUBLIC	PACKAGE	01128527772	01099807918	male	31502030201837	2015-02-03	إعمار الخاصه
10a2205e-4981-4ec9-8e01-55bcec96db9c	ATL-G10-1117	رقيه محمد سلامه محمد	رقيه محمد سلامه محمد	01286190094	01211888660	ولي الأمر (مشرف)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/Vc4CWrVt/Screenshot-20261028-142307.png	العجمي البيطاش شارع فضه رقم عشره	ياريت يبقي جمعه و سبت اجازه	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1117	LANGUAGES	PACKAGE	01211888660	01227330107	female	31109030202422	2011-09-03	مجمع الدخيله مميز لغات
e3d78ca2-37f8-4047-9076-35d73459f19e	ATL-G05-1118	مالك حافظ رضا	مالك حافظ رضا	01275028588	01122840848	ولي الأمر (اعمال حره)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/N25gH2Wk/1000515967.jpg	خلف المدرسه النموذجيه العجمي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1118	PUBLIC	PACKAGE	01122840848	01280028144	male	31605150203217	2016-05-15	الفتوح الإسلامية
9512b368-3018-44c3-9898-fce6621a693c	ATL-G10-1119	رقية سمير عمر الفاروق محمود	رقية سمير عمر الفاروق محمود	01208067656	01000671690	ولي الأمر (محاسب)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/21J3DmwM/1000251484.jpg	العجمي الهانوفيل شارع ورشه البلاط	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1119	PUBLIC	PACKAGE	01000671690	01207529769	female	31104280201748	2011-04-28	مدرسه العجمي الثانويه للبنات
86745e0f-e627-409d-9fa3-658e375fceed	ATL-G07-1120	يوسف عمرو على مرسي	يوسف عمرو على مرسي	01282144704	01090440450	ولي الأمر (موظف في شركة الكهرباء)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/gL5b154p/image.jpg	الإسكندرية مطروح بجوار حلواني كلاسيك	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1120	LANGUAGES	PACKAGE	01090440450	01200519152	male	31305150203574	2013-05-15	اللؤاء محمد نجيب
c5b6db22-3bdf-4513-9328-345defce4075	ATL-G05-1121	احمد حسن محمد حسين	احمد حسن محمد حسين	01289106199	01289106199	ولي الأمر (موظف)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/gbzbBK02/1016.jpg	اسكندريه /العجمي/الهانوفيل شارع السلام	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1121	PUBLIC	PACKAGE	01289106199	01204013503	male	31602200202897	2016-02-20	شباب المستقبل
6dfa270d-ab15-4a2f-bfd5-549e53446b98	ATL-G06-1122	عمر أحمد محمد هنداوى	عمر أحمد محمد هنداوى	01274604869	01274604869	ولي الأمر (أعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/7dxv97MJ/1000158749.jpg	الهانوفيل شارع منجد من شارع السلام	احنا فى الشتاء ياريت المواعيد متتاخرش لأنهم بيتاخرو فى الليل [طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1122	PUBLIC	PACKAGE	01274604869	01282213050	male	31509251501694	2015-09-25	مدرسه الفتوح الإسلامية
527ab4d1-0263-46dc-8c15-6fcaf18082ed	ATL-G07-1123	مراد يوسف فتح الله ادريس	مراد يوسف فتح الله ادريس	01207441610	01274264122	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/fYJRvb2m/17931832171176485215762480761845.jpg	العجمي ابو يوسف شارع الشامي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1123	PUBLIC	PACKAGE	01274264122	01205631740	male	31405180203093	2014-05-18	الشهيد بسام جابر
6bafe049-69bb-4f5e-a2a7-6c3a50b85b35	ATL-G06-1125	ياسمين عمرو علي مرسي	ياسمين عمرو علي مرسي	01111972455	01111972455	ولي الأمر (موظف في شركه الكهرباء)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/wNWGF9n9/Snapchat-95253068.jpg	شارع اسكندريه مطروح بجوار حلواني كلاسيك	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1125	LANGUAGES	PACKAGE	01111972455	01200519152	female	31409250201188	2014-09-25	اللؤاء محمد نجيب
4b4efa81-df41-464f-a77c-6190bc942cc1	ATL-G08-1126	فتحى احمد محمد هنداوى	فتحى احمد محمد هنداوى	01274604869	01274604869	ولي الأمر (أعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/4RNkjnJf/1000158748.jpg	الهانوفيل شارع منجد متفرع من ش السلام	احنا فى الشتا ياريت المواعيد متبقاش متاخره [طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1126	PUBLIC	PACKAGE	01274604869	01282213050	male	31211161500053	2012-11-16	الإدريسي
b58452b2-4a67-471c-927d-7f1a519fedfa	ATL-G06-1127	روزان وليد مصطفي كامل	روزان وليد مصطفي كامل	01205676806	01205676506	ولي الأمر (موظف ش ايكندريه لتداول الحوويات)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/FqB1Dygc/69360.jpg	ش الامراء خلف مطعم الصالحين من الكومي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1127	PUBLIC	PACKAGE	01205676506	01220209054	female	31506290200805	2015-06-29	سعد بن ابي وقاص
66c50218-bed6-4b28-a477-5789a0b32c7f	ATL-G06-1128	سيف محمد ابراهيم محمد	سيف محمد ابراهيم محمد	01289142424	01289142424	ولي الأمر (لحام كهرباء)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/8nDz31qJ/IMG-20261028-WA0001.jpg	الهانوفيل شارع ابو هنديه	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1128	PUBLIC	PACKAGE	01289142424	01556055179	male	31411080202871	2014-11-08	مدرسه الفتوح الإسلامية
517326b1-a102-46da-b613-e86f9dad75ec	ATL-G05-1129	أسر أحمد سمير مصيلحي	أسر أحمد سمير مصيلحي	01222649165	01222649165	ولي الأمر (محاسب)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/v6LN0gJX/IMG.jpg	23 شارع عطالله العوامي برج الأصدقاء بجوار ماركت الهدى	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1129	PUBLIC	PACKAGE	01222649165	01111257366	male	31508270203878	2015-08-27	أسر أحمد سمير مصيلحي
40da67cb-59ab-4011-bf5c-a14fa3621765	ATL-G05-1130	لوجين كريم محمد جمعه	لوجين كريم محمد جمعه	01205293909	01272949198	ولي الأمر (اعمال حره)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/RkPZxXFx/f30788c3-09ea-4e12-9252-23e5c3de7fde.jpg	الهانوفيل الراضوان	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1130	PUBLIC	PACKAGE	01272949198	01208080383	female	26606010201467	1966-06-01	مجدي ابن حليم
54a1794b-2a94-467c-946d-d1d290597d3a	ATL-G04-1131	هنا احمد رزق	هنا احمد رزق	01000219348	01000219348	ولي الأمر (اعمال حره)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/9HKdTMcK/1000250366.jpg	خلف مسجد محمد موسي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1131	LANGUAGES	PACKAGE	01000219348	01286627119	female	29205290200041	1992-05-29	مدرسه الشهيد صابر على ابو العينين
8014561c-5e6d-438b-9f74-6e1bb3e8c34e	ATL-G09-1132	فارس سيد ربيع السيوفي	فارس سيد ربيع السيوفي	01202401498	01203384994	ولي الأمر (متوفى)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/ch5CXwfc/1793181233038166407656928025642.jpg	الاسكندريه العجمي الهانوفيل خلف مخازن فتح الله	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1132	PUBLIC	PACKAGE	01203384994	01101907541	male	31201252104775	2012-01-25	مدرسه الادريسى الاعداديه
252e4be9-780d-419d-9cae-3b0505b17c75	ATL-G08-1133	رميساء سيد عبد القادر إبراهيم	رميساء سيد عبد القادر إبراهيم	01211040536	01098567506	ولي الأمر (أعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/gLhQ6cvW/IMG-20261028-WA0003.jpg	الإسكندرية العجمي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1133	PUBLIC	PACKAGE	01098567506	01029290225	female	31211131203127	2012-11-13	مدرسة الشهيد النقيب بسام جابر محمد علي
2e54b548-efed-4ffa-ae28-9a10dd55bfc8	ATL-G09-1134	نورين محمد محمد عبد الموجود	نورين محمد محمد عبد الموجود	01555203234	01555203234	ولي الأمر (لا تعمل)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/ccSfPqXq/17931786566368809671052187621945.jpg	الهانوفيل ش الخطيب أمام مدرسة اللواء محمد نجيب رابع عمارة على اليمين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1134	LANGUAGES	PACKAGE	01555203234	01155508791	female	31112180203142	2011-12-18	اللواء محمد نجيب
b0cba020-b3ff-4edd-bda5-94d60151a797	ATL-G08-1135	فريده محمد سيد مكي	فريده محمد سيد مكي	01041842258	01206307678	ولي الأمر (اعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/N6RGWzwc/file-00000000308081f481ad4ab1e352cbf3.png	الهانوفيل شارع الخلفاء الراشدين	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1135	PUBLIC	PACKAGE	01206307678	01204430893	female	31205130203467	2012-05-13	مدرسه مجدي بن حليم الاعداديه بنات
d35154e7-4734-4fbc-92a2-b81ab24e2d5c	ATL-G05-1136	ياسين احمد السيد احمد	ياسين احمد السيد احمد	01551520444	01551520444	ولي الأمر (فنى فى المصرية للاتصالات)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/Wvf3Szqh/126324.jpg	9ش الاسراء متفرع من الكومى الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1136	LANGUAGES	PACKAGE	01551520444	01111855677	male	31509160202376	2015-09-16	مدرسة اللواء محمد نجيب
f7996133-b1b0-4f61-87b8-a5fff3959382	ATL-G06-1137	ياسين سمير فوزي سيد احمد علي سلامه	ياسين سمير فوزي سيد احمد علي سلامه	01090088419	01274808408	ولي الأمر (اعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/Sw1tW39N/36551.jpg	الهانوفيل -حي العجمي-شارع ابو الشوارب	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1137	LANGUAGES	PACKAGE	01274808408	01113850112	male	31310270202214	2013-10-27	مدرسة اللواء محمد نجيب
9e2c5907-70b1-4b4d-bc70-beee250c204d	ATL-G10-1138	هنا هادي محمد إبراهيم	هنا هادي محمد إبراهيم	01221760746	01223165798	ولي الأمر (مهندس تبريد وتكييف مركزي)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/DPFgSdsR/IMG.jpg	العجمى النموذجيه الباب الخلفي للمدرسه شباب المستقبل عماره رقم 18	مدرسه مسائيه	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1138	LANGUAGES	PACKAGE	01223165798	01284885673	female	31102040201624	2011-02-04	اللواء محمد نجيب الرسمى للغات
e7efc6f2-3520-4ad0-81c3-65122da94fee	ATL-G07-1139	سلمى عصام رفاعي عبد ربه	سلمى عصام رفاعي عبد ربه	01273156566	01273156566	ولي الأمر (مبيض معماري)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/8nQ1c38M/1000118238.jpg	العجمي شارع الهانوفيل (امام ورشة البلاط) في شارع الملاهي في عمارة سنتر النور عند مدرسه زهرة الاواءل الخاصة	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1139	PUBLIC	PACKAGE	01273156566	01286133112	female	31401010209962	2014-01-01	شباب المستقبل
7eefdf0c-8f7d-4b38-ab05-10e31b21ae52	ATL-G05-1140	محمد احمد محمود علي	محمد احمد محمود علي	01015051428	01020120396	ولي الأمر (اعمال حرة)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/JRYXRVQt/17931721924618799852141140422998.jpg	الاسكندريه شارع عطا الله العوامي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1140	PUBLIC	PACKAGE	01020120396	01015081428	male	31607310201774	2016-07-31	عباس حلمي
10c77113-5e79-4b93-9f47-f831706bbd32	ATL-G08-1141	يوسف كريم عباس عبدالله	يوسف كريم عباس عبدالله	01043407212	01018431817	ولي الأمر (مهندس)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/4wVnLGm1/Screenshot-20260531-225710-com-huawei-photos.jpg	الهانوفيل ش محمد الفردي عماره رقم ١	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1141	PUBLIC	PACKAGE	01018431817	01271022141	male	31306260203657	2013-06-26	مدرسه الحياه الخاصه
9017da55-2a3c-4344-a881-03ce71b8bd69	ATL-G05-1142	يارا كريم عباس عبدالله	يارا كريم عباس عبدالله	01069197605	01018431817	ولي الأمر (مهندس)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/hRn7PG1z/image.jpg	الهانوفيل ش محمد الفردي عماره رقم ١	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1142	PUBLIC	PACKAGE	01018431817	01271022141	female	31602080201301	2016-02-08	مدرسه الحياه الخاصه
db5a47c4-4caf-4feb-9e14-d9f2c91577df	ATL-G09-1143	عمر عصام عبد المحسن ابراهيم	عمر عصام عبد المحسن ابراهيم	01285046368	01200632477	ولي الأمر (معلم)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/jZqSgJB9/1000162312.jpg	الإسكندرية- شارع محمد موسى	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1143	PUBLIC	PACKAGE	01200632477	01004523904	male	31206170201197	2012-06-17	مدرسه زهره الأوائل الخاصة
d3e2b086-9ec9-422b-afb3-f05b5f83c03e	ATL-G06-1144	عمار علاء عصمت محمد	عمار علاء عصمت محمد	01201192427	01288963688	ولي الأمر (اعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/9mvdyhXM/Snapchat-165308397.jpg	مساكن طلعت مصطفي بجوار مسجد التوحيد	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1144	PUBLIC	PACKAGE	01288963688	01227603888	male	31504160202838	2015-04-16	الفتوح الاسلاميه الصباحيه
ec98c8b8-03f3-43cd-9b0e-d110e08feab3	ATL-G10-1145	خالد أحمد عبد الوهاب	خالد أحمد عبد الوهاب	01207556071	01222245384	ولي الأمر (مدير متابعه مركزية لفتح الله)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/5p9NSFj/IMG-20260914-WA0005.jpg	شارع العوامي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1145	PUBLIC	PACKAGE	01222245384	01208738643	male	31112140203077	2011-12-14	مدرسه الراشدين الخاصة
c7198830-a4f9-4c84-adc6-ac15cb3f2fe1	ATL-G05-1146	مالك احمد صابر رزق	مالك احمد صابر رزق	01101125361	01101125361	ولي الأمر (مصنع ملابس)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/mC5HkSMz/1793157274753982440883461041330.jpg	العانوفيل ش الخلفا	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1146	LANGUAGES	PACKAGE	01101125361	01273543445	male	31501030201512	2015-01-03	جعفر ابن ابي طالب
f5a754f4-3bab-41c7-a7d5-5592134f18b8	ATL-G05-1147	داني السيد فتحي عبد الرحمن محمد	داني السيد فتحي عبد الرحمن محمد	01200991760	01274385220	ولي الأمر (معلم)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/Y4dqNYFV/IMG.jpg	مدينه الاسكندريه /العجمي الهانوفيل/بجوار بنك مصر	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1147	PUBLIC	PACKAGE	01274385220	01017991536	male	31606241703219	2016-06-24	مدرسه شباب المستقبل
e46bd113-d6c3-4377-b08e-aa8d587c3e54	ATL-G10-1148	هنا هيثم كمال احمد	هنا هيثم كمال احمد	01021748680	01062357005	ولي الأمر (محامي)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/zhXsLknf/Snapchat-1754732989.jpg	خير الله ميدان الساعه بجوار مسجد التقوي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1148	PUBLIC	PACKAGE	01062357005	01121508370	female	31012011400244	2010-12-01	مدرسه العجمي الثانويه بنات
94a991ea-5625-42df-ab42-90e8e1da89ed	ATL-G06-1149	عبد الرحمن محمد التوني	عبد الرحمن محمد التوني	01229243806	01229243806	ولي الأمر (أعمال حرة)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/mrj7wtWz/IMG-20261018-060702-587.jpg	أبو يوسف شارع الحمد والصلب	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1149	LANGUAGES	PACKAGE	01229243806	01272155592	male	28710122602896	1987-10-12	طلائع العجمي
98253649-4e11-4014-bf7e-e40abca938c6	ATL-G05-1150	ساجد محمد التوني	ساجد محمد التوني	01229243806	01229243806	ولي الأمر (أعمال حرة)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/gMZmhYFg/IMG-20261021-165040-621.jpg	العجمي ابويوسف شارع الحمد والصلب	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1150	PUBLIC	PACKAGE	01229243806	01272155592	male	28906160101461	1989-06-16	أمير الشعراء
f96322e9-f653-4739-9e3b-89a3a7263307	ATL-G09-1151	ريماس ثابت ابراهيم مصطفي	ريماس ثابت ابراهيم مصطفي	01011892607	01021329142	ولي الأمر (صف ضابط بالقوات المسلحه)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/N67yXCcv/17931418128973034484044935256103.jpg	الاسكندريه-الهانوفيل - شارع الجمعيه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1151	PUBLIC	PACKAGE	01021329142	01147671083	female	31111241804725	2011-11-24	مدرسه مجدي بن حليم الاعداديه
fd17e300-28dc-4351-a505-49a92786120e	ATL-G07-1152	سلمي احمد سند محمد	سلمي احمد سند محمد	01274234509	01274234509	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/qYFRqx5h/IMG-20261023-WA0002.jpg	العجمي الهانوفييل شارع سيد الحوت متفرع من شارع ورشه البلاط	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1152	PUBLIC	PACKAGE	01274234509	01204667243	female	31407140301805	2014-07-14	مدرسه شباب المستقبل(الشهيد بسام جابࢪ)
0db0ef8d-1d6e-41b8-9d48-81af41dd80f9	ATL-G05-1153	تاليا وليد محمد	تاليا وليد محمد	01277571853	01277571853	ولي الأمر (موظف بشركة)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/kV3JcQWY/858729710-1095420949872952-5159773530586981667-n.jpg	مساكن الصينية - الهانوفيل - العجمى	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1153	LANGUAGES	PACKAGE	01277571853	01210388326	female	29110230200504	1991-10-23	مدرسة اللواء محمد نجيب
b48c1f7f-357c-4f05-9b4d-6c973f1a8927	ATL-G05-1154	جورى مراد محمد ذكى	جورى مراد محمد ذكى	01226016144	01226016144	ولي الأمر (عامل)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/Xr9mVmHn/17931381053808907245251464905852.jpg	العجمى الهانوفيل شارع زمزم	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1154	LANGUAGES	PACKAGE	01226016144	01009071025	female	31509190200548	2015-09-19	جعفر بن أبى طالب
ad22c794-8896-4439-8dcf-8d80c9492c9b	ATL-G05-1155	هنا شريف عبد المنعم نصر خليل	هنا شريف عبد المنعم نصر خليل	01222715165	01227606590	ولي الأمر (محاسب)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/XfZzh0Nn/5cd34fcd-1ffb-4a46-a562-c5d65d0905c3-1-all-13832.jpg	الهانوفيل شارع عباد الرحمن متفرع من شارع المدرسه النموزجيه بالهانوفيل	عربي ميس دنيا درسات مستر محمود رشاد	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1155	LANGUAGES	PACKAGE	01227606590	01228941263	female	31505050204807	2015-05-05	خديجة بنت خويلد الرسمية لغات
630595f9-2e80-458a-9075-c18b9490663a	ATL-G08-1156	فاطيمة سعيد كامل علي	فاطيمة سعيد كامل علي	01226355396	01112771651	ولي الأمر (مدير عام بشركه النقل و الهندسه)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/cXRPDtSQ/1000022526.jpg	شارع خليل خير الله -برج الفاروق	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1156	PUBLIC	PACKAGE	01112771651	01211289441	female	31308250204941	2013-08-25	مدرسة الهانوفيل الخاصه الضوي 1
47643df4-6424-4e33-9429-173f5dbf05cc	ATL-G06-1157	ياسين احمد جابر مصطفى محمد	ياسين احمد جابر مصطفى محمد	01222520994	01222520994	ولي الأمر (اعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/sLRfCfJ/17931371224264929987189510307819.jpg	هانوفيل شارع راضوان	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1157	PUBLIC	PACKAGE	01222520994	01207172089	male	31410270202936	2014-10-27	شباب المستقبل
00d321f9-c906-462c-ad0d-cdad9a8e6baf	ATL-G09-1158	محمد عادل محمد جميل	محمد عادل محمد جميل	01273638426	01068211213	ولي الأمر (اعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/yF1TpczY/1793136889554351140861877567550.jpg	خلف مدرسة النموذجية	مستر محمد علاء انجليزي المواعيد يوم الثلاثاء الساعه 4 و يوم السبت الساعه 4	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1158	PUBLIC	PACKAGE	01068211213	01278633241	male	31205030203177	2012-05-03	عابدين ابو تلات
58196606-8070-4009-b639-4aa4b256ba5a	ATL-G09-1159	رودينا محمد رجب احمد	رودينا محمد رجب احمد	01010645729	01066622188	ولي الأمر (طباخ)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/GzkY6xR/IMG-20261013-WA0033.jpg	شارع النموذجيه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1159	LANGUAGES	PACKAGE	01066622188	01016946446	female	31202190200205	2012-02-19	مدرسه طلائع العجمي الرسميه لغات
8ed42a25-f8e8-46e6-a532-2b349837fb2b	ATL-G04-1160	اسر فاروق السيد احمد	اسر فاروق السيد احمد	01207696122	01206296780	ولي الأمر (اعمال حره)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/dsSXW38L/1000653475.jpg	العجمى الهانوڤيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1160	LANGUAGES	PACKAGE	01206296780	01034673672	male	28909211701041	1989-09-21	اللواء محمد نجيب
b0b7cf6e-097c-4c55-8677-54bfae3647b5	ATL-G05-1161	ادهم عيد محمد احمد	ادهم عيد محمد احمد	01220570259	01036849048	ولي الأمر (ربه منزل)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/5gqH6ZYY/1000349330.png	الاسكندريه العجمي الهانوفيل ش ورشه البلاط	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1161	PUBLIC	PACKAGE	01036849048	01205916139	male	31504200202399	2015-04-20	الفتوح الاسلاميه
7aaf37d8-6a60-4300-87ea-91c129bc3eae	ATL-G06-1162	بلال احمد محمد احمد	بلال احمد محمد احمد	01201917228	01201917228	ولي الأمر (كاتب ف التأمينات والمعاشات)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/XdHjXMf/17931357125603213216362883530482.jpg	شارع الخلفاء الراشدين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر] | [تعليم أزهري]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1162	PUBLIC	PACKAGE	01201917228	01007396509	male	31601032600931	2016-01-03	معهدالازهر القويرى ابتدائى
cf7153e9-4c13-47c4-ae33-b38c23907026	ATL-G09-1163	حنين احمد محمد احمد	حنين احمد محمد احمد	01201917228	01201917228	ولي الأمر (كاتب ف التأمينات والمعاشات)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/v4FBbbxK/1793134967399162756776821615401.jpg	شارع الخلفاء الراشدين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1163	PUBLIC	PACKAGE	01201917228	01007396509	female	31208102604286	2012-08-10	مدرسه شهيد بسام جابر
e2cfb28e-a917-4ec9-9a8a-8e7cb02f5078	ATL-G09-1164	لميس حسين محمد موسى	لميس حسين محمد موسى	01272335083	01005818410	ولي الأمر (أعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/9kFXKZWf/IMG-20261028-WA0000.jpg	العجمى الهانوفيل امام المدرسه النموذجيه برج الصابرين	ضبط المواعيد لعدم دخول الطالب الحصه التانيه متأخر وتعرض الطالب للكلام من المستر 2:توفير قاعه لمستر خالد النصيرى وعدم إلقاء المحاضره خارج القاعه لعدم توفير قاعه فى هذا المعاد	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1164	LANGUAGES	PACKAGE	01005818410	01220214880	female	31302010202609	2013-02-01	مدرسه الدخيله الجديده
39050c6b-f10d-4eab-9c1c-dfe2b89e9ff5	ATL-G06-1165	روان عبدالله محمود محمد	روان عبدالله محمود محمد	01205808737	01205808737	ولي الأمر (عامل)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/Q7fFmQ7V/IMG.jpg	الهانوفيل شارع الكومي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1165	LANGUAGES	PACKAGE	01205808737	01205808661	female	31311080203687	2013-11-08	مدرسه اللواء محمد نجيب
a3ccbb37-c21d-4494-acae-77d1bbea3695	ATL-G08-1166	محمد احمد محمد احمد	محمد احمد محمد احمد	01212142450	01201917228	ولي الأمر (كاتب ف التأمينات والمعاشات)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/yBQ6Ymdf/17931342967433813746249068615143.jpg	شارع الخلفاء الراشدين	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1166	PUBLIC	PACKAGE	01201917228	01007396509	male	31208102603336	2012-08-10	مدرسه شهيد بسام جابر
af92658c-76f1-46ba-bf42-29598f5e192e	ATL-G08-1167	جنا السيد محمود احمد حسانين	جنا السيد محمود احمد حسانين	01278127808	01278127808	ولي الأمر (موظف شركه)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/gLw4c7mg/1000173341.jpg	ابو يوسف شارع جمعه مفتاح	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1167	LANGUAGES	PACKAGE	01278127808	01153090353	female	31201032800428	2012-01-03	مدرسه طلائع الرسميه لغات
ad01d113-0151-4dbe-9956-8c29647258e0	ATL-G08-1169	جومانا محمد أنور محمد	جومانا محمد أنور محمد	01284840093	01284840093	ولي الأمر (اعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/RG4Zsx5N/IMG-20261025-WA0078.jpg	٣٣ شارع الكومي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1169	LANGUAGES	PACKAGE	01284840093	01226690337	female	31112280202003	2011-12-28	اللواء محمد نجيب
b48a5094-b11f-4fc4-be84-3282654b5a34	ATL-G06-1046	سما وليد محمد السيد	سما وليد محمد السيد	01274172287	01214740441	ولي الأمر (شركه)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/Ndf1fZxM/IMG.jpg	مساكن ايجيكات	مواعيد مفضله	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1046	PUBLIC	PACKAGE	01214740441	01278048154	female	28509050202289	1985-09-05	حفصه بنت عمر
ccc300b9-b08e-42d2-98c4-a37def390a37	ATL-G04-1170	ريم علاء البدرى خميس	ريم علاء البدرى خميس	01150997016	01150997016	ولي الأمر (سباك)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/yFP8vZG4/8691.jpg	الاسكندريه الهانوفيل شارع محمد موسى	اختيارى [طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر] | [تعليم أزهري]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1170	PUBLIC	PACKAGE	01150997016	01121446837	female	31701112900264	2017-01-11	معهد القويرى
1c69066c-4187-4159-a09e-6376a2af3ea8	ATL-G06-1171	مارك عادل عدلي صالح اسكاروس	مارك عادل عدلي صالح اسكاروس	01212595123	01229066484	ولي الأمر (محل مجمدات لحوم)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/5x5bwLZR/IMG.jpg	ابويوسف ش هيبه سعيد قبل الشامي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1171	LANGUAGES	PACKAGE	01229066484	01279228088	male	31310120202631	2013-10-12	اللواء محمد نجيب تجريبي لغات
03c49db5-75e6-49be-95c6-cd2a5b62ebbd	ATL-G06-1172	سما احمد سعد ابراهيم	سما احمد سعد ابراهيم	01223964370	01212498899	ولي الأمر (صياد)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/XkN1dPy3/1000017306.jpg	مساكن طلعت مصطفى بلوك 21	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1172	PUBLIC	PACKAGE	01212498899	01223964079	female	31501160200143	2015-01-16	مجدى ابن حليم
d887aa3a-b752-4532-a9a7-44a12e2d0e11	ATL-G05-1173	زياد سامح عبد العزيز سعد	زياد سامح عبد العزيز سعد	01227418114	01550808650	ولي الأمر (اعمال حرة)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/vvk2MhLF/61988.jpg	شارع على بن أبى طالب الدرايسة أمام مدرسة النموذجيه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1173	PUBLIC	PACKAGE	01550808650	01553376732	male	31510250203078	2015-10-25	الفتوح الاسلامية
95d6ad09-8377-48cd-96a3-d05526938d1b	ATL-G08-1174	ريتاج احمد سعد ابراهيم	ريتاج احمد سعد ابراهيم	01208821533	01212498899	ولي الأمر (صياد)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/qYWjHZmp/1000017304.jpg	مساكن طلعت مصطفى بلوك 21	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1174	PUBLIC	PACKAGE	01212498899	01223964079	female	31302020204723	2013-02-02	مجدى ابن حليم
d789ff0d-2e1c-43b9-98d9-060cc6d658c7	ATL-G07-1175	اياد علاء البدرى خميس	اياد علاء البدرى خميس	01150997016	01150997016	ولي الأمر (سباك)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/Zp11Tr2n/268.jpg	الاسكندريه الهانوفيل شارع محمد موسى	اختيارى [طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر] | [تعليم أزهري]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1175	PUBLIC	PACKAGE	01150997016	01121446837	male	31309212901538	2013-09-21	معهد طاهر القويرى
44e60578-db03-4a15-b8e4-b40f59564548	ATL-G10-1177	حسين عبد النبي محمد محمد	حسين عبد النبي محمد محمد	01111867904	01551321192	ولي الأمر (أعمال حرة)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/mF6Xvh95/1655.jpg	5شارع الطاهرة من الخلفاء الراشدين الهانوفيل الأسكندرية	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1177	PUBLIC	PACKAGE	01551321192	01065098522	male	31008050205257	2010-08-05	مدرسة حسان بن ثابت الثانوية بنين
bdbd85eb-9869-4cd7-abef-87d0e383e7c3	ATL-G07-1178	محمد خالد عبد الرحمن محمود	محمد خالد عبد الرحمن محمود	01013863563	01013863563	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/Z1XZXHG2/IMG-20261015-WA0029-1.jpg	الاسكندريه في العجمي في شارع الكومي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1178	PUBLIC	PACKAGE	01013863563	01063725952	male	31403310201699	2014-03-31	الشهيد بسام جابر
8be82901-ab6b-4bae-b5df-ec742191a661	ATL-G05-1179	فيرينا جورج صبرى جورج	فيرينا جورج صبرى جورج	01228224605	01289600569	ولي الأمر (مشرف عام بالمقالات)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/XZgmvG4Y/37767.jpg	العجمى بالهانوفيل 72شارع الكومى	الماث / ميس اسماء العربى / مستر مروان الدراسات / مستر محمود رشاد	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1179	LANGUAGES	PACKAGE	01289600569	01203036896	female	31502261800628	2015-02-26	مدرسه مجمع الدخيلة الرسمي لغات
9ca24b02-025c-42ce-a50a-c6c42a46dc00	ATL-G10-1180	حسن عبد النبي محمد محمد	حسن عبد النبي محمد محمد	01020162984	01551321192	ولي الأمر (اعمال حرة)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/N6xQDVsK/IMG.jpg	الهانوفيل 5شارع الطاهرة من الخلفاء الراشدين الدخيلة -الاسكندرية	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1180	PUBLIC	PACKAGE	01551321192	01065098522	male	31008050205214	2010-08-05	حسان بن ثابت
9a094e8c-118a-4fe7-8635-00263757728f	ATL-G08-1181	روميساء على متولي على	روميساء على متولي على	01284458689	01277322995	ولي الأمر (أعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/Z1WnY2CS/1000130415.jpg	شارع الكومي	تغير مواعيد س4ونص	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1181	PUBLIC	PACKAGE	01277322995	01036778802	female	28101120201511	1981-01-12	مجدي ابن حليم
cc75b701-2d1f-43bd-a13c-7dc498cbe312	ATL-G09-1182	محمد ماهر فتحي	محمد ماهر فتحي	01214862065	01278052831	ولي الأمر (اعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/0RBMhTs0/1000163123.png	العجمي/الهانوفيل /شارع الرضوان	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1182	PUBLIC	PACKAGE	01278052831	01037360086	male	31111241501951	2011-11-24	حفصه بنت عمر
f3ab9afc-6538-4a48-825a-22621d8fb126	ATL-G09-1183	جيوفانى جورج صبري جورج	جيوفانى جورج صبري جورج	01211769576	01289600569	ولي الأمر (مشرف عام بالمقاولات)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/Z1bg5x7P/17931314817052044282604347428799.jpg	العجمي الهنوفيل 72شارع الكومي	درسات م/ محمد سعيد عربي م/ محمد صلاح	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1183	LANGUAGES	PACKAGE	01289600569	01203036896	male	31103101802053	2011-03-10	مدرسه مجمع الدخيلة الرسمي لغات
7110c52b-3f00-4755-ab30-4c6e55010d30	ATL-G06-1184	ريناد محمد عصمت عبد السلام	ريناد محمد عصمت عبد السلام	01211173325	01211173325	ولي الأمر (موظف)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/Y4FX40xX/IMG-20261027-WA0132.jpg	العجمي الهانوفيل شارع ابو الشوارب	المواعيد متأخرة نحتاج تبكير لو سمحت حرام الأطفال صغيرة بنقلق عليهم [طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1184	PUBLIC	PACKAGE	01211173325	01211173324	female	31408010205309	2014-08-01	الفيروز
4edc0cb9-a253-47c4-9c74-4e03570a1cfb	ATL-G06-1185	رودينا علي متولي علي	رودينا علي متولي علي	01274018807	01277322995	ولي الأمر (اعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/XfG0cqWW/Snapchat-1969298996.jpg	شارع الكومي متفرع من شارع عرفات عماره 105	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1185	PUBLIC	PACKAGE	01277322995	01036887702	female	29304110200984	1993-04-11	الفتوح السلاميه
2b32f587-b1f3-4935-8c20-6fa94d068cd4	ATL-G09-1186	رودينا عبد اللطيف يحيى	رودينا عبد اللطيف يحيى	01223559216	01223559216	ولي الأمر (مشرف)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/23Wx3Mzg/17931184670063927555924381255556.jpg	البيطاش قبلي خلف مجمع مدارس الصناعات الصغيرة	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1186	LANGUAGES	PACKAGE	01223559216	01098976151	female	31202190200426	2012-02-19	اجيال الغد
2f8dd341-a5dc-4edd-a516-e1a60546f944	ATL-G06-1187	ايسل ايمن السيد شرف الدين	ايسل ايمن السيد شرف الدين	01004179788	01556538123	ولي الأمر (مستخلص جمركي)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/fVYvHySN/1000446302.png	الدرايسة نهاية شارع يونس ارض اولاد غانم	ميس دنيا _عربي ميس الاء _ انجليزي لانني لا استفيد بالباكدج	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1187	LANGUAGES	PACKAGE	01556538123	01275020340	female	31401080202329	2014-01-08	مودرن ساينس للغات الخاصة
2cac988f-7c82-4b2f-88aa-1ff299b185d7	ATL-G06-1188	مريم عماد جعفر جعفر	مريم عماد جعفر جعفر	01211178213	01211178213	ولي الأمر (مدرسة لغة عربية اعدادي)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/cK5267ss/1000114796.jpg	اسكندريه عجمي هانوفيل شارع خالد بن الوليد	ابي متوفي [طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1188	PUBLIC	PACKAGE	01211178213	01006847776	female	31410261701229	2014-10-26	شباب المستقبل الابتدائيه
a70df43b-580e-4de5-9b70-a7179ef5c161	ATL-G09-1189	مصطفى فرغلي احمد	مصطفى فرغلي احمد	01501751085	01092376024	ولي الأمر (اعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/LzPD5PNS/IMG-20261024-WA0007.jpg	العجمي الهانوفيل شارع عمر المختار	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1189	LANGUAGES	PACKAGE	01092376024	01283440867	male	31006040201072	2010-06-04	مدرسه حمزه ابن عبد المطلب
f5af880d-64b5-4df3-9983-bab031a8f8ed	ATL-G05-1190	محمد هيثم نصر الدين ابراهيم	محمد هيثم نصر الدين ابراهيم	01221813713	01222758064	ولي الأمر (موظف بالنيابه الإدارية)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/d4TJXMwj/1000232470.jpg	شارع عبد العال الصغير أمام قريه الزهراء الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1190	LANGUAGES	PACKAGE	01222758064	01282282297	male	31411160203216	2014-11-16	مدرسه اللواء محمد نجيب
db7dcb18-0939-4879-8666-b344a67b7a8a	ATL-G07-1192	ملك خالد علي احمد	ملك خالد علي احمد	01012006579	01012006579	ولي الأمر (اعمال حىدره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/YFGJ5HZS/1000072947.jpg	اسكندريه العجمي الهانوفيل شارع الخلفاء الراشدين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1192	PUBLIC	PACKAGE	01012006579	01033990641	female	27201011507856	1972-01-01	مجدي بن حليم
01fe9161-517a-41b8-b529-0fb3924c38cf	ATL-G10-1193	ريماس محمود بيه محمد	ريماس محمود بيه محمد	01554478196	01221784781	ولي الأمر (شيف حلواني)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/35Sh1w32/IMG-20261027-WA0176.jpg	٣ش جامع محمد موسي	بعد الساعه ٥	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1193	PUBLIC	PACKAGE	01221784781	01282410166	female	31105220200102	2011-05-22	عباس حلمي الثانويه بنات
10424464-0b6c-44e4-a2f0-1742930d228d	ATL-G07-1194	ادم مدحت عطيه	ادم مدحت عطيه	01223892624	01224167228	ولي الأمر (موظف في شركه الاسمنت)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/s9J2frqY/IMG-20261018-WA0001.jpg	الهانوڤيل شارع الجمعيه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1194	PUBLIC	PACKAGE	01224167228	01211803024	male	31407061804154	2014-07-06	مدرسه بسام جابر
808a04b4-f668-4566-b436-0f6cdd489c59	ATL-G05-1195	محمد جمال توفيق عبد الله	محمد جمال توفيق عبد الله	01200479800	01200479800	ولي الأمر (اعمال حره)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/wGd4JxR/received-936244565931377.jpg	الهانوفيل عند كلاسك	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1195	LANGUAGES	PACKAGE	01200479800	01207083107	male	31505250204577	2015-05-25	اللواء محمد نجيب
c5b3e0d2-8586-450c-8c0c-b45ad565fde9	ATL-G10-1196	جنى سعيد فاروق عبد الفتاح	جنى سعيد فاروق عبد الفتاح	01006931221	01010080528	ولي الأمر (مساعد أول قوات مسلحه)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/YYPFfRC/IMG-20260910-WA0012.jpg	شارع ابراهيم العوامي متفرع من شارع عبد الجواد في العجمي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1196	PUBLIC	PACKAGE	01010080528	01050806460	female	31111271803448	2011-11-27	مدرسه عباس حلمي الثانويه بنات
f3e2152b-5d2d-47d4-8dc9-17d3adef8a52	ATL-G09-1197	احمد ابراهيم علي سعدالله	احمد ابراهيم علي سعدالله	01505663426	01505633426	ولي الأمر (أعمال حرة)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/gbQGJk45/1793129309677.jpg	الاسكندريه العجمي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1197	PUBLIC	PACKAGE	01505633426	01227753216	male	31205100200413	2012-05-10	الإدريسي بنين
f5fa4f33-0ede-4c41-a232-7e9c16b70834	ATL-G09-1198	منه مدحت عطيه	منه مدحت عطيه	01285120450	01224167228	ولي الأمر (موظف شركة الاسمنت)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/cS6DXCdW/file-0000000054bc82108fba8a7fe18501c9.png	الهانوڤيل شارع الجمعيه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1198	PUBLIC	PACKAGE	01224167228	01211803024	female	31110031800941	2011-10-03	مدرسه مجدي ابن حليم
57ccf098-ee04-44f7-9fa2-bb2e02aad2eb	ATL-G10-1199	Mohamed Adel Abodoma	Mohamed Adel Abodoma	01148840335	01150626836	ولي الأمر (اعمال كهربا حره)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/2LHKmFr/Picsart-26-10-27-22-22-24-117.jpg	عجمي الهانوفيل شارع مسجد النور متفرع من شارع زمزم	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1199	PUBLIC	PACKAGE	01150626836	01122974612	male	31108110204152	2011-08-11	مدرسة حسان بن ثابت الثانوية بنين
2baca187-d448-493e-b9ed-d85606aa6ac0	ATL-G09-1047	جودي السيد حسن	جودي السيد حسن	01144435082	01206042393	ولي الأمر (عمل حر)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/SXxJ6R40/1000297322.jpg	اسكندريه الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1047	PUBLIC	PACKAGE	01206042393	01212070903	female	28610160200551	1986-10-16	بنت الشاطئ
f0a549d6-252f-4bb8-bb73-211487566b5b	ATL-G04-1200	زياد محمد ابو اليفى عبد الفضيل	زياد محمد ابو اليفى عبد الفضيل	01280067380	01280067380	ولي الأمر (موظف فى شركه)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/TBtDzqJh/IMG-0037.jpg	10 شارع الصالحين متفرع من شارع عمر المختار الهانو فيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1200	LANGUAGES	PACKAGE	01280067380	01275954144	male	31510230203691	2015-10-23	اللواء محمد نجيب
3bc9ea04-6465-4ee4-a239-e25a8e90245b	ATL-G08-1201	ياسين محمد البسيوني قطب جمعه	ياسين محمد البسيوني قطب جمعه	01212802599	01118180580	ولي الأمر (أعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/39hJfnMg/IMG-20261027-WA0003.jpg	الأسكندريه-العجمي-شارع الروبي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1201	LANGUAGES	PACKAGE	01118180580	01118399128	male	31110170203974	2011-10-17	مدرسة اللواء محمد نجيب
113ebac7-e18c-4ec6-a964-b381821d8a12	ATL-G05-1202	محمد ايمن محمد حسين	محمد ايمن محمد حسين	01274514022	01274514022	ولي الأمر (اعمال حره)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/WXkHFDt/1000037183.png	الهانوفيل-شارع عطا الله العوامى	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1202	LANGUAGES	PACKAGE	01274514022	01144332468	male	31508180201817	2015-08-18	مدرسه اللواء محمد نجيب
f247cebc-0fe3-4ac2-b508-1d4bfc9455cd	ATL-G10-1203	حنين اشرف علي درويش	حنين اشرف علي درويش	01204571688	01282602286	ولي الأمر (مدير عام شركه البتروكيماويات)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/Df97d3Tp/1000778083.jpg	العجمي الهانوفيل شارع الكومي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1203	PUBLIC	PACKAGE	01282602286	01016081956	female	31203250200206	2012-03-25	اليكس لايف الخاصة
15b25be5-e88b-400c-9a4a-38d98cfff031	ATL-G09-1204	ريماس ايمن عبد المنعم عبد العزيز	ريماس ايمن عبد المنعم عبد العزيز	01286963205	01500059514	ولي الأمر (مدير مكتب في البريد المصري)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/FkqJ3Kgt/1000151695.jpg	الاسكندريه الكيلو 29 شارع مدرسه ابو تلات عابدين الخاصه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1204	PUBLIC	PACKAGE	01500059514	01205209635	female	31203100203126	2012-03-10	مدرسه ابو تلات عابدين الخاصه
e1024a36-ff1d-418e-a654-9102392fbb05	ATL-G07-1205	علي محمد حسين حامد	علي محمد حسين حامد	01214516959	01288860270	ولي الأمر (مساعد فني)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/SDVZNGjL/17931275329604534994440309866227.jpg	العجمي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1205	PUBLIC	PACKAGE	01288860270	01277467542	male	31309250205537	2013-09-25	العجمي النموذجية الخاصة
1d28c6ea-8857-4d82-81c7-e3ade3c5c7a0	ATL-G09-1206	عمار طارق ابراهيم	عمار طارق ابراهيم	01204143412	01287480537	ولي الأمر (اعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/Mykrmqyk/1000135084.jpg	الهانوفيل شارع الخلفاء الراشدين بجوار مطعم الصالحين	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1206	PUBLIC	PACKAGE	01287480537	01550811915	male	31206110201074	2012-06-11	حفصه
121e9b9e-df09-437f-b95b-5cca3fcffded	ATL-G08-1207	يوسف ايمن عبدالمنعم	يوسف ايمن عبدالمنعم	01274677505	01220212514	ولي الأمر (مدبر مكتب المنطقه الحره البريد المصري)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/NdPvymbL/1000146173.jpg	شارع مدرسه عابدين الكيلو ٢٩	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1207	PUBLIC	PACKAGE	01220212514	01205209635	male	31308180202393	2013-08-18	مدرسه ابو تلات عابدين الخاصه
b8b77360-72f9-4ab5-9e1e-b354c53c9447	ATL-G08-1208	جونير جورج وديع ايوب	جونير جورج وديع ايوب	01210494299	01204443675	ولي الأمر (مهندس)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/wZ7CJMr4/IMG.jpg	شارع الحنفية امام شركه الكهرباء خلف مسجد الحاج خليفه / البيطاش	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1208	LANGUAGES	PACKAGE	01204443675	01200092185	female	31202010205441	2012-02-01	مدرسة التنوير الرسمية لغات
2cd3b830-c3e5-4d08-b640-af531c2e5ae4	ATL-G04-1209	حمزة طاهر أبو زيد	حمزة طاهر أبو زيد	01283207214	01283207214	ولي الأمر (اعمال حرة)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/FLCy4ZkH/1000073435.jpg	ش عطالله العوامي الهانوفيل العجمي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1209	PUBLIC	PACKAGE	01283207214	01228606630	male	31705250204711	2017-05-25	الفتوح الإسلامية
662d93e4-7dc2-4655-94b8-08f311be196f	ATL-G04-1210	رانسي ايمن محمد حسين	رانسي ايمن محمد حسين	01274514022	01274514022	ولي الأمر (أعمال حره)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/gZJ4Hjjs/1000037164.jpg	الهانوفيل -شارع عطا الله العوامى	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1210	PUBLIC	PACKAGE	01274514022	01144332468	female	31708230202223	2017-08-23	مدرسه شباب المستقبل
2fd2862e-f610-48e0-8886-c60a0f89ba08	ATL-G10-1211	رقيه طارق مرتضي احمد	رقيه طارق مرتضي احمد	01277575087	01500914557	ولي الأمر (اعمال حره)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/dhP7Ztb/55606.jpg	العجمي بوابه 8 اخر شارع فضه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1211	LANGUAGES	PACKAGE	01500914557	01279280093	female	31103210200608	2011-03-21	الشهيد محمد علي المسيري
51593bd8-8181-4e96-a03e-f4381740b7d7	ATL-G06-1212	رؤيه صالح حسن احمد	رؤيه صالح حسن احمد	01208168475	01205244471	ولي الأمر (فني معمل)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/9kFtrywt/IMG-20260824-WA0183.jpg	الهانوفيل شارع عمر المختار برج الصفا و المروه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1212	PUBLIC	PACKAGE	01205244471	01205244472	female	31411200200622	2014-11-20	حفصه بنت عمر
b542fa1c-5384-4bfd-b923-3eab8cb6cdfd	ATL-G08-1213	احمد محمد رجب النجار	احمد محمد رجب النجار	01132508475	01069753090	ولي الأمر (عامل)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/yF7Zs7PQ/1000102332.webp	الهانوفيل شارع الجمعيه بجوار مسجد السلام	مستر محمد علاء انجليزي مستر محمد سعيد دراسات مستر محمد صلاح عربي مستر محمد عادل رياضه	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1213	PUBLIC	PACKAGE	01069753090	01096031013	male	28901012726352	1989-01-01	مدرسه التنوير الاعدادي بنين
01d7cf5f-805a-4c19-a34c-deadefe1c95d	ATL-G04-1214	إياد وليد محمد محمد	إياد وليد محمد محمد	01221776315	01224761192	ولي الأمر (رئيس أمن ف فتح الله)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/LG6vnHg/17931316022693219769422204055891.jpg	الهانوفيل عمر المختار	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1214	PUBLIC	PACKAGE	01224761192	01226446754	male	31705220200576	2017-05-22	الفتوح الاسلاميه
f4d1c353-60b9-43e5-bcbc-e50704630a64	ATL-G07-1215	فريدة اسلام عبدالرحمن ابراهيم	فريدة اسلام عبدالرحمن ابراهيم	01018690696	01040475998	ولي الأمر (مشرف أول صحه و سلامه المقاولون العرب)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/jZ1ZvYBV/IMG-20261027-WA0007.jpg	شارع اجياد متفرع من شارع زمزم الهانوفيل الرئيسي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1215	PUBLIC	PACKAGE	01040475998	01220103769	female	31304040200743	2013-04-04	مدرسه مجدي ابن حليم الاعدادي بنات
1fa86c55-b5b2-4534-ad3a-b2053f77a32e	ATL-G08-1216	ريماس انور احمد ابراهيم	ريماس انور احمد ابراهيم	01284353850	01205597600	ولي الأمر (اعمال حرة)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/qLQY9WFj/Screenshot.jpg	الإسكندرية العجمي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1216	LANGUAGES	PACKAGE	01205597600	01224026722	female	31209100201741	2012-09-10	التنوير الرسمية لغات
cdc71339-825c-40ec-9685-de2a071fb551	ATL-G07-1217	محمد طاهر أبوزيد	محمد طاهر أبوزيد	01283207214	01283207214	ولي الأمر (اعمال حرة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/23c3YjWg/1000073441.jpg	ش عطالله العوامي الهانوفيل العجمي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1217	PUBLIC	PACKAGE	01283207214	01228606630	male	31409050203275	2014-09-05	امير الشعراء مساءي
567fe2ef-252e-4966-b922-139119251830	ATL-G07-1218	ريماس محمد ابراهيم توفيق	ريماس محمد ابراهيم توفيق	01223150654	01094116767	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/BVBSTVdr/17931264137525830821234202646205.jpg	شارع العوامى بجوار مخبز المسيحه الهانوڤيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1218	PUBLIC	PACKAGE	01094116767	01275981157	female	27807210200463	1978-07-21	مدرسة مجدي بن حليم
06489d45-c95e-40ac-8c7b-6c2fd3166104	ATL-G07-1219	يوسف اسامه عبد الفتاح غنيم	يوسف اسامه عبد الفتاح غنيم	01116664322	01116664322	ولي الأمر (موظف)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/m57BJLrG/1000411005.jpg	ش محمد موسى الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1219	PUBLIC	PACKAGE	01116664322	01142247775	male	31407241802079	2014-07-24	مدرسه الهانوفيل الخاصة
51287d2c-a2a2-42af-8d1e-8b0e37156a85	ATL-G10-1220	هاجر احمد اسماعيل احمد	هاجر احمد اسماعيل احمد	01207268940	01285098170	ولي الأمر (اعمال حره)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/2329kFXq/IMG-20260717-110802-766.jpg	اسكندريه هانوفيل شركه الكهربه	بلاش دروس بعد سبعه	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1220	PUBLIC	PACKAGE	01285098170	01285098174	female	31107031801602	2011-07-03	العجمي الثانويه بنات
abe21cc3-2699-457e-a998-70c1095fb817	ATL-G05-1221	أنس محمد عبد الحميد عبد اللطيف	أنس محمد عبد الحميد عبد اللطيف	01202223936	01202223936	ولي الأمر (اعمال حره)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/tPCydWzX/IMG-5516.png	شارع عطالله العوامى الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1221	LANGUAGES	PACKAGE	01202223936	01555057211	male	31503020201819	2015-03-02	مجمع الدخيلة
ecb799ae-63e9-4e2d-8d0d-0626532d9091	ATL-G10-1223	جودي طارق عبد العليم	جودي طارق عبد العليم	01019813306	01227695796	ولي الأمر (صيدلي و موظفه في بنك)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/B2XX7znQ/20261008-180747-0.jpg	هنوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1223	PUBLIC	PACKAGE	01227695796	01060318137	female	31101100203587	2011-01-10	اليكس بايف
a9d3c1ed-3acb-453d-8c49-5182a14102cb	ATL-G09-1224	ريتاج عمرو بدر	ريتاج عمرو بدر	01032041837	01042679303	ولي الأمر (تاجر ادوات منزليه)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/Y5dWXGs/1000329330.jpg	العجمي الهانوفيل شارع قصر القويري	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1224	PUBLIC	PACKAGE	01042679303	01090244203	female	31207251604683	2012-07-25	مدرسه الشهيد النقيب بسام جابر
b31d8978-44ed-444d-9c62-2470ed0b9feb	ATL-G09-1225	ملك سامح احمد عبد الستار	ملك سامح احمد عبد الستار	01276228571	01276228571	ولي الأمر (عامل)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/60FMCXps/IMG-20261015-WA0021.jpg	الهانوفيل اخر شارع الجمعية(كوم التراب)	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1225	PUBLIC	PACKAGE	01276228571	01508128190	female	31106300201947	2011-06-30	الشهيد بسام جابر محمد احمد
1ebdc40e-ef19-459f-8582-958aa5e78f48	ATL-G09-1226	نوفير امجد سعد	نوفير امجد سعد	01274111040	01212064528	ولي الأمر (مستخلص جمركي)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/fGCCvzLt/1000409678.jpg	كيلو ٢٢ معرض الحرمين	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1226	LANGUAGES	PACKAGE	01212064528	01275711420	male	31109100203693	2011-09-10	اللواء محمد نجيب
7c5140ff-08fc-4e26-bd8d-22ca7ffbbc85	ATL-G08-1227	يوسف انور صبحي محمد	يوسف انور صبحي محمد	01066572353	01066572353	ولي الأمر (اعمال حرة)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/G4Dhg3L4/file-00000000de0c81f5948a76cd2b44ddd3.png	العجمي الهانوفيل شارع الشيوخ	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1227	PUBLIC	PACKAGE	01066572353	01080415223	male	31308290204219	2013-08-29	مدرسة الشهيد بسام
e9f0da50-22e7-4892-bb61-c0678314e456	ATL-G07-1228	محمد أحمد إبراهيم شعبان	محمد أحمد إبراهيم شعبان	01277073911	01277073911	ولي الأمر (موظف بهيئة الطاقة الذرية)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/NdyW4KPz/17931277887406685900595473327494.jpg	22 برج الفيروز ش محمد موسى الهانوفيل الدخيلة الإسكندرية	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1228	PUBLIC	PACKAGE	01277073911	01093042773	male	31401261803316	2014-01-26	مدرسة النقيب شهيد بسام جابر محمد أحمد الاعدادية بنين
79df3955-48d2-4d0b-9e1a-cc542abdc544	ATL-G07-1229	ملك محمد مصطفى فيصل	ملك محمد مصطفى فيصل	01200534379	01220077089	ولي الأمر (عامل فني كهربه)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/spCDzRL0/IMG-20261022-WA0000.jpg	حي العجمي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1229	PUBLIC	PACKAGE	01220077089	01220074330	female	31408030205543	2014-08-03	الشهيد النقيب بسام جابر محمد احمد
c6930b40-1180-4ab7-b67e-ffe41c862abf	ATL-G05-1230	احمد محمد عبد الله مصطفى	احمد محمد عبد الله مصطفى	01092513419	01004586719	ولي الأمر (تمريض)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/BHL0PrtC/1000079062.jpg	الهانوفيل 17شارع الصفا متفرع من شارع زمزم	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1230	PUBLIC	PACKAGE	01004586719	01065118245	male	27905160200205	1979-05-16	مدرسه الفتوح الاسلاميه
3fd33d98-e12a-4e8b-b612-07eac2f9bb43	ATL-G09-1231	يحي نبيل محمود محمد	يحي نبيل محمود محمد	01286151174	01286151174	ولي الأمر (شيف)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/G3JzWsq3/IMG-20261027-WA0010.jpg	الهانوفيل الاسكندرية	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1231	LANGUAGES	PACKAGE	01286151174	01015314834	male	31102090203334	2011-02-09	اجيال الغد
006a5f77-b3bd-4c94-9034-a5ebcb2452fe	ATL-G10-1232	ابراهيم ايمن ابراهيم علي	ابراهيم ايمن ابراهيم علي	01213993200	01287106214	ولي الأمر (مديراداره)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/0y0NBxD9/image.jpg	الاسكندريه العجمي هانوفيل شارع قصرالقويري	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1232	PUBLIC	PACKAGE	01287106214	01210254995	male	31009220202475	2010-09-22	حسان بن ثابت
c90f4dc2-640b-4479-9218-fe8c559c729d	ATL-G07-1233	محمد علاء صلاح	محمد علاء صلاح	01224062810	01558306589	ولي الأمر (معلم)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/Vc7mJ6JZ/17931224069534792556213340645084.jpg	اسكندريه العجمي شارع الرضوان	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1233	PUBLIC	PACKAGE	01558306589	01272962912	male	31210150203239	2012-10-15	مدرسه حفصه بنت عمر
7590874d-ffef-4fbe-a903-a957e3c9ab18	ATL-G10-1234	اسلام علاء عبد اللاه	اسلام علاء عبد اللاه	01208110932	01225042262	ولي الأمر (عامل في شركه)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/BWz1cnP/1000044364.jpg	العامريه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1234	PUBLIC	PACKAGE	01225042262	01279618944	male	31108260201852	2011-08-26	حسان ابن ثابت
d247fd28-7e14-4afc-81b9-6abca867a388	ATL-G11-1235	جنى عماد ابراهيم محمد	جنى عماد ابراهيم محمد	01063446255	01225786979	ولي الأمر (محاميه)	c206e817-623a-495c-9a9a-a07eb25c401e	\N	PACKAGE_BUNDLE	https://i.ibb.co/QFCwbg37/Snapchat-2007069094.jpg	ش التوحيد العجمى الهانوفيل الدخيله الاسكندريه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1235	PUBLIC	PACKAGE	01225786979	01011864466	female	31009250205762	2010-09-25	مدرسه العجمى الثانويه بنات
0ed4bc3f-ab0a-41ca-ac74-46f2c7a9f51d	ATL-G04-1236	اسلام سعيد محمد علي محمود	اسلام سعيد محمد علي محمود	01207026252	01207026252	ولي الأمر (موظف حكومي)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/8DqNZT2c/1000000093.jpg	الهانوفيل شارع ابو زيد	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1236	PUBLIC	PACKAGE	01207026252	01204501321	male	28706010208993	1987-06-01	حفصه بنت عمر
7469c351-2807-4ba0-8f28-0e73daa0914f	ATL-G10-1237	سلمي مدحت رمضان	سلمي مدحت رمضان	01042635494	01289615086	ولي الأمر (سائق)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/gMkkxwSr/1000760215.jpg	اسكندرية _الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1237	PUBLIC	PACKAGE	01289615086	01210881886	female	31005121403269	2010-05-12	مدرسه سميره موسي
910cbf90-ec0e-4090-aa70-d2970bcb85fe	ATL-G05-1238	بارثنيا جورج وديع ايوب	بارثنيا جورج وديع ايوب	01515611815	01204443675	ولي الأمر (مهندس)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/fYNKB86V/IMG-20261027-WA0044.jpg	شارع الحنفية امام شركه الكهرباء خلف مسجد الحاج خليفه / البيطاش	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1238	LANGUAGES	PACKAGE	01204443675	01200092185	female	31501080204369	2015-01-08	مدرسة التنوير الرسمية لغات
435fc930-8f2a-4fdb-a448-b250ffab8817	ATL-G10-1240	احمد هاني محمد شرف عبدالله	احمد هاني محمد شرف عبدالله	01060720296	01007916386	ولي الأمر (دكتور صيدلي)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/FqCdZhTw/17931262139238633667794243990706.jpg	٢٦ شارع الزبير بن العوام اعلي مسجد عباد الرحمن الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1240	PUBLIC	PACKAGE	01007916386	01122008724	male	31107170204376	2011-07-17	عباس حلمي الثانويه بنين
99eb2864-b958-4162-91e8-69e0e76adcad	ATL-G05-1241	محمد هاني محمد شرف عبدالله	محمد هاني محمد شرف عبدالله	01007916386	01007916386	ولي الأمر (دكتور صيدلي)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/4RTpTsKq/17931255173875084965708928593012.jpg	٢٦ شارع الزبير بن العوام اعلي مسجد عباد الرحمن-الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1241	PUBLIC	PACKAGE	01007916386	01122008724	male	31608200204537	2016-08-20	شباب المستقبل الابتدائية
eb1c47bf-702e-45b8-aa4f-774e3405a805	ATL-G07-1242	سارة محمد على احمد	سارة محمد على احمد	01065672132	01273382897	ولي الأمر (معاش)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/YTPStGT1/2921.jpg	الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1242	LANGUAGES	PACKAGE	01273382897	01278916105	female	31306090202464	2013-06-09	طلائع العجمي لغات
cfbc79d4-b99e-4ff9-aa25-5db3bad9aed4	ATL-G09-1243	يّوُسًـفُ سًـآمِـحً عٌبًدٍهّ مًحًمًدٍ	يّوُسًـفُ سًـآمِـحً عٌبًدٍهّ مًحًمًدٍ	01035075258	01035075258	ولي الأمر (ربة منزل)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/Kzb75Dcx/IMG-20261015-WA0009.jpg	شارع محمد العجمي- الهانوفيل- الدخيلة -الاسكندرية	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر] | [تعليم أزهري]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1243	PUBLIC	PACKAGE	01035075258	01227762879	male	31303120202112	2013-03-12	معهد بنين القويري
5cc02aac-5d30-4b45-810e-f1ce13a3f02a	ATL-G09-1245	جني محمود السيد علي	جني محمود السيد علي	01204262264	01277213415	ولي الأمر (اعمال حره)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/SXjcQx5y/17931249764651229304448616118959.jpg	الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1245	PUBLIC	PACKAGE	01277213415	01277151041	female	31101040201547	2011-01-04	مدرسه بلال بن رباح
a21acebb-c1bf-4cdf-97ee-13caa8ade03e	ATL-G08-1244	سلمي احمد زايد محمد	سلمي احمد زايد محمد	01287829185	01284229383	ولي الأمر (نجار)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/zTL36Hzg/IMG-20260906-173948-198.jpg	امام مدرسه النموذجيه	محمد صبحي	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1244	PUBLIC	PACKAGE	01284229383	01277185173	female	31308250204828	2013-08-25	مدرسه مجدي بن حليم
aa0589af-2212-4cee-9b2b-93c8f024ff89	ATL-G06-1246	انس هاني محمد شرف عبدالله	انس هاني محمد شرف عبدالله	01007916386	01007916386	ولي الأمر (دكتور صيدلي)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/zh2Z7XSw/17931241776166737728510823816882.jpg	٢٦ شارع الزبير ابن العوام اعلي مسجد عباد الرحمن -الهانوفيل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1246	PUBLIC	PACKAGE	01007916386	01122008724	male	31501010213115	2015-01-01	شباب المستقبل الابتدائية
6817c2b9-0d88-4f8a-866a-13898f2ccf9c	ATL-G07-1247	رحمه محمد عبد الحميد ماضى	رحمه محمد عبد الحميد ماضى	01024974112	01227213437	ولي الأمر (تاجر موبيليا)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/Lzm8M8gj/77859.jpg	الكيلو ١٧ ونصف شارع الهيبه سعيد عمتره رقم ٧	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1247	LANGUAGES	PACKAGE	01227213437	01203145667	female	31309080202465	2013-09-08	مدرسه زيد بن حارثه لغات
9efeaf2b-622c-471f-a8d9-972f1574ca20	ATL-G07-1249	اصاله سعيد محمد علي	اصاله سعيد محمد علي	01274234509	01207026252	ولي الأمر (موظف حكومي)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/kVf1Bhpx/Snapchat-231345752.jpg	الهانوفيل شارع ابو زيد	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1249	PUBLIC	PACKAGE	01207026252	01204501321	female	28311030201168	1983-11-03	الشهيد بسام جابر بنات
e2a02f58-c386-4afc-8ab3-6d193a4a1253	ATL-G04-1250	فاطمه الزهراء مدحت أحمد محمود احمد خليل	فاطمه الزهراء مدحت أحمد محمود احمد خليل	01212279638	01212279638	ولي الأمر (مشرف معماري)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/d4mNjcdZ/97911.jpg	الهانوفيل عبد المنعم جابر ش المدينة المنورة	ياريت السن ده المواعيد تكون متوسطه [طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1250	LANGUAGES	PACKAGE	01212279638	01278737814	female	31609140200983	2016-09-14	مدرسه مجمع الدخيله رسميه (مميز)لغات
e56e1ea3-46bf-47b2-8582-af0bee8dcc49	ATL-G10-1251	جومانا اسلام محمد حلمي	جومانا اسلام محمد حلمي	01286454667	01221880823	ولي الأمر (مشرف عام ف شركه غاز مصر)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/ch9r3kYy/Snapchat-1390424394.jpg	اسكندريه عجمي هانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1251	PUBLIC	PACKAGE	01221880823	01557103338	female	31103220201386	2011-03-22	عباس حلمي الثانويه بنات
0191d1b9-3149-4be8-b7a0-115a6b616a03	ATL-G07-1252	عمر سامي عبدالمنعم حامد سالمان	عمر سامي عبدالمنعم حامد سالمان	01554150022	01200957536	ولي الأمر (أخصائي أشعه جامعه الاسكندريه)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/k2JLK5Qp/IMG-20260910-WA0003.jpg	الهانوفيل مدخل الهانوفيل الرئيسي مول الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1252	PUBLIC	PACKAGE	01200957536	01278102285	male	31305230201912	2013-05-23	اليكس لايف الخاصه
7b247a6b-5611-4ebd-ae89-c67a41335336	ATL-G10-1253	ادهم مصطفى السيد	ادهم مصطفى السيد	01201617469	01278926212	ولي الأمر (اعمال حره)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/PZZZMb8d/IMG-20250222-WA0006.jpg	مساكن طلعت مصطفى	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1253	PUBLIC	PACKAGE	01278926212	01207153359	male	31011150203031	2010-11-15	حسان بن ثابت بنين
5bf414e5-ff60-4818-b5f4-ec321a000f4d	ATL-G04-1254	إياد السيد على عبد السيد عبد الحميد	إياد السيد على عبد السيد عبد الحميد	01225296626	01201510226	ولي الأمر (مستشفى السعودي الألماني)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/840jnH3q/IMG-20261027-203349.jpg	الهانوفيل شارع مدينه السلام متفرع من شارع أبو الشوارب بجوار فيلا زمزم	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1254	LANGUAGES	PACKAGE	01201510226	01271347375	male	31511230200672	2015-11-23	اللواء محمد نجيب الرسمية للغات
98e01be8-cec0-47d5-a330-2d711223ccad	ATL-G04-1255	أندرو أسامة فتحي سند	أندرو أسامة فتحي سند	01273689980	01288026021	ولي الأمر (مدرس رياضيات)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/G41d00K6/IMG-20261027-200649-84.jpg	الكيلو 17 ونص عند الشامي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1255	LANGUAGES	PACKAGE	01288026021	01283050510	male	31608270203279	2016-08-27	اللواء محمد نجيب
9d2bb5b7-9436-499b-93ab-c076643d7f17	ATL-G07-1256	آسر وليد عزت محمد	آسر وليد عزت محمد	01559507884	01229296961	ولي الأمر (محامي)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/8nRrR7CF/17931215876313522883106602669697.jpg	العجمي الهانوفيل شارع خلف محمد موسي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1256	PUBLIC	PACKAGE	01229296961	01280765300	male	31402010201291	2014-02-01	العجمي النموذجيه
316a6e5f-21b1-4613-91fc-1d10eaed5f3c	ATL-G05-1257	جني حلمي عبد الوهاب	جني حلمي عبد الوهاب	01033215201	01033215201	ولي الأمر (مهندس)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/N6TRy8v3/Snapchat-1726003116.jpg	اسكندريه شارع اسكندريه مطروح الرئيس	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1257	LANGUAGES	PACKAGE	01033215201	01558332152	female	28005241700442	1980-05-24	اللواء محمد نجيب للغات
de4c2dd2-1aff-4647-991f-d3e8faec2170	ATL-G07-1258	معاذ علاء الدين محمد غيطانى	معاذ علاء الدين محمد غيطانى	01020046707	01020046707	ولي الأمر (محام)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/kfm5N7q/e1a16a7661e6055dcfdb3e0f60d3f8150c3351dbff1527d9968a297fac9331d0.png	العجمي الهانوفيل بجوار مسجد أم القري خلف نقطة فوزى معاذ	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1258	LANGUAGES	PACKAGE	01020046707	01096464428	male	31306160201894	2013-06-16	اجيال الغد
78da3191-09e5-44c4-adbc-79dce6d134dc	ATL-G04-1259	رقيه علاء محمد عبد الرحمن	رقيه علاء محمد عبد الرحمن	01126613484	01126613484	ولي الأمر (مهندس بحري)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/qMD5hppR/1001110372.jpg	الهانوفيل شارع مسجد محمد موسي الاول	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1259	PUBLIC	PACKAGE	01126613484	01287684882	female	31612240201783	2016-12-24	الضوي1
3d732e4a-b63b-4f29-b0f0-7fa6bea507ba	ATL-G09-1009	چنى اشرف احمد محمد	چنى اشرف احمد محمد	01028346725	01028346725	ولي الأمر (بحري مبتدا ع متن السفن التجاريه)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/1G37Npb3/d5301330-fca4-4214-837f-1c959bfc6d62-1-all-1173.jpg	اسكندرية العجمي الهانوفيل شارع الفردي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1009	PUBLIC	PACKAGE	01028346725	01096478515	female	31105180103044	2011-05-18	مدرسة الشهيد بسام جابر الاعداديه
00432b74-133f-4147-bc51-3fad64624907	ATL-G10-1261	جومانة محمد محسن مرسي	جومانة محمد محسن مرسي	01068567976	01284413016	ولي الأمر (فني تبريد و تكيف)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/fdnb4PN1/Snapchat-840800648.jpg	الهنوفيل _شارع الخلفاء الراشدين	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1261	LANGUAGES	PACKAGE	01284413016	01009743555	female	31008070201207	2010-08-07	اللواء محمد نجيب الرسمية لغات
27c0775a-2974-4dd4-b24a-0908b1cf5fe6	ATL-G05-1262	زياد احمد مصطفى السيد	زياد احمد مصطفى السيد	01286173481	01286173481	ولي الأمر (أخصائيه تمريض (مشرفه تمريض))	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/RGYWt4Ws/image.png	العجمي الهانوفيل شارع الجمعيه عند مسجد السلام كوم التراب	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1262	LANGUAGES	PACKAGE	01286173481	01206613845	male	31508060205398	2015-08-06	مجمع مدارس الدخيله لغات بوابه ٨
3b9db98e-91cc-4572-aafd-126d82ccc085	ATL-G10-1263	سمر جابر محمد مبروك	سمر جابر محمد مبروك	01210415155	01270485829	ولي الأمر (اعمال حره)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/SDd8qnd9/IMG-20261027-WA0074.jpg	العجمي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1263	PUBLIC	PACKAGE	01270485829	01274682912	female	31012280202602	2010-12-28	سميره موسي
60b8dfa8-d168-45f8-a877-2f84b306b134	ATL-G06-1264	مصطفى احمد مصطفى السيد	مصطفى احمد مصطفى السيد	01286173481	01286173481	ولي الأمر (أخصائيه تمريض)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/bMtXQ6cp/upsized-4x-second.png	العجمي الهانوفيل شارع الجمعيه عند مسجد السلام كوم التراب	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1264	LANGUAGES	PACKAGE	01286173481	01206613845	male	31403260203776	2014-03-26	مجمع مدارس الدخيله لغات بوابه ٨
c2982f19-bd64-4e0c-beeb-dc4cb89d586d	ATL-G10-1265	فاطمة الزهراء سامح عبده محمد	فاطمة الزهراء سامح عبده محمد	01035070869	01227762879	ولي الأمر (ربة منزل)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/xKjnqwZz/IMG.jpg	شارع محمد العجمي-الهانوفيل-الدخيلة- الاسكندرية	[تعليم أزهري]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1265	PUBLIC	PACKAGE	01227762879	01035075258	female	31108150204643	2011-08-15	معهد فتيات القويري
c46aceb0-99a8-40fa-8bf2-396404f9f263	ATL-G04-1266	مريم عادل محمد حسين	مريم عادل محمد حسين	01553533637	01553533637	ولي الأمر (كهربائيّ)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/LhvsQdDJ/1000639348.jpg	ش زمزم	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1266	PUBLIC	PACKAGE	01553533637	01122974612	female	31611020204084	2016-11-02	مدرسه شباب المستقبل
97ca1db2-18fe-48d0-aa0f-9bf3c3603fd9	ATL-G09-1267	سيف محمد رمضان	سيف محمد رمضان	01212236133	01204168223	ولي الأمر (عامل)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/kg2Rw9Q3/IMG20261015173804.jpg	العجمي الهانوفيل خلف فتح الله	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1267	PUBLIC	PACKAGE	01204168223	01289784864	male	31205150202433	2012-05-15	الادريسي
e88586d7-9e7d-4c21-a690-9274c275a1c6	ATL-G07-1268	علي محمود علي محمود	علي محمود علي محمود	01212725938	01272602703	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/93B6zQnN/IMG-4881.jpg	العجمي الدرايسه قبلي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1268	LANGUAGES	PACKAGE	01272602703	01212726358	male	31304030202616	2013-04-03	مدرسه طلائع العجمي للغات
cbc527b3-e8a9-4529-bfee-e6e64049d023	ATL-G09-1271	معاذ هاني محمد محمد	معاذ هاني محمد محمد	01206255584	01028885248	ولي الأمر (مهندس)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/QFbM67KX/99619.jpg	الاسكندىيه العجمي شارع الرضوان امام اكازيون	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1271	PUBLIC	PACKAGE	01028885248	01288091337	male	31112020202875	2011-12-02	الاعمار الخاصه
3d1a175b-c2f4-4281-81b8-f8b31bd228d8	ATL-G07-1273	آدم حسام فؤاد مصطفى	آدم حسام فؤاد مصطفى	01222752671	01274655548	ولي الأمر (أعمال حرة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/DDgC4RVb/IMG-20250506-WA0003.jpg	٢٥ ش نور الإسلام الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1273	PUBLIC	PACKAGE	01274655548	01281686361	male	31403230202996	2014-03-23	الشهيد بسام جابر
746dc704-e8d6-48f2-b8ca-04719af9fa9a	ATL-G08-1274	اياد علي عبد العال احمد	اياد علي عبد العال احمد	01282214540	01110340114	ولي الأمر (مشرف عام مراكب الترسانه البحريه)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/PGV4Xdsd/IMG-20261027-WA0007.jpg	واحد وعشرين شارع محمد موسي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1274	PUBLIC	PACKAGE	01110340114	01201910282	male	31301170200851	2013-01-17	الشهيد النقيب بسام جابر محمد الاعداديه بنين
b08a8a3f-eb98-4132-9301-678f44e8dbff	ATL-G07-1275	لوجى وليد إبراهيم محمود زقزوق	لوجى وليد إبراهيم محمود زقزوق	01222594276	01202123494	ولي الأمر (محامى)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/ZpntJGXp/1000106912.jpg	الهانوفيل شارع الخلفاء الراشدين	مستر محمد صلاح لغه عربيه مستر محمدسعيد دراسات إجتماعيه	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1275	PUBLIC	PACKAGE	01202123494	01024903521	female	31311201601243	2013-11-20	مدرسه شباب المستقبل بسام جابر الاعداديه بنات
4f318f9a-9162-4901-adc9-3f645af24dc8	ATL-G06-1289	عبد الرحمن احمد محمود	عبد الرحمن احمد محمود	01029450214	01029450214	ولي الأمر (رئيس قسم معلبات فتح الله)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/SwSNZ9yH/IMG-20261114-WA0000.jpg	٢٥ شارع حمدي السباعي متفرع من الخلفاء الراشدين	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-14 17:44:44.202788+02	2026-11-19 15:34:35.259525+02	1289	PUBLIC	PACKAGE	01029450214	01225101646	male	31506280201293	2015-06-28	حفظه بنت عمر الابتدائية
b1d85b14-61e2-42f5-8b52-20faf84e9c25	ATL-G06-1004	هدي محمد حامد اسماعيل	هدي محمد حامد اسماعيل	01206059306	01229815271	ولي الأمر (اعمال حره)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/tp1vW49v/Snapchat-1819062916.jpg	شارع الجمعيه	صباحى	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1004	LANGUAGES	PACKAGE	01229815271	01229815217	female	28506278800519	1985-06-27	ذيد ابن حارثه
81bc3e5b-c831-4c46-8aaf-95603a461df7	ATL-G08-1005	جومانا وليد منصور فريد	جومانا وليد منصور فريد	01282627320	01287380109	ولي الأمر (سيراميك ارضيات)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/Q1Nj6FB/IMG-20261102-WA5942.jpg	العجمي الهانوفيل شارع خيرالله جنب قهوه فهد	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1005	PUBLIC	PACKAGE	01287380109	01281883454	female	31301071900302	2013-01-07	الشهيد النقيب /بسام جابر محمد احمد ص٠ب
048ae168-ee83-42a8-ab89-31555f6c5dc3	ATL-G05-1006	احمد سعيد فاروق أبو يوسف	احمد سعيد فاروق أبو يوسف	01010080528	01010080528	ولي الأمر (مساعد أول قوات مسلحه)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/v4yYfmNX/17935560631858321909497350132958.jpg	شارع عبد الجواد العوامى متفرغ من ابراهيم العوامى	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1006	PUBLIC	PACKAGE	01010080528	01050806460	male	31505101806912	2015-05-10	الفيروز الخاصه
57cc3419-4662-4223-96e2-d2d69a88c72f	ATL-G08-1007	جيداء حمدي خلف علي	جيداء حمدي خلف علي	01279995677	01277011265	ولي الأمر (أعمال حره)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/Zp4SPGkP/Snapchat-746639373.jpg	الاسكندرية	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1007	PUBLIC	PACKAGE	01277011265	01011537146	female	31306140203203	2013-06-14	بنت الشاطئ الاعدادية
1dd9c771-28ed-4ff4-ac28-1e21b2906dd5	ATL-G06-1008	احمد اشرف احمد محمد	احمد اشرف احمد محمد	01020346725	01020346725	ولي الأمر (بحري مبتدا ع متن السفن التجاريه)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/bjVsHSz3/240278.jpg	اسكندرية العجمي الهانوفيل شارع الفردي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1008	PUBLIC	PACKAGE	01020346725	01096478515	male	29008041303344	1990-08-04	مدرسة شباب المستقبل
79bf20b6-9d28-404f-b215-dfafc0989321	ATL-G07-1037	ادم خالد سيد عطيفي	ادم خالد سيد عطيفي	01205597060	01277297029	ولي الأمر (اعمال حرة)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/PsDd25cL/image.jpg	العجمي الهانوفيل شارع الرضوان شارع عبد المجيد عوض العوامي بجوار مسجد الفضالي	عايز مذكرات مستر محمد صلاح مستر محمد بكير مستر احمد عبد الله	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1037	PUBLIC	PACKAGE	01277297029	01070576200	male	31312130201652	2013-12-13	مدرسة الشهيد بسام جابر
4dcab7f3-3c9e-49f4-bc60-41e9fd287b07	ATL-G09-1097	ياسين عبد الغني نبيل عبد الغني	ياسين عبد الغني نبيل عبد الغني	01287795934	01208341808	ولي الأمر (فني احصه)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/rKFjd8TV/IMG-20261012-WA0004.jpg	الهانوفيل شارع ابو الشوارب بجانب مسجد الفاروق	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1097	PUBLIC	PACKAGE	01208341808	01276196599	male	31202171800196	2012-02-17	بسام جابر
086949db-1e4e-4933-a0b4-40cf9271d3ae	ATL-G09-1124	يوسف محمد فوزي سيد	يوسف محمد فوزي سيد	01275806587	01288576940	ولي الأمر (اعمال حرة)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/8DGkjFFq/Screenshot-680d03679600f7af0b4c700c6b270fe7.jpg	شار ع الصالحين	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1124	PUBLIC	PACKAGE	01288576940	01287523668	male	26703102700236	1967-03-10	الادريسي
6d39210d-9c92-4252-8a45-e88d2e7602b9	ATL-G09-1168	مريم سعيد السيد خليل	مريم سعيد السيد خليل	01125901240	01272033408	ولي الأمر (مهندس)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/Ld7M5XxQ/Screenshot-com-miui-gallery.jpg	الهانوفيل خلف مدرسه النموذجيه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1168	PUBLIC	PACKAGE	01272033408	01144241598	female	31207301801604	2012-07-30	بنت الشاطئ
dc156c8b-9ae2-4057-8d69-5a07b5bf8c38	ATL-G09-1176	احمد شريف احمد محمد	احمد شريف احمد محمد	01282603384	01275829798	ولي الأمر (مشرف مبيعات)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/BFTNGD8/1000130739.jpg	5 ش ادهم الشرقاوى متفرع من ش الرضوان بجوار مسجد الفاروق عمر	انا باخد انجليزي بس في الباكدج مع مستر محمد علاء	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1176	LANGUAGES	PACKAGE	01275829798	01289874450	male	31107020201336	2011-07-02	اللواء محمد نجيب
9b88718e-a87c-4a19-9f07-d9e7ad5ce8d1	ATL-G04-1222	معاذ محمد انور محمد	معاذ محمد انور محمد	01275185656	01275185656	ولي الأمر (معلم)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/SwWhZM4V/1000341373.jpg	الهانوفيل خلف كافيتريا الامل	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1222	LANGUAGES	PACKAGE	01275185656	01275185200	male	31510140200855	2015-10-14	مدرسة زيد بن حارثة الرسمية لغات
c6ed5652-dec8-4fa3-a0e1-d11d828822e0	ATL-G08-1239	مؤمن جابر السيد محمد	مؤمن جابر السيد محمد	01274235839	01208869561	ولي الأمر (مدير شركه تخذيه)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/6cx4T1t4/IMG-20260830-WA0022.jpg	اسكندريه العجمي الهانوفيل شارع چلاتي عزه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1239	PUBLIC	PACKAGE	01208869561	01287834610	male	30805120101235	2008-05-12	الشهيد بسام. جابر
f78248cd-36d9-43f6-9549-54ba54f80be8	ATL-G07-1269	ادم كرم السيد محمد	ادم كرم السيد محمد	01201735386	01202208104	ولي الأمر (سائق نقل)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/BKHwWFkV/2026-10-2718-06-404702254211534798922.jpg	العجمي شارع الفردي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1269	PUBLIC	PACKAGE	01202208104	01203663784	male	31406190204353	2014-06-19	الشهيد بسام جابر الاعداديه بنين
0d845876-ed46-4836-b858-3c0adac4a4dd	ATL-G07-1270	أيتن أحمد توفيق علي	أيتن أحمد توفيق علي	01002087976	01271567257	ولي الأمر (معاش)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/9H58XPFB/1001130039.jpg	مدينه الاسكندريه الهانوفيل مدينه الاندلس والحجاز	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1270	PUBLIC	PACKAGE	01271567257	01225305203	female	31306160204427	2013-06-16	مدرسه الشهيد النقيب بسام جابر محمد
0d6117b0-35c4-405e-9315-c0dd08b414db	ATL-G09-1272	عمرو محمد حسن محمد	عمرو محمد حسن محمد	01005730422	01005730422	ولي الأمر (عامل حرفي)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/BKK0kn8s/file-00000000b6cc8210838b4e565e9929e0.png	العجمي هانوفيل شارع الخطاب	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1272	PUBLIC	PACKAGE	01005730422	01279687112	male	31112110202955	2011-12-11	الادريسي
44599752-d636-49ef-99d9-2823b6f447ff	ATL-G07-1276	ميادة ايمن احمد السيد	ميادة ايمن احمد السيد	01213952181	01280955677	ولي الأمر (مسؤول في شركه اوشن اكسبريس للحاويات)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/fV9N2qT0/IMG-20260623-WA0077.jpg	شارع ابو الشوارب امام مدرسه مدنون ساينس الهانوفيل	يوم الجمعه مستر محمد علاء يوم التلات مستر محمد علاء ميس نهله مسيو جالد	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1276	LANGUAGES	PACKAGE	01280955677	01287460136	female	31211110201043	2012-11-11	مدرسة اللواء محمد نجيب الرسميه للغات
1d4e60b6-b8ad-4383-8fca-f8e60600254f	ATL-G10-1278	محمد وسام عبد السلام غنيم	محمد وسام عبد السلام غنيم	01509084022	01155863654	ولي الأمر (اعمال حره)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/rGs9zrtn/IMG-20261027-WA0005.jpg	العجمى هانوفيل شارع صيدليه د/على حماد متفرع من شارع السلام	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1278	PUBLIC	PACKAGE	01155863654	01288481624	male	31110090201393	2011-10-09	عباس حلمى
6febd4bf-d0eb-47b1-b4bd-9360936b1cf9	ATL-G08-1279	زكريا احمد زكريا محمد	زكريا احمد زكريا محمد	01223636085	01223636085	ولي الأمر (معلم قرآن كريم)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/B55k4yjY/IMG.jpg	الهانوفيل شارع الكومي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1279	PUBLIC	PACKAGE	01223636085	01276989283	male	31304020203312	2013-04-02	مدرسة الشهيد النقيب بسام جابر الاعداديه بنين
bcf63b9f-79e1-4f77-8894-9b4b811cd7c5	ATL-G06-1280	يسر علي عبد العال	يسر علي عبد العال	01145319494	01110340114	ولي الأمر (مشرف عام مراكب الترسانه البحريه)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/xt8zkJKT/IMG-20260925-WA0058.jpg	واحد وعشرين شارع محمد موسي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1280	PUBLIC	PACKAGE	01110340114	01201910282	female	31411100200544	2014-11-10	حفصه بنت عمر م
b9939887-15c0-4897-86ef-473908c00d98	ATL-G10-1281	محمد عصام هيكل	محمد عصام هيكل	01280700772	01098909107	ولي الأمر (الاب متوفي والام ربة منزل)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/C5vRcNLD/1000468473.jpg	الهانوفيل شارع الامراء متفرع من شارع الكومي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1281	PUBLIC	PACKAGE	01098909107	01037391805	male	31010120200732	2010-10-12	مدرسة عباس حلمي
20c009ce-26ae-4ad9-b73b-91abaf6ea16a	ATL-G10-1282	نور احمد زكريا محمد	نور احمد زكريا محمد	01277872766	01223636085	ولي الأمر (معلم قرآن كريم)	afb79da5-7db2-4b1b-b5d5-78694d100743	\N	PACKAGE_BUNDLE	https://i.ibb.co/LdPjxPdM/Snapchat-1713445668.jpg	الهانوفيل شارع الكومي	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1282	PUBLIC	PACKAGE	01223636085	01276989283	female	31110130202908	2011-10-13	مدرسه العجمي الثانويه بنات
6f6a187d-b91c-4f74-982e-bfb512815631	ATL-G05-1283	فريدة إبراهيم متولى إبراهيم	فريدة إبراهيم متولى إبراهيم	01272759551	01200055122	ولي الأمر (محامى)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/ksb07zr6/file-000000005acc82109cb2e9dfff930ebc.png	منطقة الزهراء الهانوفيل الإسكندرية	باكيتچ	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1283	LANGUAGES	PACKAGE	01200055122	01278697859	female	31410050201327	2014-10-05	مدرسة محمد نجيب المشتركة لغات
8e46da03-8d49-454f-9e9e-fe9057420168	ATL-G04-1284	بارثينيا بيشوي وديع عبد السيد	بارثينيا بيشوي وديع عبد السيد	01228018021	01228018021	ولي الأمر (اعمال حره)	9833561e-f6fb-43b9-b9d4-152b41863bc5	\N	PACKAGE_BUNDLE	https://i.ibb.co/ynRjVxnY/image.avif	الهانوفيل الرئيسي جنب مدرسه الضوي	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1284	PUBLIC	PACKAGE	01228018021	01207222362	female	31703030200984	2017-03-03	الهانوفيل الخاصه الضوي
d9dc00a1-957b-42c0-a8f3-92c6b115b2c7	ATL-G07-1285	حازم خميس فتحي محمد	حازم خميس فتحي محمد	01203185062	01203185062	ولي الأمر (معاش)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/60cDF5sZ/IMG-1257.jpg	عجمي هانوفيل ش قصر القويري	[طالب ابتدائي بدون هاتف - التواصل عبر هاتف ولي الأمر]	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1285	LANGUAGES	PACKAGE	01203185062	01271643467	male	31307280200537	2013-07-28	مدرسه طلائع العجمي
726a0a16-c8f7-46fc-b4e1-6f2ec6f9d520	ATL-G07-1286	عائشة احمد محمد أحمد الصاوى	عائشة احمد محمد أحمد الصاوى	01004108060	01004503013	ولي الأمر (اعمال حره)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/DHsm3SxD/19659.jpg	العجمى الهانوفيل مساكن طلعت مصطفى	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1286	LANGUAGES	PACKAGE	01004503013	01221891074	female	31305030200261	2013-05-03	مدرسة الدخليه الرسميه الغات
ed96870a-97ce-42ae-95a7-ed0a111304b7	ATL-G08-1287	مريم محمود السيد محمد	مريم محمود السيد محمد	01559100790	01207242027	ولي الأمر (امين مخزن)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/9m4RcXWF/17931096927965183576222723489765.jpg	قصر القويري الهانوفيل شارع المدينه المنورة	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1287	PUBLIC	PACKAGE	01207242027	01206154596	female	31304200202586	2013-04-20	الشهيد بسام محمد جابر
a5b0fe17-aa76-408d-8404-f84494de5bef	ATL-G06-1288	احمد محمد احمد محمد	احمد محمد احمد محمد	01112712344	01202730383	ولي الأمر (متوفي)	59141280-1c86-41bc-a284-6d05d555f457	\N	PACKAGE_BUNDLE	https://i.ibb.co/tM88nPdn/image-757fe43.jpg	اسكندريه-الهانوفيل-شارع ورشه البلاط	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1288	PUBLIC	PACKAGE	01202730383	01284565566	male	31410120202224	2014-10-12	حفصه بنت عمر مسائي
c8d4fd14-52cb-4843-a8c2-810cc12ca1ab	ATL-G07-1191	أحمد محمد نبيل	أحمد محمد نبيل	01289063050	01206900691	ولي الأمر (رئيس قسم)	eab6184a-f010-48ea-9eee-a75a44ee9f7e	\N	PACKAGE_BUNDLE	https://i.ibb.co/YBBXgLDm/Screenshot.jpg	الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1191	PUBLIC	PACKAGE	01206900691	01206900667	male	31406170203318	2014-06-17	الهانوفيل الخاصه الضوي (١)
7e97c4c6-df02-4fd7-9583-a89f2d8f5ff0	ATL-G09-1248	امال شريف احمد السيد محمد	امال شريف احمد السيد محمد	01284153153	01284134138	ولي الأمر (ربه منزل)	6d603462-3d6b-43b1-9f9d-71c8d88ac6ea	\N	PACKAGE_BUNDLE	https://i.ibb.co/rG0MgvVC/13739.jpg	العجمي الهانوفيل	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1248	PUBLIC	PACKAGE	01284134138	01221499046	female	31102260202648	2011-02-26	مدرسة مجدي بن حليم
5d325beb-cf17-4b08-9293-e827e4a68956	ATL-G05-1260	جويريه علاء الدين محمد غيطانى	جويريه علاء الدين محمد غيطانى	01033064661	01020046707	ولي الأمر (محام)	5426bcc0-f8fb-4700-8022-d2b3fbed22ee	\N	PACKAGE_BUNDLE	https://i.ibb.co/9kk8LjW4/356cb5352af41b02aad17095b3a6f9f55fbef05da9471839eae64f1073617a5b.png	العجمي الهانوفيل بجوار مسجد أم القري	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1260	PUBLIC	PACKAGE	01020046707	01096464428	female	31601300202189	2016-01-30	حفصه بنت عمر
90379b67-38c2-46a3-8fc2-73f260d95ec2	ATL-G08-1277	كارمن محمد شعبان عبد التواب	كارمن محمد شعبان عبد التواب	01012646633	01044106263	ولي الأمر (محامية)	79842e52-6787-4773-b13f-5d8abf4c5043	\N	PACKAGE_BUNDLE	https://i.ibb.co/SXj41zw7/Screenshot-2026-10-27-17-20-45-47-6012fa4d4ddec268fc5c7112cbb265e7.jpg	الهانوفيل شارع الجامعيه	\N	t	local	\N	2026-11-13 16:15:13.671852+02	2026-11-19 15:34:35.259525+02	1277	LANGUAGES	PACKAGE	01044106263	01206769993	female	31205300200485	2012-05-30	Alex Life Language School
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
3d11fe4b-c72d-47bc-9bc8-6cab0c484836	اللغة الإيطالية	\N	ITA	#e11d48	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
53e7da3c-8cdc-4c19-9747-72c6cd90001d	التاريخ	\N	HIST	#b45309	t	local	2026-09-26 05:01:02.658105+03	2026-09-26 10:55:32.400343+03	general
585a7c3b-1dec-474f-b4e0-167924033473	التربية الدينية	Religious Education	\N	#10b981	t	local	2026-11-14 20:30:41.202827+02	2026-11-14 20:30:41.202827+02	general
a30f912c-914f-4a2a-87cb-c998dd144a0c	العلوم المتكاملة	Integrated Science (AR)	INT-SCI	#0e7490	t	local	2026-09-26 05:01:02.658105+03	2026-11-14 20:30:41.202827+02	general
7ffeeb0e-fc7d-4602-8bdb-82dfa1f1dd4c	Integrated Science (العلوم المتكاملة لغات)	Integrated Science	\N	#0284c7	t	local	2026-11-14 20:30:41.202827+02	2026-11-14 20:30:41.202827+02	general
ce5b10c3-aed1-4564-97c1-720147137ae6	تكنولوجيا المعلومات	Information Technology	\N	#6d28d9	t	local	2026-11-14 20:30:41.202827+02	2026-11-14 20:30:41.202827+02	general
bd95b9c0-f032-4a71-aaa6-a130bac5c8af	الجغرافيا	Geography	\N	#b45309	t	local	2026-11-14 20:30:41.202827+02	2026-11-14 20:30:41.202827+02	both
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (id, key, value, value_type, category, label_ar, label_en, is_public, updated_by, created_at, updated_at) FROM stdin;
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
e22779fb-114f-40e5-afe8-1f31fbc71982	center_name	أكاديمية أطلس التعليمية	string	general	اسم السنتر	Center Name	f	\N	2026-09-15 14:29:44.486698+03	2026-10-01 23:28:06.890314+03
a8f58fd5-34c2-4bd5-9058-7ecef5f11400	center_name_en	Atlas Educational Academy	string	general	اسم السنتر بالإنجليزية	Center Name (English)	f	\N	2026-09-15 14:29:44.486698+03	2026-10-01 23:28:06.890314+03
\.


--
-- Data for Name: teachers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teachers (id, full_name, full_name_ar, phone, email, specialization, revenue_split_percent, revenue_split_type, fixed_rate_per_student, is_active, notes, sync_status, remote_id, created_at, updated_at, subject_id, subject_ids, aka, gender, national_id, bio, social_links, secretary_name, secretary_phone, photo_url, logo_url, date_of_birth) FROM stdin;
e1813cfc-859d-4fe8-8ed7-57bb7b7bd3f6	ا/ اسلام جمال	ا/ اسلام جمال	\N	\N	العلوم الشرعية والأزهرية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	3954d6f5-1bff-49b1-bb06-60c852e8910b	{3954d6f5-1bff-49b1-bb06-60c852e8910b}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
7bb1ba79-480f-4b9e-b9f9-dba553ea37e2	ا/ صفية	ا/ صفية	\N	\N	التربية الدينية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	585a7c3b-1dec-474f-b4e0-167924033473	{585a7c3b-1dec-474f-b4e0-167924033473}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
ad027524-540c-42f2-ad26-aa6a34267e70	ميس/ الاء علاء	ميس/ الاء علاء	\N	\N	اللغة الإنجليزية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	37455367-fad4-4bb6-87d8-4b2d0ec9da10	{37455367-fad4-4bb6-87d8-4b2d0ec9da10}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
3d7d9d9a-5c2c-41e4-b51f-7d40fb4b8ad5	ا/ سالي	ا/ سالي	\N	\N	اللغة الإنجليزية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	37455367-fad4-4bb6-87d8-4b2d0ec9da10	{37455367-fad4-4bb6-87d8-4b2d0ec9da10}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
d363fcfd-a2d4-4e98-863b-150b0c2782fd	ا/ محمد علاء	ا/ محمد علاء	\N	\N	اللغة الإنجليزية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	37455367-fad4-4bb6-87d8-4b2d0ec9da10	{37455367-fad4-4bb6-87d8-4b2d0ec9da10}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
a2069239-3646-4e1b-92e0-3b4759f21934	ا/ صبحي محمد	ا/ صبحي محمد	\N	\N	اللغة الإنجليزية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	37455367-fad4-4bb6-87d8-4b2d0ec9da10	{37455367-fad4-4bb6-87d8-4b2d0ec9da10}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
054ac3aa-69dd-4248-92a6-998a5682f97d	ا/ محمد يوسف	ا/ محمد يوسف	\N	\N	الرياضيات	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	f4e734d7-0612-46bc-bfc0-1450fdc253f0	{f4e734d7-0612-46bc-bfc0-1450fdc253f0}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
bf333932-7d20-4bb5-b444-e3f36db093a8	ميس/ اسماء	ميس/ اسماء	\N	\N	Math (الرياضيات لغات)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	13e61af9-7072-46de-9141-d85e764dc20a	{13e61af9-7072-46de-9141-d85e764dc20a}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
a359f7ea-fa56-44ca-a33a-b333008fe008	ا/ حازم	ا/ حازم	\N	\N	العلوم	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	{ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
8bd35926-4cc3-445a-901b-3a5304ab2c4a	ميس/ اية ادم	ميس/ اية ادم	\N	\N	العلوم والعلوم المتكاملة	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	{ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e,a30f912c-914f-4a2a-87cb-c998dd144a0c}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
b8d04a31-a402-41b7-89ea-d3da56e01ec0	ا/ احمد عبد الله	ا/ احمد عبد الله	\N	\N	العلوم	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	{ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
ab99cb00-1ad0-406d-bc36-57ac15f1199c	ميس/ ايناس	ميس/ ايناس	\N	\N	Science (العلوم لغات)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	cae85df3-e30e-4e9e-89e4-4645bf9918c4	{cae85df3-e30e-4e9e-89e4-4645bf9918c4}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
84256980-b857-4c45-985d-c6d18385eb58	ا/ ادهم امبابي	ا/ ادهم امبابي	\N	\N	Science (العلوم لغات)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	cae85df3-e30e-4e9e-89e4-4645bf9918c4	{cae85df3-e30e-4e9e-89e4-4645bf9918c4}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
4724ea44-2b86-4d5a-a4f0-57c0f44471ec	ا/ اسلام عبد الجليل	ا/ اسلام عبد الجليل	\N	\N	Science (العلوم لغات)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	cae85df3-e30e-4e9e-89e4-4645bf9918c4	{cae85df3-e30e-4e9e-89e4-4645bf9918c4}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
6b63da64-5097-4ed3-9b0e-7029a9ee608a	ا/ محمد العربي	ا/ محمد العربي	\N	\N	Science & Bio & Integrated Science	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	cae85df3-e30e-4e9e-89e4-4645bf9918c4	{cae85df3-e30e-4e9e-89e4-4645bf9918c4,7ffeeb0e-fc7d-4602-8bdb-82dfa1f1dd4c,af504fc9-7db3-4e00-9b78-5eb2a73f32c8}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
170831a0-e73c-438f-8302-16513b9e8ef6	ميس/ شيماء	ميس/ شيماء	\N	\N	الدراسات الاجتماعية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	{d11f3ffc-8506-4b5b-867f-ca4f0c8bc622}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
19c3af70-b27c-4370-82ee-c2e31b83ca08	ا/ محمود رشاد	ا/ محمود رشاد	\N	\N	الدراسات الاجتماعية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	{d11f3ffc-8506-4b5b-867f-ca4f0c8bc622}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
055351d1-280c-4beb-950b-9e1bfa752847	ا/ محمد سعيد دراسات	ا/ محمد سعيد دراسات	\N	\N	الدراسات الاجتماعية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	{d11f3ffc-8506-4b5b-867f-ca4f0c8bc622}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
c5d59e81-692c-4cb4-b725-9d804c06e942	ا/ محمود طارق	ا/ محمود طارق	\N	\N	الدراسات الاجتماعية والجغرافيا	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	{d11f3ffc-8506-4b5b-867f-ca4f0c8bc622,bd95b9c0-f032-4a71-aaa6-a130bac5c8af}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
8a8afd20-f129-44f4-a078-196b5523368b	ا/ ايمن سليمان	ا/ ايمن سليمان	\N	\N	التاريخ	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	53e7da3c-8cdc-4c19-9747-72c6cd90001d	{53e7da3c-8cdc-4c19-9747-72c6cd90001d}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
85bd995b-7f11-4f19-a521-ce3e5268bfeb	ميس/ هبة	ميس/ هبة	\N	\N	تكنولوجيا المعلومات	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	ce5b10c3-aed1-4564-97c1-720147137ae6	{ce5b10c3-aed1-4564-97c1-720147137ae6}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
a97e99d1-d9dc-49f1-901a-32892ef6b418	ميس/ نهلة	ميس/ نهلة	\N	\N	ICT (لغات)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	b59175b2-1b28-4825-8179-8557160906dc	{b59175b2-1b28-4825-8179-8557160906dc}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
b23b63fb-da7c-408b-adc2-ba1dc28ed0d5	ا/ مروان	ا/ مروان	\N	\N	اللغة العربية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	{d9620fc2-df55-418d-9a9d-aeae69e8e2c3}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
324d13d6-dd4d-4f9a-a890-0ab85fd7d05a	ميس/ دنيا	ميس/ دنيا	\N	\N	اللغة العربية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	{d9620fc2-df55-418d-9a9d-aeae69e8e2c3}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
3a7d1ee9-29d1-4783-bf60-acaf0637e908	ا/ محمد صلاح عربي	ا/ محمد صلاح عربي	\N	\N	اللغة العربية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	{d9620fc2-df55-418d-9a9d-aeae69e8e2c3}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
47a489df-7f51-460a-9d16-5f2e9016a73a	ميس/ ياسمين حسن	ميس/ ياسمين حسن	\N	\N	اللغة العربية والشرعي (أزهر)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	{d9620fc2-df55-418d-9a9d-aeae69e8e2c3,3954d6f5-1bff-49b1-bb06-60c852e8910b}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
e2088d15-5449-491a-aeed-f856044f00c8	ا/ الغزالي	ا/ الغزالي	\N	\N	اللغة العربية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	{d9620fc2-df55-418d-9a9d-aeae69e8e2c3}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
3d974419-1413-43b9-9a16-b0a96e51b4bd	ا/ الاء محمد	ا/ الاء محمد	\N	\N	العلوم الشرعية والأزهرية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	3954d6f5-1bff-49b1-bb06-60c852e8910b	{3954d6f5-1bff-49b1-bb06-60c852e8910b}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
b4fdc16f-30e3-4a79-ad99-f4396d9a9944	ا/ احمد نبيل	ا/ احمد نبيل	\N	\N	Math (الرياضيات لغات)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	13e61af9-7072-46de-9141-d85e764dc20a	{13e61af9-7072-46de-9141-d85e764dc20a}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
9f7fd802-4ed5-447d-a832-132fc6782b02	ا/ محمود الرفاعي	ا/ محمود الرفاعي	\N	\N	Math (الرياضيات لغات)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	13e61af9-7072-46de-9141-d85e764dc20a	{13e61af9-7072-46de-9141-d85e764dc20a}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
9f2f9160-96dc-4d52-9dd6-932ab8c48ed9	ا/ عمر جمال	ا/ عمر جمال	\N	\N	Math (الرياضيات لغات)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	13e61af9-7072-46de-9141-d85e764dc20a	{13e61af9-7072-46de-9141-d85e764dc20a}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
5db56b25-f2d2-4d12-be46-6fc4ecb45037	ا/ احمد عثمان	ا/ احمد عثمان	\N	\N	العلوم	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e	{ac346ee8-88bc-4c81-bc9a-d6b6c2b9199e}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
64d5b53b-948e-426b-924b-63f0e1971219	ا/ الشاذلي	ا/ الشاذلي	\N	\N	اللغة الإنجليزية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	37455367-fad4-4bb6-87d8-4b2d0ec9da10	{37455367-fad4-4bb6-87d8-4b2d0ec9da10}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
601b0bc0-bfbe-4e96-be03-bbab9a7f011a	ا/ ادهم ابو الصفا	ا/ ادهم ابو الصفا	\N	\N	اللغة الإنجليزية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	37455367-fad4-4bb6-87d8-4b2d0ec9da10	{37455367-fad4-4bb6-87d8-4b2d0ec9da10}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
ddf47e11-3e05-4112-b3dd-0f99c471c62a	مسيو/ خالد النصيري	مسيو/ خالد النصيري	\N	\N	اللغة الفرنسية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	640f4d8d-69e4-47ad-9682-863a1c9158b7	{640f4d8d-69e4-47ad-9682-863a1c9158b7}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
38e7c542-e70b-4581-86e4-7acad9a5af09	ا/ احمد محمود	ا/ احمد محمود	\N	\N	الرياضيات	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	f4e734d7-0612-46bc-bfc0-1450fdc253f0	{f4e734d7-0612-46bc-bfc0-1450fdc253f0}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
4e260ca1-b3b0-4263-843f-5377db71442e	ا/ ادهم هاني	ا/ ادهم هاني	\N	\N	الرياضيات	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	f4e734d7-0612-46bc-bfc0-1450fdc253f0	{f4e734d7-0612-46bc-bfc0-1450fdc253f0}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
03392b62-ead6-4b3b-964d-7741605b12a0	ا/ محمد بكير	ا/ محمد بكير	\N	\N	الرياضيات	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	f4e734d7-0612-46bc-bfc0-1450fdc253f0	{f4e734d7-0612-46bc-bfc0-1450fdc253f0}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
3e261e27-224b-4bc1-a2de-ebe1c2ee4ce6	ا/ محمد عادل	ا/ محمد عادل	\N	\N	الرياضيات	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	f4e734d7-0612-46bc-bfc0-1450fdc253f0	{f4e734d7-0612-46bc-bfc0-1450fdc253f0}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
3dd07ede-7090-44a3-bedc-867ca7c1a0f8	ا/ محمد عاشور	ا/ محمد عاشور	\N	\N	البرمجة وعلوم الحاسب	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	4815ecec-0d9f-466f-a6c6-b88364951f89	{4815ecec-0d9f-466f-a6c6-b88364951f89}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
68ddc058-d0c1-4802-9f97-0d5c8bcc158b	ا/ محمد صلاح فلسفة	ا/ محمد صلاح فلسفة	\N	\N	الفلسفة والمنطق	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	9f9b6f17-3ad9-459f-b640-0d3d2f988ea8	{9f9b6f17-3ad9-459f-b640-0d3d2f988ea8}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
3e2a7683-742e-45bb-9494-5e91bebc928d	ا/ علي فؤاد	ا/ علي فؤاد	\N	\N	الفلسفة والمنطق	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	9f9b6f17-3ad9-459f-b640-0d3d2f988ea8	{9f9b6f17-3ad9-459f-b640-0d3d2f988ea8}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
05e1d74a-7825-4d96-a32e-578a7615e19d	ا/ محمد سعيد انجليزي	ا/ محمد سعيد انجليزي	\N	\N	اللغة الإنجليزية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	37455367-fad4-4bb6-87d8-4b2d0ec9da10	{37455367-fad4-4bb6-87d8-4b2d0ec9da10}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
613810f2-76fa-45d4-8561-2a6b01b2944e	ا/ محمد علام انجليزي	ا/ محمد علام انجليزي	\N	\N	اللغة الإنجليزية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	37455367-fad4-4bb6-87d8-4b2d0ec9da10	{37455367-fad4-4bb6-87d8-4b2d0ec9da10}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
e8617785-19e0-4679-9067-02ba1af709de	ا/ الزنكلوني	ا/ الزنكلوني	\N	\N	اللغة العربية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d9620fc2-df55-418d-9a9d-aeae69e8e2c3	{d9620fc2-df55-418d-9a9d-aeae69e8e2c3}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
542e2b4a-2ec5-4af4-aa56-af5f062cff6c	ا/ اسلام موسى	ا/ اسلام موسى	\N	\N	الدراسات الاجتماعية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	d11f3ffc-8506-4b5b-867f-ca4f0c8bc622	{d11f3ffc-8506-4b5b-867f-ca4f0c8bc622}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
fee832a2-408c-43bb-af5e-695f22a98e32	ميس/ اميرة انجليزي	ميس/ اميرة انجليزي	\N	\N	اللغة الإنجليزية	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	37455367-fad4-4bb6-87d8-4b2d0ec9da10	{37455367-fad4-4bb6-87d8-4b2d0ec9da10}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
956f484a-24bf-4eaa-ad86-fc67ff856968	ميس/ ياسمين ماث	ميس/ ياسمين ماث	\N	\N	Math (الرياضيات لغات)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	13e61af9-7072-46de-9141-d85e764dc20a	{13e61af9-7072-46de-9141-d85e764dc20a}	\N	female	\N	\N	{}	\N	\N	\N	\N	\N
bdbe67a9-4a46-4bab-885d-ff8ae7938d10	ا/ محمد سالم	ا/ محمد سالم	\N	\N	الفيزياء (Physics)	0.00	percentage	0.00	t	\N	local	\N	2026-11-14 20:30:41.202827+02	2026-11-18 20:12:58.081451+02	3842cd93-85b7-46d0-a334-47d007f9c936	{3842cd93-85b7-46d0-a334-47d007f9c936}	\N	male	\N	\N	{}	\N	\N	\N	\N	\N
\.


--
-- Data for Name: treasury_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.treasury_transactions (id, transaction_type, amount, reference_id, notes, recorded_by, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password_hash, full_name, full_name_ar, phone, email, role_id, is_active, last_login_at, sync_status, remote_id, created_at, updated_at, photo_url) FROM stdin;
765a2cf1-6549-46d0-874f-aaa35ba39c17	reception	$2b$10$kTZxt8jkUL06i651LWuv.u4j3Jp2IdusPHbx1NaPkEjX1JsaNdMBi	Reception & Gate Officer	موظف الاستقبال وبوابة الحضور	01056789012	reception@atlas-educational.com	14d607eb-4061-4320-af28-64b40ea58eee	t	2026-09-26 05:18:41.940559+03	local	\N	2026-09-16 14:53:16.906195+03	2026-09-26 05:18:41.940559+03	\N
0d849aaf-181d-41b7-8d26-d9410a58bed8	center_mgr	$2b$10$mTfrXV7fNUvI3M59ga00mOGvBSBxa9fvSpiy1Jw.F7Kcuopr3MKmu	Center Operations Manager	مدير العمليات والسنتر	01023456789	manager@atlas-educational.com	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	t	2026-09-26 05:21:55.35506+03	local	\N	2026-09-16 14:53:16.906195+03	2026-09-26 05:21:55.35506+03	\N
9cb28fe8-6c18-466e-a098-f7f862b22a26	test_receptionist	$2b$10$MqVLon0xZCzn6PW0lDF1.OSbvsXVjcNTPsOVMk1Eegfz3Mgn78.em	موظف استقبال تجريبي	\N	\N	\N	14d607eb-4061-4320-af28-64b40ea58eee	t	2026-09-18 09:36:23.235918+03	local	\N	2026-09-18 09:35:38.435976+03	2026-09-18 09:36:23.235918+03	\N
c442cd1f-3343-4df7-9863-27cd8294e5d9	finance_mgr	$2b$10$kTZxt8jkUL06i651LWuv.u4j3Jp2IdusPHbx1NaPkEjX1JsaNdMBi	Treasury & Finance Supervisor	مشرف الخزينة والمالية العامة	01034567890	finance@atlas-educational.com	ad233712-296a-4aa6-89e3-3f90671d4a09	t	\N	local	\N	2026-09-16 14:53:16.906195+03	2026-09-16 14:53:16.906195+03	\N
8bebac31-b210-4eba-a0be-716bc4cb06ae	gamal	$2b$10$5Z6MS8UPGpLOlihbQJQIJ.8k3yONIyE/C0QKFcEbXItsxOj2Cjp82	[	جمال عبدالمنعم محمد	01001166055	\N	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	t	2026-10-01 14:05:35.248797+03	local	\N	2026-09-30 21:53:04.093644+03	2026-10-01 14:05:35.248797+03	\N
6c49cae8-988b-4bed-9f78-c069486f9f68	admin	$2b$10$cvcY90se/kaE5Th2cStITeAYJ6q4Y2nBWDnAL9stVAo7htCNXzHky	System Administrator	Abdalla	01224385098	abdallamagdy599@gmail.com	42c9cdc5-7909-40c8-bf3b-f81cde1336ac	t	2026-11-18 20:25:19.001799+02	local	\N	2026-09-15 14:29:44.452575+03	2026-11-18 20:25:19.001799+02	
eb0ae00c-cff6-4fb9-85e0-edaa02bf1b37	eman	$2b$10$m1Ry39vd.Oc6meWgsEu11.U3pJOXaXcNKL6c/l9Hynr9hMnGt9kCa		ايمان ادمن	01113882604	\N	43cf2b83-fc3d-4cb6-948b-9b83df7ac71f	t	2026-10-01 16:37:34.040487+03	local	\N	2026-10-01 16:37:22.57181+03	2026-10-01 16:52:28.845506+03	\N
\.


--
-- Name: booklet_reservation_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.booklet_reservation_seq', 1001, false);


--
-- Name: student_code_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_code_seq', 1295, true);


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
-- Name: idx_students_national_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_national_id ON public.students USING btree (national_id) WHERE (national_id IS NOT NULL);


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

\unrestrict WHcmNTLiq252sSsa20HqX6J7jI3MsZicPaxxlfVB1aiR5NcvMGke65uFFkZ1SUT

