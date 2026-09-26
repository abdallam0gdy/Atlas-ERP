import { pool } from '../src/config/db.js';

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Comprehensive Schedule & Package Billing Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as Admin
    console.log('--- 1. Authenticating Super Admin ---');
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.data?.token;
    assert(!!adminToken, 'Admin logged in and retrieved JWT');

    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    // 2. Database verification of imported schedules & teachers
    console.log('\n--- 2. Verifying Imported Schedules & Teachers ---');
    const groupsCountRes = await pool.query("SELECT COUNT(*) FROM groups WHERE status = 'active' OR status IS NULL");
    const totalGroups = parseInt(groupsCountRes.rows[0].count, 10);
    assert(totalGroups >= 120, `Total active groups in DB is ${totalGroups} (expected >= 120)`);

    const teachersCountRes = await pool.query('SELECT COUNT(*) FROM teachers WHERE is_active = true');
    const totalTeachers = parseInt(teachersCountRes.rows[0].count, 10);
    assert(totalTeachers >= 40, `Total active teachers in DB is ${totalTeachers} (expected >= 40)`);

    const packageGroupsCountRes = await pool.query('SELECT COUNT(*) FROM package_groups');
    const totalPackageLinks = parseInt(packageGroupsCountRes.rows[0].count, 10);
    assert(totalPackageLinks >= 150, `Total package-group links in DB is ${totalPackageLinks} (expected >= 150)`);

    // 3. Testing Private Groups vs Package Groups Filter in API
    console.log('\n--- 3. Testing Private Groups Filter (/api/groups?is_private=true/false) ---');
    // Ensure we have at least one private group for testing
    const ensurePrivateGroup = await pool.query(`
      SELECT g.id, g.name FROM groups g 
      WHERE NOT EXISTS (SELECT 1 FROM package_groups pg WHERE pg.group_id = g.id)
      LIMIT 1
    `);
    let privateGroupId = ensurePrivateGroup.rows[0]?.id;
    if (!privateGroupId) {
      // Create a test private group
      const teacherRes = await pool.query('SELECT id FROM teachers LIMIT 1');
      const subjectRes = await pool.query('SELECT id FROM subjects LIMIT 1');
      const gradeRes = await pool.query('SELECT id FROM academic_grades LIMIT 1');
      const newPrivateGroup = await pool.query(`
        INSERT INTO groups (name, grade_id, subject_id, teacher_id, price_per_session, price_per_month, max_students)
        VALUES ('مجموعة خاصة تجريبية (Private VIP)', $1, $2, $3, 100, 400, 10)
        RETURNING id
      `, [gradeRes.rows[0].id, subjectRes.rows[0].id, teacherRes.rows[0].id]);
      privateGroupId = newPrivateGroup.rows[0].id;
    }

    const privateGroupsRes = await fetch(`${API_URL}/groups?is_private=true`, { headers: adminHeaders });
    const privateGroupsData = await privateGroupsRes.json();
    assert(privateGroupsRes.status === 200, 'Fetched private groups successfully');
    assert(privateGroupsData.data?.length > 0, `Found ${privateGroupsData.data?.length} private groups`);
    const allPrivateArePrivate = privateGroupsData.data.every(g => g.is_private === true && g.is_in_package === false);
    assert(allPrivateArePrivate, 'Every group returned with is_private=true has is_private=true and is_in_package=false');

    const packageGroupsApiRes = await fetch(`${API_URL}/groups?is_private=false`, { headers: adminHeaders });
    const packageGroupsApiData = await packageGroupsApiRes.json();
    assert(packageGroupsApiRes.status === 200, 'Fetched package groups successfully');
    const allPkgArePkg = packageGroupsApiData.data.every(g => g.is_private === false && g.is_in_package === true);
    assert(allPkgArePkg, 'Every group returned with is_private=false has is_in_package=true');

    // 4. Test Package Structure & Subject Grouping
    console.log('\n--- 4. Testing Package Grade 4 (الصف الرابع الابتدائي) Structure ---');
    const grade4PkgRes = await pool.query(`
      SELECT gp.*, g.name_ar as grade_name 
      FROM grade_packages gp
      JOIN academic_grades g ON gp.grade_id = g.id
      WHERE g.name_ar LIKE '%الرابع%' AND gp.education_type = 'PUBLIC'
      LIMIT 1
    `);
    const testPackage = grade4PkgRes.rows[0];
    assert(!!testPackage, `Found Grade 4 Package: "${testPackage.name}" (Price: ${testPackage.package_price} EGP, Single: ${testPackage.single_subject_price} EGP)`);

    const pkgDetailsRes = await fetch(`${API_URL}/packages/${testPackage.id}/groups`, { headers: adminHeaders });
    const pkgDetailsData = await pkgDetailsRes.json();
    assert(pkgDetailsRes.status === 200, 'Fetched package groups successfully');
    
    // Group groups by subject
    const groupsList = pkgDetailsData.data || [];
    const subjectsMap = {};
    groupsList.forEach(g => {
      if (!subjectsMap[g.subject_id]) {
        subjectsMap[g.subject_id] = { name: g.subject_name, groups: [] };
      }
      subjectsMap[g.subject_id].groups.push(g);
    });
    const subjects = Object.values(subjectsMap);
    assert(subjects.length >= 5, `Package contains ${subjects.length} distinct subjects with groups`);
    console.log(`  ℹ️ Subjects in package: ${subjects.map(s => s.name).join(', ')}`);

    // 5. Test Full Package Enrollment (الباكدج الكامل)
    console.log('\n--- 5. Testing Full Package Enrollment (All Subjects Selected) ---');
    // Create test student 1
    const code1 = Math.floor(Math.random() * 800000) + 100000;
    const barcode1 = `ATL-T1-${code1}`;
    const student1Res = await pool.query(`
      INSERT INTO students (full_name, phone, grade_id, education_type, student_code, barcode_id)
      VALUES ('طالب باكدج كامل تجريبي', '01099998881', $1, 'PUBLIC', $2, $3)
      RETURNING id, full_name, student_code
    `, [testPackage.grade_id, code1, barcode1]);
    const student1 = student1Res.rows[0];

    // Pick 1 group for each subject
    const selectedFullGroupIds = subjects.map(s => s.groups[0].id);
    console.log(`  ℹ️ Selecting 1 group for all ${selectedFullGroupIds.length} subjects: [${selectedFullGroupIds.join(', ')}]`);

    const fullEnrollRes = await fetch(`${API_URL}/packages/${testPackage.id}/enroll`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        student_id: student1.id,
        group_ids: selectedFullGroupIds,
        discount_type: 'FIXED',
        discount_value: 30, // 30 EGP discount
        amount_paid: 200,   // Paid 200 EGP now
        initial_sessions: 4
      }),
    });
    const fullEnrollData = await fullEnrollRes.json();
    assert(fullEnrollRes.status === 200 || fullEnrollRes.status === 201, `Full package enrollment response: ${fullEnrollData.message}`);
    assert(fullEnrollData.data?.enrollment_type === 'PACKAGE', `Enrollment type marked as PACKAGE (Full Package)`);
    assert(fullEnrollData.data?.gross_price === Number(testPackage.package_price), `Gross price matches package_price: ${testPackage.package_price}`);
    const expectedNet = Number(testPackage.package_price) - 30;
    assert(fullEnrollData.data?.net_price === expectedNet, `Net price correctly subtracted discount: ${expectedNet}`);
    const expectedDebt = expectedNet - 200;
    assert(fullEnrollData.data?.debt_amount === expectedDebt, `Debt correctly calculated: ${expectedDebt}`);

    // Verify student_subscriptions rows
    const subs1 = await pool.query('SELECT * FROM student_subscriptions WHERE student_id = $1', [student1.id]);
    assert(subs1.rows.length === selectedFullGroupIds.length, `Created ${subs1.rows.length} subscription balances (1 per subject)`);
    const allHave4Sessions = subs1.rows.every(s => s.remaining_sessions === 4);
    assert(allHave4Sessions, 'All subscriptions charged with 4 sessions');

    // Verify treasury transaction
    const tx1 = await pool.query(`
      SELECT * FROM treasury_transactions 
      WHERE transaction_type = 'subscription_fee' 
      ORDER BY created_at DESC LIMIT 1
    `);
    assert(Number(tx1.rows[0].amount) === 200, `Treasury transaction recorded correctly with amount 200 EGP (Tx ID: ${tx1.rows[0].id})`);

    // 6. Test Partial / Center Subject Enrollment (مادة سنتر - منفردة)
    console.log('\n--- 6. Testing Center Subject Enrollment (Fewer Subjects Selected) ---');
    // Create test student 2
    const code2 = Math.floor(Math.random() * 800000) + 100000;
    const barcode2 = `ATL-T2-${code2}`;
    const student2Res = await pool.query(`
      INSERT INTO students (full_name, phone, grade_id, education_type, student_code, barcode_id)
      VALUES ('طالب مواد سنتر تجريبي', '01099998882', $1, 'PUBLIC', $2, $3)
      RETURNING id, full_name, student_code
    `, [testPackage.grade_id, code2, barcode2]);
    const student2 = student2Res.rows[0];

    // Pick only 2 subjects out of 5
    const selectedCenterGroupIds = subjects.slice(0, 2).map(s => s.groups[0].id);
    console.log(`  ℹ️ Selecting only 2 groups (Center Subjects): [${selectedCenterGroupIds.join(', ')}]`);

    const singleSubPrice = Number(testPackage.single_subject_price);
    const expectedCenterGross = singleSubPrice * 2;

    const centerEnrollRes = await fetch(`${API_URL}/packages/${testPackage.id}/enroll`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        student_id: student2.id,
        group_ids: selectedCenterGroupIds,
        discount_type: 'PERCENT',
        discount_value: 10, // 10% discount
        amount_paid: 100,
        initial_sessions: 4
      }),
    });
    const centerEnrollData = await centerEnrollRes.json();
    assert(centerEnrollRes.status === 200 || centerEnrollRes.status === 201, `Center subject enrollment response: ${centerEnrollData.message}`);
    assert(centerEnrollData.data?.enrollment_type === 'CENTER_SUBJECT', `Enrollment type marked as CENTER_SUBJECT`);
    assert(centerEnrollData.data?.gross_price === expectedCenterGross, `Gross price calculated as single_subject_price * 2 (${singleSubPrice} * 2 = ${expectedCenterGross})`);
    const expectedCenterNet = expectedCenterGross * 0.9;
    assert(centerEnrollData.data?.net_price === expectedCenterNet, `Net price correctly discounted 10%: ${expectedCenterNet}`);

    const subs2 = await pool.query('SELECT * FROM student_subscriptions WHERE student_id = $1', [student2.id]);
    assert(subs2.rows.length === 2, `Created exactly 2 subscription balances for the selected center subjects`);

    // 7. Test Private Group Enrollment (/api/subscriptions/groups/enroll)
    console.log('\n--- 7. Testing Private Group Enrollment ---');
    const code3 = Math.floor(Math.random() * 800000) + 100000;
    const barcode3 = `ATL-T3-${code3}`;
    const student3Res = await pool.query(`
      INSERT INTO students (full_name, phone, grade_id, education_type, student_code, barcode_id)
      VALUES ('طالب برايفت تجريبي', '01099998883', $1, 'PUBLIC', $2, $3)
      RETURNING id, full_name, student_code
    `, [testPackage.grade_id, code3, barcode3]);
    const student3 = student3Res.rows[0];

    const privateEnrollRes = await fetch(`${API_URL}/subscriptions/enroll`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        student_id: student3.id,
        group_id: privateGroupId,
        enrollment_type: 'PRIVATE',
        discount_type: 'FIXED',
        discount_value: 20,
        sessions_count: 8,
        amount_paid: 150
      }),
    });
    const privateEnrollData = await privateEnrollRes.json();
    assert(privateEnrollRes.status === 200 || privateEnrollRes.status === 201, `Private group enrollment response: ${privateEnrollData.message}`);
    
    const subPvt = await pool.query('SELECT * FROM student_subscriptions WHERE student_id = $1 AND group_id = $2', [student3.id, privateGroupId]);
    assert(subPvt.rows.length === 1, 'Created private group subscription');
    assert(subPvt.rows[0].remaining_sessions === 8, 'Private group subscription credited with 8 sessions');

    // 8. Clean up test students
    console.log('\n--- 8. Cleaning up test students ---');
    await pool.query('DELETE FROM students WHERE id IN ($1, $2, $3)', [student1.id, student2.id, student3.id]);
    console.log('  🧹 Test student records cleaned up successfully.');

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Test suite crashed with error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
