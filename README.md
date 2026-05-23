# TraderWallet

TraderWallet is a digital wallet created for South African informal traders, including spaza shop owners, hawkers, and taxi drivers. The application enables these traders to receive digital payments, log their daily cash takings, and gradually build a credit profile that unlocks access to formal Standard Bank products. The project was developed for the Standard Bank and BBD Hackathon under the theme "Bridging the Gap", which challenged our team to empower millions of South Africans engaged in informal economic activities to participate in the formal economy without requiring them to alter their established habits.

The idea is simple: a trader's cash sales become their credit score. Rather than competing with Standard Bank's existing offerings, TraderWallet acts as an on-ramp, stitching together the bank's existing products (DigiMe, PayShap, Instant Money, MyMo, SimplyBlu) into a single experience aimed at a market the bank cannot reach economically. Once a trader has built sufficient transaction history, they move from the wallet into a real Standard Bank account, and eventually into SimplyBlu when they outgrow informal trading.

## TraderWallet.Api

* ASP.NET Core Web API serving as the backend for the wallet, ledger, and credit scoring
* Packet Base via Entity Framework Core, suitable for a hackathon environment
* Omnibus account model: a single Standard Bank account holds all wallet balances, with per-user ledger entries reconciled to the cent
* UI is available at the root URL for endpoint exploration.

## TraderWallet.Web

* Frontend built with JavaScript for trader-facing screens, including onboarding, wallet home, QR receive, end-of-day cash log, dashboard, and loan offer.
* Progressive web app design so the application installs without the Play Store and works on low-end Android devices.
* Two languages supported for the demo: English and isiZulu

## Integrations

* Identity verification via Standard Bank DigiMe, powered by [iiDENTIFii](https://www.iidentifii.com/), with biometric liveness and Department of Home Affairs validation
* Digital payments via [PayShap](https://payshap.co.za/) and QR codes
* Cash deposits and withdrawals via the [Instant Money](https://www.standardbank.co.za/southafrica/personal/products-and-services/bank-with-us/manage-your-money/manage-everyday-banking/send-money/instantmoney) retailer network (Pick n Pay, Boxer, Spar, Standard Bank ATMs)
* Graduation pathway into Standard Bank [MyMo](https://www.standardbank.co.za/southafrica/personal/products-and-services/bank-with-us/bank-accounts/everyday-banking/mymo-account) accounts and eventually [SimplyBlu](https://www.standardbank.co.za/southafrica/business/products-and-services/grow-your-business/manage-your-business/simplyblu) for established merchants.

All integrations are mocked for the hackathon demo. The architecture is designed so that each mocked service can be replaced with its real integration without changing the surrounding code.

## Credit Scoring

The Business Health Score is a single value, ranging from 500 to 730, visible to the trader. Internally, the score is a weighted composite of the 5 Cs of credit, reframed for informal traders who lack traditional financial records:

* Character: logging consistency and repayment history of in-app credit (25%)
* Capacity: rolling 30-day average revenue, trend slope, and expense ratio (30%)
* Capital: wallet balance and logged inventory value (15%)
* Collateral: vendor permit on file and equipment photos (10%)
* Conditions: sector, location, and seasonal adjustment (20%)

Verified digital transactions are weighted higher than self-reported cash logs, creating a trust hierarchy that rewards traders for digitising their business over time without forcing them to abandon cash.

## Team

* Sanda Nondlozi
* Sabelo Nyoka
* Ntsika Ntontela
* Minenhle Gumede
* Sechaba Mokoena
