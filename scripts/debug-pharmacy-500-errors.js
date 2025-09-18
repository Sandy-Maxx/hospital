const http = require('http');

function makeRequest(path, method = 'GET', cookies = '') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'http://localhost:3000/admin/pharmacy'
            },
            timeout: 15000
        };

        if (cookies) {
            options.headers['Cookie'] = cookies;
        }

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ 
                        status: res.statusCode, 
                        data: parsed, 
                        headers: res.headers,
                        cookies: res.headers['set-cookie'] || []
                    });
                } catch (e) {
                    resolve({ 
                        status: res.statusCode, 
                        data: data, 
                        headers: res.headers,
                        cookies: res.headers['set-cookie'] || []
                    });
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

async function debugPharmacy500Errors() {
    console.log('🔍 Debugging Pharmacy 500 Errors...\n');
    
    // First, let's test the working endpoint
    console.log('1. Testing working endpoint (/api/test-pharmacy)...');
    const testResult = await makeRequest('/api/test-pharmacy');
    console.log(`   Status: ${testResult.status}`);
    if (testResult.status === 200) {
        console.log('   ✅ Working - This confirms database and basic Prisma client work');
    } else {
        console.log('   ❌ Even test endpoint failing!');
        console.log('   Response:', JSON.stringify(testResult.data, null, 2));
    }
    
    // Test the exact URLs that are failing
    console.log('\n2. Testing exact failing URLs...');
    const failingUrls = [
        '/api/pharmacy/medicines?limit=1000',
        '/api/pharmacy/stock?limit=1000',
        '/api/pharmacy/medicines?search=&limit=50',
        '/api/pharmacy/stock?search=&limit=50'
    ];
    
    for (const url of failingUrls) {
        console.log(`\n   Testing: ${url}`);
        const result = await makeRequest(url);
        console.log(`   Status: ${result.status}`);
        
        if (result.status === 500) {
            console.log('   ❌ 500 Internal Server Error');
            if (result.data && result.data.error) {
                console.log('   Error details:', result.data.error);
            } else if (typeof result.data === 'string' && result.data.includes('Error')) {
                console.log('   Error response:', result.data.substring(0, 200) + '...');
            }
        } else if (result.status === 401) {
            console.log('   🔒 Unauthorized (expected without authentication)');
        } else if (result.status === 200) {
            console.log('   ✅ Working');
        }
    }
    
    console.log('\n3. Testing with NextAuth session...');
    // Get session first
    const sessionResult = await makeRequest('/api/auth/session');
    console.log(`   Session API Status: ${sessionResult.status}`);
    
    let sessionCookie = '';
    if (sessionResult.cookies && sessionResult.cookies.length > 0) {
        sessionCookie = sessionResult.cookies.map(cookie => cookie.split(';')[0]).join('; ');
        console.log('   Found session cookies');
    }
    
    // Test with session
    console.log('\n   Testing medicines API with session...');
    const medicinesWithSession = await makeRequest('/api/pharmacy/medicines?limit=5', 'GET', sessionCookie);
    console.log(`   Status: ${medicinesWithSession.status}`);
    
    if (medicinesWithSession.status === 500) {
        console.log('   ❌ Still 500 error even with session');
        if (medicinesWithSession.data) {
            console.log('   Error details:', JSON.stringify(medicinesWithSession.data, null, 2));
        }
    }
    
    console.log('\n4. Checking server logs approach...');
    console.log('   To get detailed error info, check your Next.js development server console');
    console.log('   The 500 errors should show detailed stack traces there');
    
    console.log('\n5. Direct Prisma test...');
    // Test Prisma directly
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        console.log('   Testing direct Prisma connection...');
        const medicineCount = await prisma.medicine.count();
        console.log(`   ✅ Direct Prisma works - ${medicineCount} medicines found`);
        
        console.log('   Testing medicine query with relations...');
        const medicines = await prisma.medicine.findMany({
            take: 2,
            include: {
                category: true,
                gstSlab: true,
                stocks: {
                    select: {
                        availableQuantity: true,
                        expiryDate: true,
                        batchNumber: true,
                    },
                    where: {
                        isActive: true,
                        availableQuantity: { gt: 0 },
                    },
                    orderBy: { expiryDate: 'asc' },
                },
            },
        });
        
        console.log(`   ✅ Complex query works - found ${medicines.length} medicines with relations`);
        if (medicines.length > 0) {
            console.log(`   Sample: ${medicines[0].name} (${medicines[0].brand || 'No brand'})`);
        }
        
        await prisma.$disconnect();
        
    } catch (error) {
        console.log('   ❌ Direct Prisma test failed:', error.message);
        if (error.code) {
            console.log('   Error code:', error.code);
        }
    }
    
    console.log('\n📋 Summary:');
    console.log('The 500 errors suggest there might be:');
    console.log('1. A difference between how the test API and main APIs initialize Prisma');
    console.log('2. An authentication middleware issue');
    console.log('3. A field/relationship problem in the query');
    console.log('4. Environment variable differences');
    console.log('\n💡 Check your Next.js dev server console for detailed error messages');
}

debugPharmacy500Errors();
