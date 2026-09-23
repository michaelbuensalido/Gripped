require 'xcodeproj'
project_path = 'ios/CruxLog.xcodeproj'
project = Xcodeproj::Project.open(project_path)
main_target = project.targets.find { |t| t.name == 'CruxLog' }
file_ref = project.main_group.new_reference('CruxLogWidget/LiveActivityIntents.swift')
main_target.source_build_phase.add_file_reference(file_ref)
project.save
