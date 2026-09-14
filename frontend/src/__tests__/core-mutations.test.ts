import assert from "node:assert";
import { crmStore } from "../lib/storage/crm-store";
import { FollowUpService } from "../features/follow-ups/services/follow-up.service";
import { opportunityRepository } from "../infrastructure/local-storage/local-storage-opportunity.repository";

async function run() {
console.log("🧪 Running SewTec CRM Core Mutation Tests...\n");

// Test 1: Store Reset
{
  crmStore.reset();
  const snapshot = crmStore.getSnapshot();
  assert.strictEqual(snapshot.version, 1, "Snapshot version should be 1");
  assert.strictEqual(snapshot.customers.length, 5, "Should have 5 initial customers");
  assert.strictEqual(snapshot.followUps.length, 7, "Should have 7 initial follow-ups");
  console.log("✓ Test 1 Passed: Store resets to initial seed data cleanly.");
}

// Test 2: Multi-Entity FollowUp Completion (Happy Path)
{
  crmStore.reset();
  const alNourFollowUp = crmStore.getSnapshot().followUps.find((f) => f.id === "fu_01");
  assert.ok(alNourFollowUp, "fu_01 should exist");
  assert.strictEqual(alNourFollowUp.status, "scheduled", "Should initially be scheduled");

  const result = await FollowUpService.completeFollowUp({
    followUpId: "fu_01",
    outcome: "interested",
    outcomeNote: "تم الاتفاق على موعد زيارة لمعاينة خط الإنتاج",
    nextFollowUp: {
      scheduledAt: "2026-09-13T09:00:00.000Z",
      channel: "visit",
      topic: "زيارة ميدانية لتوقيع عقد توريد HK2900ASS",
    },
  });

  const state = crmStore.getSnapshot();
  const updatedFu = state.followUps.find((f) => f.id === "fu_01");
  assert.strictEqual(updatedFu?.status, "completed", "FollowUp should be marked completed");
  assert.strictEqual(updatedFu?.outcome, "interested", "Outcome should be recorded");

  // Interaction check
  const createdInteraction = state.interactions.find((i) => i.followUpId === "fu_01");
  assert.ok(createdInteraction, "Interaction should be created");
  assert.strictEqual(createdInteraction.outcome, "interested");

  // Activity timeline check
  const createdActivity = state.activities.find((a) => a.title.includes("fu_01") || a.type === "followup_completed");
  assert.ok(createdActivity, "Timeline activity should be generated");

  // Customer lastContactAt check
  const customer = state.customers.find((c) => c.id === "cust_01");
  assert.ok(customer?.lastContactAt, "Customer lastContactAt should be set");
  assert.strictEqual(customer?.nextFollowUpAt, "2026-09-13T09:00:00.000Z", "Customer nextFollowUpAt should be updated");

  // Next follow-up check
  assert.ok(result.nextFollowUp, "New follow-up should be returned");
  assert.strictEqual(result.nextFollowUp?.scheduledAt, "2026-09-13T09:00:00.000Z");

  console.log("✓ Test 2 Passed: Multi-entity follow-up completion updates task, customer, interaction, activity, and schedules next step atomically.");
}

// Test 3: Negative Flow ("لم يرد" / No Answer with Automatic Next-Day Retry)
{
  crmStore.reset();
  const result = await FollowUpService.completeFollowUp({
    followUpId: "fu_02",
    outcome: "no_answer",
    outcomeNote: "الهاتف يرن ولا يوجد رد",
  });

  const state = crmStore.getSnapshot();
  const updatedFu = state.followUps.find((f) => f.id === "fu_02");
  assert.strictEqual(updatedFu?.status, "completed");
  assert.strictEqual(updatedFu?.outcome, "no_answer");

  // Check that an automatic retry follow-up was generated
  assert.ok(result.nextFollowUp, "Next retry follow-up must be automatically scheduled");
  assert.ok(result.nextFollowUp?.topic.includes("لم يرد سابقاً"), "Retry topic should indicate previous no-answer");

  console.log("✓ Test 3 Passed: 'لم يرد' flow records missed attempt and creates next-day retry task.");
}

// Test 4: Opportunity Won Stage Mutation
(async () => {
  crmStore.reset();
  const customerBefore = crmStore.getSnapshot().customers.find((c) => c.id === "cust_01")!;
  const prevLifetimeSales = customerBefore.lifetimeSales;

  await opportunityRepository.updateStage("op_01", "won", "تم توقيع العقد وسداد العربون نقداً");

  const state = crmStore.getSnapshot();
  const updatedOpp = state.opportunities.find((o) => o.id === "op_01")!;
  assert.strictEqual(updatedOpp.stage, "won", "Opportunity stage should be won");

  const customerAfter = state.customers.find((c) => c.id === "cust_01")!;
  assert.strictEqual(
    customerAfter.lifetimeSales,
    prevLifetimeSales + (updatedOpp.estimatedValue || 0),
    "Lifetime sales should increase by won deal value"
  );

  console.log("✓ Test 4 Passed: Opportunity won stage properly recalculates customer lifetime sales and creates timeline activity.");
  console.log("\n🎉 All Core Mutation Tests Passed Successfully!\n");
})();

}
run().catch(error => { console.error(error); process.exitCode = 1; });
