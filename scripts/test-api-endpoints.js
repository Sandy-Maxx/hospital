async function testAPI() {
    console.log('🧪 Testing Pharmacy API Endpoints...\n');
    
    try {
        // Test medicines endpoint
        console.log('📊 Testing /api/pharmacy/medicines...');
        const medicinesResponse = await fetch('http://localhost:3000/api/pharmacy/medicines?limit=5');
        
        if (medicinesResponse.ok) {
            const medicinesData = await medicinesResponse.json();
            console.log(`✅ Medicines API: ${medicinesResponse.status} ${medicinesResponse.statusText}`);
            console.log(`   Retrieved ${medicinesData.medicines?.length || 0} medicines`);
            console.log(`   Total: ${medicinesData.total || 0} medicines in database`);
            
            if (medicinesData.medicines && medicinesData.medicines.length > 0) {
                console.log('\n   Sample medicines:');
                medicinesData.medicines.slice(0, 3).forEach((med, i) => {
                    console.log(`   ${i + 1}. ${med.name} - ₹${med.mrp} (${med.category?.name || 'N/A'})`);
                });
            }
        } else {
            console.log(`❌ Medicines API: ${medicinesResponse.status} ${medicinesResponse.statusText}`);
            const errorText = await medicinesResponse.text();
            console.log(`   Error: ${errorText}`);
        }
        
        console.log('\n📦 Testing /api/pharmacy/stock...');
        const stockResponse = await fetch('http://localhost:3000/api/pharmacy/stock?limit=5');
        
        if (stockResponse.ok) {
            const stockData = await stockResponse.json();
            console.log(`✅ Stock API: ${stockResponse.status} ${stockResponse.statusText}`);
            console.log(`   Retrieved ${stockData.stock?.length || 0} stock entries`);
            console.log(`   Total: ${stockData.total || 0} stock entries in database`);
            
            if (stockData.stock && stockData.stock.length > 0) {
                console.log('\n   Sample stock:');
                stockData.stock.slice(0, 3).forEach((stock, i) => {
                    console.log(`   ${i + 1}. ${stock.medicine?.name || 'Unknown'} - Qty: ${stock.availableQuantity} - Batch: ${stock.batchNumber}`);
                });
            }
        } else {
            console.log(`❌ Stock API: ${stockResponse.status} ${stockResponse.statusText}`);
            const errorText = await stockResponse.text();
            console.log(`   Error: ${errorText}`);
        }
        
        // Test specific search
        console.log('\n🔍 Testing medicine search for "Rituximab"...');
        const searchResponse = await fetch('http://localhost:3000/api/pharmacy/medicines?search=Rituximab&limit=1');
        
        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log(`✅ Search API: ${searchResponse.status} ${searchResponse.statusText}`);
            
            if (searchData.medicines && searchData.medicines.length > 0) {
                const med = searchData.medicines[0];
                console.log(`   Found: ${med.name} (${med.brand}) - ₹${med.mrp}`);
                console.log(`   Category: ${med.category?.name} | GST: ${med.gstSlab?.rate}%`);
                console.log(`   Description: ${med.description}`);
            } else {
                console.log('   No results found');
            }
        } else {
            console.log(`❌ Search API: ${searchResponse.status} ${searchResponse.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
        console.log('\n💡 Make sure your Next.js development server is running on localhost:3000');
        console.log('   Run: npm run dev');
    }
}

testAPI();
