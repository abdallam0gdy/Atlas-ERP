const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const API_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:5173';

async function runTests() {
  console.log('🚀 Starting Comprehensive Atlas ERP Enhancements Test Suite (Native Fetch)...\n');
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
    // 1. Auth Test
    console.log('--- 1. Authenticating as Admin ---');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
      }),
    });
    const loginJson = await loginRes.json();
    const token = loginJson.data?.token;
    assert(loginRes.status === 200 && !!token, 'Obtained JWT auth token');

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 2. Upload Image Test (WebP Sharp Processing)
    console.log('\n--- 2. Testing Image Upload & Compression ---');
    const dummyImageBuffer = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 12, g: 60, b: 130, alpha: 1 },
      },
    }).png().toBuffer();

    const blob = new Blob([dummyImageBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('photo', blob, 'test_student_photo.png');

    const uploadRes = await fetch(`${API_URL}/uploads/photo/students`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const uploadJson = await uploadRes.json();
    assert(uploadRes.status === 201, 'Upload API returned 201 Created');
    assert(uploadJson.success === true, 'Upload API response success is true');
    const uploadedUrl = uploadJson.data?.url;
    assert(uploadedUrl && uploadedUrl.startsWith('/uploads/students/'), `Image URL generated properly: ${uploadedUrl}`);
    assert(uploadedUrl.endsWith('.webp'), 'Image converted to WebP');
    assert(uploadJson.data?.savedPercentage !== undefined, `Reported space saving: ${uploadJson.data?.savedPercentage}%`);

    // Verify image is served via backend port 5000
    const backendFetch = await fetch(`http://localhost:5000${uploadedUrl}`);
    const backendBuffer = await backendFetch.arrayBuffer();
    assert(backendFetch.status === 200, `Image served by backend (port 5000) - size: ${backendBuffer.byteLength} bytes`);

    // Verify image is proxied and served via client port 5173
    const clientFetch = await fetch(`${CLIENT_URL}${uploadedUrl}`);
    const clientBuffer = await clientFetch.arrayBuffer();
    assert(clientFetch.status === 200, `Image served by Vite proxy (port 5173) - size: ${clientBuffer.byteLength} bytes`);
    assert(clientFetch.headers.get('content-type')?.includes('image/webp'), 'Client proxy returned correct image/webp content-type');

    // 3. Student Profile Edit Test (Fixing the 400 Bad Request error)
    console.log('\n--- 3. Testing Student Edit with Image & New Fields (PUT /api/students/:id) ---');
    const testStudentId = '4d2ee661-59b5-4cba-a77f-6966a8301c92';

    // Test with empty date_of_birth and new fields
    const updateRes1 = await fetch(`${API_URL}/students/${testStudentId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        full_name: 'ادمن المحدث',
        phone: '01224385090',
        parent_phone: '',
        parent_name: '',
        father_phone: '01011112222',
        mother_phone: '01122223333',
        gender: 'female',
        national_id: '29901011234567',
        date_of_birth: '',
        photo_url: uploadedUrl,
        address: 'شارع الجمهورية - الدور الثالث',
        grade_id: '6d603462-3d6b-43b1-9f9d-71c8d88ac6ea',
        education_type: 'PUBLIC',
        enrollment_type: 'PACKAGE',
        notes: 'طالب مميز',
      }),
    });

    const updateJson1 = await updateRes1.json();
    assert(updateRes1.status === 200, 'PUT /api/students/:id returned 200 OK (no 400 Bad Request)');
    assert(updateJson1.data?.photo_url === uploadedUrl, 'photo_url saved in database');
    assert(updateJson1.data?.gender === 'female', 'gender saved as female');
    assert(updateJson1.data?.father_phone === '01011112222', 'father_phone saved');
    assert(updateJson1.data?.mother_phone === '01122223333', 'mother_phone saved');
    assert(updateJson1.data?.date_of_birth === null, 'empty date_of_birth properly saved as null in DB');

    // Test with actual date_of_birth
    const updateRes2 = await fetch(`${API_URL}/students/${testStudentId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        full_name: 'ادمن',
        phone: '01224385090',
        gender: 'male',
        date_of_birth: '2008-03-15',
        photo_url: uploadedUrl,
      }),
    });
    const updateJson2 = await updateRes2.json();
    assert(updateRes2.status === 200, 'PUT /api/students/:id with date_of_birth returned 200 OK');
    assert(updateJson2.data?.date_of_birth?.includes('2008-03'), `date_of_birth saved properly: ${updateJson2.data?.date_of_birth}`);

    // 4. Create New Student Test (POST /api/students)
    console.log('\n--- 4. Testing Create Student with New Profile Fields (POST /api/students) ---');
    const randomPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const createStudentRes = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        full_name: 'طالب تجريبي للاختبار',
        phone: randomPhone,
        father_phone: '01233334444',
        mother_phone: '01566667777',
        gender: 'male',
        national_id: '30805121234567',
        date_of_birth: '2008-05-12',
        grade_id: '6d603462-3d6b-43b1-9f9d-71c8d88ac6ea',
        education_type: 'PUBLIC',
        enrollment_type: 'PACKAGE',
        photo_url: uploadedUrl,
        notes: 'تم الإنشاء للاختبار الآلي',
      }),
    });

    const createJson = await createStudentRes.json();
    assert(createStudentRes.status === 201, 'POST /api/students returned 201 Created');
    const newStudentId = createJson.data?.id;
    assert(!!newStudentId, `New student created with ID: ${newStudentId}`);
    assert(!!createJson.data?.barcode_id, `Barcode generated: ${createJson.data?.barcode_id}`);
    assert(createJson.data?.photo_url === uploadedUrl, 'photo_url persisted on creation');

    // 5. Teacher Profile & Upload Test
    console.log('\n--- 5. Testing Teacher API with Photos & New Fields ---');
    const teachersListRes = await fetch(`${API_URL}/teachers`, { headers: authHeaders });
    const teachersList = await teachersListRes.json();
    const teacherId = teachersList.data?.[0]?.id;

    if (teacherId) {
      const updateTeacherRes = await fetch(`${API_URL}/teachers/${teacherId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          aka: 'مستر عبقري',
          gender: 'male',
          date_of_birth: '',
          photo_url: uploadedUrl,
          secretary_name: 'أحمد السكرتير',
          secretary_phone: '01099998888',
        }),
      });
      const updateTeacherJson = await updateTeacherRes.json();
      assert(updateTeacherRes.status === 200, 'PUT /api/teachers/:id returned 200 OK');
      assert(updateTeacherJson.data?.photo_url === uploadedUrl, 'Teacher photo_url saved');
      assert(updateTeacherJson.data?.aka === 'مستر عبقري', 'Teacher aka saved');
      assert(updateTeacherJson.data?.secretary_name === 'أحمد السكرتير', 'Teacher secretary_name saved');
    }

    // 6. Subscriptions & Discount Flow Test
    console.log('\n--- 6. Testing Subscription & Persistent Discount System ---');
    const accountRes = await fetch(`${API_URL}/subscriptions/student-account/${testStudentId}`, {
      headers: authHeaders,
    });
    const accountJson = await accountRes.json();
    assert(accountRes.status === 200, 'GET /subscriptions/student-account/:id returned 200 OK');
    assert(Array.isArray(accountJson.data?.groups), 'Student enrolled groups returned as array');

    // 7. Users Management & Roles Test
    console.log('\n--- 7. Testing Users & Permissions Management ---');
    const rolesRes = await fetch(`${API_URL}/users/roles`, { headers: authHeaders });
    const rolesJson = await rolesRes.json();
    assert(rolesRes.status === 200, 'GET /api/users/roles returned 200 OK');
    assert(rolesJson.data?.length > 0, `Roles returned (${rolesJson.data?.length} roles found)`);

    const usersRes = await fetch(`${API_URL}/users`, { headers: authHeaders });
    const usersJson = await usersRes.json();
    assert(usersRes.status === 200, 'GET /api/users returned 200 OK');
    assert(usersJson.data?.length > 0, `Users returned (${usersJson.data?.length} users found)`);

    console.log(`\n========================================`);
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Test Error:', err);
    process.exit(1);
  }
}

runTests();
