import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

import os.log

// ─── Shared Group / Attributes ────────────────────────────────────────────────
// The Live Activity payload signature that links JS bridging to Swift

// ─── Live Activity Widget ─────────────────────────────────────────────────────

struct CruxLogWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CruxLogAttributes.self) { context in
            
            // ─── Lock Screen UI ───────────────────────────────────────────────
            
            VStack(spacing: 8) {
                // Top Row (Session Title + Small Session Timer + Sends)
                HStack(alignment: .center) {
                    // Left: Title
                    VStack(alignment: .leading, spacing: 2) {
                        Text("SESSION")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                            .tracking(1.2)
                        Text(context.attributes.sessionName.uppercased())
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                    
                    Spacer()
                    
                    // Right: Small Session Timer + SENDS
                    HStack(alignment: .center, spacing: 12) {
                        // Small Session Timer
                        VStack(alignment: .center, spacing: 2) {
                            Text("TIME")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                                .tracking(1.2)
                            Text(timerInterval: context.state.sessionStartTime...context.state.sessionStartTime.addingTimeInterval(3600*24), countsDown: false)
                                .font(.system(size: 13, weight: .bold, design: .monospaced))
                                .foregroundColor(.white)
                                .monospacedDigit()
                                .frame(width: 44, alignment: .center)
                        }
                        
                        // Vertical Divider
                        Rectangle()
                            .fill(Color(red: 39/255, green: 39/255, blue: 47/255))
                            .frame(width: 1, height: 20)

                        // SENDS
                        VStack(alignment: .center, spacing: 2) {
                            Text("SENDS")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                                .tracking(1.2)
                            Text("\(context.state.sendCount)")
                                .font(.system(size: 15, weight: .bold, design: .monospaced))
                                .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                        }
                    }
                }
                
                // Middle Row (Active Context Pill)
                if context.state.isComplete == true {
                    HStack {
                        Spacer()
                        Text("WORKOUT COMPLETE")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                            .tracking(1.2)
                        Spacer()
                    }
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(Color(red: 25/255, green: 25/255, blue: 29/255))
                    )
                    .overlay(
                        Capsule()
                            .stroke(Color(red: 39/255, green: 39/255, blue: 47/255), lineWidth: 1)
                    )
                } else if let zoneName = context.state.currentZoneName,
                   let grade = context.state.currentGrade,
                   let currentSet = context.state.currentSet,
                   let totalSets = context.state.totalSets,
                   totalSets > 0 {
                    
                    HStack {
                        Spacer()
                        Text("\(zoneName) • \(grade) • SET \(currentSet) OF \(totalSets)".uppercased())
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                        Spacer()
                    }
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(Color(red: 25/255, green: 25/255, blue: 29/255))
                    )
                    .overlay(
                        Capsule()
                            .stroke(Color(red: 39/255, green: 39/255, blue: 47/255), lineWidth: 1)
                    )
                }
                
                // Bottom Row (Animated State Machine)
                ZStack {
                    if context.state.isComplete == true {
                        HStack(spacing: 8) {
                            Image(systemName: "arrow.up.forward.app.fill")
                                .font(.system(size: 20))
                            Text("TAP TO SAVE SESSION")
                                .font(.system(size: 16, weight: .bold, design: .monospaced))
                        }
                        .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .transition(.opacity)
                    } else if context.state.action == "SEND" {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 20))
                            Text("SENT")
                                .font(.system(size: 16, weight: .bold, design: .monospaced))
                        }
                        .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .transition(.scale(scale: 0.8).combined(with: .opacity))
                        
                    } else if context.state.action == "ATTEMPT" {
                        HStack(spacing: 8) {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 20))
                            Text("LOGGED")
                                .font(.system(size: 16, weight: .bold, design: .monospaced))
                        }
                        .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .transition(.scale(scale: 0.8).combined(with: .opacity))
                        
                    } else if context.state.action == "SkipRest" {
                        HStack(spacing: 8) {
                            Image(systemName: "forward.end.fill")
                                .font(.system(size: 20))
                            Text("SKIPPED")
                                .font(.system(size: 16, weight: .bold, design: .monospaced))
                        }
                        .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .transition(.scale(scale: 0.8).combined(with: .opacity))
                        
                    } else if let restEnd = context.state.restEndDate, restEnd > Date() {
                        
                        HStack(alignment: .center) {
                            // Left: -15s Button
                            Button(intent: AdjustRestIntent(activityId: context.activityID, seconds: -15)) {
                                Text("-15")
                                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                                    .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                                    .frame(minWidth: 44, minHeight: 36)
                                    .background(Color(red: 35/255, green: 30/255, blue: 22/255))
                                    .cornerRadius(8)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color(red: 231/255, green: 174/255, blue: 86/255).opacity(0.35), lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)
                            .contentShape(Rectangle())
                            
                            Spacer()
                            
                            // Center: Amber countdown timer with dynamic identity refresh
                            VStack(spacing: 1) {
                                Text("REST")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                                    .tracking(1.5)
                                Text(timerInterval: Date()...max(Date().addingTimeInterval(1), restEnd), countsDown: true)
                                    .id(restEnd)
                                    .font(.system(size: 34, weight: .bold, design: .monospaced))
                                    .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                                    .monospacedDigit()
                                    .frame(width: 100, alignment: .center)
                            }
                            
                            Spacer()
                            
                            // Right: +15s Button & SKIP Button
                            HStack(spacing: 6) {
                                Button(intent: AdjustRestIntent(activityId: context.activityID, seconds: 15)) {
                                    Text("+15")
                                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                                        .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                                        .frame(minWidth: 44, minHeight: 36)
                                        .background(Color(red: 35/255, green: 30/255, blue: 22/255))
                                        .cornerRadius(8)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(Color(red: 231/255, green: 174/255, blue: 86/255).opacity(0.35), lineWidth: 1)
                                        )
                                }
                                .buttonStyle(.plain)
                                .contentShape(Rectangle())
                                
                                Button(intent: SkipRestIntent(activityId: context.activityID)) {
                                    Text("SKIP")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                                        .frame(minWidth: 46, minHeight: 36)
                                        .background(Color(red: 25/255, green: 25/255, blue: 29/255))
                                        .cornerRadius(8)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 8)
                                                .stroke(Color(red: 62/255, green: 62/255, blue: 72/255), lineWidth: 1)
                                        )
                                }
                                .buttonStyle(.plain)
                                .contentShape(Rectangle())
                            }
                        }
                        
                    } else {
                        
                        // Quick Action Buttons
                        HStack(spacing: 12) {
                            Button(intent: LogBurnIntent(activityId: context.activityID, status: "ATTEMPT")) {
                                Text("BURN")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color(red: 62/255, green: 62/255, blue: 72/255), lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)
                            .contentShape(Rectangle())
                            
                            Button(intent: LogBurnIntent(activityId: context.activityID, status: "SEND")) {
                                Text("SEND")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color(red: 142/255, green: 124/255, blue: 255/255), lineWidth: 1)
                                    )
                            }
                            .buttonStyle(.plain)
                            .contentShape(Rectangle())
                        }
                        
                    }
                }
                .animation(.spring(response: 0.35, dampingFraction: 0.7), value: context.state.action)
                .animation(.spring(response: 0.35, dampingFraction: 0.7), value: context.state.restEndDate)
            }
            .padding()
            .background(Color(red: 17/255, green: 17/255, blue: 19/255))
            .activityBackgroundTint(Color.black.opacity(0.8))
            
        } dynamicIsland: { context in
            // ─── Dynamic Island UI (Restored Original) ─────────────────────────────────────────────
            
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("SENDS")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Color(red: 85/255, green: 85/255, blue: 98/255))
                            .tracking(1.5)
                        Text("\(context.state.sendCount)")
                            .font(.system(size: 28, weight: .bold, design: .monospaced))
                            .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                    }
                    .padding(.leading, 8)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        if context.state.isComplete == true {
                            Text("ACTION")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(red: 85/255, green: 85/255, blue: 98/255))
                                .tracking(1.5)
                            Text("SAVE")
                                .font(.system(size: 22, weight: .bold, design: .monospaced))
                                .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                        } else if let restEnd = context.state.restEndDate, restEnd > Date() {
                            Text("REST")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                                .tracking(1.5)
                            Text(timerInterval: Date()...max(Date().addingTimeInterval(1), restEnd), countsDown: true)
                                .id(restEnd)
                                .font(.system(size: 22, weight: .bold, design: .monospaced))
                                .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                                .monospacedDigit()
                        } else if context.state.currentZoneName != nil, let set = context.state.currentSet, let total = context.state.totalSets, total > 0 {
                            Text("SET")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(red: 85/255, green: 85/255, blue: 98/255))
                                .tracking(1.5)
                            Text("\(set)/\(total)")
                                .font(.system(size: 22, weight: .bold, design: .monospaced))
                                .foregroundColor(.white)
                                .monospacedDigit()
                        } else {
                            Text("TIME")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(red: 85/255, green: 85/255, blue: 98/255))
                                .tracking(1.5)
                            Text(timerInterval: context.state.sessionStartTime...context.state.sessionStartTime.addingTimeInterval(3600 * 24), countsDown: false)
                                .font(.system(size: 22, weight: .bold, design: .monospaced))
                                .foregroundColor(.white)
                                .monospacedDigit()
                        }
                    }
                    .padding(.trailing, 8)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Spacer()
                        Circle()
                            .fill(Color(red: 142/255, green: 124/255, blue: 255/255))
                            .frame(width: 5, height: 5)
                        Text("CRUXLOG ACTIVE")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                            .tracking(2)
                        Spacer()
                    }
                    .padding(.top, 4)
                }
            } compactLeading: {
                if context.state.isComplete == true {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                } else if let restEnd = context.state.restEndDate, restEnd > Date() {
                    Image(systemName: "timer")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                } else {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                }
            } compactTrailing: {
                if context.state.isComplete == true {
                    Text("SAVE")
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                        .frame(width: 45, alignment: .trailing)
                } else if let restEnd = context.state.restEndDate, restEnd > Date() {
                    Text(timerInterval: Date()...max(Date().addingTimeInterval(1), restEnd), countsDown: true)
                        .id(restEnd)
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                        .frame(width: 45)
                } else if context.state.currentZoneName != nil, let set = context.state.currentSet, let total = context.state.totalSets, total > 0 {
                    Text("\(set)/\(total)")
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.white)
                        .frame(width: 45, alignment: .trailing)
                } else {
                    Text(timerInterval: context.state.sessionStartTime...context.state.sessionStartTime.addingTimeInterval(3600 * 24), countsDown: false)
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.white)
                        .frame(width: 45)
                }
            } minimal: {
                if context.state.isComplete == true {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                } else if let restEnd = context.state.restEndDate, restEnd > Date() {
                    Image(systemName: "timer")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                } else {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                }
            }
            .widgetURL(URL(string: "cruxlog://session/\(context.attributes.sessionId)"))
            .keylineTint(Color(red: 142/255, green: 124/255, blue: 255/255))
        }
    }
}
