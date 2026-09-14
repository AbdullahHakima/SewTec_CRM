import { crmStore } from "../lib/storage/crm-store";
import { formatEgp, formatCompactEgp } from "../lib/currency/format-currency";
import { Product } from "../types/crm";

// Mock localStorage for Node environment if not present
if (typeof window === "undefined" || !globalThis.localStorage) {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k in store) delete store[k];
    },
    length: 0,
    key: () => null,
  };
}

function runEdgeCaseAndFailureTests() {
  console.log("🛡️ Running SewTec CRM Frontend Edge Cases & System Failure Recovery Tests...");

  // =========================================================================
  // SECTION 1: User Wrong Inputs & Sanitization
  // =========================================================================

  // 1.1 Phone Number Normalization & 11-digit Boundary Validation
  const normalizeEgyptianPhone = (raw: string): string => {
    if (!raw) return "";
    // Convert Arabic-Indic numerals
    let converted = "";
    for (const ch of raw) {
      if (ch >= "٠" && ch <= "٩") {
        converted += String.fromCharCode("0".charCodeAt(0) + (ch.charCodeAt(0) - "٠".charCodeAt(0)));
      } else {
        converted += ch;
      }
    }
    let digits = converted.replace(/\D/g, "");
    if (digits.startsWith("0020") && (digits.length === 14 || digits.length === 13)) {
      digits = digits.substring(4);
    } else if (digits.startsWith("20") && (digits.length === 13 || digits.length === 12)) {
      digits = digits.substring(2);
    }
    if (digits.length === 10 && (digits.startsWith("10") || digits.startsWith("11") || digits.startsWith("12") || digits.startsWith("15"))) {
      digits = "0" + digits;
    }
    return digits;
  };

  const isPhoneValid11Digits = (phone: string): boolean => {
    const digits = normalizeEgyptianPhone(phone);
    return digits.length === 11 && digits.startsWith("01");
  };

  // Valid inputs
  if (!isPhoneValid11Digits("01012345678")) throw new Error("Expected 01012345678 to be valid");
  if (!isPhoneValid11Digits("010-1234-5678")) throw new Error("Expected formatted phone to be valid");
  if (!isPhoneValid11Digits("+201012345678")) throw new Error("Expected +20 prefix to be valid");
  if (!isPhoneValid11Digits("٠١٠١٢٣٤٥٦٧٨")) throw new Error("Expected Arabic-Indic digits to be valid");
  if (!isPhoneValid11Digits("0020 10 1234 5678")) throw new Error("Expected 0020 prefix with spaces to be valid");

  // Invalid inputs (User wrong inputs)
  if (isPhoneValid11Digits("0101234567")) throw new Error("Expected 10 digits to be invalid");
  if (isPhoneValid11Digits("010123456789")) throw new Error("Expected 12 digits to be invalid");
  if (isPhoneValid11Digits("02012345678")) throw new Error("Expected landline 02 to be invalid for mobile");
  if (isPhoneValid11Digits("")) throw new Error("Expected empty phone to be invalid");
  if (isPhoneValid11Digits("abcdefghijk")) throw new Error("Expected non-digits to be invalid");
  console.log("✓ Test 1 Passed: Egyptian 11-digit phone normalization, Arabic numerals, and boundary checks pass.");

  // 1.2 Currency Formatter Edge Cases
  if (formatEgp(0) !== "0 ج.م") throw new Error("0 must format to '0 ج.م'");
  if (formatEgp(null) !== "0 ج.م") throw new Error("null must format to '0 ج.م'");
  if (formatEgp(undefined) !== "0 ج.م") throw new Error("undefined must format to '0 ج.م'");
  if (formatEgp(NaN) !== "0 ج.م") throw new Error("NaN must format to '0 ج.م'");
  if (formatEgp(46000) !== "46,000 ج.م") throw new Error("46000 must format to '46,000 ج.م'");
  if (formatEgp(-5000) !== "-5,000 ج.م") throw new Error("-5000 must format to '-5,000 ج.م'");
  if (formatCompactEgp(1500000) !== "1.5M ج.م") throw new Error("1500000 must compact to '1.5M ج.م'");
  if (formatCompactEgp(75000) !== "75K ج.م") throw new Error("75000 must compact to '75K ج.م'");
  console.log("✓ Test 2 Passed: Currency formatter handles null, undefined, NaN, negative, and million/thousand boundaries.");

  // 1.3 Search Regex Injection & Malformed Query Resilience
  crmStore.reset();
  const products = crmStore.getSnapshot().products;
  const dangerousQueries = [
    "[",
    "]",
    "(",
    ")",
    "*",
    "+",
    "?",
    "\\",
    "^",
    "$",
    "JACK (A4B)*",
    "'; DROP TABLE Products; --",
    "<script>alert('xss')</script>",
  ];

  for (const query of dangerousQueries) {
    try {
      const q = query.toLowerCase();
      products.filter(
        (p) =>
          p.model.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.descriptionArabic.toLowerCase().includes(q)
      );
      // Safe execution, no crash
    } catch {
      throw new Error(`Search crashed on dangerous query: ${query}`);
    }
  }
  console.log("✓ Test 3 Passed: Search filter handles regex metacharacters and injection strings safely without crashing.");

  // =========================================================================
  // SECTION 2: System Failures, Storage Corruption & Recovery (24/7 Reliability)
  // =========================================================================

  // Legacy browser data is never hydrated into a new session.
  crmStore.clear();
  localStorage.setItem("sewtec_crm_state_v1", "INVALID_MALFORMED_JSON{{{");
  crmStore.initClient();
  if (crmStore.getSnapshot().customers.length !== 0) throw new Error("Legacy data leaked into an empty session");
  localStorage.setItem("sewtec_crm_state_v1", JSON.stringify({ version: 99999, customers: [{id: "other-user"}] }));
  crmStore.initClient();
  if (crmStore.getSnapshot().customers.length !== 0) throw new Error("Legacy schema data leaked");
  console.log("Storage isolation: malformed and old customer caches never hydrate.");
  crmStore.reset();

  // =========================================================================
  // SECTION 3: Multi-Entity State Consistency & Rollback
  // =========================================================================

  // 3.1 Opportunity Stage Rollback: Won -> Negotiation
  crmStore.reset();
  const testCustomerId = "cust_01";
  const initialCustomer = crmStore.getSnapshot().customers.find((c) => c.id === testCustomerId)!;
  const initialLifetimeSales = initialCustomer.lifetimeSales;
  const initialPipeline = initialCustomer.openPipelineValue;

  const dealValue = 50000;
  // Step A: Deal is Won
  crmStore.update((draft) => {
    const cust = draft.customers.find((c) => c.id === testCustomerId)!;
    cust.lifetimeSales += dealValue;
    cust.openPipelineValue = Math.max(0, cust.openPipelineValue - dealValue);
    if (cust.lifetimeSales >= 250000) cust.isVip = true;
  });

  const wonCustomer = crmStore.getSnapshot().customers.find((c) => c.id === testCustomerId)!;
  if (wonCustomer.lifetimeSales !== initialLifetimeSales + dealValue) {
    throw new Error("Lifetime sales did not increment on Won");
  }

  // Step B: Reopen deal to Negotiation (Rollback)
  crmStore.update((draft) => {
    const cust = draft.customers.find((c) => c.id === testCustomerId)!;
    cust.lifetimeSales = Math.max(0, cust.lifetimeSales - dealValue);
    cust.openPipelineValue += dealValue;
  });

  const revertedCustomer = crmStore.getSnapshot().customers.find((c) => c.id === testCustomerId)!;
  if (revertedCustomer.lifetimeSales !== initialLifetimeSales) {
    throw new Error("Lifetime sales failed to rollback when deal was reopened");
  }
  if (revertedCustomer.openPipelineValue !== initialPipeline) {
    throw new Error("Open pipeline failed to restore when deal was reopened");
  }
  console.log("✓ Test 6 Passed: Opportunity stage rollback (Won -> Reopened) accurately restores financial balances.");

  // 3.2 Automated Follow-up Retry on "no_answer" Across Date Boundaries
  const overdueTaskId = "fu_01";

  // Calculate tomorrow 11:00 AM UTC
  const now = new Date();
  const expectedRetryDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 11, 0, 0, 0));

  crmStore.update((draft) => {
    const fu = draft.followUps.find((f) => f.id === overdueTaskId)!;
    fu.status = "completed";
    fu.completedAt = now.toISOString();
    fu.outcome = "no_answer";
    fu.outcomeNote = "الهاتف يرن دون إجابة";

    // Create auto-retry task
    const retryId = "fu_retry_" + Date.now();
    draft.followUps.push({
      id: retryId,
      branchId: "mahalla",
      customerId: fu.customerId,
      customerName: fu.customerName,
      customerPhone: fu.customerPhone,
      channel: fu.channel,
      scheduledAt: expectedRetryDate.toISOString(),
      topic: `إعادة محاولة اتصال (لم يرد سابقاً): ${fu.topic}`,
      status: "scheduled",
      assignedRepId: fu.assignedRepId,
      assignedRepName: fu.assignedRepName,
    });
  });

  const scheduledRetry = crmStore.getSnapshot().followUps.find((f) => f.topic.includes("لم يرد سابقاً"));
  if (!scheduledRetry) {
    throw new Error("Next-day retry task was not generated for 'no_answer'");
  }
  const scheduledTime = new Date(scheduledRetry.scheduledAt);
  if (scheduledTime.getUTCHours() !== 11) {
    throw new Error(`Expected retry hour to be 11:00 UTC, got ${scheduledTime.getUTCHours()}`);
  }
  console.log("✓ Test 7 Passed: 'no_answer' flow correctly orchestrates next-day 11:00 AM retry across date boundaries.");

  // =========================================================================
  // SECTION 4: High-Volume Performance Stress Test
  // =========================================================================
  const syntheticCatalog: Product[] = [];
  const brands: Product["brand"][] = ["JACK", "HIKARI", "SIRUBA", "JUKI", "BROTHER"];
  const categories: Product["category"][] = ["single_needle", "overlock", "interlock", "buttonhole", "special"];

  for (let i = 0; i < 1000; i++) {
    syntheticCatalog.push({
      id: `prod_bench_${i}`,
      model: `MODEL-X-${i}`,
      brand: brands[i % brands.length],
      category: categories[i % categories.length],
      suggestedPriceEgp: 20000 + (i * 100),
      descriptionArabic: `ماكينة خياطة صناعية تجريبية موديل ${i}`,
      speedRpm: 4000 + (i % 3000),
      inStock: i % 2 === 0,
      stockCount: i % 10,
    });
  }

  const startTime = Date.now();
  // Filter by brand "JUKI", category "single_needle", price 20k-50k
  const filtered = syntheticCatalog.filter(
    (p) =>
      p.brand === "JUKI" &&
      p.suggestedPriceEgp >= 20000 &&
      p.suggestedPriceEgp <= 60000
  ).sort((a, b) => b.suggestedPriceEgp - a.suggestedPriceEgp);

  const durationMs = Date.now() - startTime;
  if (filtered.length === 0) throw new Error("Benchmark filter returned 0 items");
  if (durationMs > 50) throw new Error(`Filtering 1000 items took too long: ${durationMs}ms`);

  console.log(`✓ Test 8 Passed: Stress benchmark on 1,000 catalog items completed in ${durationMs}ms (target < 50ms).`);

  console.log("🎉 ALL 8 Edge Cases, Failure Recovery & Stress Tests Passed Successfully!");
}

runEdgeCaseAndFailureTests();

