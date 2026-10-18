import { LiveFuelService } from '../modules/fuel/liveFuel.service.js';

async function testLiveFuelService() {
  console.log('🧪 Testing LiveFuelService with caching...');

  // Test 1: Fetch price for Pune
  const start = Date.now();
  const res1 = await LiveFuelService.getPriceForCity('Pune', 'DIESEL');
  const elapsed1 = Date.now() - start;
  console.log(`✅ First Call: City=${res1.matchedCity}, Price=₹${res1.price}, Cached=${res1.cached}, Time=${elapsed1}ms`);

  if (!res1.price || res1.price <= 0) {
    throw new Error('Expected positive fuel price');
  }

  // Test 2: Fetch price for Mumbai (should come straight from in-memory cache)
  const start2 = Date.now();
  const res2 = await LiveFuelService.getPriceForCity('Mumbai', 'DIESEL');
  const elapsed2 = Date.now() - start2;
  console.log(`✅ Second Call (Different City): City=${res2.matchedCity}, Price=₹${res2.price}, Cached=${res2.cached}, Time=${elapsed2}ms`);

  // Test 3: Fetch again for Pune (must be instant cached hit)
  const start3 = Date.now();
  const res3 = await LiveFuelService.getPriceForCity('Pune', 'DIESEL');
  const elapsed3 = Date.now() - start3;
  console.log(`✅ Third Call (Repeat City): City=${res3.matchedCity}, Price=₹${res3.price}, Cached=${res3.cached}, Time=${elapsed3}ms`);

  if (!res3.cached) {
    throw new Error('Expected cached=true on repeat call!');
  }

  console.log('🎉 LiveFuelService cache tests successfully completed! Zero wasted quota.');
}

testLiveFuelService().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
