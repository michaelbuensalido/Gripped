const fs = require('fs');
let content = fs.readFileSync('components/session/ChalkSafeLogger.tsx', 'utf8');

const toastImports = `import Reanimated, { FadeInDown, FadeOutDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSessionActions } from '../../hooks/useSessionActions';`;

content = content.replace("import Reanimated from 'react-native-reanimated';", toastImports);

const newHandleLog = `
  const { undoLastClimb } = useSessionActions();
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLog = (outcome: Outcome) => {
    triggerHaptic(outcome === 'flash' ? 'heavy' : outcome === 'send' ? 'medium' : 'light');

    logGenericAscent({
      gradeRaw: isProjectMode && activeProject ? activeProject.gradeRaw : selectedGrade,
      wallAngle: isProjectMode && activeProject ? activeProject.wallAngle : selectedAngle,
      holdType: isProjectMode && activeProject ? activeProject.holdType : selectedHold,
      outcome,
      projectId: isProjectMode && activeProject ? activeProject.id : null,
    });
    
    setShowToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 4000);
  };

  const handleUndo = () => {
    triggerHaptic('medium');
    undoLastClimb();
    setShowToast(false);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  };
`;

content = content.replace(/const handleLog = \(outcome: Outcome\) => \{[\s\S]*?\}\);[\s\n]*\};/, newHandleLog.trim());

const toastJSX = `
      <FailureReasonPrompt
        visible={Boolean(pendingAttemptId)}
        onSelect={handleSelectFailureReason}
        onDismiss={() => {
          if (pendingAttemptId) setAttemptFailureReason(pendingAttemptId, null);
        }}
      />

      {showToast && (
        <Reanimated.View 
          entering={SlideInDown.springify().damping(15)} 
          exiting={SlideOutDown.duration(200)}
          style={{ position: 'absolute', bottom: -60, left: 0, right: 0, alignItems: 'center', zIndex: 999 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272F', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginRight: 16 }}>Climb logged.</Text>
            <TouchableOpacity onPress={handleUndo} style={{ backgroundColor: '#19191D', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#3E3E48' }}>
              <Text style={{ color: '#8E7CFF', fontSize: 12, fontWeight: '700' }}>UNDO</Text>
            </TouchableOpacity>
          </View>
        </Reanimated.View>
      )}
`;

content = content.replace(/<FailureReasonPrompt[\s\S]*?\/>/, toastJSX.trim());

// Add useRef to imports
if (!content.includes('useRef')) {
  content = content.replace("import React, { useState } from 'react';", "import React, { useState, useRef } from 'react';");
}

fs.writeFileSync('components/session/ChalkSafeLogger.tsx', content);
