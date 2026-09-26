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

/**
 * GET /api/packages/:id/groups
 * List all groups currently linked to this package, grouped/annotated with subjects
 */
const getPackageGroups = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT g.*, 
              s.id as subject_id, s.name_ar as subject_name, s.color as subject_color,
              t.id as teacher_id, t.full_name as teacher_name, t.photo_url as teacher_photo,
              cr.name as classroom_name,
              (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.group_id = g.id AND ge.is_active = true) as student_count
       FROM package_groups pg
       JOIN groups g ON pg.group_id = g.id
       LEFT JOIN subjects s ON g.subject_id = s.id
       LEFT JOIN teachers t ON g.teacher_id = t.id
       LEFT JOIN classrooms cr ON g.classroom_id = cr.id
       WHERE pg.package_id = $1
       ORDER BY s.name_ar ASC, g.name ASC`,
      [id]
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
 * GET /api/packages/:id/available-groups
 * List grade groups not yet added to this package
 */
const getAvailableGroupsForPackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pkgRes = await db.query('SELECT grade_id FROM grade_packages WHERE id = $1', [id]);
    if (pkgRes.rows.length === 0) {
      throw new NotFoundError('الباكدج غير موجود');
    }
    const gradeId = pkgRes.rows[0].grade_id;

    const result = await db.query(
      `SELECT g.*, 
              s.id as subject_id, s.name_ar as subject_name, s.color as subject_color,
              t.id as teacher_id, t.full_name as teacher_name,
              cr.name as classroom_name,
              (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.group_id = g.id AND ge.is_active = true) as student_count
       FROM groups g
       LEFT JOIN subjects s ON g.subject_id = s.id
       LEFT JOIN teachers t ON g.teacher_id = t.id
       LEFT JOIN classrooms cr ON g.classroom_id = cr.id
       WHERE g.grade_id = $1
         AND g.id NOT IN (SELECT group_id FROM package_groups WHERE package_id = $2)
       ORDER BY s.name_ar ASC, g.name ASC`,
      [gradeId, id]
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
 * POST /api/packages/:id/groups
 * Add candidate groups to package
 */
const addGroupsToPackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { group_ids } = req.body;

    if (!Array.isArray(group_ids) || group_ids.length === 0) {
      throw new BadRequestError('يرجى تحديد المجموعات المطلوب إضافتها');
    }

    for (const gid of group_ids) {
      await db.query(
        `INSERT INTO package_groups (package_id, group_id)
         VALUES ($1, $2)
         ON CONFLICT (package_id, group_id) DO NOTHING`,
        [id, gid]
      );
    }

    res.json({
      success: true,
      message: `تم إضافة ${group_ids.length} مجموعة للباكدج بنجاح`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/packages/:id/groups/:groupId
 * Remove a group from package
 */
const removeGroupFromPackage = async (req, res, next) => {
  try {
    const { id, groupId } = req.params;
    await db.query('DELETE FROM package_groups WHERE package_id = $1 AND group_id = $2', [id, groupId]);
    res.json({
      success: true,
      message: 'تم إزالة المجموعة من الباكدج بنجاح',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/packages/:id/enroll
 * Enroll student into package bundle with 1-group-per-subject constraint
 */
const enrollStudentInPackage = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const {
      student_id,
      selected_group_ids,
      group_ids,
      discount_type = 'FIXED',
      discount_value = 0,
      amount_paid = 0,
      sessions_count = 4,
      initial_sessions,
      billing_month,
      notes,
    } = req.body;

    const actualGroupIds = selected_group_ids || group_ids;
    const actualSessions = initial_sessions !== undefined ? initial_sessions : sessions_count;

    if (!student_id) {
      throw new BadRequestError('الطالب مطلوب');
    }
    if (!Array.isArray(actualGroupIds) || actualGroupIds.length === 0) {
      throw new BadRequestError('يرجى اختيار مجموعة واحدة على الأقل');
    }

    // 1. Get package
    const pkgRes = await client.query('SELECT * FROM grade_packages WHERE id = $1', [id]);
    if (pkgRes.rows.length === 0) {
      throw new NotFoundError('الباكدج');
    }
    const pkg = pkgRes.rows[0];

    // 2. Get student
    const studentRes = await client.query('SELECT * FROM students WHERE id = $1', [student_id]);
    if (studentRes.rows.length === 0) {
      throw new NotFoundError('الطالب');
    }
    const student = studentRes.rows[0];

    // 3. Get all groups belonging to this package
    const pkgGroupsRes = await client.query(
      `SELECT g.id, g.name, g.subject_id, s.name_ar as subject_name, g.price_per_month
       FROM package_groups pg
       JOIN groups g ON pg.group_id = g.id
       JOIN subjects s ON g.subject_id = s.id
       WHERE pg.package_id = $1`,
      [id]
    );

    if (pkgGroupsRes.rows.length === 0) {
      throw new BadRequestError('هذا الباكدج لا يحتوي على مجموعات بعد. أضف مجموعات للباكدج أولاً');
    }

    const allPkgGroups = pkgGroupsRes.rows;
    const pkgGroupMap = new Map(allPkgGroups.map(g => [g.id, g]));

    // Check all required subjects in package
    const requiredSubjectMap = new Map();
    for (const g of allPkgGroups) {
      if (!requiredSubjectMap.has(g.subject_id)) {
        requiredSubjectMap.set(g.subject_id, g.subject_name);
      }
    }

    // 4. Validate selected groups: exactly one group per subject!
    const selectedSubjects = new Map();
    for (const groupId of actualGroupIds) {
      const grp = pkgGroupMap.get(groupId);
      if (!grp) {
        throw new BadRequestError(`إحدى المجموعات المحددة لا تنتمي لهذا الباكدج`);
      }
      if (selectedSubjects.has(grp.subject_id)) {
        const dupSubject = grp.subject_name;
        throw new BadRequestError(`لا يمكن اختيار أكثر من مجموعة واحدة لنفس المادة (${dupSubject}) في هذا الباكدج`);
      }
      selectedSubjects.set(grp.subject_id, grp);
    }

    // 5. Automatic Pricing Logic:
    // If student selected all subjects -> Full Package Price
    // If student selected fewer subjects -> Center Single Subject Price * count
    const totalRequiredSubjects = requiredSubjectMap.size;
    const selectedCount = selectedSubjects.size;
    const isFullPackage = selectedCount === totalRequiredSubjects;

    const packagePriceNum = parseFloat(pkg.package_price) || 0;
    const singlePriceNum = parseFloat(pkg.single_subject_price) || 0;

    let grossPrice = 0;
    let enrollmentCategory = '';
    if (isFullPackage) {
      grossPrice = packagePriceNum;
      enrollmentCategory = 'الباكدج الكامل';
    } else {
      grossPrice = singlePriceNum * selectedCount;
      enrollmentCategory = `مواد سنتر منفردة (${selectedCount} مادة)`;
    }

    // 6. Discount & Net Price Calculation
    const discType = discount_type === 'PERCENT' ? 'PERCENT' : 'FIXED';
    const discVal = Math.max(0, parseFloat(discount_value) || 0);
    const discountAmount = discType === 'PERCENT'
      ? Math.min(grossPrice, Math.round((grossPrice * discVal) / 100))
      : Math.min(grossPrice, discVal);

    const netPrice = Math.max(0, grossPrice - discountAmount);
    const paidNum = Math.min(netPrice, Math.max(0, parseFloat(amount_paid) || 0));
    const dueNum = Math.max(0, netPrice - paidNum);
    const sessionsNum = Math.max(1, parseInt(actualSessions, 10) || 4);
    const currentMonth = billing_month || new Date().toISOString().slice(0, 7);

    // 7. Insert into student_package_enrollments
    const enrollNotes = notes || `${enrollmentCategory} - إجمالي السعر: ${grossPrice} ج.م - الخصم: ${discountAmount} ج.م - الصافي: ${netPrice} ج.م`;
    const enrollRes = await client.query(
      `INSERT INTO student_package_enrollments (student_id, package_id, selected_group_ids, total_price, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [student_id, id, actualGroupIds, netPrice, enrollNotes]
    );

    const packageEnrollmentId = enrollRes.rows[0].id;

    // 8. Enroll student in each selected group & create student_subscriptions
    const perGroupPaid = (paidNum / actualGroupIds.length).toFixed(2);
    const perGroupDue = (dueNum / actualGroupIds.length).toFixed(2);

    for (const groupId of actualGroupIds) {
      // Upsert group_enrollments with persistent discount
      await client.query(
        `INSERT INTO group_enrollments (student_id, group_id, is_active, enrollment_type, discount_type, discount_value)
         VALUES ($1, $2, true, 'PACKAGE', $3, $4)
         ON CONFLICT (student_id, group_id) DO UPDATE 
         SET is_active = true, enrollment_type = 'PACKAGE', discount_type = $3, discount_value = $4`,
        [student_id, groupId, discType, discVal]
      );

      // Create subscription credit record
      await client.query(
        `INSERT INTO student_subscriptions (
          student_id, group_id, total_sessions, used_sessions,
          amount_paid, amount_due, status, billing_month, enrollment_type,
          discount_type, discount_value, notes
        ) VALUES ($1, $2, $3, 0, $4, $5, 'active', $6, 'PACKAGE', $7, $8, $9)`,
        [
          student_id,
          groupId,
          sessionsNum,
          perGroupPaid,
          perGroupDue,
          currentMonth,
          discType,
          discVal,
          `اشتراك ${enrollmentCategory} - باكدج: ${pkg.name}`,
        ]
      );
    }

    // 9. If money was collected, record into treasury_transactions
    if (paidNum > 0) {
      await client.query(
        `INSERT INTO treasury_transactions 
         (transaction_type, amount, reference_id, notes, recorded_by)
         VALUES ('subscription_fee', $1, $2, $3, $4)`,
        [
          paidNum,
          packageEnrollmentId,
          `تحصيل اشتراك ${enrollmentCategory} (${paidNum} ج.م) - الطالب: ${student.full_name} (#${student.student_code})`,
          req.user.id,
        ]
      );
    }

    // 10. Audit log
    await client.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_data)
       VALUES ($1, 'ENROLL_PACKAGE', 'grade_packages', $2, $3)`,
      [
        req.user.id,
        id,
        JSON.stringify({
          student_id,
          selected_group_ids: actualGroupIds,
          category: enrollmentCategory,
          grossPrice,
          netPrice,
          paidNum,
          dueNum,
        }),
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `تم تسكين الطالب بنجاح في ${actualGroupIds.length} مجموعة (${enrollmentCategory}) وتفعيل الحصص والماليات`,
      data: {
        ...enrollRes.rows[0],
        enrollment_type: isFullPackage ? 'PACKAGE' : 'CENTER_SUBJECT',
        is_full_package: isFullPackage,
        category: enrollmentCategory,
        gross_price: grossPrice,
        net_price: netPrice,
        amount_paid: paidNum,
        debt_amount: dueNum,
        amount_due: dueNum,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /api/packages/:id/students
 * List all students enrolled in this package
 */
const getPackageStudents = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT spe.*,
              s.full_name as student_name, s.phone as student_phone, s.barcode_id, s.student_code, s.photo_url,
              (
                SELECT json_agg(json_build_object(
                  'id', g.id,
                  'name', g.name,
                  'subject_name', sub.name_ar,
                  'teacher_name', t.full_name
                ))
                FROM groups g
                LEFT JOIN subjects sub ON g.subject_id = sub.id
                LEFT JOIN teachers t ON g.teacher_id = t.id
                WHERE g.id = ANY(spe.selected_group_ids)
              ) as selected_groups
       FROM student_package_enrollments spe
       JOIN students s ON spe.student_id = s.id
       WHERE spe.package_id = $1
       ORDER BY spe.enrolled_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
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
  getPackageGroups,
  getAvailableGroupsForPackage,
  addGroupsToPackage,
  removeGroupFromPackage,
  enrollStudentInPackage,
  getPackageStudents,
};
