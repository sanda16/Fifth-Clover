# TraderWallet.Api

A hackathon ASP.NET Core 8 Web API: a digital wallet for informal South African
traders, with **Standard Bank** as the custodian holding all funds in a single
pooled *omnibus* account.

> Backend = mock/demo data, SQLite, no auth. Built for a demo, not production.

## Run it

```powershell
cd TraderWallet.Api
dotnet run
```

Then open **http://localhost:5050/swagger**.

- The SQLite file `traderwallet.db` is created and seeded with 3 demo traders on
  first run. Delete that file to reset the data.
- CORS allows any `localhost` / `127.0.0.1` origin, so a local frontend on any
  port can call the API directly.

> **Note on .NET versions:** the project targets **net8.0** (ASP.NET Core 8) but
> this machine only has the **.NET 10** runtime, so the `.csproj` sets
> `<RollForward>Major</RollForward>` to run on it. Once you install the .NET 8
> runtime you can remove that line. (To switch the whole project to .NET 10
> instead, change `<TargetFramework>` to `net10.0` and bump the two
> `Microsoft.EntityFrameworkCore.*` packages to `10.0.*`.)

## Demo traders

Seeded with ~2 weeks of QR payments, daily cash logs, a deposit, and (for Sipho)
a loan + repayment. "Log in" by verifying one of these SA ID numbers — the call
returns the `user_id` GUID you use for every other endpoint.

| Name           | SA ID number    | Profile                |
|----------------|-----------------|------------------------|
| Nomsa Dlamini  | `8702155009087` | Spaza shop (65% digital) |
| Sipho Khumalo  | `9105036123083` | Street vendor + loan   |
| Thandi Mthembu | `8408120456081` | Fruit & veg (80% digital) |

## Endpoints

| Method | Route                              | Purpose                                   |
|--------|------------------------------------|-------------------------------------------|
| POST   | `/api/identity/verify`             | Mock KYC; returns `user_id` (creates user if new) |
| GET    | `/api/wallet/{userId}`             | Balance + 10 recent transactions          |
| POST   | `/api/transactions/payment-in`     | Credit wallet from a QR payment           |
| POST   | `/api/transactions/cash-log`       | Log daily cash takings (no balance change)|
| POST   | `/api/transactions/transfer`       | Wallet-to-wallet transfer                 |
| GET    | `/api/credit-score/{userId}`       | 0-100 score with breakdown                |
| GET    | `/api/dashboard/{userId}`          | Last 7 days revenue (digital vs cash)     |
| GET    | `/api/custodian/omnibus`           | Omnibus total + reconciliation (bonus)    |

### Request bodies

```jsonc
// POST /api/identity/verify
{ "id_number": "8702155009087", "full_name": "Nomsa Dlamini" }

// POST /api/transactions/payment-in
{ "userId": "<guid>", "amountCents": 7500, "source": "QR" }

// POST /api/transactions/cash-log
{ "userId": "<guid>", "amountCents": 12000 }

// POST /api/transactions/transfer
{ "fromUserId": "<guid>", "toUserId": "<guid>", "amountCents": 5000 }
```

> All money is stored as **cents** (`long`). R75.00 = `7500`.

## Quick smoke test (PowerShell)

```powershell
$base = "http://localhost:5050"
$u = (Invoke-RestMethod "$base/api/identity/verify" -Method Post -ContentType application/json `
      -Body '{"id_number":"8702155009087","full_name":"Nomsa Dlamini"}').user_id
Invoke-RestMethod "$base/api/wallet/$u"
Invoke-RestMethod "$base/api/dashboard/$u"
Invoke-RestMethod "$base/api/credit-score/$u"
```

## Project layout

```
TraderWallet.Api/
├─ Program.cs              # DI, EF/SQLite, CORS, Swagger, DB create + seed on startup
├─ appsettings.json        # SQLite connection string
├─ Properties/launchSettings.json   # http profile on :5050, opens Swagger
├─ Models/                 # User, Wallet, Transaction(+Type), CreditScore, OmnibusLedger
├─ Data/
│  ├─ AppDbContext.cs      # DbSets + relationships
│  └─ DbSeeder.cs          # 3 demo traders with transaction history
├─ Dtos/ApiModels.cs       # request/response records
└─ Controllers/            # Identity, Wallet, Transactions, CreditScore, Dashboard, Custodian
```
