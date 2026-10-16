import WidgetKit
import SwiftUI

@main
struct CruxLogWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.2, *) {
            CruxLogWidgetLiveActivity()
        }
    }
}
