const http = require('http');

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function testPharmacyHTTP() {
    try {
        console.log('🌐 Testing pharmacy APIs via HTTP...');
        
        // Test the test endpoint
        console.log('\n1. Testing /api/test-pharmacy...');
        const testResult = await makeRequest('/api/test-pharmacy');
        console.log(`   Status: ${testResult.status}`);
        if (testResult.status === 200) {
            console.log('   Response:', JSON.stringify(testResult.data, null, 2));
        } else {
            console.log('   Error:', testResult.data);
        }
        
        // Test medicines API
        console.log('\n2. Testing /api/pharmacy/medicines...');
        const medicinesResult = await makeRequest('/api/pharmacy/medicines?limit=3');
        console.log(`   Status: ${medicinesResult.status}`);
        if (medicinesResult.status === 200) {
            console.log(`   Found ${medicinesResult.data.medicines?.length || 0} medicines`);
            if (medicinesResult.data.medicines?.length > 0) {
                console.log('   Sample:', medicinesResult.data.medicines[0].name);
            }
        } else {
            console.log('   Error:', medicinesResult.data);
        }
        
        // Test stock API  
        console.log('\n3. Testing /api/pharmacy/stock...');
        const stockResult = await makeRequest('/api/pharmacy/stock?limit=3');
        console.log(`   Status: ${stockResult.status}`);
        if (stockResult.status === 200) {
            console.log(`   Found ${stockResult.data.stocks?.length || 0} stock entries`);
        } else {
            console.log('   Error:', stockResult.data);
        }
        
    } catch (error) {
        console.error('❌ HTTP test failed:', error.message);
    }
}

testPharmacyHTTP();
