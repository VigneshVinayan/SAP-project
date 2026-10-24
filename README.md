# IT Asset Lifecycle Manager (ITAM)

An enterprise-grade IT Asset Lifecycle Management application built with the **SAP Cloud Application Programming Model (CAP Node.js)**, **SAP HANA Cloud**, **SAP Fiori Elements / SAPUI5**, and **SAP BTP XSUAA** authentication.

Tracks enterprise IT hardware from procurement to archival, enforcing strict lifecycle rules, department-scoped ownership, and audit ledgers.

---

## 🏛️ Architecture & Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Database** | **SAP HANA Cloud** | Native HDI Container (`hdi-shared`) with transactional tables, master data, and views |
| **Backend Service** | **SAP CAP (Node.js)** | OData V4 services with draft handling, bounded lifecycle actions, and role restrictions |
| **Authentication** | **SAP BTP XSUAA** | Dedicated authentication (`@sap/xssec`) using JWT tokens with role collections |
| **Application Router** | **SAP Approuter** | Standalone Node.js approuter handling OAuth2 login flow, CSRF tokens, and proxying |
| **User Interface** | **SAP Fiori (UI5)** | SAP Fiori Launchpad housing 14 applications (Fiori Elements List Report/Object Pages + analytical dashboards) |
| **Reporting & Export** | **Native PDF Generator** | In-memory A4 landscape PDF generation with audit logging and time-limited download links |

---

## 🔐 Roles and Permissions (SAP BTP XSUAA)

The application enforces dynamic, role-based tile visibility and data scoping directly from SAP BTP Cockpit role assignments:

| Role Collection | Role | Launchpad Tiles | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **`ITAM_Admin`** | Admin | 10 Tiles | **Full Administrative Access**<br>• Manage Assets lifecycle (procure, assign, transfer, maintain, retire, archive)<br>• Master Data administration (Departments, Employees, Categories, Vendors)<br>• View Report Audit Logs<br>• Global Analytics Dashboard and Report generation |
| **`ITAM_Manager`** | Manager | 4 Tiles | **Department-Scoped Access**<br>• Asset Dashboard (KPIs filtered to manager's department)<br>• Reports & PDF Export (departmental hardware reports)<br>• Department Operations (assign, return, transfer assets within department)<br>• Asset Overview (read-only department inventory) |
| **`ITAM_User`** | User | 5 Tiles | **Self-Service Access**<br>• My Hardware (assets currently issued to the user)<br>• My Assignments (possession history and return dates)<br>• My Profile (employee department and contact details)<br>• Asset Requests (submit return or maintenance requests)<br>• My Asset History (immutable personal ledger) |
| *(None)* | Unassigned | 1 Tile | Informative tile notifying user to request a Role Collection in SAP BTP Cockpit |

### ⚙️ How to Assign Roles in SAP BTP Cockpit:
1. Log in to [SAP BTP Cockpit](https://cockpit.hanatrial.ondemand.com/).
2. Navigate to your Subaccount → **Security** → **Users**.
3. Select the user account.
4. Under **Role Collections**, click **Assign Role Collection**.
5. Select **`ITAM_Admin`**, **`ITAM_Manager`**, or **`ITAM_User`**.
6. Save.

---

## 💻 SAP Fiori Launchpad Applications

All applications are integrated into a single Fiori Launchpad interface:

| # | Application | Semantic Intent | Target Users | Type | Purpose |
| :-: | :--- | :--- | :--- | :--- | :--- |
| 1 | **Manage Assets** | `#Asset-manage` | Admin | Fiori Elements | Create, edit, and execute lifecycle actions on hardware assets |
| 2 | **Departments** | `#Department-manage` | Admin | Fiori Elements | Manage organization departments and cost centers |
| 3 | **Employees** | `#Employee-manage` | Admin | Fiori Elements | Manage employee master records and department linkages |
| 4 | **Asset Categories** | `#AssetCategory-manage` | Admin | Fiori Elements | Configure hardware categories and depreciation lifespans |
| 5 | **Vendors** | `#Vendor-manage` | Admin | Fiori Elements | Manage hardware suppliers and maintenance service providers |
| 6 | **Report Audit Log** | `#Report-audit` | Admin | Fiori Elements | Immutable audit trail of generated, downloaded, or emailed reports |
| 7 | **Asset Dashboard** | `#Asset-dashboard` | Admin, Manager | Freestyle SAPUI5 | Analytical dashboard with KPI cards, utilization charts, and status breakdowns |
| 8 | **Reports & Export** | `#Report-manage` | Admin, Manager | Freestyle SAPUI5 | Interactive reporting with preview, PDF download, and email dispatch |
| 9 | **Department Operations** | `#Manager-operations` | Admin, Manager | Freestyle SAPUI5 | Managerial assignment, transfer, return, and request approvals |
| 10 | **Asset Overview** | `#Asset-overview` | Admin, Manager | Fiori Elements | Read-only department inventory overview |
| 11 | **My Hardware** | `#Asset-inventory` | User | Fiori Elements | Hardware issued directly to the logged-in user |
| 12 | **My Assignments** | `#Asset-mine` | User | Fiori Elements | Active assignment details and expected return dates |
| 13 | **My Profile** | `#Employee-profile` | User | Fiori Elements | User's employee master information |
| 14 | **Asset Requests** | `#AssetRequest-mine` | User | Freestyle SAPUI5 | Submit return and maintenance requests for assigned assets |
| 15 | **My Asset History** | `#AssetHistory-mine` | User | Fiori Elements | Historical possession ledger for personal hardware |

---

## 🔄 Asset Lifecycle State Machine

Assets transition strictly through predefined states. Every transition generates an **immutable ledger record** in `OwnershipLedgers`:

```
               [Procurement]
                     │
                     ▼
             ┌───────────────┐
             │   AVAILABLE   │ ◄────────────────┐
             └───────┬───────┘                  │
                     │                          │
        assignAsset  │                          │  returnAsset
                     ▼                          │
             ┌───────────────┐                  │
   ┌─────────┤   ASSIGNED    ├──────────────────┤
   │         └───────┬───────┘                  │
   │ transferAsset   │                          │
   └─────────────────┘                          │
                     │ sendToMaintenance        │
                     ▼                          │
             ┌───────────────┐                  │
             │  MAINTENANCE  ├──────────────────┘
             └───────┬───────┘ completeMaintenance
                     │
         retireAsset │ (only when AVAILABLE / returned)
                     ▼
             ┌───────────────┐
             │    RETIRED    │
             └───────┬───────┘
                     │ archiveAsset (cannot be physically deleted)
                     ▼
             ┌───────────────┐
             │   ARCHIVED    │
             └───────────────┘
```

### Key Business Rules:
- **No Physical Deletion**: Assets, ownership ledgers, and audit rows are permanent and cannot be deleted.
- **Offboarding Protection**: An employee currently holding active assets cannot be deactivated.
- **Dates Integrity**: First distribution date is locked to procurement date validation.
- **Department Isolation**: Managers can only view and manage assets within their assigned department.

---

## 📂 Project Structure

```
itam-project/
├── .deploy/
│   └── app-router/         # SAP Approuter configuration and routes
├── app/
│   ├── index.html          # Dynamic SAP Fiori Launchpad shell (role-aware tiles)
│   ├── annotations.cds     # SAP Fiori Elements UI annotations (List Reports, Object Pages)
│   ├── dashboard/          # Freestyle SAPUI5 Analytics Dashboard
│   ├── reports/            # Freestyle SAPUI5 PDF Reporting & Email Application
│   ├── manageractions/     # Freestyle SAPUI5 Department Operations Application
│   ├── myrequests/         # Freestyle SAPUI5 Asset Requests Self-Service Application
│   └── <entity_apps>/      # Fiori Elements manifests (assets, employees, departments, etc.)
├── db/
│   ├── common.cds          # Reusable types, aspects, and status enums
│   ├── master.cds          # Master data entities (Departments, Employees, Categories, Vendors)
│   ├── schema.cds          # Transactional entities (Assets, Assignments, Ledgers, Maintenance)
│   └── data/               # Seed data CSVs for SAP HANA initialization
├── srv/
│   ├── itam-service.cds    # Service definitions (AssetAdminService, AssetManagerService, AssetUserService)
│   ├── admin-service.js    # Admin lifecycle handlers and validation logic
│   ├── manager-service.js  # Department-scoped operational actions and reporting
│   ├── manager-lifecycle.js# Manager assignment and return state machine
│   ├── user-service.js     # Self-service request handling and user restrictions
│   ├── app-service.js      # Launchpad whoAmI identity and tile KPI metrics
│   ├── mail-service.js     # Email notification provider
│   └── lib/                # Utility helpers, PDF generator, and report definitions
├── scripts/
│   └── copy-apps.js        # Cross-platform build script packaging Fiori apps into gen/srv/app
├── mta.yaml                # Multi-Target Application deployment descriptor
├── package.json            # Node.js project configuration and CAP dependencies
└── xs-security.json        # XSUAA security configuration, scopes, and role templates
```

---

## 🚀 Build and Deployment

### 1. Prerequisites
- **Node.js**: v22+
- **Cloud MTA Build Tool (`mbt`)**: `npm install -g mbt`
- **Cloud Foundry CLI (`cf`)**: with `multiapps` plugin installed (`cf install-plugin multiapps`)

### 2. Local Development
```bash
# Install dependencies
npm install

# Start local development server with mock authentication
npm run watch
```
Open **[http://localhost:4004/index.html](http://localhost:4004/index.html)** in your browser.

### 3. Deploy to SAP BTP Cloud Foundry
```bash
# 1. Log in to your SAP BTP Cloud Foundry space
cf login -a <CF_API_ENDPOINT> -o <ORG> -s <SPACE>

# 2. Build the multi-target application archive
mbt build

# 3. Deploy archive to SAP BTP
cf deploy mta_archives/itam-application_1.0.0.mtar -f
```

---

## 👤 Identity & Employee Linking

When a user logs in via SAP BTP:
1. **Launchpad Header**: Automatically reflects the authentic name and email from the SAP BTP XSUAA token.
2. **Employee Master Association**:
   - For a **User** or **Manager**, the system automatically correlates the authenticated email with the `Employees` master record in SAP HANA.
   - To link a newly created user in Cockpit to their hardware and department, ensure an Administrator adds an Employee record under **Employees** with that exact login email.
