require 'xcodeproj'
project_path = 'ios/CruxLog.xcodeproj'
project = Xcodeproj::Project.open(project_path)
main_target = project.targets.find { |t| t.name == 'CruxLog' }
main_group = project.main_group.find_subpath('CruxLog', false)

# Find and remove the Live Activity reference from the main target
bad_refs = project.main_group.files.select { |f| f.path == 'CruxLogWidget/CruxLogWidgetLiveActivity.swift' }
bad_refs.each do |bad_ref|
  main_target.source_build_phase.remove_file_reference(bad_ref)
  puts "Removed CruxLogWidgetLiveActivity.swift from main target."
end

project.save
