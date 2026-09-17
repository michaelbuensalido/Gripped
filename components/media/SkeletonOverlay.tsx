import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';

export interface Keypoint {
  name: string;
  x: number;
  y: number;
  score: number;
}

export function normalizeAspectFillKeypoints(
  rawPoints: Keypoint[],
  cameraFrameWidth: number,
  cameraFrameHeight: number,
  previewWidth: number,
  previewHeight: number
): Keypoint[] {
  const scale = Math.max(previewWidth / cameraFrameWidth, previewHeight / cameraFrameHeight);
  const scaledWidth = cameraFrameWidth * scale;
  const scaledHeight = cameraFrameHeight * scale;
  const offsetX = (scaledWidth - previewWidth) / 2;
  const offsetY = (scaledHeight - previewHeight) / 2;

  return rawPoints.map(kp => {
    const screenPixelX = kp.x * cameraFrameWidth * scale - offsetX;
    const screenPixelY = kp.y * cameraFrameHeight * scale - offsetY;
    const x = Math.min(Math.max(screenPixelX / previewWidth, 0), 1);
    const y = Math.min(Math.max(screenPixelY / previewHeight, 0), 1);
    return { ...kp, x, y };
  });
}

const SKELETON_CONNECTIONS: [string, string][] = [
  // Torso Box
  ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftHip'],
  ['rightShoulder', 'rightHip'],
  ['leftHip', 'rightHip'],
  // Arms
  ['leftShoulder', 'leftElbow'],
  ['leftElbow', 'leftWrist'],
  ['rightShoulder', 'rightElbow'],
  ['rightElbow', 'rightWrist'],
  // Legs
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle']
];

const CONTACT_POINTS = new Set(['leftWrist', 'rightWrist', 'leftAnkle', 'rightAnkle']);
const MIN_CONFIDENCE = 0.40;

interface Props {
  keypoints: Keypoint[];
  containerWidth: number;
  containerHeight: number;
}

export const SkeletonOverlay: React.FC<Props> = ({ keypoints, containerWidth, containerHeight }) => {
  const { validPoints, bones } = useMemo(() => {
    if (!keypoints || keypoints.length === 0) {
      return { validPoints: [], bones: [] };
    }

    const filtered = keypoints.filter(kp => kp.score >= MIN_CONFIDENCE);
    const pointsMap = new Map(filtered.map(kp => [kp.name, kp]));

    const hasShoulder = pointsMap.has('leftShoulder') || pointsMap.has('rightShoulder');
    const hasHip = pointsMap.has('leftHip') || pointsMap.has('rightHip');

    if (!hasShoulder || !hasHip) {
      return { validPoints: [], bones: [] };
    }

    const bonesToDraw: { start: Keypoint; end: Keypoint }[] = [];
    SKELETON_CONNECTIONS.forEach(([startName, endName]) => {
      const start = pointsMap.get(startName);
      const end = pointsMap.get(endName);
      if (start && end) {
        bonesToDraw.push({ start, end });
      }
    });

    return { validPoints: filtered, bones: bonesToDraw };
  }, [keypoints]);

  if (validPoints.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={containerWidth} height={containerHeight}>
        {bones.map((bone, idx) => (
          <Line
            key={`bone-${idx}`}
            x1={bone.start.x * containerWidth}
            y1={bone.start.y * containerHeight}
            x2={bone.end.x * containerWidth}
            y2={bone.end.y * containerHeight}
            stroke="#8E7CFF"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeOpacity={0.9}
          />
        ))}
        {validPoints.map((kp, idx) => {
          const isContact = CONTACT_POINTS.has(kp.name);
          return (
            <Circle
              key={`joint-${idx}`}
              cx={kp.x * containerWidth}
              cy={kp.y * containerHeight}
              r={isContact ? 6 : 4}
              fill={isContact ? '#6EE756' : '#FFFFFF'}
              stroke={isContact ? '#131316' : '#8E7CFF'}
              strokeWidth={1.5}
            />
          );
        })}
      </Svg>
    </View>
  );
};
