const db = require('../config/db');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * GET /api/packages
 * List all grade packages with academic grade details
 */
const listPackages = async (req, res, next) => {
  try {
    const { grade_id, education_type } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (grade_id) {
      params.push(grade_id);
      whereClause += ` AND gp.grade_id = $${params.length}`;
    }

    if (education_type) {
      params.push(education_type);
      whereClause += ` AND gp.education_type = $${params.length}`;
    }

    const result = await db.query(
      `SELECT gp.*, 
              ag.name_ar as grade_name, 
              ag.grade_order
       FROM grade_packages gp
       JOIN academic_grades ag ON gp.grade_id = ag.id
       ${whereClause}
       ORDER BY ag.grade_order ASC, gp.education_type ASC`,
      params
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/packages/:id
 */
const getPackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT gp.*, 
              ag.name_ar as grade_name, 
              ag.grade_order
       FROM grade_packages gp
       JOIN academic_grades ag ON gp.grade_id = ag.id
       WHERE gp.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('باقة المرحلة الدراسية غير موجودة');
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/packages
 */
const createPackage = async (req, res, next) => {
  try {
    const { name, grade_id, education_type, package_price, single_subject_price, notes } = req.body;

    if (!name || !grade_id) {
      throw new BadRequestError('اسم الباقة والمرحلة الدراسية مطلوبان');
    }

    const result = await db.query(
      `INSERT INTO grade_packages (name, grade_id, education_type, package_price, single_subject_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        grade_id,
        education_type || 'PUBLIC',
        parseFloat(package_price) || 0,
        parseFloat(single_subject_price) || 0,
        notes || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'تم إضافة باقة المرحلة بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/packages/:id
 */
const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, package_price, single_subject_price, is_active, notes } = req.body;

    const fields = [];
    const values = [];
    let paramIdx = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramIdx++}`);
      values.push(name);
    }
    if (package_price !== undefined) {
      fields.push(`package_price = $${paramIdx++}`);
      values.push(Math.max(0, parseFloat(package_price) || 0));
    }
    if (single_subject_price !== undefined) {
      fields.push(`single_subject_price = $${paramIdx++}`);
      values.push(Math.max(0, parseFloat(single_subject_price) || 0));
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${paramIdx++}`);
      values.push(Boolean(is_active));
    }
    if (notes !== undefined) {
      fields.push(`notes = $${paramIdx++}`);
      values.push(notes);
    }

    if (fields.length === 0) {
      throw new BadRequestError('لا توجد بيانات للتعديل');
    }

    values.push(id);
    const result = await db.query(
      `UPDATE grade_packages 
       SET ${fields.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIdx} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('باقة المرحلة غير موجودة');
    }

    res.json({
      success: true,
      message: 'تم تحديث أسعار باقة المرحلة بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
};
