const db = require('../config/db');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * GET /api/pos/inventory
 * List inventory items with search & category filter
 */
const listInventory = async (req, res, next) => {
  try {
    const { category, search, low_stock } = req.query;

    let queryText = `
      SELECT 
        i.*,
        s.name_ar as subject_name,
        g.name_ar as grade_name
      FROM inventory_items i
      LEFT JOIN subjects s ON s.id = i.subject_id
      LEFT JOIN academic_grades g ON g.id = i.grade_id
      WHERE i.is_active = true
    `;
    const params = [];

    if (category) {
      params.push(category);
      queryText += ` AND i.category = $${params.length}`;
    }

    if (low_stock === 'true') {
      queryText += ` AND i.current_stock <= i.min_stock_alert`;
    }

    if (search) {
      params.push(`%${search}%`);
      queryText += ` AND (i.name ILIKE $${params.length} OR i.barcode ILIKE $${params.length})`;
    }

    queryText += ` ORDER BY i.current_stock ASC, i.name ASC`;

    const result = await db.query(queryText, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pos/inventory
 * Create new inventory item
 */
const createItem = async (req, res, next) => {
  try {
    const {
      name,
      category,
      barcode,
      subject_id,
      grade_id,
      cost_price,
      selling_price,
      current_stock,
      min_stock_alert,
    } = req.body;

    if (!name || selling_price === undefined) {
      throw new BadRequestError('اسم الصنف وسعر البيع مطلوبان');
    }

    const autoBarcode = barcode || ('ITM-' + Date.now().toString().slice(-6));

    const result = await db.query(
      `INSERT INTO inventory_items 
       (name, category, barcode, subject_id, grade_id, cost_price, selling_price, current_stock, min_stock_alert)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        category || 'booklet',
        autoBarcode,
        subject_id || null,
        grade_id || null,
        cost_price || 0,
        selling_price,
        current_stock || 0,
        min_stock_alert || 5,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'تم إضافة الصنف بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/pos/inventory/:id
 * Update inventory item
 */
const updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      barcode,
      subject_id,
      grade_id,
      cost_price,
      selling_price,
      current_stock,
      min_stock_alert,
      is_active,
    } = req.body;

    const check = await db.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      throw new NotFoundError('الصنف غير موجود');
    }

    const result = await db.query(
      `UPDATE inventory_items
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           barcode = COALESCE($3, barcode),
           subject_id = COALESCE($4, subject_id),
           grade_id = COALESCE($5, grade_id),
           cost_price = COALESCE($6, cost_price),
           selling_price = COALESCE($7, selling_price),
           current_stock = COALESCE($8, current_stock),
           min_stock_alert = COALESCE($9, min_stock_alert),
           is_active = COALESCE($10, is_active),
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        name,
        category,
        barcode,
        subject_id,
        grade_id,
        cost_price,
        selling_price,
        current_stock,
        min_stock_alert,
        is_active,
        id,
      ]
    );

    res.json({
      success: true,
      message: 'تم تحديث بيانات الصنف بنجاح',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/pos/inventory/:id
 * Soft delete item
 */
const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE inventory_items SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
    res.json({ success: true, message: 'تم حذف الصنف من المخزن بنجاح' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pos/sales
 * Complete a fast cashier POS sale
 */
const createSale = async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { items, student_id, discount = 0, paid_amount, payment_method = 'cash', notes } = req.body;
    const cashierId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('سلة المشتريات فارغة');
    }

    await client.query('BEGIN');

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      if (!item.id || !item.quantity || item.quantity <= 0) {
        throw new BadRequestError('بيانات بنود الفاتورة غير صحيحة');
      }
      subtotal += parseFloat(item.selling_price) * parseInt(item.quantity, 10);
    }

    const disc = Math.max(0, parseFloat(discount) || 0);
    const totalAmount = Math.max(0, subtotal - disc);
    const paid = paid_amount !== undefined ? parseFloat(paid_amount) : totalAmount;
    const change = Math.max(0, paid - totalAmount);

    const invoiceNo = 'INV-' + Date.now().toString().slice(-8);

    // 1. Insert pos_sales
    const saleRes = await client.query(
      `INSERT INTO pos_sales 
       (invoice_number, cashier_id, student_id, subtotal, discount, total_amount, paid_amount, change_amount, payment_method, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [invoiceNo, cashierId, student_id || null, subtotal, disc, totalAmount, paid, change, payment_method, notes || null]
    );

    const sale = saleRes.rows[0];

    // 2. Insert items & decrement stock
    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      const unitPrice = parseFloat(item.selling_price);
      const unitCost = parseFloat(item.cost_price || 0);
      const totalPrice = unitPrice * qty;

      await client.query(
        `INSERT INTO pos_sale_items (sale_id, item_id, item_name, quantity, unit_cost, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.id, item.id, item.name, qty, unitCost, unitPrice, totalPrice]
      );

      // Decrement stock
      await client.query(
        `UPDATE inventory_items 
         SET current_stock = GREATEST(0, current_stock - $1), updated_at = NOW()
         WHERE id = $2`,
        [qty, item.id]
      );
    }

    // 3. Log into treasury_transactions (actual cash collected in drawer)
    const cashCollected = Math.min(totalAmount, Math.max(0, paid));
    if (cashCollected > 0) {
      await client.query(
        `INSERT INTO treasury_transactions (transaction_type, amount, reference_id, notes, recorded_by)
         VALUES ('pos_sale', $1, $2, $3, $4)`,
        [cashCollected, sale.id, `مبيعات كاشير فاتورة #${invoiceNo}`, cashierId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'تم إتمام عملية البيع وطباعة الفاتورة بنجاح',
      data: {
        ...sale,
        items,
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
 * GET /api/pos/sales
 * List recent sales
 */
const listSales = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const result = await db.query(
      `SELECT 
         ps.*,
         u.full_name as cashier_name,
         s.full_name as student_name,
         s.student_code,
         (SELECT COUNT(*) FROM pos_sale_items psi WHERE psi.sale_id = ps.id) as items_count
       FROM pos_sales ps
       JOIN users u ON u.id = ps.cashier_id
       LEFT JOIN students s ON s.id = ps.student_id
       ORDER BY ps.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pos/sales/:id
 * Get single sale with its items
 */
const getSaleDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const saleRes = await db.query(
      `SELECT ps.*, u.full_name as cashier_name, s.full_name as student_name, s.student_code
       FROM pos_sales ps
       JOIN users u ON u.id = ps.cashier_id
       LEFT JOIN students s ON s.id = ps.student_id
       WHERE ps.id = $1`,
      [id]
    );

    if (saleRes.rows.length === 0) {
      throw new NotFoundError('الفاتورة غير موجودة');
    }

    const itemsRes = await db.query(
      'SELECT * FROM pos_sale_items WHERE sale_id = $1',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...saleRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listInventory,
  createItem,
  updateItem,
  deleteItem,
  createSale,
  listSales,
  getSaleDetails,
};
