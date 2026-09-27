const AttendanceService = require('../services/attendance.service');

/**
 * POST /api/attendance/scan
 * ✨ THE MAIN GATE ENDPOINT — Process barcode scan
 * Must respond in < 50ms for zero-latency feel
 */
const scanAttendance = async (req, res, next) => {
  try {
    const { barcode_id } = req.body;

    const result = await AttendanceService.processScan(barcode_id, req.user.id);

    // Set appropriate HTTP status based on result type
    const statusCode = result.success ? 200 : (result.type === 'NOT_FOUND' ? 404 : 400);

    res.status(statusCode).json({
      success: result.success,
      type: result.type,
      message: result.message,
      data: {
        student: result.student || null,
        sessions: result.sessions || [],
        isMultiSession: result.isMultiSession || false,
        needsPayment: result.needsPayment || false,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/attendance/today
 * Get today's attendance log with summary stats
 */
const getTodayAttendance = async (req, res, next) => {
  try {
    const result = await AttendanceService.getTodaySummary();

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/attendance/lookup?code=...
 * Preview student details, today's classes and status before manual confirmation
 */
const lookupStudent = async (req, res, next) => {
  try {
    const code = req.query.code || req.body.code;
    const result = await AttendanceService.lookupStudent(code);

    const statusCode = result.success ? 200 : (result.type === 'NOT_FOUND' ? 404 : 400);
    res.status(statusCode).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/attendance/process-absences
 * Process absences for sessions that have ended, counting against absent students
 * and deducting sessions from active subscriptions.
 */
const processAbsences = async (req, res, next) => {
  try {
    const { date, group_id } = req.body;
    const result = await AttendanceService.processAbsencesForPassedSessions({
      targetDate: date,
      groupId: group_id,
    });

    res.json({
      success: true,
      message: result.processedCount > 0
        ? `تم تسجيل غياب ${result.processedCount} طالب بنجاح (تم خصم ${result.deductedCount} حصة من الاشتراكات)`
        : 'تم فحص الحصص — لا يوجد غياب غير مسجل للحصص المنتهية',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/attendance/:id/excuse
 * Excuse an absent session and refund the deducted session back to subscription
 */
const excuseAbsence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await AttendanceService.excuseAbsence(id, req.user?.id, reason);

    res.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  scanAttendance,
  getTodayAttendance,
  lookupStudent,
  processAbsences,
  excuseAbsence,
};
