# SOP-M03-01: Machine 3 - Clearing Feed-Roller Jam and Restart Procedure

## 1. Scope and Safety Warnings
This standard operating procedure applies exclusively to automated thermoforming Machine 3 (Line B) when material feeding stalls or optical feed sensors detect roller slippage. When an obstruction halts feed-roller rotation, the human-machine interface (HMI) trips into critical shutdown mode.
**WARNING: HAZARDOUS MECHANICAL PINCH POINT.** Never reach into the roller housing while drive servos are energized. Always engage the emergency stop button (E-Stop PB-03) or perform standard lockout/tagout (LOTO) per SOP-SAF-02 before opening enclosure guard G-3. Failure to de-energize mechanical rollers can result in severe crushing injuries.

## 2. Initial Shutdown and E-204 Error Code Verification
When a feed jam occurs, Machine 3 emits an intermittent 90 dB acoustic beacon and illuminates the amber warning tower.
1. Check the primary operator control console for active fault diagnostic code **E-204: Feed Roller Tachometer Desynchronization / Stall Detection**.
2. Press the red mushroom-head Emergency Stop switch **PB-03** on the infeed operator panel.
3. Verify on the HMI screen that servo bus DC voltage discharges to below 50V DC before approaching the safety interlocking doors.
4. Record the timestamp, roll lot number, and fault status code E-204 in the shift operating logbook.

## 3. Feed-Roller Jam Clearance Procedure
Follow these sequential manual clearance instructions:
1. Open interlocked guard door **G-3** using universal key wrench T-12.
2. Locate the pneumatic tension release lever (labeled **VALVE-PR-3**) mounted directly beneath the upper drive arbor.
3. Rotate VALVE-PR-3 counter-clockwise 90 degrees to vent residual pneumatic pressure (regulated at 6.2 bar) and separate the upper nip-roller from the driven hardened steel feed-roller.
4. Utilizing non-marring brass pry wedge **TL-BR08** and high-tensile safety shears **SH-04**, slice the bunched raw polymer sheet along the transverse groove guide.
5. Manually pull the jammed material rearward away from the drive teeth. Do not strike the ceramic-coated rollers with hardened steel tools or screwdrivers.

## 4. Roller Inspection and Debris Removal
1. Inspect the upper and lower roller surfaces using inspection lamp **FL-02**. Ensure no melted plastic, stray tape, or carbonized residue adheres to the knurled roller surface.
2. If roller contamination exists, apply approved industrial solvent **Solv-80** onto lint-free microfiber cloth **CL-14** and wipe roller cylinders until clean. Allow 2 minutes for solvent evaporation.
3. Check the feed roller gap gauge: using metric feeler gauge **FG-05**, verify clearance is calibrated to exactly 2.4 mm (+/- 0.1 mm) across both drive ends.

## 5. Machine 3 Restart and HMI Fault Reset Protocol
Once the feed path is free of obstruction:
1. Return pneumatic tension release lever VALVE-PR-3 clockwise 90 degrees until the pressure gauge reads 6.2 bar.
2. Close and latch interlocked safety door G-3. Verify the magnetic interlock switch indicator changes from flashing amber to solid green.
3. Pull to release Emergency Stop PB-03.
4. On the HMI touchscreen, navigate to **Diagnostics > Alarms**, select active alarm **E-204**, and tap **Acknowledge and Clear**.
5. Depress the blue **Master Control Relay (MCR) Reset** pushbutton for 3 continuous seconds.
6. Switch the operating selector switch to **Jog Feed Mode**, advance 0.5 meters of test material, and observe roller rotation.
7. If material advances smoothly without tracking skew, press the green **Cycle Start** pushbutton to resume automated production.
