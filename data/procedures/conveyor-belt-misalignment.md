# SOP-CONV-05: Main Assembly Line Conveyor Belt Misalignment Troubleshooting

## 1. System Overview and Pinch Point Hazard Warning
This procedure specifies corrective measures for tracking deviation, lateral drift, and edge rub on heavy-duty motorized modular conveyor system **CV-02** (Packaging Line 1).
**WARNING: MOVING EQUIPMENT HAZARD.** Never place hands, fingers, or loose clothing within 500 mm of the head or tail pulley pinch zones while the conveyor is in motion. Maintenance guards **MG-01** and **MG-02** may only be removed during static alignment or when utilizing extended adjustment handles.

## 2. Fault Indication and Tracking Sensor Diagnostic
1. An off-center belt tracking condition is automatically flagged when the belt edge triggers inductive proximity sensor **PRX-TRK-L** (left limit) or **PRX-TRK-R** (right limit), producing alarm **E-315: Conveyor CV-02 Lateral Belt Tracking Deviation Exceeded (+/- 25 mm)**.
2. If drift exceeds 35 mm, the fail-safe conveyor tracking safety switch **SS-TRK-01** trips, causing an immediate automated line interlock stop.
3. Inspect the fault beacon at Station 4: a pulsing red beacon confirms conveyor trip due to E-315.
4. Record the belt travel direction and drift orientation (drive side or idle side) in the maintenance terminal.

## 3. Initial Static Inspection and Debris Check
Before adjusting mechanical tracking tensioners:
1. De-energize conveyor CV-02 following standard LOTO per SOP-SAF-02. Lock main conveyor disconnect switch **DS-CV02**.
2. Inspect the underside return idler rollers (**IDL-01** through **IDL-12**) for packaging tape, strap fragments, or cardboard build-up. Accumulation as thin as 2 mm on an idler drum creates conical diameter variance that drives the belt sideways.
3. Clean all idlers and snub rollers with brass scraper **SC-BR02** and lint-free solvent cloths.
4. Inspect the belt surface for cupping, torn edge lace fasteners (Clipper wire hooks or Alligator staple fasteners), or longitudinal gouges.

## 4. Mechanical Tracking Adjustment Procedure
Conveyor belt tracking must be corrected by adjusting the take-up bearing position on the tail pulley assembly:
1. Loosen the four jam nuts on take-up bearing blocks **BB-TAIL-L** and **BB-TAIL-R** using a 24 mm open-end box wrench **WR-24**.
2. Identify rule of tracking: *The belt moves toward the side of the idler or pulley that it contacts first.*
3. If the belt drifts to the **Left (Operator Side)**:
   - Turn the left tensioning threaded screw **TS-01L** clockwise by exactly 1/2 turn (180 degrees) to increase tension on the left side, pushing the belt back toward center.
   - Alternatively, turn the right tensioning screw **TS-01R** counter-clockwise by 1/2 turn.
4. If the belt drifts to the **Right (Drive Side)**:
   - Turn the right tensioning threaded screw **TS-01R** clockwise by 1/2 turn.
5. Use laser alignment collimator **LAT-01** magnetically attached to the tail pulley shaft to verify pulley squareness is within 0.05 degrees (1 mm per meter of pulley width).

## 5. Dynamic Run Test and Final Verification
1. Clear all tools, remove LOTO padlocks, and restore power.
2. Station an observer at Emergency Stop station PB-04 with finger poised on the E-Stop button.
3. Start conveyor CV-02 in low-speed jog mode (25% nominal velocity, 0.25 m/s) and allow the belt to complete 3 full revolutions (approx. 90 seconds).
4. Observe the belt edge position relative to the reference center scribe lines on guide plate **GP-01**.
5. Once belt tracks true within +/- 3 mm of center at full operating speed (1.0 m/s) for 10 minutes continuously, tighten all four 24 mm jam nuts on the bearing blocks to 85 Nm torque using torque wrench **TW-100**.
6. Reset alarm E-315 on the main packaging cell HMI.
