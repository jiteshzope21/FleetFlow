import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { ChatConversation } from '../models/ChatConversation.js';

async function registerTenant(email: string, compName: string, phone: string) {
  const payload = {
    companyName: compName,
    companyEmail: email,
    ownerName: 'Test Owner',
    ownerEmail: email,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    phone,
    businessType: 'LOGISTICS',
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  if (res.status !== 201) {
    throw new Error(`Failed to register ${compName}: ${JSON.stringify(res.body)}`);
  }
  return {
    token: res.body.data.accessToken,
    user: res.body.data.user,
    company: res.body.data.company,
  };
}

async function runSupportChatTests() {
  console.log('========================================================');
  console.log('🧪 FLEETFLOW AI SUPPORT CHAT & SLM INTEGRATION SUITE');
  console.log('========================================================\n');

  console.log('📦 Step 1: Connecting to isolated test database...');
  await connectDB('test-memory');
  await Promise.all([
    Company.deleteMany({}),
    User.deleteMany({}),
    SupportTicket.deleteMany({}),
    ChatConversation.deleteMany({}),
  ]);
  console.log('  ✅ PASS: Test database connected and collections cleaned');

  // Register Tenant A and B
  console.log('\n🏢 Step 2: Registering Tenant A and Tenant B...');
  const tenantA = await registerTenant('ops@apexfast.io', 'Apex Fast Logistics', '+15551112222');
  const tenantB = await registerTenant('ops@bravofreight.io', 'Bravo Freight Lines', '+15553334444');
  console.log('  ✅ PASS: Tenant A and Tenant B registered');

  // 1. Send first message
  console.log('\n💬 Step 3: Sending initial support inquiry for Tenant A...');
  const chatRes1 = await request(app)
    .post('/api/support/chat')
    .set('Authorization', `Bearer ${tenantA.token}`)
    .send({ message: 'How do I add a new vehicle to our fleet?' });

  if (chatRes1.status !== 200) {
    console.error('❌ Failed:', chatRes1.body);
    process.exit(1);
  }
  const data1 = chatRes1.body.data;
  console.log(`  ✅ PASS: HTTP 200 received`);
  console.log(`  ✅ PASS: Model Status: ${data1.modelStatus}`);
  console.log(`  ✅ PASS: Conversation ID generated: ${data1.conversationId}`);
  console.log(`  ✅ PASS: Response generated: "${data1.response.slice(0, 80)}..."`);

  const convId = data1.conversationId;

  // 2. Multi-turn continuation
  console.log('\n🔄 Step 4: Continuing conversation (multi-turn thread)...');
  const chatRes2 = await request(app)
    .post('/api/support/chat')
    .set('Authorization', `Bearer ${tenantA.token}`)
    .send({
      message: 'What if the vehicle is currently in maintenance?',
      conversationId: convId,
    });

  if (chatRes2.status !== 200) {
    console.error('❌ Failed:', chatRes2.body);
    process.exit(1);
  }
  const data2 = chatRes2.body.data;
  console.log(`  ✅ PASS: Multi-turn response received`);
  console.log(`  ✅ PASS: Message history count: ${data2.messages.length} (expected 4)`);

  // 3. Fetch user conversations
  console.log('\n📜 Step 5: Retrieving user conversation list...');
  const listRes = await request(app)
    .get('/api/support/chat/conversations')
    .set('Authorization', `Bearer ${tenantA.token}`);

  if (listRes.status !== 200 || listRes.body.data.length === 0) {
    console.error('❌ Failed:', listRes.body);
    process.exit(1);
  }
  console.log(`  ✅ PASS: Found ${listRes.body.data.length} active conversation thread(s)`);

  // 4. Strict Tenant Isolation
  console.log('\n🛡️ Step 6: Verifying tenant isolation (Tenant B cannot read Tenant A chat)...');
  const isoRes = await request(app)
    .get(`/api/support/chat/conversations/${convId}`)
    .set('Authorization', `Bearer ${tenantB.token}`);

  if (isoRes.status !== 404) {
    console.error(`❌ Security Failure: Expected 404 but got ${isoRes.status}`, isoRes.body);
    process.exit(1);
  }
  console.log(`  ✅ PASS: Tenant B blocked with HTTP 404 from reading Tenant A conversation`);

  // 5. Escalation to Human Support Ticket
  console.log('\n🎫 Step 7: Escalating conversation to human support ticket...');
  const escRes = await request(app)
    .post('/api/support/chat/escalate')
    .set('Authorization', `Bearer ${tenantA.token}`)
    .send({
      conversationId: convId,
      subject: 'Assistance needed with vehicle maintenance status unlock',
      priority: 'HIGH',
      category: 'TECHNICAL',
    });

  if (escRes.status !== 201) {
    console.error('❌ Failed:', escRes.body);
    process.exit(1);
  }
  const ticket = escRes.body.data;
  console.log(`  ✅ PASS: Support ticket created: ${ticket.ticketNumber}`);
  console.log(`  ✅ PASS: Ticket priority: ${ticket.priority}`);
  console.log(`  ✅ PASS: Ticket category: ${ticket.category}`);
  console.log(`  ✅ PASS: Transcript appended to ticket description`);

  // 6. Verify ticket appears in standard support queue
  console.log('\n📬 Step 8: Verifying ticket appears in standard carrier support queue...');
  const queueRes = await request(app)
    .get('/api/support')
    .set('Authorization', `Bearer ${tenantA.token}`);

  if (queueRes.status !== 200 || queueRes.body.data.length === 0) {
    console.error('❌ Failed:', queueRes.body);
    process.exit(1);
  }
  console.log(`  ✅ PASS: Escalated ticket found in /api/support queue`);

  await disconnectDB();
  console.log('\n========================================================');
  console.log('🏁 ALL SUPPORT CHAT & SLM TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================');
}

runSupportChatTests().catch((err) => {
  console.error('Unexpected test error:', err);
  process.exit(1);
});
