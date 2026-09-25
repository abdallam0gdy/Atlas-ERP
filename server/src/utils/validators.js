const Joi = require('joi');

// ============================================================
// Reusable validation schemas for Atlas ERP
// ============================================================

// Common patterns
const uuidPattern = Joi.string().uuid({ version: 'uuidv4' });
const phonePattern = Joi.string().pattern(/^[0-9+\-\s]{8,20}$/);
const barcodePattern = Joi.string().pattern(/^ATL-G\d{2}-\d{4,}$/);

// Auth
const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(3).max(128).required(),
});

// Student
const createStudentSchema = Joi.object({
  full_name: Joi.string().min(2).max(150).required().messages({
    'string.empty': 'اسم الطالب مطلوب',
    'any.required': 'اسم الطالب مطلوب',
  }),
  full_name_ar: Joi.string().max(150).allow('', null),
  phone: phonePattern.required().messages({
    'string.empty': 'رقم موبايل الطالب مطلوب',
    'string.pattern.base': 'رقم موبايل الطالب غير صحيح',
    'any.required': 'رقم موبايل الطالب مطلوب',
  }),
  parent_phone: phonePattern.required().messages({
    'string.empty': 'رقم ولي الأمر مطلوب',
    'string.pattern.base': 'رقم ولي الأمر غير صحيح',
    'any.required': 'رقم ولي الأمر مطلوب',
  }),
  parent_name: Joi.string().min(2).max(150).required().messages({
    'string.empty': 'اسم ولي الأمر مطلوب',
    'any.required': 'اسم ولي الأمر مطلوب',
  }),
  grade_id: uuidPattern.required().messages({
    'string.empty': 'المرحلة الدراسية مطلوبة',
    'any.required': 'المرحلة الدراسية مطلوبة',
  }),
  status_id: uuidPattern.allow('', null),
  billing_model: Joi.string().valid('PACKAGE_BUNDLE', 'PER_SUBJECT').default('PACKAGE_BUNDLE').allow('', null),
  education_type: Joi.string().valid('PUBLIC', 'LANGUAGES').default('PUBLIC'),
  enrollment_type: Joi.string().valid('PACKAGE', 'PRIVATE').default('PACKAGE'),
  photo_url: Joi.string().uri().max(500).allow('', null),
  address: Joi.string().max(500).allow('', null),
  notes: Joi.string().max(1000).allow('', null),
  group_ids: Joi.array().items(uuidPattern.allow('', null)).optional(),
});

const updateStudentSchema = createStudentSchema.fork(
  ['full_name', 'phone', 'parent_phone', 'parent_name', 'grade_id', 'education_type', 'enrollment_type'],
  (field) => field.optional()
);

// Teacher
const createTeacherSchema = Joi.object({
  full_name: Joi.string().min(2).max(150).required(),
  full_name_ar: Joi.string().max(150).allow('', null),
  phone: phonePattern.allow('', null),
  email: Joi.string().email().max(100).allow('', null),
  specialization: Joi.string().max(100).allow('', null),
  subject_id: uuidPattern.allow('', null),
  subject_ids: Joi.array().items(uuidPattern).optional(),
  revenue_split_percent: Joi.number().min(0).max(100).default(0),
  revenue_split_type: Joi.string().valid('percentage', 'fixed', 'hybrid').default('percentage'),
  fixed_rate_per_student: Joi.number().min(0).default(0),
  notes: Joi.string().max(1000).allow('', null),
});

// Group
const scheduleSlotSchema = Joi.object({
  day: Joi.string().valid('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday').required(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
});

const createGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  name_ar: Joi.string().max(100).allow('', null),
  teacher_id: uuidPattern.required(),
  subject_id: uuidPattern.required(),
  grade_id: uuidPattern.required(),
  classroom_id: uuidPattern.allow('', null),
  schedule: Joi.array().items(scheduleSlotSchema).min(1).required(),
  price_per_month: Joi.number().min(0).default(0),
  price_per_session: Joi.number().min(0).default(0),
  max_students: Joi.number().integer().min(1).max(10000).default(30),
  package_teacher_ratio: Joi.number().min(0).max(100).default(0),
  package_center_ratio: Joi.number().min(0).max(100).default(100),
  private_teacher_ratio: Joi.number().min(0).max(100).default(75),
  private_center_ratio: Joi.number().min(0).max(100).default(25),
});

// Barcode batch generation
const generateBarcodeSchema = Joi.object({
  batch_name: Joi.string().min(2).max(100).required(),
  grade_id: uuidPattern.required(),
  count: Joi.number().integer().min(1).max(1000).required(),
  start_from: Joi.number().integer().min(1).default(1),
});

// Barcode assign
const assignBarcodeSchema = Joi.object({
  barcode_value: Joi.string().max(30).required(),
  student_id: uuidPattern.required(),
});

// Attendance scan
const attendanceScanSchema = Joi.object({
  barcode_id: Joi.string().max(30).required(),
});

// Pagination
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
  search: Joi.string().max(100).allow('', null),
  sort_by: Joi.string().max(50).default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
  grade_id: uuidPattern.allow('', null),
  is_active: Joi.boolean().allow(null),
});

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'البيانات المدخلة غير صحيحة',
        details,
      });
    }

    // Replace source data with validated & sanitized values
    if (source === 'body') req.body = value;
    else if (source === 'query') req.query = value;
    else req.params = value;

    next();
  };
};

module.exports = {
  loginSchema,
  createStudentSchema,
  updateStudentSchema,
  createTeacherSchema,
  createGroupSchema,
  generateBarcodeSchema,
  assignBarcodeSchema,
  attendanceScanSchema,
  paginationSchema,
  validate,
};
