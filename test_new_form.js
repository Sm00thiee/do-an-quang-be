const axios = require('axios');

async function testNewRegisterForm() {
  try {
    console.log('🧪 Testing new register form with complex data...');
    
    const testData = {
      "role": "candidate",
      "email": "nguyenvana@example.com",
      "password": "Password123",
      "firstName": "Nguyen",
      "lastName": "Van A", 
      "phone": "0987654321",
      "dateOfBirth": "1990-01-01",
      "gender": "male",
      "address": "123 ABC Street",
      "companyName": "ABC Company",
      "province": "hanoi", 
      "district": "ba-dinh",
      "businessField": [
        "tu-van",
        "cong-nghe",
        "marketing"
      ],
      "companyDescription": [
        "cong-nghe-thong-tin",
        "marketing-quang-cao",
        "tai-chinh-ngan-hang"
      ],
      "knowAboutUs": "Giới thiệu bạn bè",
      "lookingFor": "UI/UX Designer",
      "salaryRange": "15-20", 
      "companySize": "51-200"
    };

    console.log('📤 Sending registration data:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:3001/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful!');
    console.log('📦 Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Registration failed!');
    if (error.response) {
      console.log('📦 Error response:', JSON.stringify(error.response.data, null, 2));
      console.log('🔢 Status code:', error.response.status);
    } else {
      console.log('📦 Error message:', error.message);
    }
  }
}

async function testDataEndpoints() {
  try {
    console.log('\n🧪 Testing data endpoints...');
    
    // Test provinces
    console.log('📍 Testing provinces endpoint...');
    const provincesRes = await axios.get('http://localhost:3001/api/data/provinces');
    console.log('✅ Provinces:', provincesRes.data.data?.slice(0, 3));

    // Test business fields
    console.log('🏢 Testing business fields endpoint...');
    const businessRes = await axios.get('http://localhost:3001/api/data/business-fields');
    console.log('✅ Business fields:', businessRes.data.data?.slice(0, 3));

    // Test company descriptions
    console.log('📝 Testing company descriptions endpoint...');
    const companyDescRes = await axios.get('http://localhost:3001/api/data/company-descriptions');
    console.log('✅ Company descriptions:', companyDescRes.data.data?.slice(0, 3));

  } catch (error) {
    console.log('❌ Data endpoints test failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive tests...\n');
  
  // Test data endpoints first
  await testDataEndpoints();
  
  // Then test registration
  await testNewRegisterForm();
  
  console.log('\n🎉 Tests completed!');
}

runTests();