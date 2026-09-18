import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

// ─── Shared Attributes ────────────────────────────────────────────────────────
// MUST match the struct in node_modules/react-native-live-activities/ios/LiveActivities.swift
// EXACTLY — same name, same property names, same types — ActivityKit links by type signature

struct CruxLogAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var sessionStartTime: Date
        var sendCount: Int
        var restEndDate: Date?
    }
    var sessionName: String
    var sessionId: String
}

// ─── Interactive Buttons (App Intents) ────────────────────────────────────────

struct LogBurnIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Log Burn"

    @Parameter(title: "Status")
    var status: String

    init() { self.status = "ATTEMPT" }

    init(status: String) {
        self.status = status
    }

    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: "group.com.cruxlog.app")
        let pending = defaults?.string(forKey: "PendingOfflineAscents") ?? ""
        let newEvent = "\(Date().timeIntervalSince1970)|\(status)"
        let updated = pending.isEmpty ? newEvent : "\(pending),\(newEvent)"
        defaults?.set(updated, forKey: "PendingOfflineAscents")

        if #available(iOS 16.2, *) {
            if let activity = Activity<CruxLogAttributes>.activities.first {
                var updatedState = activity.content.state
                if status == "SEND" { updatedState.sendCount += 1 }
                let updatedContent = ActivityContent(state: updatedState, staleDate: nil)
                await activity.update(updatedContent)
            }
        }

        return .result()
    }
}

// ─── Live Activity Widget ─────────────────────────────────────────────────────

struct CruxLogWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CruxLogAttributes.self) { context in

            // ─── Lock Screen UI ───────────────────────────────────────────────

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("SESSION")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(red: 85/255, green: 85/255, blue: 98/255))
                        .tracking(1.5)
                    Text(context.attributes.sessionName.uppercased())
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                        .lineLimit(1)
                }

                Spacer()

                // Ticking timer or Rest Timer
                if let restEnd = context.state.restEndDate, restEnd > Date() {
                    VStack(alignment: .center, spacing: 2) {
                        Text("REST")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                            .tracking(1.5)
                        Text(timerInterval: Date()...restEnd, countsDown: true)
                            .font(.system(size: 28, weight: .bold, design: .monospaced))
                            .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                            .monospacedDigit()
                    }
                } else {
                    Text(timerInterval: context.state.sessionStartTime...context.state.sessionStartTime.addingTimeInterval(3600 * 24), countsDown: false)
                        .font(.system(size: 28, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                        .monospacedDigit()
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    Text("SENDS")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(red: 85/255, green: 85/255, blue: 98/255))
                        .tracking(1.5)
                    Text("\(context.state.sendCount)")
                        .font(.system(size: 28, weight: .bold, design: .monospaced))
                        .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(red: 17/255, green: 17/255, blue: 19/255))
            .activityBackgroundTint(Color(red: 17/255, green: 17/255, blue: 19/255))
            .widgetURL(URL(string: "cruxlog://session/\(context.attributes.sessionId)"))

        } dynamicIsland: { context in

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
                        if let restEnd = context.state.restEndDate, restEnd > Date() {
                            Text("REST")
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                                .tracking(1.5)
                            Text(timerInterval: Date()...restEnd, countsDown: true)
                                .font(.system(size: 22, weight: .bold, design: .monospaced))
                                .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
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
                if let restEnd = context.state.restEndDate, restEnd > Date() {
                    Image(systemName: "timer")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                } else {
                    Image(systemName: "flame.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                }
            } compactTrailing: {
                if let restEnd = context.state.restEndDate, restEnd > Date() {
                    Text(timerInterval: Date()...restEnd, countsDown: true)
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(Color(red: 231/255, green: 174/255, blue: 86/255))
                        .frame(width: 45)
                } else {
                    Text(timerInterval: context.state.sessionStartTime...context.state.sessionStartTime.addingTimeInterval(3600 * 24), countsDown: false)
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .monospacedDigit()
                        .foregroundColor(.white)
                        .frame(width: 45)
                }
            } minimal: {
                if let restEnd = context.state.restEndDate, restEnd > Date() {
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
