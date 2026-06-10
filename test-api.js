const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runTests() {
  console.log('Starting QA Tests...');

  try {
    // 1. Health Check
    console.log('\nTesting Health Check...');
    const healthRes = await fetch(`${API_URL}/health`);
    const healthData = await healthRes.json();
    console.log('Health:', healthData.success ? 'PASSED' : 'FAILED');

    // 2. Auth: Register (will likely fail if DB not set up, but we check response shape)
    console.log('\nTesting Registration (Validation)...');
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'T', email: 'invalid', password: '123' })
    });
    const regData = await regRes.json();
    console.log('Reg Validation:', !regData.success && regData.message ? 'PASSED' : 'FAILED');

    // 3. Courses: Get All
    console.log('\nTesting Courses List...');
    const coursesRes = await fetch(`${API_URL}/courses`);
    const coursesData = await coursesRes.json();
    console.log('Courses:', coursesData.success ? 'PASSED' : 'FAILED');

    // 4. Enrollments: Auth Required
    console.log('\nTesting Enrollment (Unauth)...');
    const enrolRes = await fetch(`${API_URL}/enrollments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: 1 })
    });
    const enrolData = await enrolRes.json();
    console.log('Enroll Unauth:', enrolRes.status === 401 ? 'PASSED' : 'FAILED');

    // 5. Bot: Ask
    console.log('\nTesting Bot Ask...');
    const botRes = await fetch(`${API_URL}/bot/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' })
    });
    const botData = await botRes.json();
    console.log('Bot:', botData.success && botData.data.answer ? 'PASSED' : 'FAILED');

    console.log('\nBasic API flow tests completed.');
    console.log('Note: Full integration tests (login, guest payment) require a running MySQL DB and Paystack mock.');

  } catch (err) {
    console.error('Test Execution Error:', err.message);
  }
}

// Check if server is running before starting tests
async function start() {
    try {
        await fetch(`${API_URL}/health`);
        runTests();
    } catch (e) {
        console.error(`Server is not reachable at ${API_URL}. Please start the server first.`);
        // Note: In some environments fetch might not be available or fails due to no server.
    }
}

start();
