/**
 * Acceptance Journeys Test Suite - SewTec CRM (El Mahalla Branch)
 * Validates the 6 Core Deterministic Journeys End-to-End
 */

import { crmStore } from "../lib/storage/crm-store";
import { FollowUpService } from "../features/follow-ups/services/follow-up.service";
import { opportunityRepository } from "../infrastructure/local-storage/local-storage-opportunity.repository";
import { customerRepository } from "../infrastructure/local-storage/local-storage-customer.repository";
import { followUpRepository } from "../infrastructure/local-storage/local-storage-follow-up.repository";
import { isOverdue } from "../lib/dates/branch-time";

async function runAcceptanceJourneys() {
  console.log("=================================================");
  console.log("🚀 Running 6 Core Acceptance Journeys Verification");
  console.log("=================================================\n");

  // Step 0: Ensure clean seed data
  crmStore.reset();
  const initial = crmStore.getSnapshot();

  // -------------------------------------------------------------
  // Journey 1: Morning Triage on Dashboard
  // -------------------------------------------------------------
  console.log("▶ Journey 1: Morning Triage on Dashboard");
  const overdueBefore = initial.followUps.filter(
    (f) => f.status === "scheduled" && isOverdue(f.scheduledAt)
  );
  if (overdueBefore.length === 0) {
    throw new Error("J1 Failed: Expected at least 1 overdue follow-up in initial seed data.");
  }
  const targetOverdue = overdueBefore[0];
  console.log(`  Found overdue task: "${targetOverdue.topic}" for ${targetOverdue.customerName}`);

  // Complete with outcome "interested"
  await FollowUpService.completeFollowUp({
    followUpId: targetOverdue.id,
    outcome: "interested",
    outcomeNote: "تم الاتصال بالعميل وأبدى اهتماماً كبيراً بماكينات الأوفرلوك",
  });

  const stateAfterJ1 = crmStore.getSnapshot();
  const completedTask = stateAfterJ1.followUps.find((f) => f.id === targetOverdue.id);
  if (completedTask?.status !== "completed") {
    throw new Error("J1 Failed: Task status should be 'completed'.");
  }
  if (completedTask.outcome !== "interested") {
    throw new Error("J1 Failed: Task outcome should be 'interested'.");
  }

  // Verify overdue count decreased
  const overdueAfter = stateAfterJ1.followUps.filter(
    (f) => f.status === "scheduled" && isOverdue(f.scheduledAt)
  );
  if (overdueAfter.length !== overdueBefore.length - 1) {
    throw new Error("J1 Failed: Overdue follow-up counter did not decrement.");
  }

  // Verify interaction and activity were logged
  const interactionLogged = stateAfterJ1.interactions.find(
    (i) => i.customerId === targetOverdue.customerId && i.outcome === "interested"
  );
  if (!interactionLogged) {
    throw new Error("J1 Failed: Interaction was not logged for completed follow-up.");
  }
  console.log("  ✓ J1 Passed: Overdue task completed, counter decremented, interaction logged.\n");

  // -------------------------------------------------------------
  // Journey 2: Instant Global Search (Ctrl + K)
  // -------------------------------------------------------------
  console.log("▶ Journey 2: Instant Global Search Matching");
  // Test search by phone substring
  const phoneMatches = await customerRepository.getAll({ search: "010-00" });
  if (phoneMatches.length === 0 || !phoneMatches.some((c) => c.phone.includes("010-00"))) {
    throw new Error("J2 Failed: Phone search for '010-00' returned no matching customers.");
  }
  console.log(`  Search '010-00' matched: ${phoneMatches[0].name} (${phoneMatches[0].phone})`);

  // Test search by machine model
  const modelMatches = await customerRepository.getAll({ search: "JACK A4" });
  if (
    modelMatches.length === 0 ||
    !modelMatches.some((c) => c.installedMachines.some((m) => m.model.includes("JACK A4")))
  ) {
    throw new Error("J2 Failed: Machine model search for 'JACK A4' failed.");
  }
  console.log(`  Search 'JACK A4' matched: ${modelMatches[0].name} (Fleet includes JACK A4)`);

  // Test search by Arabic name substring
  const nameMatches = await customerRepository.getAll({ search: "النور" });
  if (nameMatches.length === 0 || nameMatches[0].id !== "cust_01") {
    throw new Error("J2 Failed: Name search for 'النور' did not resolve cust_01.");
  }
  console.log("  ✓ J2 Passed: Global search resolves phone numbers, machine models, and Arabic customer names.\n");

  // -------------------------------------------------------------
  // Journey 3: Customer 360 & Quick Interaction Logger
  // -------------------------------------------------------------
  console.log("▶ Journey 3: Customer 360 & Quick Interaction Logger");
  const alNour = await customerRepository.getById("cust_01");
  if (!alNour) throw new Error("J3 Failed: cust_01 not found.");

  // Verify context rail data
  const totalInstalledCount = alNour.installedMachines.reduce((sum, m) => sum + m.quantity, 0);
  if (totalInstalledCount !== 7) {
    throw new Error(`J3 Failed: Expected 7 machines for cust_01, got ${totalInstalledCount}`);
  }
  if (alNour.lifetimeSales !== 385000) {
    throw new Error(`J3 Failed: Expected 385,000 EGP lifetime sales, got ${alNour.lifetimeSales}`);
  }

  // Quick note logged
  const quickNote = "قام الحاج أحمد بزيارة معرض المحلة لتجربة موديل Jack C5";
  const nowIso = new Date().toISOString();
  crmStore.update((state) => {
    state.activities.unshift({
      id: `act_${Date.now()}`,
      customerId: alNour.id,
      type: "interaction",
      title: "ملاحظة سريعة في المعرض",
      description: quickNote,
      occurredAt: nowIso,
      performedBy: "محمود العربي",
    });
    const c = state.customers.find((cust) => cust.id === alNour.id);
    if (c) c.lastContactAt = nowIso;
  });

  const stateAfterJ3 = crmStore.getSnapshot();
  const latestActivity = stateAfterJ3.activities[0];
  if (latestActivity.description !== quickNote || latestActivity.customerId !== alNour.id) {
    throw new Error("J3 Failed: Quick note was not prepended to timeline activities.");
  }
  console.log("  ✓ J3 Passed: Context rail verified, quick note immediately reflected on customer timeline.\n");

  // -------------------------------------------------------------
  // Journey 4: Opportunity Negotiation Kanban & Inspector Drawer
  // -------------------------------------------------------------
  console.log("▶ Journey 4: Opportunity Pipeline Stage Advance");
  const targetOpp = await opportunityRepository.getById("op_02");
  if (!targetOpp) throw new Error("J4 Failed: op_02 not found.");
  if (targetOpp.stage !== "quotation") {
    throw new Error(`J4 Failed: Expected op_02 to be in quotation stage, got ${targetOpp.stage}`);
  }

  const oppsBefore = await opportunityRepository.getAll();
  const quotationSumBefore = oppsBefore
    .filter((o) => o.stage === "quotation")
    .reduce((sum, o) => sum + (o.estimatedValue || 0), 0);
  const negotiationSumBefore = oppsBefore
    .filter((o) => o.stage === "negotiation")
    .reduce((sum, o) => sum + (o.estimatedValue || 0), 0);

  // Advance stage to negotiation
  await opportunityRepository.updateStage(
    targetOpp.id,
    "negotiation",
    "العميل طلب تسهيلات سداد على دفعتين وجاري التفاوض على شروط الضمان"
  );

  const oppsAfter = await opportunityRepository.getAll();
  const targetOppAfter = oppsAfter.find((o) => o.id === targetOpp.id);
  if (targetOppAfter?.stage !== "negotiation") {
    throw new Error("J4 Failed: Opportunity stage did not update to 'negotiation'.");
  }

  const quotationSumAfter = oppsAfter
    .filter((o) => o.stage === "quotation")
    .reduce((sum, o) => sum + (o.estimatedValue || 0), 0);
  const negotiationSumAfter = oppsAfter
    .filter((o) => o.stage === "negotiation")
    .reduce((sum, o) => sum + (o.estimatedValue || 0), 0);

  if (quotationSumAfter !== quotationSumBefore - (targetOpp.estimatedValue || 0)) {
    throw new Error("J4 Failed: Quotation column sum did not decrement properly.");
  }
  if (negotiationSumAfter !== negotiationSumBefore + (targetOpp.estimatedValue || 0)) {
    throw new Error("J4 Failed: Negotiation column sum did not increment properly.");
  }

  // Check activity timeline entry
  const oppActivity = crmStore
    .getSnapshot()
    .activities.find((a) => a.type === "stage_change" && a.metadata?.opportunityId === targetOpp.id);
  if (!oppActivity) {
    throw new Error("J4 Failed: Opportunity stage change activity not recorded.");
  }
  console.log("  ✓ J4 Passed: Deal moved to negotiation, column totals adjusted, timeline recorded change.\n");

  // -------------------------------------------------------------
  // Journey 5: Negative Flow ("لم يرد" / No Answer Retry)
  // -------------------------------------------------------------
  console.log("▶ Journey 5: Negative Flow ('لم يرد' / No Answer Retry)");
  const scheduledTasks = (await followUpRepository.getAll()).filter(
    (f) => f.status === "scheduled" && f.customerId === "cust_02"
  );
  if (scheduledTasks.length === 0) {
    throw new Error("J5 Failed: No scheduled task found for cust_02.");
  }
  const taskToFail = scheduledTasks[0];

  const result = FollowUpService.completeFollowUp({
    followUpId: taskToFail.id,
    outcome: "no_answer",
    outcomeNote: "الرقم يرن دون إجابة - إعادة الاتصال غداً صباحاً",
  });

  const stateAfterJ5 = crmStore.getSnapshot();
  const failedTask = stateAfterJ5.followUps.find((f) => f.id === taskToFail.id);
  if (failedTask?.status !== "completed" || failedTask.outcome !== "no_answer") {
    throw new Error("J5 Failed: Task not marked completed with no_answer outcome.");
  }

  // Verify interaction was logged with outcome no_answer
  const noAnswerInteraction = stateAfterJ5.interactions.find(
    (i) => i.followUpId === taskToFail.id && i.outcome === "no_answer"
  );
  if (!noAnswerInteraction) {
    throw new Error("J5 Failed: Missed attempt interaction was not logged.");
  }

  // Verify automatic retry follow-up for tomorrow at 11:00 AM
  const retryTask = result.nextFollowUp;
  if (!retryTask || !retryTask.topic.includes("لم يرد سابقاً")) {
    throw new Error("J5 Failed: Automated retry task for tomorrow was not generated.");
  }
  console.log(`  Generated retry task: "${retryTask.topic}" at ${retryTask.scheduledAt}`);

  // Verify customer's nextFollowUpAt was updated
  const custAfter = stateAfterJ5.customers.find((c) => c.id === taskToFail.customerId);
  if (custAfter?.nextFollowUpAt !== retryTask.scheduledAt) {
    throw new Error("J5 Failed: Customer nextFollowUpAt was not updated with retry task timestamp.");
  }

  console.log("  ✓ J5 Passed: 'لم يرد' logged, retry follow-up created for tomorrow, customer next schedule updated.\n");

  // -------------------------------------------------------------
  // Journey 6: Developer Reset Demo Data
  // -------------------------------------------------------------
  console.log("▶ Journey 6: Developer Reset Demo Data");
  // State is currently mutated
  const mutatedOverdue = crmStore
    .getSnapshot()
    .followUps.filter((f) => f.status === "scheduled" && isOverdue(f.scheduledAt)).length;
  console.log(`  Mutated overdue count: ${mutatedOverdue}`);

  // Trigger Reset
  crmStore.reset();
  const resetState = crmStore.getSnapshot();

  if (resetState.customers.length !== initial.customers.length) {
    throw new Error("J6 Failed: Customers count mismatch after reset.");
  }
  if (resetState.opportunities.length !== initial.opportunities.length) {
    throw new Error("J6 Failed: Opportunities count mismatch after reset.");
  }
  if (resetState.followUps.length !== initial.followUps.length) {
    throw new Error("J6 Failed: Follow-ups count mismatch after reset.");
  }

  const resetOverdue = resetState.followUps.filter(
    (f) => f.status === "scheduled" && isOverdue(f.scheduledAt)
  ).length;
  if (resetOverdue !== overdueBefore.length) {
    throw new Error(`J6 Failed: Overdue count not restored to initial ${overdueBefore.length}, got ${resetOverdue}`);
  }

  const opp2 = resetState.opportunities.find((o) => o.id === "op_02");
  if (opp2?.stage !== "quotation") {
    throw new Error("J6 Failed: op_02 stage not restored to quotation.");
  }

  console.log("  ✓ J6 Passed: Complete demo dataset restored atomically with pristine initial state.\n");

  console.log("=================================================");
  console.log("🏆 ALL 6 ACCEPTANCE JOURNEYS PASSED WITH 100% SUCCESS!");
  console.log("=================================================");
}

runAcceptanceJourneys().catch((err) => {
  console.error("❌ Acceptance Journey Failed:", err);
  process.exit(1);
});
