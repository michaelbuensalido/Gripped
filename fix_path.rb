require 'xcodeproj'
project_path = 'ios/CruxLog.xcodeproj'
project = Xcodeproj::Project.open(project_path)
main_target = project.targets.find { |t| t.name == 'CruxLog' }
main_group = project.main_group.find_subpath('CruxLog', false)

# Find and remove the broken reference
bad_refs = main_group.files.select { |f| f.path == '../CruxLogWidget/CruxLogWidgetLiveActivity.swift' }
bad_refs.each do |bad_ref|
  main_target.source_build_phase.remove_file_reference(bad_ref)
  bad_ref.remove_from_project
end

# Add the correct reference
file_path = '../ios/CruxLogWidget/CruxLogWidgetLiveActivity.swift'
good_ref = main_group.new_reference(file_path)
main_target.source_build_phase.add_file_reference(good_ref)
project.save
puts "Fixed path!"
