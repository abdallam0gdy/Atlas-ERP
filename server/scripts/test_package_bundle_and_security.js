const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Comprehensive Package Bundle & Security Test Suite...\n');
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
    // 1. Auth Admin
    console.log('--- 1. Authenticating as Super Admin ---');
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.data?.token;
    assert(!!adminToken, 'Admin logged in and obtained token');

    const adminHeaders = {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    // 2. Security Test: Restricted User
    console.log('\n--- 2. Testing Page-Level API Security & RBAC Guards ---');
    // Login as reception
    const receptionLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'reception', password: 'Atlas@2024' }),
    });
    const receptionData = await receptionLoginRes.json();
    const receptionToken = receptionData.data?.token;
    const allowedPages = receptionData.data?.user?.role?.allowedPages || [];
    console.log(`  ℹ️ Receptionist role allowed pages: [${allowedPages.join(', ')}]`);

    const receptionHeaders = {
      Authorization: `Bearer ${receptionToken}`,
      'Content-Type': 'application/json',
    };

    // Receptionist trying to access finance API (NOT in allowed pages)
    const financeAccessRes = await fetch(`${API_URL}/finance/treasury-stats`, {
      headers: receptionHeaders,
    });
    const financeAccessJson = await financeAccessRes.json();
    assert(financeAccessRes.status === 403, `Accessing /api/finance without permission returned 403 Forbidden (status: ${financeAccessRes.status})`);
    assert(financeAccessJson.code === 'FORBIDDEN', `Returned code: FORBIDDEN`);

    // Receptionist trying to access users management API (Strictly SUPER_ADMIN_OWNER)
    const usersAccessRes = await fetch(`${API_URL}/users`, {
      headers: receptionHeaders,
    });
    assert(usersAccessRes.status === 403, `Accessing /api/users by non-admin returned 403 Forbidden (status: ${usersAccessRes.status})`);

    // Admin accessing finance API
    const adminFinanceRes = await fetch(`${API_URL}/finance/treasury-stats`, {
      headers: adminHeaders,
    });
    assert(adminFinanceRes.status === 200, `Super Admin accessed /api/finance/treasury-stats successfully (200 OK)`);

    // 3. Package Bundle System: Structure & Linking
    console.log('\n--- 3. Testing Package Bundle System ---');
    const packagesRes = await fetch(`${API_URL}/packages`, { headers: adminHeaders });
    const packagesData = await packagesRes.json();
    const testPackage = packagesData.data?.find(p => p.education_type === 'PUBLIC') || packagesData.data?.[0];
    assert(!!testPackage, `Selected Test Package: "${testPackage.name}" (${testPackage.grade_name})`);

    // Fetch candidate groups
    const availableGroupsRes = await fetch(`${API_URL}/packages/${testPackage.id}/available-groups`, {
      headers: adminHeaders,
    });
    const availableGroupsData = await availableGroupsRes.json();
    assert(availableGroupsRes.status === 200, `Fetched available groups for package grade (found: ${availableGroupsData.data?.length || 0})`);

    let candidateGroupIds = [];
    if (availableGroupsData.data && availableGroupsData.data.length > 0) {
      candidateGroupIds = availableGroupsData.data.slice(0, 3).map(g => g.id);
      const addGroupsRes = await fetch(`${API_URL}/packages/${testPackage.id}/groups`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ group_ids: candidateGroupIds }),
      });
      const addGroupsJson = await addGroupsRes.json();
      assert(addGroupsRes.status === 200, `Added candidate groups to package: ${addGroupsJson.message}`);
    }

    // Fetch package groups
    const pkgGroupsRes = await fetch(`${API_URL}/packages/${testPackage.id}/groups`, {
      headers: adminHeaders,
    });
    const pkgGroupsData = await pkgGroupsRes.json();
    const currentPkgGroups = pkgGroupsData.data || [];
    assert(pkgGroupsRes.status === 200, `Fetched linked package groups (count: ${currentPkgGroups.length})`);

    // 4. Testing 1-Group-per-Subject Constraint on Package Enrollment
    console.log('\n--- 4. Testing 1-Group-Per-Subject Constraint & Validation ---');
    
    // Create a student to test package enrollment
    const testStudentRes = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        full_name: 'طالب اختبار الباكدج الذكي',
        phone: `012${Math.floor(10000000 + Math.random() * 90000000)}`,
        grade_id: testPackage.grade_id,
        education_type: testPackage.education_type,
        enrollment_type: 'PACKAGE',
      }),
    });
    const testStudentData = await testStudentRes.json();
    const studentId = testStudentData.data?.id;
    assert(!!studentId, `Created temporary student for package enrollment (#${testStudentData.data?.student_code})`);

    if (currentPkgGroups.length >= 2) {
      // Find two groups with the SAME subject if possible, or simulate duplicate
      const firstGroup = currentPkgGroups[0];
      const secondGroup = currentPkgGroups[1];

      // A) Duplicate group in selection test
      const dupRes = await fetch(`${API_URL}/packages/${testPackage.id}/enroll`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          student_id: studentId,
          selected_group_ids: [firstGroup.id, firstGroup.id],
        }),
      });
      const dupJson = await dupRes.json();
      assert(dupRes.status === 400, `Selecting duplicate groups/subjects rejected with 400 Bad Request`);
      console.log(`     ℹ️ Rejection message: "${dupJson.message}"`);

      // B) Partial subject selection test (Now treated as Center Single Subject as requested)
      const partialRes = await fetch(`${API_URL}/packages/${testPackage.id}/enroll`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          student_id: studentId,
          selected_group_ids: [firstGroup.id],
        }),
      });
      const partialJson = await partialRes.json();
      const distinctSubjectsCount = new Set(currentPkgGroups.map(g => g.subject_id)).size;
      if (distinctSubjectsCount > 1) {
        assert(
          partialRes.status === 201 && partialJson.data?.enrollment_type === 'CENTER_SUBJECT',
          `Partial subject selection treated as Center Single Subject (status: ${partialRes.status})`
        );
        console.log(`     ℹ️ Enrollment message: "${partialJson.message}"`);
      }

      // C) Valid selection (pick exactly one group per distinct subject)
      const validGroupMap = new Map();
      for (const g of currentPkgGroups) {
        if (!validGroupMap.has(g.subject_id)) {
          validGroupMap.set(g.subject_id, g.id);
        }
      }
      const validGroupIds = Array.from(validGroupMap.values());

      const validEnrollRes = await fetch(`${API_URL}/packages/${testPackage.id}/enroll`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          student_id: studentId,
          selected_group_ids: validGroupIds,
          notes: 'اشتراك باكدج تجريبي من سكريبت الفحص',
        }),
      });
      const validEnrollJson = await validEnrollRes.json();
      assert(validEnrollRes.status === 201, `Valid package enrollment succeeded with 201 Created`);
      assert(validEnrollJson.success === true, `Message: "${validEnrollJson.message}"`);

      // Verify student enrolled in all selected groups
      const accountRes = await fetch(`${API_URL}/subscriptions/student-account/${studentId}`, {
        headers: adminHeaders,
      });
      const accountData = await accountRes.json();
      const enrolledGroupIds = (accountData.data?.groups || []).map(g => g.group_id);
      const allIncluded = validGroupIds.every(id => enrolledGroupIds.includes(id));
      assert(allIncluded, `Student automatically enrolled in all ${validGroupIds.length} package groups`);

      // Verify student shows in package students list
      const pkgStudentsRes = await fetch(`${API_URL}/packages/${testPackage.id}/students`, {
        headers: adminHeaders,
      });
      const pkgStudentsData = await pkgStudentsRes.json();
      const foundInPkg = pkgStudentsData.data?.some(st => st.student_id === studentId);
      assert(foundInPkg, `Student appears in package enrolled students list`);
    }

    // Clean up test student
    await fetch(`${API_URL}/students/${studentId}`, {
      method: 'DELETE',
      headers: adminHeaders,
    }).catch(() => {});

    console.log(`\n========================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal Test Error:', err);
    process.exit(1);
  }
}

runTests();
