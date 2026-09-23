require 'xcodeproj'
project_path = 'ios/CruxLog.xcodeproj'
project = Xcodeproj::Project.open(project_path)

main_target = project.targets.find { |t| t.name == 'CruxLog' }
file_ref = project.files.find { |f| f.path == 'CruxLogWidget/CruxLogWidgetLiveActivity.swift' } || project.files.find { |f| f.path.include?('CruxLogWidgetLiveActivity.swift') }

if file_ref.nil?
  puts "File ref not found!"
  # We can create it if it's not in the main group
  widget_group = project.main_group.find_subpath(File.join('CruxLogWidget'), true)
  widget_group.set_source_tree('<group>')
  file_ref = widget_group.new_reference('CruxLogWidgetLiveActivity.swift')
end

if !main_target.source_build_phase.files_references.include?(file_ref)
  main_target.source_build_phase.add_file_reference(file_ref)
  project.save
  puts "Added to CruxLog target."
else
  puts "Already in CruxLog target."
end
