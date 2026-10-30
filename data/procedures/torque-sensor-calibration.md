# SOP-CAL-06: Robotic Spindle Rotary Torque Sensor Calibration Protocol

## 1. Scope, Purpose, and Metrology Standards
This standard operating procedure prescribes the semi-annual static calibration and zero-drift verification for the high-precision rotary strain-gauge torque transducer (**Model Futek TRS-605 / Tag TQ-104**) installed on Automated Fastening Spindle **SP-02** (Cell 3).
**CRITICAL QUALITY NOTICE:** Accurate torque feedback is essential to prevent overtightening and stripped threads on automotive battery tray fasteners. Calibration must comply with ISO 6789-2:2017 standards. All calibration weights and digital indicators must hold current NIST-traceable accreditation certificates.

## 2. Pre-Calibration Setup and Thermal Stabilization
1. Ensure Cell 3 environmental conditions are stable: ambient temperature must be 20°C +/- 2°C (68°F +/- 3.6°F) and relative humidity between 35% and 65%. Record environmental readings from thermo-hygrometer **TH-03**.
2. De-energize spindle drive motor per SOP-SAF-02. Lock out high-voltage servo amp breaker **CB-SP02**. Leave low-voltage 24V DC sensor instrumentation power active.
3. Power on digital torque signal conditioning amplifier **AMP-TQ-02** and allow a 30-minute warm-up stabilization period to prevent thermal zero drift.
4. If diagnostic fault **E-508: Torque Transducer Static Zero Offset Exceeded (> 1.2% Full Scale)** is active on the cell controller, note the raw bridge output voltage in mV/V.

## 3. Shunt Calibration and Zero Balance Verification
1. Inspect the physical condition of torque transducer TQ-104: check the slip-ring housing, cable shielding **CBL-TQ-SH**, and M12 8-pin IP67 circular connector. Clean connector contacts with contact cleaner **CRC-2000** if oxidation is visible.
2. With zero mechanical load on spindle SP-02, navigate on amplifier AMP-TQ-02 to **Channel 1 > Calibration > Zero Tare**.
3. Measure the zero-load sensor voltage across pins 2 and 3 using calibrated 6.5-digit multimeter **Agilent-34401A**. Voltage must read 0.000 mV +/- 0.025 mV.
4. Activate the internal precision shunt resistor (350.0 kΩ, 0.01% tolerance) by pressing the **CAL SHUNT** button. The displayed reading must register 80.00% of nominal full-scale (equivalent to 40.00 Nm on a 50 Nm transducer) within +/- 0.10 Nm.

## 4. Five-Point Deadweight Static Load Calibration
Execute a 5-point calibration test using certified NIST-traceable calibration arm **CAL-ARM-50** (exactly 0.5000 meters effective length) and class F deadweights:
1. Mount CAL-ARM-50 onto the square drive output shaft of spindle SP-02. Level the arm horizontally using precision digital spirit level **DL-01** (angular tilt < 0.05 degrees).
2. Apply the following clockwise test loads sequentially, pausing 30 seconds at each step:
   - **Point 1 (10 Nm):** Suspend certified weight hanger plus 2.039 kg mass (**WT-02**). Target reading: 10.00 Nm (Permissible range: 9.95 to 10.05 Nm).
   - **Point 2 (20 Nm):** Add 2.039 kg mass. Target reading: 20.00 Nm (Range: 19.90 to 20.10 Nm).
   - **Point 3 (30 Nm):** Add 2.039 kg mass. Target reading: 30.00 Nm (Range: 29.85 to 30.15 Nm).
   - **Point 4 (40 Nm):** Add 2.039 kg mass. Target reading: 40.00 Nm (Range: 39.80 to 40.20 Nm).
   - **Point 5 (50 Nm - Full Scale):** Add final mass. Target reading: 50.00 Nm (Range: 49.75 to 50.25 Nm).
3. Repeat the procedure in descending order to calculate hysteresis error. Maximum allowable hysteresis across all points is 0.25% FS (0.125 Nm).

## 5. Calibration Sign-Off, Gain Adjustment, and Certification
1. If any point deviates beyond +/- 0.5% FS, adjust calibration gain potentiometer **POT-GAIN-01** or input digital slope coefficient in firmware menu **Setup > Scaling > Cal Factor**.
2. Save the calibration profile to internal EEPROM.
3. Affix tamper-evident calibration sticker **LBL-CAL-PASS** on transducer housing TQ-104 displaying: Date Calibrated, Calibration Due Date (6 months), Technician Initials, and Certificate Number **CAL-2026-TQ104**.
4. Clear fault code E-508 on the robotic controller, re-enable spindle servo drive, and perform 3 test fastening cycles on torque verification test block **TB-FAST-01**.
