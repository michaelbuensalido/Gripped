import ActivityKit
import AppIntents
import Foundation
import WidgetKit

// ─── Shared Live Activity Attributes ──────────────────────────────────────────

public struct CruxLogAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var sessionStartTime: Date
        public var sendCount: Int
        public var climbCount: Int
        public var restEndDate: Date?
        public var currentZoneName: String?
        public var currentGrade: String?
        public var currentSet: Int?
        public var totalSets: Int?
        public var action: String?
        public var isComplete: Bool?

        public init(
            sessionStartTime: Date,
            sendCount: Int,
            climbCount: Int = 0,
            restEndDate: Date? = nil,
            currentZoneName: String? = nil,
            currentGrade: String? = nil,
            currentSet: Int? = nil,
            totalSets: Int? = nil,
            action: String? = nil,
            isComplete: Bool? = nil
        ) {
            self.sessionStartTime = sessionStartTime
            self.sendCount = sendCount
            self.climbCount = climbCount
            self.restEndDate = restEndDate
            self.currentZoneName = currentZoneName
            self.currentGrade = currentGrade
            self.currentSet = currentSet
            self.totalSets = totalSets
            self.action = action
            self.isComplete = isComplete
        }
    }

    public var sessionName: String
    public var sessionId: String

    public init(sessionName: String, sessionId: String) {
        self.sessionName = sessionName
        self.sessionId = sessionId
    }
}

private func notifyMainAppViaDarwin() {
    let center = CFNotificationCenterGetDarwinNotifyCenter()
    let name = CFNotificationName("com.cruxlog.restUpdated" as CFString)
    CFNotificationCenterPostNotification(center, name, nil, nil, true)
}

// ─── Interactive Buttons (App Intents) ────────────────────────────────────────

@available(iOS 16.2, *)
struct LogBurnIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Log Climb"
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Activity ID")
    var activityId: String?

    @Parameter(title: "Status")
    var status: String

    init() {
        self.status = "ATTEMPT"
    }

    init(activityId: String, status: String) {
        self.activityId = activityId
        self.status = status
    }

    func perform() async throws -> some IntentResult {
        let defaults = UserDefaults(suiteName: "group.com.cruxlog.app")
        let pending = defaults?.string(forKey: "PendingOfflineAscents") ?? ""
        let newEvent = "\(Date().timeIntervalSince1970)|\(status)"
        let updated = pending.isEmpty ? newEvent : "\(pending),\(newEvent)"
        defaults?.set(updated, forKey: "PendingOfflineAscents")
        defaults?.set(status, forKey: "ActiveRestAction")

        let activities = Activity<CruxLogAttributes>.activities
        let target = activities.first(where: { $0.id == activityId }) ?? activities.first

        if let activity = target {
            var updatedState = activity.content.state
            updatedState.climbCount += 1
            if status == "SEND" {
                updatedState.sendCount += 1
            }
            updatedState.action = status

            await activity.update(ActivityContent(state: updatedState, staleDate: nil))
            notifyMainAppViaDarwin()

            let targetId = activity.id
            let actionStatus = status
            Task.detached {
                try? await Task.sleep(nanoseconds: 1_200_000_000)
                if let current = Activity<CruxLogAttributes>.activities.first(where: { $0.id == targetId }) {
                    var cleared = current.content.state
                    if cleared.action == actionStatus {
                        cleared.action = nil
                        await current.update(ActivityContent(state: cleared, staleDate: nil))
                    }
                }
            }
        }

        return .result()
    }
}

@available(iOS 16.2, *)
struct AdjustRestIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Adjust Rest Timer"
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Activity ID")
    var activityId: String?

    @Parameter(title: "Seconds")
    var seconds: Int

    init() {
        self.seconds = 15
    }

    init(activityId: String, seconds: Int) {
        self.activityId = activityId
        self.seconds = seconds
    }

    func perform() async throws -> some IntentResult {
        let activities = Activity<CruxLogAttributes>.activities
        let target = activities.first(where: { $0.id == activityId }) ?? activities.first

        if let activity = target {
            var updatedState = activity.content.state
            let baseDate = (updatedState.restEndDate != nil && updatedState.restEndDate! > Date())
                ? updatedState.restEndDate!
                : Date()
            let newRest = baseDate.addingTimeInterval(TimeInterval(seconds))

            if newRest > Date() {
                updatedState.restEndDate = newRest
            } else {
                updatedState.restEndDate = nil
            }
            updatedState.action = "AdjustRest"

            let defaults = UserDefaults(suiteName: "group.com.cruxlog.app")
            defaults?.set(updatedState.restEndDate?.timeIntervalSince1970 ?? 0, forKey: "ActiveRestEndTimestamp")
            defaults?.set("AdjustRest", forKey: "ActiveRestAction")

            await activity.update(ActivityContent(state: updatedState, staleDate: nil))
            notifyMainAppViaDarwin()
        }

        return .result()
    }
}

@available(iOS 16.2, *)
struct SkipRestIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Skip Rest Timer"
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Activity ID")
    var activityId: String?

    init() {}

    init(activityId: String) {
        self.activityId = activityId
    }

    func perform() async throws -> some IntentResult {
        let activities = Activity<CruxLogAttributes>.activities
        let target = activities.first(where: { $0.id == activityId }) ?? activities.first

        if let activity = target {
            var updatedState = activity.content.state
            updatedState.restEndDate = nil
            updatedState.action = "SkipRest"

            let defaults = UserDefaults(suiteName: "group.com.cruxlog.app")
            defaults?.set(0, forKey: "ActiveRestEndTimestamp")
            defaults?.set("SkipRest", forKey: "ActiveRestAction")

            await activity.update(ActivityContent(state: updatedState, staleDate: nil))
            notifyMainAppViaDarwin()

            let targetId = activity.id
            Task.detached {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                if let current = Activity<CruxLogAttributes>.activities.first(where: { $0.id == targetId }) {
                    var cleared = current.content.state
                    if cleared.action == "SkipRest" {
                        cleared.action = nil
                        await current.update(ActivityContent(state: cleared, staleDate: nil))
                    }
                }
            }
        }

        return .result()
    }
}
