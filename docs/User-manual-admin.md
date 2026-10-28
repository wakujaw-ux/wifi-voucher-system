# MWONGOZO WA MMILIKI (ADMIN MANUAL) - WIFI VOUCHER SYSTEM

Karibu kwenye mfumo wako wa kusimamia biashara ya Wi-Fi. Mwongozo huu utakusaidia kuelewa jinsi ya kutumia mfumo wako kwa ufanisi.

## 1. Kuingia Kwenye Mfumo (Login)
1. Fungua browser yako (Chrome, Edge, n.k.).
2. Nenda kwenye anwani ya mfumo wako (Mfano: `http://localhost:5173` au IP ya server yako).
3. Bonyeza kitufe cha **"Ingia Kwenye Mfumo"**.
4. Weka **Username** (Mfano: `admin`) na **Password** yako.
5. Bonyeza **"Ingia"**.

## 2. Dashboard (Muhtasari wa Biashara)
Ukishafungua ukurasa wa Dashboard, utaona kadi mbalimbali zinazoonyesha afya ya biashara yako:
* **Mauzo ya Leo:** Idadi ya vocha zilizouzwa leo.
* **Jumla ya Mapato:** Kiasi cha pesa ulichoingiza leo.
* **Wateja Online:** Idadi ya wateja waliopo kwenye Wi-Fi kwa sasa hivi.
* **Vocha Zilizopo:** Vocha ambazo hazijauzwa bado (Available).
* **Chati ya Mapato:** Inaonyesha mauzo ya siku 7 zilizopita.
* **Quick Actions:** Vitufe vya haraka vya kwenda kuuza vocha au kuangalia wateja.

## 3. Kusimamia Vifurushi (Packages)
Hapa ndipo unapotengeneza mipango ya vocha (Mfano: Saa 1 kwa TZS 500).
1. Nenda kwenye menyu ya **Packages**.
2. Bonyeza **"Package Mpya"**.
3. Weka Jina la Kifurushi (Mfano: `1 Hour`), Bei (Mfano: `500`), Muda kwa dakika (Mfano: `60`), na Kasi (Speed) kwa Mbps.
4. Bonyeza **Unda**.
*Kumbuka: Kifurushi kinapaswa kuwa na status ya "Active" ili kiweze kutumika.*

## 4. Kuzalisha Vocha (Generate Vouchers)
Unapotaka kuandaa vocha za kuuza, fanya hivi:
1. Nenda kwenye menyu ya **Vouchers**.
2. Bonyeza kitufe cha bluu kilicho juu kulia: **"Zalisha Vocha"**.
3. Chagua Kifurushi (Package).
4. Weka Idadi ya vocha unazotaka (Mfano: `50`).
5. Bonyeza **"Zalisha"**. Mfumo utazalisha vocha hizo na kuzituma moja kwa moja kwenye router yako (MikroTik).
6. Vocha zitakazozalishwa zitakuwa na status ya **AVAILABLE** (Zipo tayari kuuzwa).

## 5. Kuuza Vocha (Selling)
Kuna njia mbili za kuuza vocha:
**Njia A (Kupitia Vouchers Page):**
1. Nenda kwenye **Vouchers**.
2. Kwenye orodha ya vocha, tafuta vocha yenye status ya `AVAILABLE`.
3. Bonyeza kitufe cha kijani cha **Shopping Cart** (Kuuza).
4. Thibitisha (Confirm). Vocha itakuwa `SOLD` na mauzo yameingia kwenye mfumo.

**Njia B (Mauzo ya Haraka Kupitia Packages):**
1. Nenda kwenye **Packages**.
2. Bonyeza kitufe cha kijani cha **Shopping Cart** kwenye kifurushi husika.
3. Mfumo utazalisha vocha moja na kuiuza papo hapo. Itakupa code ya vocha mara moja.

## 6. Kuchapisha Vocha (Printing)
1. Nenda kwenye ukurasa wa **Vouchers**.
2. Bonyeza kitufe cha **"Chapisha"** kilichopo juu (rangi ya machungwa).
3. Ukurasa mpya utafunguka ukionyesha vocha zilizopo kwenye gridi nzuri.
4. Bonyeza kitufe cha **"Chapisha Sasa"** na uchague printer yako au `Save as PDF`.

## 7. Kusimamia Wateja (Sessions)
Ukurasa wa **Sessions** unakuonyesha nani yupo online kwa sasa.
* **Waliopo Online:** Wateja wanaotumia Wi-Fi sasa hivi. Unaweza kumbonyeza kitufe cha **LogOut** kumtoa mteja kwa nguvu.
* **Historia ya Sessions:** Inaonyesha wateja wote waliowahi kuingia. Utawaona waliokatika (`DISCONNECTED`) na wale ambao muda wao uliisha (`EXPIRED`).

## 8. Kuangalia Ripoti (Reports)
Nenda kwenye menyu ya **Reports**. Hapa unaweza kuona:
* **Mauzo:** Chati ya mapato kwa siku, wiki, mwezi au mwaka. Unaweza kupakua faili la Excel.
* **Voucha:** Idadi ya vocha zilizotumika, zilizopo, n.k.
* **Mapato:** Uchambuzi wa mapato kwa njia ya malipo (M-Pesa, Tigo, Cash, n.k.).
* **Faida/Hasara (P&L):** Inaonyesha kama biashara inaingiza faida au inapata hasara.

## 9. Kusimamia Watumiaji (Users)
Unaweza kuongeza wafanyakazi wengine (Operators) hapa.
1. Nenda kwenye **Users**.
2. Bonyeza **"User Mpya"**.
3. Weka majina, username na password.
4. Chagua Role: **Operator** (Kwa ajili ya wafanyakazi wanaouza tu) au **Admin** (Kwa mtu unayemwamini kusimamia mfumo).
5. Bonyeza **Unda**.

## 10. Mipangilio (Settings)
Nenda kwenye **Settings** kubadilisha mambo ya msingi kama:
* Jina la Biashara yako (Business Name).
* Namba ya simu ya msaada kwa wateja (Support Phone).
* Sarafu inayotumika (Currency).

---
*Kumbuka: Ukishindwa kitu, wasiliana na mtaalamu wa IT wako.*