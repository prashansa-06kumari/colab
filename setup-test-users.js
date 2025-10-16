/**
 * Setup Test Users Script
 * Creates test users for multi-user testing
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

const testUsers = [
  { name: 'Alice Johnson', email: 'alice@test.com', password: 'password123' },
  { name: 'Bob Smith', email: 'bob@test.com', password: 'password123' },
  { name: 'Charlie Brown', email: 'charlie@test.com', password: 'password123' },
  { name: 'Diana Prince', email: 'diana@test.com', password: 'password123' },
  { name: 'Eve Wilson', email: 'eve@test.com', password: 'password123' }
];

async function createTestUsers() {
  console.log('🚀 Setting up test users...\n');
  
  for (const user of testUsers) {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, user);
      if (response.data.success) {
        console.log(`✅ Created user: ${user.name} (${user.email})`);
      } else {
        console.log(`⚠️  User already exists: ${user.name} (${user.email})`);
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log(`⚠️  User already exists: ${user.name} (${user.email})`);
      } else {
        console.error(`❌ Failed to create ${user.name}:`, error.response?.data?.message || error.message);
      }
    }
  }
  
  console.log('\n🎉 Test users setup complete!');
  console.log('\n📋 Test Users:');
  testUsers.forEach(user => {
    console.log(`   • ${user.name} - ${user.email} (password: ${user.password})`);
  });
  
  console.log('\n💡 Usage:');
  console.log('   1. Open multiple browser tabs');
  console.log('   2. Login with different users in each tab');
  console.log('   3. Use the "Switch User" button for quick switching');
  console.log('   4. Test real-time collaboration!');
}

// Run the setup
createTestUsers().catch(console.error);
