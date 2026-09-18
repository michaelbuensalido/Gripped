import Foundation

let num = NSNumber(value: 5)
let dict: NSDictionary = ["sendCount": num]

if let val = dict["sendCount"] as? Double {
    print("Double cast works: \(val)")
} else {
    print("Double cast fails!")
}
