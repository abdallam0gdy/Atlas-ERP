const db = require('../config/db');

/**
 * Barcode Service — Handles batch generation and card assignment
 * Designed for sequential barcode pattern: ATL-G{grade}-{seq}
 */
class BarcodeService {
  /**
   * Generate a batch of sequential barcodes for a specific grade
   * @param {Object} params - { batch_name, grade_id, count, start_from, generated_by }
   * @returns {Object} batch info with generated barcode items
   */
  static async generateBatch({ batch_name, grade_id, count, start_from, generated_by }) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Get grade order for barcode pattern
      const gradeResult = await client.query(
        'SELECT grade_order, name_ar FROM academic_grades WHERE id = $1',
        [grade_id]
      );

      if (gradeResult.rows.length === 0) {
        throw new Error('المرحلة الدراسية غير موجودة');
      }

      const gradeOrder = gradeResult.rows[0].grade_order;
      const gradeStr = String(gradeOrder).padStart(2, '0');
      const endSequence = start_from + count - 1;

      // Create batch record
      const batchResult = await client.query(
        `INSERT INTO barcode_batches (batch_name, prefix, grade_id, start_sequence, end_sequence, status, generated_by)
         VALUES ($1, 'ATL', $2, $3, $4, 'generated', $5)
         RETURNING *`,
        [batch_name, grade_id, start_from, endSequence, generated_by]
      );

      const batch = batchResult.rows[0];

      // Generate individual barcode items
      const barcodeItems = [];
      for (let seq = start_from; seq <= endSequence; seq++) {
        const barcodeValue = `ATL-G${gradeStr}-${String(seq).padStart(4, '0')}`;
        barcodeItems.push(barcodeValue);
      }

      // Bulk insert barcode items
      if (barcodeItems.length > 0) {
        const valueStrings = barcodeItems.map(
          (_, i) => `($1, $${i + 2}, 'unassigned')`
        );
        const values = [batch.id, ...barcodeItems];

        await client.query(
          `INSERT INTO barcode_items (batch_id, barcode_value, status)
           VALUES ${valueStrings.join(', ')}
           ON CONFLICT (barcode_value) DO NOTHING`,
          values
        );
      }

      await client.query('COMMIT');

      return {
        batch,
        barcodes: barcodeItems,
        gradeName: gradeResult.rows[0].name_ar,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Assign a pre-printed barcode card to a student
   * @param {string} barcodeValue - The barcode string on the card
   * @param {string} studentId - UUID of the student
   * @returns {Object} updated barcode item
   */
  static async assignCard(barcodeValue, studentId) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Check barcode exists and is unassigned
      const barcodeResult = await client.query(
        `SELECT bi.*, bb.grade_id FROM barcode_items bi
         JOIN barcode_batches bb ON bi.batch_id = bb.id
         WHERE bi.barcode_value = $1`,
        [barcodeValue]
      );

      if (barcodeResult.rows.length === 0) {
        throw new Error('الباركود غير موجود في النظام');
      }

      const barcode = barcodeResult.rows[0];

      if (barcode.status === 'assigned') {
        throw new Error('الباركود مربوط بطالب آخر بالفعل');
      }

      if (barcode.status === 'damaged') {
        throw new Error('الباركود تالف ولا يمكن استخدامه');
      }

      // Assign to student
      await client.query(
        `UPDATE barcode_items SET status = 'assigned', assigned_to = $1, assigned_at = NOW()
         WHERE id = $2`,
        [studentId, barcode.id]
      );

      // Update student's barcode_id
      await client.query(
        'UPDATE students SET barcode_id = $1 WHERE id = $2',
        [barcodeValue, studentId]
      );

      // Update batch assigned count
      await client.query(
        `UPDATE barcode_batches SET 
           assigned_count = (SELECT COUNT(*) FROM barcode_items WHERE batch_id = $1 AND status = 'assigned'),
           status = CASE 
             WHEN (SELECT COUNT(*) FROM barcode_items WHERE batch_id = $1 AND status = 'assigned') 
                  = (SELECT COUNT(*) FROM barcode_items WHERE batch_id = $1) 
             THEN 'fully_assigned'::batch_status_enum
             ELSE 'partially_assigned'::batch_status_enum
           END
         WHERE id = $1`,
        [barcode.batch_id]
      );

      await client.query('COMMIT');

      return {
        barcode_value: barcodeValue,
        student_id: studentId,
        status: 'assigned',
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get all batches with summary info
   */
  static async listBatches() {
    const result = await db.query(
      `SELECT bb.*, ag.name_ar as grade_name, ag.grade_order,
              u.full_name as generated_by_name
       FROM barcode_batches bb
       LEFT JOIN academic_grades ag ON bb.grade_id = ag.id
       LEFT JOIN users u ON bb.generated_by = u.id
       ORDER BY bb.created_at DESC`
    );
    return result.rows;
  }

  /**
   * Get barcode items for a specific batch
   */
  static async getBatchItems(batchId) {
    const result = await db.query(
      `SELECT bi.*, s.full_name as student_name
       FROM barcode_items bi
       LEFT JOIN students s ON bi.assigned_to = s.id
       WHERE bi.batch_id = $1
       ORDER BY bi.barcode_value ASC`,
      [batchId]
    );
    return result.rows;
  }
}

module.exports = BarcodeService;
