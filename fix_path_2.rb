require 'xcodeproj'
project_path = 'ios/CruxLog.xcodeproj'
project = Xcodeproj::Project.open(project_path)
main_target = project.targets.find { |t| t.name == 'CruxLog' }
main_group = project.main_group.find_subpath('CruxLog', false)

# Find and remove the broken reference
bad_refs = main_group.files.select { |f| f.path.include?('CruxLogWidgetLiveActivity.swift') }
bad_refs.each do |bad_ref|
  main_target.source_build_phase.remove_file_reference(bad_ref)
  bad_ref.remove_from_project
end

# Add the correct reference using group-relative path
# The 'CruxLog' group path is 'CruxLog', project root is 'ios'
# So if we just use the main group of the project instead
file_ref = project.main_group.new_reference('CruxLogWidget/CruxLogWidgetLiveActivity.swift')
main_target.source_build_phase.add_file_reference(file_ref)
project.save
puts "Fixed path!"
