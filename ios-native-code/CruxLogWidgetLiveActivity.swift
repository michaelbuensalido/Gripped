import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

// ─── Shared Group / Attributes ────────────────────────────────────────────────
// The Live Activity payload signature that links JS bridging to Swift

struct CruxLogAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var sessionStartTime: Date
        var sendCount: Int
    }
    var sessionName: String
}

// ─── Interactive Buttons (App Intents) ────────────────────────────────────────
// These allow Lock Screen buttons to mutate data natively without waking JS up

struct LogBurnIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Log Burn"
    
    @Parameter(title: "Status")
    var status: String
    
    init() {}
    
    init(status: String) {
        self.status = status
    }
    
    func perform() async throws -> some IntentResult {
        // Sync to UserDefaults (AppGroup) so React Native can pick it up via bridging
        let defaults = UserDefaults(suiteName: "group.com.cruxlog.app")
        
        let pending = defaults?.string(forKey: "PendingOfflineAscents") ?? ""
        let newEvent = "\(Date().timeIntervalSince1970)|\(status)"
        let updated = pending.isEmpty ? newEvent : "\(pending),\(newEvent)"
        
        defaults?.set(updated, forKey: "PendingOfflineAscents")
        
        // Also update the UI state live if ActivityKit allows
        if let activity = Activity<CruxLogAttributes>.activities.first {
            var updatedState = activity.content.state
            if status == "SEND" {
                updatedState.sendCount += 1
            }
            
            // Using modern iOS 16.2+ ActivityKit update syntax
            let alertConfiguration = AlertConfiguration(
                title: "CruxLog",
                body: "Logged \(status)",
                sound: .default
            )
            
            let updatedContent = ActivityContent(state: updatedState, staleDate: nil)
            await activity.update(updatedContent, alertConfiguration: alertConfiguration)
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
                // Left: Title
                Text(context.attributes.sessionName.uppercased())
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                
                Spacer()
                
                // Center: Native ticking timer (Bypasses JS thread!)
                Text(timerInterval: context.state.sessionStartTime...Date().addingTimeInterval(3600*24), countsDown: false)
                    .font(.system(size: 34, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
                    .monospacedDigit()
                
                Spacer()
                
                // Right: App Intents
                HStack(spacing: 8) {
                    Button(intent: LogBurnIntent(status: "ATTEMPT")) {
                        Text("BURN")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(red: 138/255, green: 138/255, blue: 152/255))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(Color(red: 62/255, green: 62/255, blue: 72/255), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                    
                    Button(intent: LogBurnIntent(status: "SEND")) {
                        Text("SEND")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(Color(red: 142/255, green: 124/255, blue: 255/255), lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
            .background(Color(red: 17/255, green: 17/255, blue: 19/255))
            .activityBackgroundTint(Color.black.opacity(0.8))
            
        } dynamicIsland: { context in
            // ─── Dynamic Island UI ─────────────────────────────────────────────
            
            DynamicIsland {
                // Expanded Region
                DynamicIslandExpandedRegion(.leading) {
                    Text("SENDS")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(Color(red: 85/255, green: 85/255, blue: 98/255))
                    Text("\(context.state.sendCount)")
                        .font(.system(size: 24, weight: .bold, design: .monospaced))
                        .foregroundColor(Color(red: 110/255, green: 231/255, blue: 86/255))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    // Blinking Tracker Dot + Timer
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color(red: 142/255, green: 124/255, blue: 255/255))
                            .frame(width: 6, height: 6)
                        Text(timerInterval: context.state.sessionStartTime...Date().addingTimeInterval(3600*24), countsDown: false)
                            .font(.system(size: 24, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                            .monospacedDigit()
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Spacer()
                        Text("AUTOLOGGER ACTIVE")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
                            .tracking(2)
                        Spacer()
                    }
                }
            } compactLeading: {
                Text("CL")
                    .font(.system(size: 12, weight: .black))
                    .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
            } compactTrailing: {
                Text(timerInterval: context.state.sessionStartTime...Date().addingTimeInterval(3600*24), countsDown: false)
                    .font(.system(size: 12, weight: .bold, design: .monospaced))
                    .monospacedDigit()
                    .foregroundColor(.white)
                    .frame(width: 45)
            } minimal: {
                Text("CL")
                    .font(.system(size: 12, weight: .black))
                    .foregroundColor(Color(red: 142/255, green: 124/255, blue: 255/255))
            }
            .widgetURL(URL(string: "cruxlog://session/active"))
            .keylineTint(Color(red: 142/255, green: 124/255, blue: 255/255))
        }
    }
}
