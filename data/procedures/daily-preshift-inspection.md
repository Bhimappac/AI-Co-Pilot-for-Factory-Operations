# SOP-OPS-03: Daily Pre-Shift Equipment Inspection and Operational Checklist

## 1. Objective and Pre-Operational Safety
This standard operating procedure outlines the mandatory 20-minute daily pre-shift inspection required on all automated production lines prior to starting shift operations.
**SAFETY DIRECTIVE:** Wear mandatory personal protective equipment (PPE): ANSI Z87.1 approved impact safety glasses, steel-toe boots (ASTM F2413), and cut-resistant nitrile-dipped gloves (ANSI Cut Level A3). Never bypass safety interlock switches during pre-shift visual inspections.

## 2. Emergency Stop and Interlock Verification
Before power is applied to main motor drives:
1. Walk the perimeter of the production line and physically inspect all 6 Emergency Stop mushroom buttons (**E-Stop PB-01** through **PB-06**).
2. Confirm each E-Stop button is free of physical damage, cracks, or mechanical sticking.
3. Test the emergency trip wire on the primary discharge conveyor by pulling firmly with a force of 40-50 N. Verify that safety relay module **SR-101** trips and illuminates the amber fault LED.
4. Verify all interlocked polycarbonate safety doors (**G-1** through **G-6**): open each door individually and verify that safety circuit breaker **CB-SAFE** immediately opens, showing status "INTERLOCK OPEN" on the central annunciator.
5. Inspect optical safety light curtains (**LC-OPT-A** and **LC-OPT-B**) at the palletizing infeed. Pass a 30 mm test rod through the beam array and verify drive motor contactors instantaneously drop out.

## 3. Fluid Levels, Pressures, and Lubrication
1. **Hydraulic Power Unit (HPU-1):** Check the sight glass on reservoir **TK-HYD-01**. Fluid level must sit between the 65% and 80% marks. Fluid must appear clear amber; if milky (water contamination) or dark brown (oxidation), log maintenance alert **AL-OIL-02**. Check reservoir temperature gauge **TI-201**; normal operating range is 38°C to 52°C.
2. **Pneumatic Main Pressure:** Inspect primary regulator gauge **REG-PN-01**. Operating line pressure must read between 6.0 and 6.5 bar (87-94 psi). Drain automatic moisture trap filter **FLT-H2O-01** by pressing the bottom purge valve until clear air expels.
3. **Automatic Central Lubricator:** Verify grease canister **LUB-AUTO-01** contains approved synthetic lithium complex grease (Mobilux EP 2). Level must exceed minimum fill line (minimum 250 mL). Verify lubricant delivery pressure gauge reads 15-20 bar during cyclic pulse.

## 4. Mechanical Drive, Belts, and Fastener Inspection
1. Inspect main drive transmission belts for tension using sonic tension tester **STT-01** or finger deflection method (maximum permissible deflection is 8 mm under 20 N applied load). Check for fraying, edge cracking, or rubber shavings.
2. Inspect primary drive chains for slack and ensure automatic oil drip applicator **DRP-02** is delivering 2 drops per minute.
3. Check motor mounting bolts and pillow-block bearings (**PB-B101** through **PB-B108**) with handheld infrared thermometer **Fluke-62MAX**. Bearing surface temperatures must not exceed 65°C during idling.

## 5. Shift Sign-Off and HMI Readiness Log
1. Navigate to the HMI **Main Menu > Shift Handover > Pre-Shift Inspection Checklist**.
2. Input operator badge number, shift number (Shift 1, 2, or 3), and confirm all check items.
3. If any critical safety anomaly is detected (e.g. defective E-Stop, low hydraulic oil below 50%, or light curtain failure), DO NOT START LINE. Immediately place out-of-service tag on panel and summon the maintenance team.
4. If all items pass, click **Authorize Shift Start** to enable machine cycle controls.
