import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Edit2, Plus, Share, Video } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useProjectBetas, useBetaMoves } from '../../db/hooks';
import * as B from '../../db/betaQueries';
import { SecondaryButton } from '../ui/SecondaryButton';

export function BetaSection({ projectId }: { projectId: string }) {
  const { colors, radius, space, type } = useTheme();
  const router = useRouter();
  
  const betas = useProjectBetas(projectId);
  const currentBeta = betas.find(b => b.isCurrent) || betas[0] || null;
  const moves = useBetaMoves(currentBeta?.id || null);
  
  const [isVisible, setIsVisible] = useState(false);
  
  if (betas.length === 0) {
    return (
      <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border, marginBottom: space.xl }}>
        <Text style={[type.label, { color: colors.textMuted, marginBottom: space.sm }]}>BETA</Text>
        <Text style={[type.body, { color: colors.textMuted, marginBottom: space.lg }]}>No beta added yet.</Text>
        <SecondaryButton 
          label="Add Beta" 
          onPress={() => router.push(`/project/beta-editor?projectId=${projectId}`)}
        />
      </View>
    );
  }

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.border, marginBottom: space.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: isVisible ? space.md : 0 }}>
        <Text style={[type.label, { color: colors.textMuted }]}>BETA</Text>
        <TouchableOpacity onPress={toggleVisibility} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={[type.caption, { color: colors.accent }]}>{isVisible ? 'Hide Beta' : 'Show Beta'}</Text>
          {isVisible ? <EyeOff size={16} color={colors.accent} /> : <Eye size={16} color={colors.accent} />}
        </TouchableOpacity>
      </View>
      
      {isVisible && (
        <View>
          {/* Version Switcher */}
          {betas.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.md }}>
              {betas.sort((a,b) => a.version - b.version).map(b => (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => B.setCurrentBeta(b.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor: b.isCurrent ? colors.accent : colors.cardMuted,
                    borderWidth: 1,
                    borderColor: b.isCurrent ? colors.accent : colors.border,
                    marginRight: space.sm
                  }}
                >
                  <Text style={[type.caption, { color: b.isCurrent ? colors.textOnAccent : colors.text, fontWeight: '600' }]}>
                    v{b.version} {b.label ? `- ${b.label}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Key Tip */}
          {currentBeta?.keyTip && (
            <View style={{ backgroundColor: colors.cardMuted, padding: space.md, borderRadius: radius.md, marginBottom: space.md }}>
              <Text style={[type.caption, { color: colors.accentText, fontWeight: '700', marginBottom: 2 }]}>KEY TIP</Text>
              <Text style={[type.body, { color: colors.text }]}>{currentBeta.keyTip}</Text>
            </View>
          )}

          {/* Move List */}
          {moves.length > 0 && (
            <View style={{ marginBottom: space.lg, gap: 8 }}>
              {moves.sort((a,b) => a.order - b.order).map((m, i) => {
                const isCrux = m.id === currentBeta?.cruxMoveId;
                return (
                  <View 
                    key={m.id} 
                    style={{ 
                      flexDirection: 'row', 
                      gap: 12, 
                      alignItems: 'center',
                      backgroundColor: isCrux ? 'rgba(255, 69, 58, 0.15)' : 'transparent',
                      padding: isCrux ? 8 : 0,
                      borderRadius: radius.md,
                      borderWidth: isCrux ? 1 : 0,
                      borderColor: isCrux ? 'rgba(255, 69, 58, 0.3)' : 'transparent'
                    }}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.cardMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>{i + 1}</Text>
                    </View>
                    {m.limb && (
                      <View style={{ backgroundColor: colors.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: colors.border }}>
                        <Text style={[type.caption, { color: colors.textMuted, fontSize: 10 }]}>{m.limb}</Text>
                      </View>
                    )}
                    <Text style={[type.body, { color: colors.text, flex: 1 }]}>{m.text}</Text>
                    {isCrux && (
                      <Text style={[type.caption, { color: '#FF453A', fontWeight: '700', fontSize: 10, letterSpacing: 0.5 }]}>CRUX</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <TouchableOpacity 
              onPress={() => router.push(`/project/beta-editor?projectId=${projectId}&betaId=${currentBeta?.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardMuted, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill }}
            >
              <Edit2 size={16} color={colors.text} />
              <Text style={[type.control, { color: colors.text }]}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push(`/project/beta-editor?projectId=${projectId}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.cardMuted, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill }}
            >
              <Plus size={16} color={colors.text} />
              <Text style={[type.control, { color: colors.text }]}>Add Version</Text>
            </TouchableOpacity>
            
            {/* The entry points for Add Video and Share will be handled here or inside the parent? */}
          </View>
        </View>
      )}
    </View>
  );
}
