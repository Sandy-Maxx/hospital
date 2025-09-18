const http = require('http');

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'test-script'
            },
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ status: 'ERROR', error: error.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ status: 'TIMEOUT', error: 'Request timeout' });
        });

        req.end();
    });
}

async function testEndpoints() {
    console.log('🌐 Testing Next.js application endpoints...\n');
    
    const endpoints = [
        { path: '/', name: 'Home page' },
        { path: '/api/auth/session', name: 'NextAuth session' },
        { path: '/api/users', name: 'Users API' },
        { path: '/api/appointments', name: 'Appointments API' },
        { path: '/api/test-pharmacy', name: 'Pharmacy test API' }
    ];
    
    for (const endpoint of endpoints) {
        console.log(`Testing ${endpoint.name}: ${endpoint.path}`);
        const result = await makeRequest(endpoint.path);
        
        if (result.status === 'ERROR' || result.status === 'TIMEOUT') {
            console.log(`   ❌ ${result.status}: ${result.error}`);
        } else {
            console.log(`   📊 Status: ${result.status}`);
            
            if (result.status === 200) {
                console.log('   ✅ Working');
            } else if (result.status === 401) {
                console.log('   🔒 Unauthorized (expected for protected routes)');
            } else if (result.status === 404) {
                console.log('   ❓ Not Found');
            } else if (result.status === 500) {
                console.log('   ❌ Internal Server Error');
                if (result.data && result.data.error) {
                    console.log(`   Error: ${result.data.error}`);
                }
            }
        }
        console.log('');
    }
    
    // Test if Next.js is running
    console.log('📋 Summary:');
    const homeTest = await makeRequest('/');
    if (homeTest.status === 'ERROR' || homeTest.status === 'TIMEOUT') {
        console.log('❌ Next.js application is not running or not accessible');
        console.log('💡 Try running: npm run dev');
    } else {
        console.log('✅ Next.js application is running');
        console.log('💡 Check the specific API endpoints for issues');
    }
}

testEndpoints();
