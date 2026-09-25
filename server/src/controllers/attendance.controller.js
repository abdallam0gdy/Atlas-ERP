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

module.exports = { scanAttendance, getTodayAttendance, lookupStudent };
