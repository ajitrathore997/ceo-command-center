import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  CampaignStatus,
  DealStatus,
  Department,
  EmploymentStatus,
  InvoiceStatus,
  LeaveStatus,
  PrismaClient,
  TaskStatus,
  UserRole,
} from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before running the seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const now = new Date();
const daysFromNow = (days: number) =>
  new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

async function main() {
  await prisma.leaveRequest.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("CEO123!secure", 12);
  const ceo = await prisma.user.create({
    data: {
      name: "Anika Sharma",
      email: "ceo@commandcenter.local",
      passwordHash,
      role: UserRole.CEO,
    },
  });

  const employeeData = [
    ["Riya Mehta", Department.SALES, true],
    ["Vikram Nair", Department.SALES, true],
    ["Ishita Kapoor", Department.SALES, true],
    ["Arjun Rao", Department.OPERATIONS, true],
    ["Nisha Iyer", Department.OPERATIONS, true],
    ["Kabir Singh", Department.OPERATIONS, true],
    ["Meera Joshi", Department.OPERATIONS, true],
    ["Dev Malhotra", Department.FINANCE, true],
    ["Priya Sethi", Department.FINANCE, true],
    ["Sana Khan", Department.MARKETING, true],
    ["Rahul Verma", Department.MARKETING, true],
    ["Tara Bansal", Department.HR, true],
    ["Aman Gupta", Department.HR, true],
    ["Neha Kulkarni", Department.OPERATIONS, false],
    ["Karan Shah", Department.SALES, false],
    ["Pooja Desai", Department.MARKETING, false],
  ] as const;

  const employees = await Promise.all(
    employeeData.map(([name, department, presentToday]) =>
      prisma.employee.create({
        data: {
          name,
          department,
          status: EmploymentStatus.ACTIVE,
          presentToday,
        },
      }),
    ),
  );

  const activeDealTitles = [
    "Marina View Residences",
    "Orchid Business Park",
    "Maple Grove Villas",
    "Crescent Heights",
    "Harbor Point Offices",
    "Willow Creek Townhomes",
    "Skyline Retail Hub",
    "Palm Court Apartments",
    "Greenfield Industrial Estate",
    "Lakeside Executive Suites",
    "Riverstone Condominiums",
    "Park Avenue Lofts",
    "Sunset Boulevard Retail",
    "Northgate Warehouses",
    "Bluebell Senior Living",
    "Central Square Mixed Use",
    "Elm Street Residences",
    "Hilltop Corporate Center",
    "Westend Co-working Campus",
    "Silver Oak Plots",
  ];

  await Promise.all(
    activeDealTitles.map((title, index) =>
      prisma.deal.create({
        data: {
          title,
          value: 450000 + index * 85000,
          status: DealStatus.ACTIVE,
          salespersonId: ceo.id,
          createdAt: daysFromNow(-((index % 26) + 2)),
        },
      }),
    ),
  );

  await Promise.all(
    ["Aster Heights", "Kingsway Plaza", "Coral Bay Villas", "Meadowbrook Homes", "Metro Business Center"].map(
      (title, index) =>
        prisma.deal.create({
          data: {
            title,
            value: 780000 + index * 120000,
            status: DealStatus.WON,
            salespersonId: ceo.id,
            createdAt: daysFromNow(-(20 + index)),
            closedAt: daysFromNow(-(index + 1)),
          },
        }),
    ),
  );

  await prisma.deal.create({
    data: {
      title: "Old Mill Redevelopment",
      value: 1250000,
      status: DealStatus.LOST,
      salespersonId: ceo.id,
      createdAt: daysFromNow(-35),
      closedAt: daysFromNow(-9),
    },
  });

  const overdueTaskTitles = [
    "Confirm delayed possession handover",
    "Escalate site safety inspection",
    "Review contractor payment documents",
    "Close elevator maintenance ticket",
    "Update fire compliance certificate",
    "Resolve tenant water-supply complaint",
    "Approve materials delivery schedule",
    "Inspect vacant unit repairs",
    "Submit weekly facilities report",
    "Renew security vendor agreement",
  ];

  await Promise.all(
    overdueTaskTitles.map((title, index) =>
      prisma.task.create({
        data: {
          title,
          status: index < 7 ? TaskStatus.PENDING : TaskStatus.IN_PROGRESS,
          dueDate: daysFromNow(-(index + 1)),
          employeeId: employees[3 + (index % 5)].id,
        },
      }),
    ),
  );

  await Promise.all(
    ["Verify lobby lighting", "Archive lease amendments", "Update vendor contacts", "Inspect parking access", "Confirm cleaning rota"].map(
      (title, index) =>
        prisma.task.create({
          data: {
            title,
            status: TaskStatus.COMPLETED,
            dueDate: daysFromNow(0),
            completedAt: new Date(now.getTime() - (index + 1) * 60 * 60 * 1000),
            employeeId: employees[3 + (index % 5)].id,
          },
        }),
    ),
  );

  await Promise.all(
    ["Prepare move-in welcome packs", "Schedule generator servicing", "Audit common-area inventory", "Review concierge coverage", "Publish maintenance calendar"].map(
      (title, index) =>
        prisma.task.create({
          data: {
            title,
            status: index % 2 === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.PENDING,
            dueDate: daysFromNow(index + 2),
            employeeId: employees[3 + (index % 5)].id,
          },
        }),
    ),
  );

  const invoices = [
    ["Apex Interiors", 145000, InvoiceStatus.PENDING, -2, null],
    ["Metro Elevators", 98000, InvoiceStatus.PENDING, 1, null],
    ["Greenline Security", 76000, InvoiceStatus.PENDING, 4, null],
    ["BrightSpark Electrical", 119000, InvoiceStatus.PENDING, -1, null],
    ["UrbanScape Landscaping", 54000, InvoiceStatus.PENDING, 6, null],
    ["Citywide Cleaning", 42000, InvoiceStatus.PENDING, 9, null],
    ["Northstar Plumbing", 68000, InvoiceStatus.PENDING, 3, null],
    ["Vertex Construction", 325000, InvoiceStatus.APPROVED, -4, -2],
    ["Prime Glassworks", 210000, InvoiceStatus.APPROVED, -7, -5],
    ["SafeGuard Systems", 184000, InvoiceStatus.APPROVED, -10, -7],
    ["Atlas Furniture", 132000, InvoiceStatus.APPROVED, -14, -11],
    ["Cobalt Consulting", 96000, InvoiceStatus.APPROVED, -18, -15],
  ] as const;

  await Promise.all(
    invoices.map(([customerName, amount, status, dueInDays, approvedInDays]) =>
      prisma.invoice.create({
        data: {
          customerName,
          amount,
          status,
          dueDate: daysFromNow(dueInDays),
          approvedAt: approvedInDays === null ? null : daysFromNow(approvedInDays),
        },
      }),
    ),
  );

  const campaigns = [
    ["Q3 Investor Webinar", CampaignStatus.ACTIVE, 12, "LinkedIn", -2],
    ["Waterfront Launch Email", CampaignStatus.ACTIVE, 9, "Email", -4],
    ["First Home Buyer Search", CampaignStatus.ACTIVE, 8, "Google Ads", -6],
    ["Referral Partner Drive", CampaignStatus.PAUSED, 6, "Broker Network", -5],
    ["Luxury Living Magazine", CampaignStatus.PAUSED, 84, "Print", -18],
    ["Corporate Leasing Push", CampaignStatus.ACTIVE, 73, "Property Portal", -24],
    ["Festival Open House", CampaignStatus.PAUSED, 61, "Instagram", -32],
    ["NRI Property Showcase", CampaignStatus.ACTIVE, 92, "Property Portal", -40],
  ] as const;

  await Promise.all(
    campaigns.map(([name, status, leadsGenerated, leadSource, createdInDays]) =>
      prisma.campaign.create({
        data: {
          name,
          status,
          leadsGenerated,
          leadSource,
          createdAt: daysFromNow(createdInDays),
        },
      }),
    ),
  );

  await Promise.all(
    (
      [
      [employees[3], -2, 1, LeaveStatus.PENDING, "Family commitment"],
      [employees[4], 5, 8, LeaveStatus.APPROVED, "Annual leave"],
      [employees[9], 12, 13, LeaveStatus.PENDING, "Medical appointment"],
      [employees[11], -10, -8, LeaveStatus.APPROVED, "Personal travel"],
      [employees[13], 18, 20, LeaveStatus.REJECTED, "Training overlap"],
      ] as const
    ).map(async ([employee, startInDays, endInDays, status, reason]) =>
      prisma.leaveRequest.create({
        data: {
          employeeId: employee.id,
          startDate: daysFromNow(startInDays),
          endDate: daysFromNow(endInDays),
          status,
          reason,
        },
      }),
    ),
  );

  console.log("Seeded CEO Command Center data.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
