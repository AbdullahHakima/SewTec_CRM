using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SewTec.CRM.Api.DTOs;
using SewTec.CRM.Api.Models;

namespace SewTec.CRM.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(CrmDbContext context)
    {
        if (await context.Users.AnyAsync()) { await EnsureProductsSeededAsync(context); return; }

        var now = DateTime.UtcNow;
        var yesterday = now.AddDays(-1);
        var twoDaysAgo = now.AddDays(-2);
        var threeDaysAgo = now.AddDays(-3);
        var fourDaysAgo = now.AddDays(-4);
        var fiveDaysAgo = now.AddDays(-5);
        var sixDaysAgo = now.AddDays(-6);
        var sevenDaysAgo = now.AddDays(-7);
        var eightDaysAgo = now.AddDays(-8);
        var tenDaysAgo = now.AddDays(-10);
        var fourteenDaysAgo = now.AddDays(-14);
        var fifteenDaysAgo = now.AddDays(-15);
        var twentyTwoDaysAgo = now.AddDays(-22);
        var tomorrow = now.AddDays(1);
        var threeDaysLater = now.AddDays(3);

        // 1. Users
        var adminUser = new AppUser
        {
            Id           = "admin_01",
            Username     = "admin",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            FullName     = "مدير النظام",
            Role         = "admin",
            BranchId     = "mahalla",
            CreatedAt    = now
        };

        var repUser1 = new AppUser
        {
            Id           = "rep_01",
            Username     = "ahmed",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("ahmed123"),
            FullName     = "أحمد شحاتة",
            Role         = "rep",
            BranchId     = "mahalla",
            CreatedAt    = now
        };

        var repUser2 = new AppUser
        {
            Id           = "rep_02",
            Username     = "mohamed",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("mohamed123"),
            FullName     = "محمد السيد",
            Role         = "rep",
            BranchId     = "mahalla",
            CreatedAt    = now
        };

        context.Users.AddRange(adminUser, repUser1, repUser2);

        // 2. Customers & Installed Machines
        var customers = new List<Customer>
        {
            new Customer
            {
                Id = "cust_01",
                BranchId = "mahalla",
                Name = "مصنع النور للملابس الجاهزة",
                Type = CustomerType.Factory,
                Status = CustomerStatus.Active,
                IsVip = true,
                Phone = "010-0000-1122",
                PhoneSecondary = "01522223344",
                ContactPerson = "الحاج محمود الشناوي",
                Address = "المنطقة الصناعية، طريق المنصورة، مجمع المصانع 4",
                City = "المحلة الكبرى",
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة",
                LifetimeSales = 385000,
                OpenPipelineValue = 120000,
                LastContactAt = yesterday,
                NextFollowUpAt = new DateTime(yesterday.Year, yesterday.Month, yesterday.Day, 10, 30, 0, DateTimeKind.Utc),
                Notes = "مصنع متخصص في البنطلون والقميص الرجالي. عميل دائم ذو التزام مالي ممتاز.",
                CreatedAt = now.AddDays(-180),
                InstalledMachines = new List<InstalledMachine>
                {
                    new InstalledMachine { CustomerId = "cust_01", Model = "JACK A4", Quantity = 5, SerialNumber = "SN-JK-2023-0891", PurchaseYear = 2023, PurchasedFromSewTec = true },
                    new InstalledMachine { CustomerId = "cust_01", Model = "SIRUBA 747K", Quantity = 2, SerialNumber = "SN-SR-2022-4412", PurchaseYear = 2022, PurchasedFromSewTec = true }
                }
            },
            new Customer
            {
                Id = "cust_02",
                BranchId = "mahalla",
                Name = "شركة الصفوة لتجارة وتوريد الماكينات",
                Type = CustomerType.Trader,
                Status = CustomerStatus.Active,
                IsVip = false,
                Phone = "011-0000-3344",
                PhoneSecondary = "01522335566",
                ContactPerson = "أ/ محمد غنيم",
                Address = "شارع شكري القوتلي، برج النصر التجاري",
                City = "المحلة الكبرى",
                AssignedRepId = "rep_02",
                AssignedRepName = "محمد السيد",
                LifetimeSales = 190000,
                OpenPipelineValue = 138000,
                LastContactAt = twoDaysAgo,
                NextFollowUpAt = new DateTime(now.Year, now.Month, now.Day, 11, 15, 0, DateTimeKind.Utc),
                Notes = "تاجر معتمد بالمحلة يقوم بإعادة التوزيع للورش الصغيرة.",
                CreatedAt = now.AddDays(-120),
                InstalledMachines = new List<InstalledMachine>
                {
                    new InstalledMachine { CustomerId = "cust_02", Model = "JACK A4B", Quantity = 3, PurchaseYear = 2024, PurchasedFromSewTec = true }
                }
            },
            new Customer
            {
                Id = "cust_03",
                BranchId = "mahalla",
                Name = "ورشة المستقبل للملابس الرياضية",
                Type = CustomerType.Workshop,
                Status = CustomerStatus.Dormant,
                IsVip = false,
                Phone = "012-0000-5566",
                ContactPerson = "إبراهيم كمال",
                Address = "منطقة المنشية، خلف مدرسة طلعت حرب",
                City = "المحلة الكبرى",
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة",
                LifetimeSales = 85000,
                OpenPipelineValue = 0,
                LastContactAt = twentyTwoDaysAgo,
                NextFollowUpAt = new DateTime(now.Year, now.Month, now.Day, 14, 0, 0, DateTimeKind.Utc),
                Notes = "ورشة تصنيع ترنجات وملابس رياضية. لم يتواصل معهم أحد منذ 22 يوماً بحاجة لتنشيط.",
                CreatedAt = now.AddDays(-90),
                InstalledMachines = new List<InstalledMachine>
                {
                    new InstalledMachine { CustomerId = "cust_03", Model = "Overlock 4-thread", Quantity = 2, PurchaseYear = 2021, PurchasedFromSewTec = false }
                }
            },
            new Customer
            {
                Id = "cust_04",
                BranchId = "mahalla",
                Name = "مصنع الهدى للتريكو والصباغة",
                Type = CustomerType.Factory,
                Status = CustomerStatus.Active,
                IsVip = true,
                Phone = "010-0000-9988",
                ContactPerson = "م/ حسن عبد ربه",
                Address = "طريق محلة أبو علي، المنطقة الصناعية",
                City = "المحلة الكبرى",
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة",
                LifetimeSales = 420000,
                OpenPipelineValue = 310000,
                LastContactAt = fourDaysAgo,
                NextFollowUpAt = new DateTime(tomorrow.Year, tomorrow.Month, tomorrow.Day, 11, 0, 0, DateTimeKind.Utc),
                Notes = "مصنع كبير يخطط لتوسعة خط الخياطة والتطريز بالكامل.",
                CreatedAt = now.AddDays(-200),
                InstalledMachines = new List<InstalledMachine>
                {
                    new InstalledMachine { CustomerId = "cust_04", Model = "SIRUBA 747K", Quantity = 6, PurchaseYear = 2022, PurchasedFromSewTec = true },
                    new InstalledMachine { CustomerId = "cust_04", Model = "JACK A4", Quantity = 4, PurchaseYear = 2023, PurchasedFromSewTec = true }
                }
            },
            new Customer
            {
                Id = "cust_05",
                BranchId = "mahalla",
                Name = "أحمد حسنين الكردي (مشغل السعادة)",
                Type = CustomerType.Individual,
                Status = CustomerStatus.Active,
                IsVip = false,
                Phone = "010-0000-7788",
                ContactPerson = "أحمد حسنين",
                Address = "حي أبو راضي، بجوار مسجد الست زينب",
                City = "المحلة الكبرى",
                AssignedRepId = "rep_02",
                AssignedRepName = "محمد السيد",
                LifetimeSales = 18500,
                OpenPipelineValue = 0,
                LastContactAt = eightDaysAgo,
                NextFollowUpAt = new DateTime(threeDaysLater.Year, threeDaysLater.Month, threeDaysLater.Day, 12, 0, 0, DateTimeKind.Utc),
                Notes = "ترزي مستقل اشترى ماكينة سنجر كمبيوتر للمشغل الخاص به.",
                CreatedAt = now.AddDays(-40),
                InstalledMachines = new List<InstalledMachine>
                {
                    new InstalledMachine { CustomerId = "cust_05", Model = "JACK F4", Quantity = 1, SerialNumber = "SN-F4-2024-1002", PurchaseYear = 2024, PurchasedFromSewTec = true }
                }
            }
        };

        context.Customers.AddRange(customers);

        // 3. Opportunities
        var opportunities = new List<Opportunity>
        {
            new Opportunity
            {
                Id = "op_01",
                BranchId = "mahalla",
                CustomerId = "cust_01",
                CustomerName = "مصنع النور للملابس الجاهزة",
                Title = "توريد 3 ماكينات HIKARI HK2900ASS",
                MachineModel = "HIKARI HK2900ASS",
                Quantity = 3,
                EstimatedValue = 120000,
                Stage = OpportunityStage.Negotiation,
                StageUpdatedAt = eightDaysAgo,
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة",
                ExpectedCloseDate = now.AddDays(5),
                QuotationRef = "Q-2026-0041",
                Notes = "العميل طلب خصم 3% للكمية. تم رفع الطلب للإدارة والموافقة المبدئية جاهزة.",
                CreatedAt = fourteenDaysAgo
            },
            new Opportunity
            {
                Id = "op_02",
                BranchId = "mahalla",
                CustomerId = "cust_02",
                CustomerName = "شركة الصفوة لتجارة وتوريد الماكينات",
                Title = "عرض سعر توريد 3 ماكينات JACK A4B",
                MachineModel = "JACK A4B",
                Quantity = 3,
                EstimatedValue = 138000,
                Stage = OpportunityStage.Quotation,
                StageUpdatedAt = fourDaysAgo,
                AssignedRepId = "rep_02",
                AssignedRepName = "محمد السيد",
                ExpectedCloseDate = now.AddDays(7),
                QuotationRef = "Q-2026-0042",
                Notes = "عرض سعر رسمي ساري لمدة 10 أيام. بانتظار رد الشركاء بالفرع.",
                CreatedAt = eightDaysAgo
            },
            new Opportunity
            {
                Id = "op_03",
                BranchId = "mahalla",
                CustomerId = "cust_04",
                CustomerName = "مصنع الهدى للتريكو والصباغة",
                Title = "تحديث خط الخياطة والسرفلة المتكامل",
                MachineModel = "SIRUBA 747K + JACK A4B",
                Quantity = 8,
                EstimatedValue = 310000,
                Stage = OpportunityStage.Interested,
                StageUpdatedAt = twoDaysAgo,
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة",
                ExpectedCloseDate = now.AddDays(20),
                Notes = "تمت المعاينة الميدانية للورشة وحصر الاحتياجات.",
                CreatedAt = tenDaysAgo
            },
            new Opportunity
            {
                Id = "op_04",
                BranchId = "mahalla",
                CustomerId = "cust_03",
                CustomerName = "ورشة المستقبل للملابس الرياضية",
                Title = "استبدال ماكينة الأوفرلوك القديمة",
                MachineModel = "SIRUBA 747K",
                Quantity = 1,
                EstimatedValue = 48000,
                Stage = OpportunityStage.Contacted,
                StageUpdatedAt = sixDaysAgo,
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة",
                ExpectedCloseDate = now.AddDays(12),
                Notes = "الورشة بحاجة لسداد نقدي مع تسهيلات شهرية.",
                CreatedAt = fifteenDaysAgo
            },
            new Opportunity
            {
                Id = "op_05",
                BranchId = "mahalla",
                CustomerId = "cust_05",
                CustomerName = "أحمد حسنين الكردي",
                Title = "شراء ماكينة عراوي إضافية",
                MachineModel = "JACK Buttonhole",
                Quantity = 1,
                EstimatedValue = 35000,
                Stage = OpportunityStage.New,
                StageUpdatedAt = yesterday,
                AssignedRepId = "rep_02",
                AssignedRepName = "محمد السيد",
                ExpectedCloseDate = now.AddDays(30),
                Notes = "استفسار مبدئي عبر الهاتف عن ماكينات العراوي الصينية.",
                CreatedAt = twoDaysAgo
            }
        };

        context.Opportunities.AddRange(opportunities);

        // 4. FollowUps
        var followUps = new List<FollowUp>
        {
            new FollowUp
            {
                Id = "fu_01",
                BranchId = "mahalla",
                CustomerId = "cust_01",
                CustomerName = "مصنع النور للملابس الجاهزة",
                CustomerPhone = "010-0000-1122",
                Channel = FollowUpChannel.Call,
                ScheduledAt = new DateTime(yesterday.Year, yesterday.Month, yesterday.Day, 10, 30, 0, DateTimeKind.Utc),
                Topic = "متابعة طلب تخفيض 3% على ماكينة HK2900ASS (عرض Q-2026-0041)",
                Status = FollowUpStatus.Scheduled,
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة"
            },
            new FollowUp
            {
                Id = "fu_02",
                BranchId = "mahalla",
                CustomerId = "cust_02",
                CustomerName = "شركة الرواد للتجارة",
                CustomerPhone = "010-0000-8811",
                Channel = FollowUpChannel.Call,
                ScheduledAt = new DateTime(twoDaysAgo.Year, twoDaysAgo.Month, twoDaysAgo.Day, 12, 0, 0, DateTimeKind.Utc),
                Topic = "متابعة استلام الكتالوج الفني وأسعار الجملة لماكينات Jack",
                Status = FollowUpStatus.Scheduled,
                AssignedRepId = "rep_02",
                AssignedRepName = "محمد السيد"
            },
            new FollowUp
            {
                Id = "fu_03",
                BranchId = "mahalla",
                CustomerId = "cust_04",
                CustomerName = "شركة النجاح للغزل",
                CustomerPhone = "011-0000-7722",
                Channel = FollowUpChannel.Visit,
                ScheduledAt = new DateTime(threeDaysAgo.Year, threeDaysAgo.Month, threeDaysAgo.Day, 14, 30, 0, DateTimeKind.Utc),
                Topic = "معاينة خط التجهيز وتقديم استشارة فنية في مقر المصنع",
                Status = FollowUpStatus.Scheduled,
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة"
            },
            new FollowUp
            {
                Id = "fu_04",
                BranchId = "mahalla",
                CustomerId = "cust_02",
                CustomerName = "شركة الصفوة لتجارة وتوريد الماكينات",
                CustomerPhone = "011-0000-3344",
                Channel = FollowUpChannel.Visit,
                ScheduledAt = new DateTime(now.Year, now.Month, now.Day, 11, 15, 0, DateTimeKind.Utc),
                Topic = "معاينة مقر فرع المحلة وتسليم عرض أسعار JACK A4B باليد",
                Status = FollowUpStatus.Scheduled,
                AssignedRepId = "rep_02",
                AssignedRepName = "محمد السيد"
            },
            new FollowUp
            {
                Id = "fu_05",
                BranchId = "mahalla",
                CustomerId = "cust_03",
                CustomerName = "ورشة المستقبل للملابس الرياضية",
                CustomerPhone = "012-0000-5566",
                Channel = FollowUpChannel.Whatsapp,
                ScheduledAt = new DateTime(now.Year, now.Month, now.Day, 14, 0, 0, DateTimeKind.Utc),
                Topic = "إرسال فيديو توضيحي لماكينة الأوفرلوك 4 فتلة وسعر السداد النقدي",
                Status = FollowUpStatus.Scheduled,
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة"
            },
            new FollowUp
            {
                Id = "fu_06",
                BranchId = "mahalla",
                CustomerId = "cust_04",
                CustomerName = "مصنع الهدى للتريكو والصباغة",
                CustomerPhone = "010-0000-9988",
                Channel = FollowUpChannel.Call,
                ScheduledAt = new DateTime(tomorrow.Year, tomorrow.Month, tomorrow.Day, 11, 0, 0, DateTimeKind.Utc),
                Topic = "مناقشة تفاصيل الدفعات والجدول الزمني لتوريد 8 ماكينات",
                Status = FollowUpStatus.Scheduled,
                AssignedRepId = "rep_01",
                AssignedRepName = "أحمد شحاتة"
            },
            new FollowUp
            {
                Id = "fu_07",
                BranchId = "mahalla",
                CustomerId = "cust_05",
                CustomerName = "أحمد حسنين الكردي",
                CustomerPhone = "010-0000-7788",
                Channel = FollowUpChannel.Call,
                ScheduledAt = new DateTime(threeDaysLater.Year, threeDaysLater.Month, threeDaysLater.Day, 12, 0, 0, DateTimeKind.Utc),
                Topic = "استطلاع الرأي بعد أسبوعين من تشغيل ماكينة JACK F4 وفحص الضمان",
                Status = FollowUpStatus.Scheduled,
                AssignedRepId = "rep_02",
                AssignedRepName = "محمد السيد"
            }
        };

        context.FollowUps.AddRange(followUps);

        // 5. Interactions
        var interactions = new List<Interaction>
        {
            new Interaction
            {
                Id = "int_01",
                CustomerId = "cust_01",
                CustomerName = "مصنع النور للملابس الجاهزة",
                Channel = InteractionChannel.Call,
                Outcome = InteractionOutcome.Interested,
                Summary = "تم الاتصال بالحاج محمود الشناوي، مهتم بـ 3 ماكينات HK2900ASS وطلب خصم 3% للكمية.",
                PerformedBy = "أحمد شحاتة",
                OccurredAt = twoDaysAgo,
                OpportunityId = "op_01"
            },
            new Interaction
            {
                Id = "int_02",
                CustomerId = "cust_01",
                CustomerName = "مصنع النور للملابس الجاهزة",
                Channel = InteractionChannel.Visit,
                Outcome = InteractionOutcome.QuotationRequested,
                Summary = "زيارة ميدانية لمقر المصنع بالمنطقة الصناعية ومعاينة خط القميص القديم.",
                PerformedBy = "أحمد شحاتة",
                OccurredAt = sevenDaysAgo,
                OpportunityId = "op_01"
            }
        };

        context.Interactions.AddRange(interactions);

        // 6. Activities
        var activities = new List<Activity>
        {
            new Activity
            {
                Id = "act_01",
                CustomerId = "cust_01",
                Type = ActivityType.Interaction,
                Title = "مكالمة هاتفية مع الحاج محمود الشناوي",
                Description = "مناقشة التخفيض المطلوب (3%) لماكينة HK2900ASS، وتم إبلاغه بانتظار موافقة الإدارة.",
                OccurredAt = twoDaysAgo,
                PerformedBy = "أحمد شحاتة",
                MetadataJson = JsonSerializer.Serialize(new ActivityMetadataDto(
                    Channel: "call",
                    MachineModel: "HIKARI HK2900ASS",
                    QuotationRef: "Q-2026-0041",
                    OpportunityId: "op_01",
                    Amount: null,
                    Outcome: null
                ))
            },
            new Activity
            {
                Id = "act_02",
                CustomerId = "cust_01",
                Type = ActivityType.Quotation,
                Title = "إرسال عرض أسعار رسمي رقم Q-2026-0041",
                Description = "عرض سعر توريد 3 ماكينات HIKARI HK2900ASS بقيمة إجمالية 120,000 ج.م شامل التوصيل والتركيب.",
                OccurredAt = fiveDaysAgo,
                PerformedBy = "أحمد شحاتة",
                MetadataJson = JsonSerializer.Serialize(new ActivityMetadataDto(
                    Channel: null,
                    MachineModel: "HIKARI HK2900ASS",
                    QuotationRef: "Q-2026-0041",
                    OpportunityId: null,
                    Amount: 120000,
                    Outcome: null
                ))
            },
            new Activity
            {
                Id = "act_03",
                CustomerId = "cust_01",
                Type = ActivityType.Interaction,
                Title = "زيارة ميدانية للمصنع",
                Description = "معاينة خطوط الإنتاج القائمة؛ يوجد 5 ماكينات Jack قديمة بحاجة لاستبدال مستقبلي.",
                OccurredAt = sevenDaysAgo,
                PerformedBy = "أحمد شحاتة",
                MetadataJson = JsonSerializer.Serialize(new ActivityMetadataDto(
                    Channel: "visit",
                    MachineModel: null,
                    QuotationRef: null,
                    OpportunityId: null,
                    Amount: null,
                    Outcome: null
                ))
            }
        };

        context.Activities.AddRange(activities);

                await EnsureProductsSeededAsync(context);
        await context.SaveChangesAsync();
    }

    public static async Task EnsureProductsSeededAsync(CrmDbContext context)
    {
        if (await context.Products.CountAsync() >= 15) return;

        var existing = await context.Products.ToListAsync();
        if (existing.Any())
        {
            context.Products.RemoveRange(existing);
            await context.SaveChangesAsync();
        }

        var products = GetCatalogProducts();
        try
        {
            var baseDir = AppContext.BaseDirectory;
            var p1 = Path.Combine(baseDir, "Data", "seed_files", "catalog_seed.json");
            var p2 = Path.Combine(Directory.GetCurrentDirectory(), "backend", "Data", "seed_files", "catalog_seed.json");
            var seedPath = File.Exists(p1) ? p1 : (File.Exists(p2) ? p2 : null);
            if (seedPath != null)
            {
                var json = await File.ReadAllTextAsync(seedPath);
                var fromFile = JsonSerializer.Deserialize<List<Product>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (fromFile != null && fromFile.Any())
                {
                    products = fromFile;
                }
            }
        }
        catch { /* fallback to built-in */ }

        context.Products.AddRange(products);
        await context.SaveChangesAsync();
    }

    public static List<Product> GetCatalogProducts()
    {
        return new List<Product>
        {
            new Product
            {
                Id = "prod_01",
                Model = "JACK A4B-A",
                Brand = "JACK",
                Category = "single_needle",
                SuggestedPriceEgp = 46000,
                DescriptionArabic = "ماكينة سنجر كمبيوتر كاملة مع محرك سيرفو مدمج، قص خيط أوتوماتيك فائق النظافة، ورفع دواس إلكتروني.",
                SpeedRpm = 5000,
                MaxStitchLengthMm = 5.0m,
                NeedleSystem = "DBx1 11-18#",
                MotorType = "سيرفو دفع مباشر مدمج 550W (Direct Drive)",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = true,
                LubricationType = "حوض زيت مغلق جاف بالكامل لمنع بقع الزيت",
                WarrantyMonths = 24,
                InStock = true,
                StockCount = 12,
                Application = "القمصان، البنطلونات، الملابس الجاهزة، وأقمشة الجينز الخفيفة والمتوسطة",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "شاشة تحكم رقمية ملونة تعمل باللمس",
                    "توجيه صوتي ذكي باللغة العربية لشرح الأعطال والاستخدام",
                    "قص خيط قصير جداً بأقل من 3 مم لتوفير وقت التشطيب",
                    "إضاءة LED ثلاثية المستويات موجهة لمنطقة الإبرة",
                    "منفذ USB مدمج لشحن الهاتف وتحديث السوفتوير"
                })
            },
            new Product
            {
                Id = "prod_02",
                Model = "JACK A5E-A",
                Brand = "JACK",
                Category = "single_needle",
                SuggestedPriceEgp = 54000,
                DescriptionArabic = "ماكينة خياطة ذكية مزودة بشريحة ذكاء اصطناعي (AI Chip) وحساس استشعار أوتوماتيكي لسماكة القماش بدون أي ضبط يدوي.",
                SpeedRpm = 5000,
                MaxStitchLengthMm = 5.0m,
                NeedleSystem = "DBx1 11-18#",
                MotorType = "سيرفو ذكي بنظام تحكم رقمي متطور",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = true,
                LubricationType = "نظام تزييت شبه جاف مختوم (Semi-dry)",
                WarrantyMonths = 36,
                InStock = true,
                StockCount = 8,
                Application = "خياطة الأقمشة المتغيرة من الحرير والشيفون الرقيق حتى 8 طبقات جينز سميك دون تغيير الإعدادات",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "شريحة AI تستشعر كثافة وسماكة القماش في أجزاء من الثانية",
                    "موتور خطوي فائق الهدوء يتحكم في الفرماتورة وطول الغرزة بدقة 0.1 مم",
                    "ذراع واسع بمساحة تشغيل 264 مم لسهولة تدوير وتطريز القطع الكبيرة",
                    "نظام منع كسر الإبرة عند بدء التشغيل السريع"
                })
            },
            new Product
            {
                Id = "prod_03",
                Model = "JACK F4",
                Brand = "JACK",
                Category = "single_needle",
                SuggestedPriceEgp = 19500,
                DescriptionArabic = "ماكينة سنجر اقتصادية متينة بموتور مدمج بدون سيور، الحل المثالي للمشاغل وورش تصنيع الملابس.",
                SpeedRpm = 5000,
                MaxStitchLengthMm = 5.0m,
                NeedleSystem = "DBx1 11-18#",
                MotorType = "سيرفو مدمج موفر للطاقة 550W",
                HasAutomaticTrimmer = false,
                HasAutoFootLifter = false,
                HasReverseStitch = true,
                LubricationType = "تزييت أوتوماتيك بالطلمبة",
                WarrantyMonths = 12,
                InStock = true,
                StockCount = 18,
                Application = "ورش الخياطة، مشاغل العبايات والترزية، والإنتاج اليومي المتوسط",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "توفير استهلاك الكهرباء بنسبة تصل إلى 71% مقارنة بالمواتير التقليدية",
                    "لوحة تحكم مبسطة وسريعة لضبط السرعة القصوى بضغطة زر",
                    "مفتاح تحديد موضع الإبرة إلكترونياً (أعلى / أسفل)",
                    "إضاءة LED موجهة موفرة ومريحة للعين"
                })
            },
            new Product
            {
                Id = "prod_04",
                Model = "JACK C4",
                Brand = "JACK",
                Category = "overlock",
                SuggestedPriceEgp = 52000,
                DescriptionArabic = "ماكينة أوفرلوك 4 فتلة كمبيوتر متطورة مع حساس كهروضوئي لقص الخيط ورفع الدواس تلقائياً.",
                SpeedRpm = 7000,
                MaxStitchLengthMm = 3.8m,
                NeedleSystem = "DCx27 11-14#",
                MotorType = "سيرفو دفع مباشر مدمج عالي السرعة",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = false,
                LubricationType = "تزييت محكم مغلق كلياً مع فلتر تنقية للزيت",
                WarrantyMonths = 24,
                InStock = true,
                StockCount = 7,
                Application = "الملابس الرياضية، التيشيرت، الترنجات، الأقمشة المطاطية، والليكرا",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "3 حساسات ذكية تبدأ الخياطة وتقص الخيط وترفع الدواس أوتوماتيكياً",
                    "سرعة خيالية تصل لـ 7000 دورة/دقيقة مع ثبات مطلق وانعدام الاهتزاز",
                    "سحب وشفط هوائي مدمج لقصاصات القماش والخيوط الزائدة",
                    "إمكانية العمل بالوضع اليدوي، نصف أوتوماتيك، أو أوتوماتيك بالكامل"
                })
            },
            new Product
            {
                Id = "prod_05",
                Model = "JACK C5",
                Brand = "JACK",
                Category = "overlock",
                SuggestedPriceEgp = 56000,
                DescriptionArabic = "ماكينة أوفرلوك 5 فتلة للأقمشة الثقيلة مع غرزة أمان مزدوجة وتثبيت متين للأطراف.",
                SpeedRpm = 6500,
                MaxStitchLengthMm = 4.0m,
                NeedleSystem = "DCx27 14-18#",
                MotorType = "سيرفو دفع مباشر مدمج عالي العزم",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = false,
                LubricationType = "تزييت أوتوماتيك مع مضخة ضغط عالي",
                WarrantyMonths = 24,
                InStock = true,
                StockCount = 5,
                Application = "تقفيل بنطلونات الجينز، الجواكت، العبايات الثقيلة، واليونيفورم",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "غرزة أمان 5 فتلة فائقة التحمل ومقاومة للتمزق",
                    "محرك قوي يتحمل ضغط العمل المستمر 24 ساعة بالمصانع",
                    "لوحة تشغيل رقمية بواجهة سهلة للمشغلين",
                    "نظام تبريد زيت فعال يطيل عمر الكروشيه والميكانيزم الداخلي"
                })
            },
            new Product
            {
                Id = "prod_06",
                Model = "JACK W4-D",
                Brand = "JACK",
                Category = "interlock",
                SuggestedPriceEgp = 67000,
                DescriptionArabic = "ماكينة أورليه / فلاتلوك كمبيوتر 3 إبرة 5 فتلة مع قص خيط علوي وسفلي أوتوماتيكي.",
                SpeedRpm = 5500,
                MaxStitchLengthMm = 4.4m,
                NeedleSystem = "UY128GAS 11-14#",
                MotorType = "سيرفو مدمج مع تحكم إلكتروني في السرعة",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = false,
                LubricationType = "نظام استرجاع زيت قسري لمنع الرشح",
                WarrantyMonths = 24,
                InStock = true,
                StockCount = 6,
                Application = "ثني ذيل التيشيرت، تركيب الكول والأسورة، وخياطة التريكو والمطاطيات",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "قص خيط علوي وسفلي فائق الدقة بضغطة واحدة على الدواسة",
                    "رفع دواس هوائي أو كهرومغناطيسي اختياري",
                    "إمكانية التحويل بين الأقمشة الرقيقة والسميكة دون تفويت غرز",
                    "إضاءة ليد واضحة تغطي مساحة الإبر الثلاث بالكامل"
                })
            },
            new Product
            {
                Id = "prod_07",
                Model = "HIKARI HK2900ASS",
                Brand = "HIKARI",
                Category = "single_needle",
                SuggestedPriceEgp = 43000,
                DescriptionArabic = "ماكينة سنجر كمبيوتر بتقنية هندسية يابانية، تجمع بين الدقة الفائقة وشاشة اللمس الذكية ونظام التزييت المغلق.",
                SpeedRpm = 5000,
                MaxStitchLengthMm = 5.0m,
                NeedleSystem = "DBx1 11-18#",
                MotorType = "سيرفو دفع مباشر فائق النعومة والهدوء",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = true,
                LubricationType = "خزان زيت محكم الغلق بنظام الدورة المغلقة",
                WarrantyMonths = 24,
                InStock = true,
                StockCount = 9,
                Application = "القمصان الفاخرة، البدل الرجالي، فساتين السهرة، والأقمشة عالية الحساسية",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "تصميم هيكل ياباني متزن يقلل الاهتزاز والضوضاء لأدنى المستويات",
                    "شاشة لمس ملونة عالية الحساسية لإعداد جميع المعاملات بلمسة واحدة",
                    "انعدام تام لتسريب نقاط الزيت على خامات القماش الفاخرة",
                    "تحكم رقمي إلكتروني في طول الغرزة والفرماتورة بدقة ميكرونية"
                })
            },
            new Product
            {
                Id = "prod_08",
                Model = "HIKARI H8800-4",
                Brand = "HIKARI",
                Category = "overlock",
                SuggestedPriceEgp = 49500,
                DescriptionArabic = "ماكينة أوفرلوك صناعي 4 فتلة فائقة السرعة مصممة لخطوط الإنتاج الكثيف بمصانع التصدير.",
                SpeedRpm = 7200,
                MaxStitchLengthMm = 4.0m,
                NeedleSystem = "DCx27 11-14#",
                MotorType = "سيرفو ياباني مدمج مباشر",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = false,
                LubricationType = "تزييت أوتوماتيك مع تبريد مستمر",
                WarrantyMonths = 24,
                InStock = true,
                StockCount = 6,
                Application = "مصانع الملابس الرياضية، التيشيرتات القطنية للتصدير، والأقمشة المطاطية",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "سرعة دوران 7200 غرزة/دقيقة مع كفاءة تبريد تمنع سخونة الماكينة",
                    "دواس خاص مصمم لمرونة عالية مع أقمشة الليكرا والإيلاستين",
                    "قص خيط أوتوماتيك سريع وسلس يرفع إنتاجية العامل بنسبة 25%"
                })
            },
            new Product
            {
                Id = "prod_09",
                Model = "SIRUBA 747K-514M2-24",
                Brand = "SIRUBA",
                Category = "overlock",
                SuggestedPriceEgp = 48500,
                DescriptionArabic = "ماكينة أوفرلوك 4 فتلة تايوانية أصلية، الماركة الأشهر تاريخياً في مصر لموثوقيتها الاستثنائية وسهولة صيانتها.",
                SpeedRpm = 7500,
                MaxStitchLengthMm = 3.6m,
                NeedleSystem = "DCx27 9-14#",
                MotorType = "موتور سيرفو خارجي أو مدمج موفر للطاقة",
                HasAutomaticTrimmer = false,
                HasAutoFootLifter = false,
                HasReverseStitch = false,
                LubricationType = "تزييت هيدروليكي أوتوماتيكي كامل",
                WarrantyMonths = 36,
                InStock = true,
                StockCount = 14,
                Application = "الأقمشة الحساسة والملابس الداخلية، التريكو، الملابس الرياضية والكاجوال",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "صناعة تايوانية أصلية 100% بعمر افتراضي يتجاوز 15 عاماً",
                    "سرعة فائقة تصل إلى 7500 غرزة/دقيقة مع صوت ناعم جداً",
                    "توفر قطع الغيار الأصلية بكثرة وأسعار اقتصادية في السوق المصري",
                    "سهولة فائقة في ضبط الكروشيه والإبر لأي فني صيانة"
                })
            },
            new Product
            {
                Id = "prod_10",
                Model = "SIRUBA F007K-W122-356",
                Brand = "SIRUBA",
                Category = "interlock",
                SuggestedPriceEgp = 69000,
                DescriptionArabic = "ماكينة أورليه تايوانية أسطوانية عالية المتانة مصممة لخياطة الملابس القطنية وأكمام التيشيرت.",
                SpeedRpm = 6000,
                MaxStitchLengthMm = 4.2m,
                NeedleSystem = "UY128GAS 11-14#",
                MotorType = "سيرفو دفع مباشر تايواني موفر",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = false,
                LubricationType = "تزييت مايكرو محكم بنظام تصريف متقدم",
                WarrantyMonths = 36,
                InStock = true,
                StockCount = 4,
                Application = "تجهيز خطوط إنتاج الملابس الجاهزة والملابس القطنية والتريكو",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "رأس أسطواني حر لتسهيل خياطة فتحات الأكمام وأرجل البنطلونات",
                    "كفاءة فائقة في سحب خيوط التغطية العلوية والسفلية بانسيابية",
                    "رفع دواس كهربائي سريع ومريح في الشغل المستمر"
                })
            },
            new Product
            {
                Id = "prod_11",
                Model = "JUKI DDL-9000C-FMS",
                Brand = "JUKI",
                Category = "single_needle",
                SuggestedPriceEgp = 85000,
                DescriptionArabic = "الماكينة الرقمية الأولى في العالم ياباني بالكامل، تحكم رقمي كامل بضغط الدواس ومسار التغذية ورأس خالي تماماً من الزيت.",
                SpeedRpm = 5000,
                MaxStitchLengthMm = 5.0m,
                NeedleSystem = "DBx1 9-18#",
                MotorType = "محرك سيرفو تيار متردد ياباني متطور (AC Servo)",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = true,
                LubricationType = "تقنية الرأس الجاف الخالي 100% من الزيت (Complete Dry)",
                WarrantyMonths = 36,
                InStock = true,
                StockCount = 5,
                Application = "مصانع البدل الراقية، قمصان التصدير لأوروبا، والملابس الحريرية الفاخرة",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "تحكم رقمي كامل بضغط الدواس والفرماتورة ومسار المشط بدقة متناهية",
                    "تقنية الرأس الجاف بدون نقطة زيت واحدة لضمان نظافة القطع الفاخرة",
                    "اتصال NFC لنقل إعدادات الخياطة القياسية للهاتف الذكي بين خطوط الإنتاج",
                    "شاشة تحكم لمسية ملونة تدعم أنماط الخياطة المتقدمة والذاكرة"
                })
            },
            new Product
            {
                Id = "prod_12",
                Model = "JUKI MO-6814S",
                Brand = "JUKI",
                Category = "overlock",
                SuggestedPriceEgp = 59000,
                DescriptionArabic = "ماكينة أوفرلوك 4 فتلة يابانية فائقة المتانة والتحمل الشاق لإنتاج الملابس القطنية والكاجوال.",
                SpeedRpm = 7000,
                MaxStitchLengthMm = 3.8m,
                NeedleSystem = "DCx27 11-14#",
                MotorType = "سيرفو مباشر معزول حرارياً",
                HasAutomaticTrimmer = false,
                HasAutoFootLifter = true,
                HasReverseStitch = false,
                LubricationType = "تزييت أوتوماتيك مع مضخة طرد مركزي",
                WarrantyMonths = 24,
                InStock = true,
                StockCount = 6,
                Application = "الملابس الكاجوال، التريكو، البولار، وخامات الأقطان المصرية المصدرة",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "أعلى معايير الجودة اليابانية مع عمر افتراضي استثنائي في خطوط الإنتاج",
                    "كروشيه مقوى مطلي بالتيتانيوم لمقاومة التآكل والتلف",
                    "غرز محكمة وناعمة الملمس لا تسبب حساسية لمرتدي الملابس"
                })
            },
            new Product
            {
                Id = "prod_13",
                Model = "BROTHER S-7250A Nexio",
                Brand = "BROTHER",
                Category = "single_needle",
                SuggestedPriceEgp = 77000,
                DescriptionArabic = "ماكينة سنجر كمبيوتر بنظام التغذية الرقمي DigiFlex Feed لمنع تكسير الإبر وتجعد القماش عند التقاطعات.",
                SpeedRpm = 5000,
                MaxStitchLengthMm = 5.0m,
                NeedleSystem = "DBx1 11-18#",
                MotorType = "محرك سيرفو ياباني مباشر فائق الاستجابة",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = true,
                LubricationType = "حوض زيت محكم الغلق ياباني (Sealed Tank)",
                WarrantyMonths = 36,
                InStock = true,
                StockCount = 5,
                Application = "الملابس الجاهزة الفاخرة، القمصان، والعبايات، مع أداء لا مثيل له في التقاطعات السميكة",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "تقنية DigiFlex Feed للتحكم بحركة مشط التغذية إلكترونياً حسب نوع القماش",
                    "حماية ميكاترونية ذكية تمنع كسر الإبرة عند بدء التشغيل السريع",
                    "نظام قطع خيط مزدوج لا يترك زوائد خيطية بعد القص",
                    "شاشة تشغيل متطورة مدمجة برأس الماكينة"
                })
            },
            new Product
            {
                Id = "prod_14",
                Model = "BROTHER HE-800B",
                Brand = "BROTHER",
                Category = "buttonhole",
                SuggestedPriceEgp = 142000,
                DescriptionArabic = "ماكينة عراوي إلكترونية ديجيتال بالكامل، تتيح برمجة 21 شكلاً للعراوي مع مقص أوتوماتيكي متعدد المقاسات.",
                SpeedRpm = 4000,
                MaxStitchLengthMm = 40.0m,
                NeedleSystem = "DPx5 11-14#",
                MotorType = "محرك نبضي مباشر عالي العزم (Direct Pulse Motor)",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = true,
                LubricationType = "نظام شبه جاف يمنع بقع الزيت تماماً",
                WarrantyMonths = 36,
                InStock = true,
                StockCount = 3,
                Application = "عراوي القمصان والبلوزات، البدل والجاكيتات، والملابس الرسمية والجينز",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "21 نمط وشكل عروة مبرمج وجاهز مع إمكانية تعديل الأبعاد على الشاشة",
                    "سكين قطع إلكترونية تقطع أي طول عروة بدون تغيير السكينة ميكانيكياً",
                    "قص خيط علوي وسفلي أوتوماتيكي مع شد خيط رقمي متغير",
                    "شاشة LCD رسومية تعرض تفاصيل العروة وعدد القطع المنفذة"
                })
            },
            new Product
            {
                Id = "prod_15",
                Model = "JACK JK-T1900BS",
                Brand = "JACK",
                Category = "special",
                SuggestedPriceEgp = 59000,
                DescriptionArabic = "ماكينة تثبيت زراير وفرماتورة كمبيوتر متعددة الاستخدامات مع 100 شكل ونمط خياطة مسبق التثبيت.",
                SpeedRpm = 3200,
                MaxStitchLengthMm = 30.0m,
                NeedleSystem = "DPx17 11-18#",
                MotorType = "سيرفو مباشر مع محرك خطوي ثنائي المحور",
                HasAutomaticTrimmer = true,
                HasAutoFootLifter = true,
                HasReverseStitch = true,
                LubricationType = "تزييت أوتوماتيك مغلق",
                WarrantyMonths = 24,
                InStock = true,
                StockCount = 4,
                Application = "تثبيت الأزرار، فرماتورة الجيوب، حلقات الحزام، وتثبيت التيكيت والماركات",
                FeaturesJson = JsonSerializer.Serialize(new List<string>
                {
                    "100 باترون ونمط خياطة مخزن بذاكرة الماكينة قابلة للتعديل",
                    "إمكانية التحويل بين تثبيت الأزرار والفرماتورة خلال دقائق",
                    "سرعة هائلة ودقة متناهية في إسقاط الإبرة داخل فتحات الزرار",
                    "رفع دواس أوتوماتيكي بمحرك خطوي هادئ للغاية"
                })
            }
        };
    }
}
