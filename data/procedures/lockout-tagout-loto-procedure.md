# SOP-SAF-02: Hazardous Energy Control - Lockout/Tagout (LOTO) Procedure

## 1. Scope and Life-Safety Warning
This procedure mandates the strict isolation of all electrical, pneumatic, hydraulic, and stored mechanical energy sources prior to any maintenance, cleaning, servicing, or unjamming activities on plant machinery.
**DANGER: ZERO TOLERANCE POLICY.** Servicing energized machinery without completing formal Lockout/Tagout constitutes an immediate OSHA violation and poses lethal arc-flash, electrocution, or amputation risks. Every authorized technician must apply their personal red padlock and danger tag. Master or gang keys are strictly forbidden.

## 2. Equipment Preparation and Notification
Before initiating mechanical isolation:
1. Identify all primary and secondary energy sources feeding the target machine:
   - Primary 480V AC 3-phase high voltage electrical feed.
   - Auxiliary 24V DC control power transformer bus.
   - Plant pneumatic compressed air supply line (8.0 bar / 116 psi).
   - High-pressure hydraulic accumulator circuit (160 bar).
2. Verbally notify the shift production supervisor, line operators, and adjacent cell workers that the equipment is being removed from service.
3. Execute standard operational shutdown via the primary control panel by pressing the **Stop** button and allowing internal drives to brake to zero RPM.

## 3. Sequential Isolation and Energy Dissipation
Execute isolation strictly in the following order:
1. **Electrical Disconnect:** Open the primary rotary electrical isolator switch located on Main Power Distribution Cabinet **MDB-01**. Throw switch handle from the vertical ON position to horizontal OFF.
2. **Pneumatic Lockout:** Locate main air shutoff ball valve **V-AIR-01**. Turn handle 90 degrees perpendicular to the supply pipe. Slide the exhaust slide sleeve forward to vent all downstream air with an audible discharge hiss.
3. **Hydraulic De-energization:** Close high-pressure isolation valve **HYD-ISO-04**. Depress manual bleed valve **PB-BLEED-HYD** until pressure gauge **PG-H02** reads exactly 0.0 bar.
4. **Gravitational Restraint:** Lower all mechanical counterweights, ram presses, or pneumatic lift cylinders to the physical bottom stop, or insert steel safety drop-pins **PIN-STL-50**.

## 4. Padlock, Hasps, and Danger Tag Application
1. Place a heavy-duty nylon safety hasp **HSP-06** through the padlock hole of rotary switch MDB-01.
2. Affix your assigned OSHA-compliant red personal safety padlock **PL-RED-01** through the hasp hole. Retain the single unique key in your personal possession.
3. Affix Lockout Tag **TAG-DNG-01** filled out completely with: Authorized Operator Name, Employee ID, Cell / Line Name, Date, Contact Phone Extension, and Reason for Lockout.
4. Affix secondary lockout clamshell bracket **LC-PN-02** around pneumatic ball valve V-AIR-01 and lock with a second red padlock.

## 5. Zero-Energy Verification ("Try-Step")
Never assume isolation is effective without performing mandatory physical verification:
1. Using calibrated digital multimeter **Fluke-87V** (verified on a known live voltage source immediately prior), test line-to-line (L1-L2, L2-L3, L1-L3) and line-to-ground for zero volts AC (<3.0V AC residual).
2. Verify visual pressure gauges **PG-A01** (pneumatics) and **PG-H02** (hydraulics) read absolute zero.
3. Press the machine **Start** pushbutton on the local operator console for 5 seconds. Verify that no contactor clicks, motor hums, or motion occurs.
4. Return the control switch to the **Off** position. The machine is now verified safe for servicing.
