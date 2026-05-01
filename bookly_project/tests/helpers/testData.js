/**
 * Generates a unique test user with a timestamp-based email.
 * Ensures no conflicts when tests run multiple times or in parallel.
 */
export function generateUser(prefix = 'playwright') {
  const timestamp = Date.now();
  return {
    name: `${prefix} Tester`,
    email: `${prefix}-${timestamp}@test.com`,
    password: 'asdasdasd',
  };
}
