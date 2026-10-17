import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

// ─── Design System v2.1 Dark Matte Tokens ─────────────────────────────────────

private enum WidgetTheme {
    static let bg = Color(red: 16/255, green: 16/255, blue: 20/255)             // #101014
    static let card = Color(red: 26/255, green: 26/255, blue: 32/255)           // #1A1A20
    static let cardMuted = Color(red: 34/255, green: 34/255, blue: 42/255)      // #22222A
    static let border = Color.white.opacity(0.08)
    static let text = Color(red: 242/255, green: 243/255, blue: 247/255)        // #F2F3F7
    static let textMuted = Color(red: 154/255, green: 154/255, blue: 168/255)   // #9A9AA8
    static let accent = Color(red: 112/255, green: 89/255, blue: 219/255)       // #7059DB
    static let accentSoft = Color(red: 45/255, green: 43/255, blue: 62/255)     // #2D2B3E
    static let accentText = Color(red: 165/255, green: 150/255, blue: 245/255)  // #A596F5
    static let flash = Color(red: 169/255, green: 220/255, blue: 138/255)       // #A9DC8A
    static let flashSoft = Color(red: 49/255, green: 57/255, blue: 49/255)      // #313931
    static let restAmber = Color(red: 240/255, green: 169/255, blue: 59/255)    // #F0A93B
    static let restAmberSoft = Color(red: 60/255, green: 49/255, blue: 36/255)  // #3C3124
}

// ─── Reusable Interactive Control Row ─────────────────────────────────────────

@available(iOS 17.0, *)
private struct InteractiveActionRow: View {
    let activityId: String
    let state: CruxLogAttributes.ContentState
    var compact: Bool = false

    var body: some View {
        let buttonHeight: CGFloat = compact ? 34 : 40

        ZStack {
            if state.action == "SEND" {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 18, weight: .semibold))
                    Text("SENT")
                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                        .tracking(1.0)
                }
                .foregroundColor(WidgetTheme.flash)
                .frame(maxWidth: .infinity, minHeight: buttonHeight)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(WidgetTheme.flashSoft)
                )
            } else if state.action == "ATTEMPT" {
                HStack(spacing: 8) {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 18, weight: .semibold))
                    Text("ATTEMPT LOGGED")
                        .font(.system(size: 14, weight: .bold, design: .monospaced))
                        .tracking(1.0)
                }
                .foregroundColor(WidgetTheme.accentText)
                .frame(maxWidth: .infinity, minHeight: buttonHeight)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(WidgetTheme.accentSoft)
                )
            } else if state.action == "SkipRest" {
                HStack(spacing: 8) {
                    Image(systemName: "forward.end.fill")
                        .font(.system(size: 16, weight: .semibold))
                    Text("REST SKIPPED")
                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                        .tracking(1.0)
                }
                .foregroundColor(WidgetTheme.textMuted)
                .frame(maxWidth: .infinity, minHeight: buttonHeight)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(WidgetTheme.cardMuted)
                )
            } else if let restEnd = state.restEndDate, restEnd > Date() {
                HStack(alignment: .center, spacing: 8) {
                    Button(intent: AdjustRestIntent(activityId: activityId, seconds: -15)) {
                        Text("-15s")
                            .font(.system(size: 13, weight: .bold, design: .monospaced))
                            .foregroundColor(WidgetTheme.restAmber)
                            .frame(minWidth: 52, minHeight: buttonHeight)
                            .background(WidgetTheme.restAmberSoft)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(WidgetTheme.restAmber.opacity(0.35), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)

                    if !compact {
                        Spacer(minLength: 4)
                        VStack(spacing: 1) {
                            Text("RESTING")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(WidgetTheme.restAmber)
                                .tracking(1.2)
                            Text(timerInterval: Date()...max(Date().addingTimeInterval(1), restEnd), countsDown: true)
                                .id(restEnd)
                                .font(.system(size: 26, weight: .bold, design: .monospaced))
                                .foregroundColor(WidgetTheme.restAmber)
                                .monospacedDigit()
                                .multilineTextAlignment(.center)
                                .frame(minWidth: 86)
                        }
                        Spacer(minLength: 4)
                    } else {
                        Spacer(minLength: 4)
                    }

                    Button(intent: AdjustRestIntent(activityId: activityId, seconds: 15)) {
                        Text("+15s")
                            .font(.system(size: 13, weight: .bold, design: .monospaced))
                            .foregroundColor(WidgetTheme.restAmber)
                            .frame(minWidth: 52, minHeight: buttonHeight)
                            .background(WidgetTheme.restAmberSoft)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(WidgetTheme.restAmber.opacity(0.35), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)

                    Button(intent: SkipRestIntent(activityId: activityId)) {
                        Text("Skip")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(WidgetTheme.textMuted)
                            .frame(minWidth: 52, minHeight: buttonHeight)
                            .background(WidgetTheme.cardMuted)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(WidgetTheme.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            } else {
                let gradeSuffix = (state.currentGrade != nil && !state.currentGrade!.isEmpty)
                    ? " · \(state.currentGrade!)"
                    : ""

                HStack(spacing: 10) {
                    Button(intent: LogBurnIntent(activityId: activityId, status: "ATTEMPT")) {
                        Text("Attempt\(gradeSuffix)")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(WidgetTheme.text)
                            .frame(maxWidth: .infinity, minHeight: buttonHeight)
                            .background(WidgetTheme.cardMuted)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(WidgetTheme.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)

                    Button(intent: LogBurnIntent(activityId: activityId, status: "SEND")) {
                        Text("Send\(gradeSuffix)")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(WidgetTheme.accentText)
                            .frame(maxWidth: .infinity, minHeight: buttonHeight)
                            .background(WidgetTheme.accentSoft)
                            .cornerRadius(10)
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(WidgetTheme.accent.opacity(0.55), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// ─── Live Activity Widget Configuration ───────────────────────────────────────

@available(iOS 17.0, *)
struct CruxLogWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CruxLogAttributes.self) { context in

            // ─── Lock Screen Banner UI ────────────────────────────────────────
            VStack(spacing: 12) {
                // Top Row: Gym Name + Session Elapsed Time + Climbs + Sends
                HStack(alignment: .center, spacing: 10) {
                    // Left: Gym Name
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 5) {
                            Circle()
                                .fill(WidgetTheme.accentText)
                                .frame(width: 6, height: 6)
                            Text("ACTIVE SESSION")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(WidgetTheme.textMuted)
                                .tracking(1.1)
                        }
                        Text(context.attributes.sessionName)
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(WidgetTheme.text)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                    }

                    Spacer(minLength: 6)

                    // Right: Telemetry Columns (TIME | CLIMBS | SENDS)
                    HStack(alignment: .center, spacing: 10) {
                        VStack(alignment: .center, spacing: 2) {
                            Text("TIME")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(WidgetTheme.textMuted)
                                .tracking(1.0)
                            Text(
                                timerInterval: context.state.sessionStartTime...context.state.sessionStartTime.addingTimeInterval(3600 * 24),
                                countsDown: false
                            )
                            .font(.system(size: 14, weight: .bold, design: .monospaced))
                            .foregroundColor(WidgetTheme.text)
                            .monospacedDigit()
                            .multilineTextAlignment(.center)
                            .frame(minWidth: 46)
                        }

                        Rectangle()
                            .fill(WidgetTheme.border)
                            .frame(width: 1, height: 22)

                        VStack(alignment: .center, spacing: 2) {
                            Text("CLIMBS")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(WidgetTheme.textMuted)
                                .tracking(1.0)
                            Text("\(context.state.climbCount)")
                                .font(.system(size: 15, weight: .bold, design: .monospaced))
                                .foregroundColor(WidgetTheme.text)
                                .monospacedDigit()
                        }

                        Rectangle()
                            .fill(WidgetTheme.border)
                            .frame(width: 1, height: 22)

                        VStack(alignment: .center, spacing: 2) {
                            Text("SENDS")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(WidgetTheme.textMuted)
                                .tracking(1.0)
                            Text("\(context.state.sendCount)")
                                .font(.system(size: 15, weight: .bold, design: .monospaced))
                                .foregroundColor(WidgetTheme.accentText)
                                .monospacedDigit()
                        }
                    }
                }

                // Bottom Row: Interactive Controls (Rest Timer or Quick Log)
                InteractiveActionRow(
                    activityId: context.activityID,
                    state: context.state,
                    compact: false
                )
            }
            .padding(14)
            .background(WidgetTheme.bg)
            .activityBackgroundTint(WidgetTheme.bg)
            .activitySystemActionForegroundColor(WidgetTheme.text)
            .widgetURL(URL(string: "cruxlog://session/active"))

        } dynamicIsland: { context in

            // ─── Dynamic Island UI ────────────────────────────────────────────
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(context.attributes.sessionName.uppercased())
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(WidgetTheme.textMuted)
                            .tracking(1.0)
                            .lineLimit(1)

                        HStack(alignment: .firstTextBaseline, spacing: 10) {
                            VStack(alignment: .leading, spacing: 1) {
                                Text("\(context.state.sendCount)")
                                    .font(.system(size: 22, weight: .bold, design: .monospaced))
                                    .foregroundColor(WidgetTheme.accentText)
                                    .monospacedDigit()
                                Text("SENDS")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundColor(WidgetTheme.textMuted)
                                    .tracking(1.0)
                            }

                            VStack(alignment: .leading, spacing: 1) {
                                Text("\(context.state.climbCount)")
                                    .font(.system(size: 22, weight: .bold, design: .monospaced))
                                    .foregroundColor(WidgetTheme.text)
                                    .monospacedDigit()
                                Text("CLIMBS")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundColor(WidgetTheme.textMuted)
                                    .tracking(1.0)
                            }
                        }
                    }
                    .padding(.leading, 6)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        if let restEnd = context.state.restEndDate, restEnd > Date() {
                            Text("REST")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(WidgetTheme.restAmber)
                                .tracking(1.2)
                            Text(timerInterval: Date()...max(Date().addingTimeInterval(1), restEnd), countsDown: true)
                                .id(restEnd)
                                .font(.system(size: 22, weight: .bold, design: .monospaced))
                                .foregroundColor(WidgetTheme.restAmber)
                                .monospacedDigit()
                                .multilineTextAlignment(.trailing)
                        } else {
                            Text("SESSION TIME")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(WidgetTheme.textMuted)
                                .tracking(1.2)
                            Text(
                                timerInterval: context.state.sessionStartTime...context.state.sessionStartTime.addingTimeInterval(3600 * 24),
                                countsDown: false
                            )
                            .font(.system(size: 22, weight: .bold, design: .monospaced))
                            .foregroundColor(WidgetTheme.text)
                            .monospacedDigit()
                            .multilineTextAlignment(.trailing)
                        }
                    }
                    .padding(.trailing, 6)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    InteractiveActionRow(
                        activityId: context.activityID,
                        state: context.state,
                        compact: true
                    )
                    .padding(.top, 4)
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                if let restEnd = context.state.restEndDate, restEnd > Date() {
                    Image(systemName: "timer")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(WidgetTheme.restAmber)
                } else {
                    HStack(spacing: 3) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(WidgetTheme.accentText)
                        Text("\(context.state.sendCount)")
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundColor(WidgetTheme.accentText)
                            .monospacedDigit()
                    }
                }
            } compactTrailing: {
                if let restEnd = context.state.restEndDate, restEnd > Date() {
                    Text(timerInterval: Date()...max(Date().addingTimeInterval(1), restEnd), countsDown: true)
                        .id(restEnd)
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(WidgetTheme.restAmber)
                        .frame(width: 46, alignment: .trailing)
                } else {
                    Text(
                        timerInterval: context.state.sessionStartTime...context.state.sessionStartTime.addingTimeInterval(3600 * 24),
                        countsDown: false
                    )
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(WidgetTheme.text)
                    .frame(width: 46, alignment: .trailing)
                }
            } minimal: {
                if let restEnd = context.state.restEndDate, restEnd > Date() {
                    Image(systemName: "timer")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(WidgetTheme.restAmber)
                } else {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(WidgetTheme.accentText)
                }
            }
            .widgetURL(URL(string: "cruxlog://session/active"))
            .keylineTint(WidgetTheme.accent)
        }
    }
}
