export interface GradeDefinition {
  label: string;       // "V0", "V1", …
  difficulty: number;  // 0–13
  color: string;       // Tailwind-compatible hex for the pill bg
  textColor: string;
}

export const GRADES: GradeDefinition[] = [
  { label: 'V0',  difficulty: 0,  color: '#6EE7B7', textColor: '#064E3B' },
  { label: 'V1',  difficulty: 1,  color: '#34D399', textColor: '#064E3B' },
  { label: 'V2',  difficulty: 2,  color: '#10B981', textColor: '#FFFFFF' },
  { label: 'V3',  difficulty: 3,  color: '#059669', textColor: '#FFFFFF' },
  { label: 'V4',  difficulty: 4,  color: '#FCD34D', textColor: '#78350F' },
  { label: 'V5',  difficulty: 5,  color: '#FBBF24', textColor: '#78350F' },
  { label: 'V6',  difficulty: 6,  color: '#F59E0B', textColor: '#FFFFFF' },
  { label: 'V7',  difficulty: 7,  color: '#D97706', textColor: '#FFFFFF' },
  { label: 'V8',  difficulty: 8,  color: '#F97316', textColor: '#FFFFFF' },
  { label: 'V9',  difficulty: 9,  color: '#EF4444', textColor: '#FFFFFF' },
  { label: 'V10', difficulty: 10, color: '#DC2626', textColor: '#FFFFFF' },
  { label: 'V11', difficulty: 11, color: '#B91C1C', textColor: '#FFFFFF' },
  { label: 'V12', difficulty: 12, color: '#7C3AED', textColor: '#FFFFFF' },
  { label: 'V13', difficulty: 13, color: '#4C1D95', textColor: '#FFFFFF' },
];

export const GRADE_BY_LABEL: Record<string, GradeDefinition> = Object.fromEntries(
  GRADES.map((g) => [g.label, g])
);

export const DEFAULT_GRADE = GRADES[0];

export const OUTCOME_COLORS = {
  flash:   { bg: '#6EE756', text: '#141416', label: 'Flash' },
  send:    { bg: '#8E7CFF', text: '#FFFFFF', label: 'Top'   },
  attempt: { bg: '#E8DEB5', text: '#1E1E24', label: 'Attempt' },
  fail:    { bg: '#55555D', text: '#FFFFFF', label: 'Fail' },
} as const;
