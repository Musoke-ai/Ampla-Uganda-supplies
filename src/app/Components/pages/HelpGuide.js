import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BarChartLine,
  BoxSeam,
  Buildings,
  CashCoin,
  ChatDots,
  CheckCircleFill,
  ClipboardData,
  Gear,
  Grid,
  HouseDoor,
  JournalText,
  People,
  QuestionCircle,
  Receipt,
  Search,
  Send,
  ShieldCheck,
  Shop,
  Tools,
} from "react-bootstrap-icons";
import { selectRoles } from "../../auth/authSlice";
import { useSendHelpQuestionMutation } from "../../features/api/agentSlice";
import Header from "./publicPages/Header";
import Footer from "./publicPages/Footer";
import "./WorkspacePages.css";

const supportPhone = "0750147072";
const supportAltPhone = "0776033533";

const quickStartSteps = [
  {
    title: "Set Up The Business Profile",
    text: "Confirm the business name, contacts, currency, low-stock thresholds, and app appearance in Settings.",
    path: "/home/settings",
    action: "Open Settings",
  },
  {
    title: "Create Branches And Access",
    text: "Add operating branches, assign users to their correct roles, and select the active branch scope before entering data.",
    path: "/home/branches",
    action: "Manage Branches",
  },
  {
    title: "Add Products And Materials",
    text: "Register sellable products, categories, buying prices, selling prices, raw materials, and starting quantities.",
    path: "/home/inventory",
    action: "Add Products",
  },
  {
    title: "Start Daily Operations",
    text: "Use the Sales Desk for quick sales, Production for batch work, Customers for debt tracking, and Reports for review.",
    path: "/home/pos",
    action: "Go To Sales Desk",
  },
];

const modules = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: HouseDoor,
    summary: "Monitor daily stock movement, sales performance, alerts, and recent activity.",
    tasks: [
      "Review low-stock alerts before opening sales.",
      "Check sales, expenses, stock value, and recent transactions.",
      "Use dashboard signals to decide what to restock or investigate.",
    ],
    path: "/home/dashboard",
  },
  {
    id: "production",
    title: "Production",
    icon: Tools,
    summary: "Manage raw materials, orders, employees, expenses, batches, and finished outputs.",
    tasks: [
      "Register raw materials and keep intake records current.",
      "Create production batches with material, labor, and expense costs.",
      "Post finished output so product stock and costs stay accurate.",
    ],
    path: "/home/production",
  },
  {
    id: "inventory",
    title: "Products",
    icon: BoxSeam,
    summary: "Maintain the product catalog, categories, pricing, reorder levels, and item details.",
    tasks: [
      "Add products with clear names, categories, units, and selling prices.",
      "Update cost and selling prices when suppliers change.",
      "Retire or edit product records carefully because they affect sales history.",
    ],
    path: "/home/inventory",
  },
  {
    id: "stock",
    title: "Stock",
    icon: Grid,
    summary: "Track quantities on hand, stock entries, adjustments, and movement history.",
    tasks: [
      "Record stock additions immediately after purchases are received.",
      "Use stock counts to correct physical variances.",
      "Review movements before deleting or changing stock records.",
    ],
    path: "/home/stock",
  },
  {
    id: "sales",
    title: "Sales Desk",
    icon: Shop,
    summary: "Sell products, issue receipts, handle paid and credit sales, and keep transactions clean.",
    tasks: [
      "Search products, confirm quantity, and verify selling price before checkout.",
      "Capture customer details when the sale is on credit.",
      "Print or save receipts for customer and audit records.",
    ],
    path: "/home/pos",
  },
  {
    id: "customers",
    title: "Customers",
    icon: People,
    summary: "Manage customer records, balances, debt sales, and payments received.",
    tasks: [
      "Create customer profiles before issuing credit.",
      "Record debt payments as soon as money is received.",
      "Use customer history to follow up overdue balances.",
    ],
    path: "/home/customers",
  },
  {
    id: "branches",
    title: "Branches",
    icon: Buildings,
    summary: "Separate records by branch and keep each location's users, stock, and reports in the correct scope.",
    tasks: [
      "Create branches before assigning location-based users.",
      "Switch branch scope before reviewing stock, sales, or reports.",
      "Keep branch names and contact details clear for receipts and handovers.",
    ],
    path: "/home/branches",
  },
  {
    id: "reports",
    title: "Reports",
    icon: BarChartLine,
    summary: "Analyze sales, inventory, purchases, suppliers, production, expenses, audit logs, and staff data.",
    tasks: [
      "Choose the right date range and branch scope before reviewing results.",
      "Use sales profit and paid-versus-credit reports for cash decisions.",
      "Export or share reports after confirming filters and totals.",
    ],
    path: "/home/reports",
  },
  {
    id: "assistant",
    title: "Ampla Copilot",
    icon: ChatDots,
    summary: "Ask operational questions, generate summaries, and draft guided actions with confirmation.",
    tasks: [
      "Ask clear questions with a date range, branch, or module when possible.",
      "Review any drafted action before confirming it.",
      "Use Copilot for summaries, not as a replacement for final business judgment.",
    ],
    path: "/home/assistant",
  },
  {
    id: "history",
    title: "History",
    icon: ClipboardData,
    summary: "Review stock entries, sales events, edits, deletions, and operational records over time.",
    tasks: [
      "Use date filters to find the exact period you need.",
      "Check history before correcting stock or cancelling a transaction.",
      "Pair history records with reports when investigating differences.",
    ],
    path: "/home/history",
  },
  {
    id: "documents",
    title: "Documents",
    icon: Receipt,
    summary: "Prepare invoices, receipts, quotations, and records that support daily transactions.",
    tasks: [
      "Confirm customer and item details before generating a document.",
      "Keep document dates aligned with the actual transaction date.",
      "Use saved receipts and invoices to support audit checks.",
    ],
    path: "/home/documents",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Gear,
    summary: "Control business profile, user access, thresholds, currency, tax, debt sale settings, and theme.",
    tasks: [
      "Only admins should change business-wide settings.",
      "Review user roles after staff changes.",
      "Set low-stock thresholds that match real reorder habits.",
    ],
    path: "/home/settings",
  },
];

const roleGuides = [
  {
    id: "administrator",
    role: "Administrator",
    aliases: ["superadmin", "developer", "admin", "settings"],
    icon: ShieldCheck,
    focus: "Configure the business, control access, supervise branch activity, and protect sensitive records.",
    modules: ["Settings", "Branches", "Reports", "Assistant", "History", "Imports"],
    checklist: [
      "Create branches before assigning branch-based users.",
      "Review roles and permissions after every staff change.",
      "Use audit, reports, and assistant summaries before approving corrections.",
    ],
    routine: [
      "Start by checking dashboard alerts and branch scope.",
      "Review pending access, low-stock, debt, and production issues.",
      "Approve settings changes only after confirming business impact.",
    ],
    warnings: [
      "Do not share admin accounts.",
      "Do not delete records that already have business activity.",
      "Do not change global settings during active sales without informing the team.",
    ],
    questions: [
      "How should I onboard a new branch user?",
      "What should an admin check before closing the day?",
      "How do I investigate a suspicious stock change?",
    ],
  },
  {
    id: "inventory",
    role: "Inventory Manager",
    aliases: ["inventorymanager", "products", "stock", "rawmaterials"],
    icon: BoxSeam,
    focus: "Keep product stock, raw materials, prices, counts, and movement history accurate.",
    modules: ["Products", "Stock", "Production", "Imports", "Reports"],
    checklist: [
      "Confirm product names, categories, units, cost prices, and selling prices.",
      "Record purchases, stock additions, and stock counts on the same day.",
      "Review low-stock products and raw materials before production starts.",
    ],
    routine: [
      "Check low stock and reorder levels each morning.",
      "Record received stock before the sales desk begins selling it.",
      "Compare physical counts with system quantities before adjusting stock.",
    ],
    warnings: [
      "Do not adjust stock without a reason.",
      "Do not use the wrong branch when adding stock.",
      "Do not let production consume raw materials that are not recorded.",
    ],
    questions: [
      "How do I correct stock after a physical count?",
      "How should I add new raw materials?",
      "What is the right way to prepare products for production output?",
    ],
  },
  {
    id: "sales",
    role: "Sales Team",
    aliases: ["sales", "salesdesk", "creditsales"],
    icon: CashCoin,
    focus: "Process accurate sales, issue receipts, capture customers, and keep credit sales clean.",
    modules: ["Sales Desk", "Customers", "Documents", "History"],
    checklist: [
      "Search the correct product and confirm available quantity.",
      "Confirm price, quantity, payment method, and customer before checkout.",
      "Issue receipts and record debt payments immediately.",
    ],
    routine: [
      "Confirm the active branch before selling.",
      "Review cart quantities and prices before completing the sale.",
      "At closing, compare receipts, cash, credit sales, and cancelled sales.",
    ],
    warnings: [
      "Do not post credit sales without a customer.",
      "Do not sell from the wrong branch.",
      "Do not ignore receipt or payment errors.",
    ],
    questions: [
      "How do I make a credit sale correctly?",
      "What should I check before printing a receipt?",
      "How do I handle a customer paying an old debt?",
    ],
  },
  {
    id: "accounting",
    role: "Accountant",
    aliases: ["accountant", "reports", "customers", "expenses", "history"],
    icon: ClipboardData,
    focus: "Review money movement, sales, expenses, debts, reports, and audit evidence.",
    modules: ["Reports", "Customers", "Expenses", "History", "Documents"],
    checklist: [
      "Select the correct date range and branch before reading reports.",
      "Compare cash sales, credit sales, customer balances, and receipts.",
      "Review expenses and production costs before period reporting.",
    ],
    routine: [
      "Run sales and paid-vs-credit reports daily.",
      "Follow up overdue customer balances.",
      "Export period reports only after checking filters and totals.",
    ],
    warnings: [
      "Do not approve financial reports with the wrong branch scope.",
      "Do not treat unpaid credit sales as cash received.",
      "Do not ignore production costs when reviewing product profitability.",
    ],
    questions: [
      "How do I reconcile credit sales?",
      "Which reports should I review at month end?",
      "How do I check whether production costs are complete?",
    ],
  },
  {
    id: "production",
    role: "Production Manager",
    aliases: ["productionmanager", "productionmanger", "batches", "orders", "employees"],
    icon: Tools,
    focus: "Plan orders, consume raw materials, post finished output, control wastage, and complete QC.",
    modules: ["Production", "Raw Materials", "Orders", "Employees", "Reports"],
    checklist: [
      "Create a batch with branch, order/product, planned quantity, supervisor, and start date.",
      "Record materials, labor, and expenses before or during production.",
      "Post output, record wastage, and complete quality checks before closing the batch.",
    ],
    routine: [
      "Check raw material availability before starting a batch.",
      "Record material usage as it leaves the store.",
      "Post finished goods only after confirming output quantity and wastage.",
    ],
    warnings: [
      "Do not post output before important costs are recorded.",
      "Do not change branch, order, or product after batch activity starts.",
      "Do not approve QC without clear notes when there is rework or rejection.",
    ],
    questions: [
      "How do I run a production batch from start to finish?",
      "Why should I record labor before posting output?",
      "What should I do when a batch has wastage?",
    ],
  },
];

const faqs = [
  {
    question: "How do I add a new product?",
    answer:
      "Open Products, choose the add product action, then enter the item name, category, cost, selling price, unit, and opening quantity. Review prices before saving.",
  },
  {
    question: "How do I record a sale?",
    answer:
      "Open Sales Desk, search for the product, enter the quantity, confirm the payment type, then complete the sale and issue the receipt.",
  },
  {
    question: "How should credit sales be handled?",
    answer:
      "Create or select the customer first, record the credit sale through the sales workflow, and update the customer balance immediately when a payment is received.",
  },
  {
    question: "Why are report totals different from what I expected?",
    answer:
      "Check the date range, branch scope, payment type, cancelled sales, and whether recent transactions were saved before the report was opened.",
  },
  {
    question: "Who can change user access?",
    answer:
      "User access and business-wide settings should be handled by an administrator from the Settings workspace.",
  },
];

const dailyChecklist = [
  "Select the correct branch scope before entering records.",
  "Review dashboard alerts and low-stock products.",
  "Record purchases, production output, sales, debts, and payments on the same day.",
  "Check cash, credit, and receipt totals before closing.",
  "Use Reports or Copilot to summarize the day before handover.",
];

const operationManual = [
  {
    title: "Daily Opening",
    audience: "Admins, inventory managers, sales, production",
    steps: [
      "Confirm the active branch and user role before entering records.",
      "Review dashboard alerts, low-stock products, and low raw materials.",
      "Confirm products, selling prices, and materials needed for the day.",
      "Check pending orders, production batches, and customer debt follow-ups.",
    ],
  },
  {
    title: "Inventory And Stock Control",
    audience: "Inventory manager, admin",
    steps: [
      "Create clean product records with category, unit, cost price, selling price, and reorder level.",
      "Record stock additions when goods are received, not later from memory.",
      "Use stock counts for physical differences and keep notes for audit review.",
      "Review movement history before editing or deleting stock-related records.",
    ],
  },
  {
    title: "Sales And Credit Sales",
    audience: "Sales team, accountant",
    steps: [
      "Search the product, confirm quantity, price, and payment type before checkout.",
      "For credit sales, select or create the customer before completing the transaction.",
      "Issue receipts and keep cancelled or corrected transactions traceable.",
      "Record debt payments as soon as money is received.",
    ],
  },
  {
    title: "Production Batch Control",
    audience: "Production manager, inventory manager, accountant",
    steps: [
      "Create the batch from the correct branch and link the order when applicable.",
      "Record material usage so raw material stock is deducted and batch cost is updated.",
      "Add labor and production expenses before posting output whenever possible.",
      "Post finished goods, record wastage, then complete QC with clear notes.",
    ],
  },
  {
    title: "Reporting And Closing",
    audience: "Admin, accountant, managers",
    steps: [
      "Choose the correct date range and branch before opening reports.",
      "Compare sales, customer balances, receipts, stock movements, and expenses.",
      "Review production cost per unit and wastage before relying on profitability.",
      "Use History and Audit reports to investigate unusual changes.",
    ],
  },
];

const normalize = (value) => value.toLowerCase().trim();

const findPreferredRoleGuide = (roles = []) => {
  const normalizedRoles = roles.map((role) => normalize(String(role)));

  return (
    roleGuides.find((guide) =>
      guide.aliases.some((alias) => normalizedRoles.includes(normalize(alias)))
    ) || roleGuides[0]
  );
};

const HelpCopilotPanel = ({ publicPage, activeRole, activeModule }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sendHelpQuestion, { isLoading }] = useSendHelpQuestionMutation();

  const askQuestion = async (nextQuestion = question) => {
    const cleanQuestion = nextQuestion.trim();
    if (!cleanQuestion) return;

    setAnswer("");

    try {
      const response = await sendHelpQuestion({
        question: cleanQuestion,
        role: activeRole?.role || "General User",
        module: activeModule?.title || "General Operations",
      }).unwrap();

      setAnswer(response?.answer || "I could not generate a help answer right now.");
      setQuestion("");
    } catch (error) {
      setAnswer(
        error?.data?.message ||
          error?.data?.error ||
          "The help assistant could not answer right now."
      );
    }
  };

  return (
    <section className="help-guide-ai-panel">
      <div className="help-guide-ai-copy">
        <span className="help-guide-eyebrow">
          <ChatDots size={16} />
          Role-Aware AI Help
        </span>
        <h2>Ask Ampla Copilot how to use the system</h2>
        <p>
          The assistant answers training questions using the Ampla operations guide,
          your selected role, and the current module topic.
        </p>
        <div className="help-guide-ai-chips">
          <span>{activeRole?.role || "General User"}</span>
          <span>{activeModule?.title || "Current Module"}</span>
        </div>
      </div>

      {publicPage ? (
        <div className="help-guide-ai-locked">
          <QuestionCircle size={22} />
          <p>Sign in to ask role-specific questions from inside the workspace.</p>
        </div>
      ) : (
        <div className="help-guide-ai-form">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: How should I post finished goods after production?"
            rows={4}
          />
          <div className="help-guide-ai-actions">
            <button
              type="button"
              onClick={() => askQuestion()}
              disabled={isLoading || !question.trim()}
            >
              <Send size={16} />
              {isLoading ? "Asking..." : "Ask Copilot"}
            </button>
          </div>
          <div className="help-guide-ai-suggestions">
            {(activeRole?.questions || []).slice(0, 3).map((item) => (
              <button key={item} type="button" onClick={() => askQuestion(item)} disabled={isLoading}>
                {item}
              </button>
            ))}
          </div>
          {answer ? <div className="help-guide-ai-answer">{answer}</div> : null}
        </div>
      )}
    </section>
  );
};

const HelpGuide = ({ publicPage = false }) => {
  const roles = useSelector(selectRoles) || [];
  const [query, setQuery] = useState("");
  const [activeModuleId, setActiveModuleId] = useState("dashboard");
  const [activeRoleId, setActiveRoleId] = useState(() => findPreferredRoleGuide(roles).id);
  const normalizedQuery = normalize(query);

  const filteredModules = useMemo(() => {
    if (!normalizedQuery) return modules;

    return modules.filter((module) => {
      const haystack = [
        module.title,
        module.summary,
        ...module.tasks,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const activeModule =
    filteredModules.find((module) => module.id === activeModuleId) ||
    filteredModules[0] ||
    modules[0];
  const ActiveModuleIcon = activeModule.icon;
  const activeRole =
    roleGuides.find((guide) => guide.id === activeRoleId) ||
    findPreferredRoleGuide(roles);

  const pageContent = (
    <div className={publicPage ? "help-guide-public" : "workspace-page-shell help-guide-page"}>
      <div className="help-guide-shell">
        <section className="help-guide-hero">
          <div className="help-guide-hero-copy">
            <span className="help-guide-eyebrow">
              <JournalText size={16} />
              Ampla Uganda Guide
            </span>
            <h1>Operate the system with confidence</h1>
            <p>
              A practical guide for setting up the workspace, running daily sales,
              managing stock, tracking production, reviewing reports, and keeping
              records clean.
            </p>
          </div>

          <div className="help-guide-search-panel">
            <label htmlFor="help-guide-search">Search the guide</label>
            <div className="help-guide-search">
              <Search size={18} />
              <input
                id="help-guide-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, sales, reports, debts..."
              />
            </div>
            <div className="help-guide-contact-strip">
              <QuestionCircle size={17} />
              <span>
                Need support? Call or WhatsApp {supportPhone}; call {supportAltPhone}.
              </span>
            </div>
          </div>
        </section>

        <section className="help-guide-metrics" aria-label="Guide sections">
          <div>
            <strong>{modules.length}</strong>
            <span>Workspace Modules</span>
          </div>
          <div>
            <strong>{quickStartSteps.length}</strong>
            <span>Setup Steps</span>
          </div>
          <div>
            <strong>{roleGuides.length}</strong>
            <span>Role Playbooks</span>
          </div>
          <div>
            <strong>{faqs.length}</strong>
            <span>Common Questions</span>
          </div>
        </section>

        <HelpCopilotPanel
          publicPage={publicPage}
          activeRole={activeRole}
          activeModule={activeModule}
        />

        <section className="help-guide-section">
          <div className="help-guide-section-head">
            <div>
              <h2>Quick Start</h2>
              <p>Follow these steps when setting up a new business or branch.</p>
            </div>
          </div>

          <div className="help-guide-step-grid">
            {quickStartSteps.map((step, index) => (
              <article className="help-guide-step-card" key={step.title}>
                <span className="help-guide-step-number">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                {!publicPage ? (
                  <Link to={step.path} className="help-guide-inline-link">
                    {step.action}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="help-guide-section help-guide-module-layout">
          <div className="help-guide-module-index">
            <div className="help-guide-section-head compact">
              <div>
                <h2>Module Guide</h2>
                <p>
                  {filteredModules.length} topic
                  {filteredModules.length === 1 ? "" : "s"} found.
                </p>
              </div>
            </div>

            <div className="help-guide-module-tabs">
              {filteredModules.map((module) => {
                const ModuleIcon = module.icon;
                const isActive = module.id === activeModule.id;

                return (
                  <button
                    key={module.id}
                    type="button"
                    className={isActive ? "active" : ""}
                    onClick={() => setActiveModuleId(module.id)}
                  >
                    <ModuleIcon size={17} />
                    <span>{module.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <article className="help-guide-module-detail">
            <div className="help-guide-module-title">
              <span>
                <ActiveModuleIcon size={22} />
              </span>
              <div>
                <h3>{activeModule.title}</h3>
                <p>{activeModule.summary}</p>
              </div>
            </div>

            <div className="help-guide-task-list">
              {activeModule.tasks.map((task) => (
                <div key={task}>
                  <CheckCircleFill size={17} />
                  <span>{task}</span>
                </div>
              ))}
            </div>

            {!publicPage ? (
              <Link to={activeModule.path} className="help-guide-primary-link">
                Open {activeModule.title}
              </Link>
            ) : null}
          </article>
        </section>

        <section className="help-guide-section">
          <div className="help-guide-section-head">
            <div>
              <h2>Daily Control Checklist</h2>
              <p>Use this rhythm to reduce missing stock, reporting gaps, and debt mistakes.</p>
            </div>
          </div>

          <div className="help-guide-checklist">
            {dailyChecklist.map((item) => (
              <div key={item}>
                <CheckCircleFill size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="help-guide-section">
          <div className="help-guide-section-head">
            <div>
              <h2>Role Playbooks</h2>
              <p>Focused operating guidance based on the user's responsibility.</p>
            </div>
          </div>

          <div className="help-guide-role-selector">
            {roleGuides.map((guide) => {
              const RoleIcon = guide.icon;
              const isActive = guide.id === activeRole.id;

              return (
                <button
                  className={isActive ? "active" : ""}
                  key={guide.role}
                  type="button"
                  onClick={() => setActiveRoleId(guide.id)}
                >
                  <RoleIcon size={18} />
                  <span>{guide.role}</span>
                </button>
              );
            })}
          </div>

          <article className="help-guide-role-detail">
            <div className="help-guide-role-head">
              <span>
                {React.createElement(activeRole.icon, { size: 20 })}
              </span>
              <div>
                <h3>{activeRole.role}</h3>
                <p>{activeRole.focus}</p>
              </div>
            </div>

            <div className="help-guide-role-columns">
              <div>
                <h4>Primary Modules</h4>
                <div className="help-guide-ai-chips">
                  {activeRole.modules.map((module) => (
                    <span key={module}>{module}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4>Daily Routine</h4>
                <ul>
                  {activeRole.routine.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Must Check</h4>
                <ul>
                  {activeRole.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Avoid</h4>
                <ul>
                  {activeRole.warnings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </section>

        <section className="help-guide-section">
          <div className="help-guide-section-head">
            <div>
              <h2>Operations Manual</h2>
              <p>Detailed workflows users can follow during setup, daily work, and closing.</p>
            </div>
          </div>

          <div className="help-guide-manual-grid">
            {operationManual.map((workflow) => (
              <article className="help-guide-manual-card" key={workflow.title}>
                <div>
                  <h3>{workflow.title}</h3>
                  <span>{workflow.audience}</span>
                </div>
                <ol>
                  {workflow.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="help-guide-section help-guide-faq-section">
          <div className="help-guide-section-head">
            <div>
              <h2>Common Questions</h2>
              <p>Answers to issues teams usually meet during daily operations.</p>
            </div>
          </div>

          <div className="help-guide-faq-list">
            {faqs.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="help-guide-support">
          <div>
            <span className="help-guide-support-icon">
              <QuestionCircle size={22} />
            </span>
            <div>
              <h2>Need hands-on support?</h2>
              <p>
                Contact Ampla Uganda support for setup guidance, staff onboarding,
                reporting checks, and workflow questions.
              </p>
            </div>
          </div>
          <div className="help-guide-support-actions">
            <a href={`tel:${supportPhone}`}>Call {supportPhone}</a>
            <a href={`https://wa.me/256${supportPhone.slice(1)}`}>WhatsApp Support</a>
          </div>
        </section>
      </div>
    </div>
  );

  if (!publicPage) {
    return pageContent;
  }

  return (
    <>
      <Header />
      {pageContent}
      <Footer />
    </>
  );
};

export default HelpGuide;
