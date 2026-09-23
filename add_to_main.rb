require 'xcodeproj'
project_path = 'ios/CruxLog.xcodeproj'
project = Xcodeproj::Project.open(project_path)

main_target = project.targets.find { |t| t.name == 'CruxLog' }
main_group = project.main_group.find_subpath('CruxLog', false)

file_path = '../CruxLogWidget/CruxLogWidgetLiveActivity.swift'
file_ref = main_group.new_reference(file_path)

unless main_target.source_build_phase.files_references.include?(file_ref)
  main_target.source_build_phase.add_file_reference(file_ref)
  project.save
  puts "Added CruxLogWidgetLiveActivity.swift to CruxLog target!"
else
  puts "Already in CruxLog target."
end
