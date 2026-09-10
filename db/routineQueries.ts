import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { getDatabase } from './schema';
import type { Routine, RoutineBlock, PlannedBoulder, RoutineWithBlocks, RoutineCategory } from '../types';
import { GRADE_BY_LABEL } from '../constants/grades';

// ─── Query & Fetch Functions ──────────────────────────────────────────────────

export function getAllRoutinesWithBlocks(): RoutineWithBlocks[] {
  const db = getDatabase();
  const routineRows = db.getAllSync<{
    id: string;
    title: string;
    description: string;
    category: string;
    is_custom: number;
    estimated_minutes: number;
    created_at: number;
    updated_at: number;
  }>(`SELECT * FROM routines ORDER BY is_custom ASC, created_at DESC`);

  return routineRows.map((r) => getRoutineWithBlocksById(r.id)!);
}

export function getRoutineById(id: string): RoutineWithBlocks | null {
  return getRoutineWithBlocksById(id);
}

function getRoutineWithBlocksById(routineId: string): RoutineWithBlocks | null {
  const db = getDatabase();
  const rRow = db.getFirstSync<{
    id: string;
    title: string;
    description: string;
    category: string;
    is_custom: number;
    estimated_minutes: number;
    created_at: number;
    updated_at: number;
  }>(`SELECT * FROM routines WHERE id = ?`, [routineId]);

  if (!rRow) return null;

  const blockRows = db.getAllSync<{
    id: string;
    routine_id: string;
    title: string;
    default_rest_seconds: number;
    sort_order: number;
  }>(`SELECT * FROM routine_blocks WHERE routine_id = ? ORDER BY sort_order ASC`, [routineId]);

  const blocks: RoutineBlock[] = blockRows.map((b) => {
    const boulderRows = db.getAllSync<{
      id: string;
      block_id: string;
      grade_raw: string;
      normalized_difficulty: number;
      target_attempts: number;
      style_tags: string;
      sort_order: number;
    }>(`SELECT * FROM routine_boulders WHERE block_id = ? ORDER BY sort_order ASC`, [b.id]);

    const boulders: PlannedBoulder[] = boulderRows.map((bo) => ({
      id: bo.id,
      blockId: bo.block_id,
      gradeRaw: bo.grade_raw,
      normalizedDifficulty: bo.normalized_difficulty,
      targetAttempts: bo.target_attempts,
      styleTags: safeParseJson(bo.style_tags, []),
      order: bo.sort_order,
    }));

    return {
      id: b.id,
      routineId: b.routine_id,
      title: b.title,
      defaultRestSeconds: b.default_rest_seconds,
      order: b.sort_order,
      boulders,
    };
  });

  return {
    id: rRow.id,
    title: rRow.title,
    description: rRow.description,
    category: rRow.category as RoutineCategory,
    isCustom: Boolean(rRow.is_custom),
    estimatedMinutes: rRow.estimated_minutes,
    createdAt: rRow.created_at,
    updatedAt: rRow.updated_at,
    blocks,
  };
}

function safeParseJson<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function insertRoutine(routine: RoutineWithBlocks): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO routines (id, title, description, category, is_custom, estimated_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      routine.id,
      routine.title,
      routine.description,
      routine.category,
      routine.isCustom ? 1 : 0,
      routine.estimatedMinutes,
      routine.createdAt,
      routine.updatedAt,
    ]
  );

  routine.blocks.forEach((block, bIdx) => {
    db.runSync(
      `INSERT INTO routine_blocks (id, routine_id, title, default_rest_seconds, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [block.id, routine.id, block.title, block.defaultRestSeconds, bIdx]
    );

    block.boulders.forEach((boulder, boIdx) => {
      db.runSync(
        `INSERT INTO routine_boulders (id, block_id, grade_raw, normalized_difficulty, target_attempts, style_tags, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          boulder.id,
          block.id,
          boulder.gradeRaw,
          boulder.normalizedDifficulty,
          boulder.targetAttempts,
          JSON.stringify(boulder.styleTags),
          boIdx,
        ]
      );
    });
  });
}

export function updateRoutine(routine: RoutineWithBlocks): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE routines
     SET title = ?, description = ?, category = ?, estimated_minutes = ?, updated_at = ?
     WHERE id = ?`,
    [
      routine.title,
      routine.description,
      routine.category,
      routine.estimatedMinutes,
      Date.now(),
      routine.id,
    ]
  );

  // Re-sync blocks and boulders: delete existing blocks and re-insert
  db.runSync(`DELETE FROM routine_blocks WHERE routine_id = ?`, [routine.id]);

  routine.blocks.forEach((block, bIdx) => {
    db.runSync(
      `INSERT INTO routine_blocks (id, routine_id, title, default_rest_seconds, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [block.id, routine.id, block.title, block.defaultRestSeconds, bIdx]
    );

    block.boulders.forEach((boulder, boIdx) => {
      db.runSync(
        `INSERT INTO routine_boulders (id, block_id, grade_raw, normalized_difficulty, target_attempts, style_tags, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          boulder.id,
          block.id,
          boulder.gradeRaw,
          boulder.normalizedDifficulty,
          boulder.targetAttempts,
          JSON.stringify(boulder.styleTags),
          boIdx,
        ]
      );
    });
  });
}

export function deleteRoutine(id: string): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM routines WHERE id = ?`, [id]);
}

export function duplicateRoutine(id: string): RoutineWithBlocks | null {
  const source = getRoutineById(id);
  if (!source) return null;

  const newRoutineId = uuid();
  const duplicate: RoutineWithBlocks = {
    ...source,
    id: newRoutineId,
    title: `${source.title} (Copy)`,
    isCustom: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocks: source.blocks.map((block, bIdx) => {
      const newBlockId = uuid();
      return {
        ...block,
        id: newBlockId,
        routineId: newRoutineId,
        order: bIdx,
        boulders: block.boulders.map((boulder, boIdx) => ({
          ...boulder,
          id: uuid(),
          blockId: newBlockId,
          order: boIdx,
        })),
      };
    }),
  };

  insertRoutine(duplicate);
  return duplicate;
}

// ─── Default Templates Seed ───────────────────────────────────────────────────

export function seedDefaultRoutinesIfEmpty(): void {
  const db = getDatabase();
  const countRow = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM routines WHERE is_custom = 0`
  );

  if ((countRow?.count ?? 0) > 0) {
    return;
  }

  // 1. Warmup to Limit Projecting
  const t1Id = uuid();
  const t1b1Id = uuid();
  const t1b2Id = uuid();
  const t1: RoutineWithBlocks = {
    id: t1Id,
    title: 'Warmup to Limit Projecting',
    description: 'Structured warmup ladder progressing into hard limit project burns with 3-minute rests.',
    category: 'Projecting',
    isCustom: false,
    estimatedMinutes: 75,
    createdAt: Date.now() - 3000,
    updatedAt: Date.now() - 3000,
    blocks: [
      {
        id: t1b1Id,
        routineId: t1Id,
        title: 'Warm-Up Ladder',
        defaultRestSeconds: 60,
        order: 0,
        boulders: [
          { id: uuid(), blockId: t1b1Id, gradeRaw: 'V0', normalizedDifficulty: 0, targetAttempts: 1, styleTags: ['Slab', 'Footwork'], order: 0 },
          { id: uuid(), blockId: t1b1Id, gradeRaw: 'V1', normalizedDifficulty: 1, targetAttempts: 1, styleTags: ['Vertical'], order: 1 },
          { id: uuid(), blockId: t1b1Id, gradeRaw: 'V2', normalizedDifficulty: 2, targetAttempts: 1, styleTags: ['Overhang'], order: 2 },
          { id: uuid(), blockId: t1b1Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 2, styleTags: ['Dynamic'], order: 3 },
        ],
      },
      {
        id: t1b2Id,
        routineId: t1Id,
        title: 'Limit Projects',
        defaultRestSeconds: 180,
        order: 1,
        boulders: [
          { id: uuid(), blockId: t1b2Id, gradeRaw: 'V5', normalizedDifficulty: 5, targetAttempts: 4, styleTags: ['Overhang', 'Crimpy'], order: 0 },
          { id: uuid(), blockId: t1b2Id, gradeRaw: 'V6', normalizedDifficulty: 6, targetAttempts: 4, styleTags: ['Roof', 'Power'], order: 1 },
          { id: uuid(), blockId: t1b2Id, gradeRaw: 'V7', normalizedDifficulty: 7, targetAttempts: 5, styleTags: ['Compression'], order: 2 },
          { id: uuid(), blockId: t1b2Id, gradeRaw: 'V7', normalizedDifficulty: 7, targetAttempts: 5, styleTags: ['Technical'], order: 3 },
        ],
      },
    ],
  };

  // 2. 4x4 Power Endurance
  const t2Id = uuid();
  const t2b1Id = uuid();
  const t2b2Id = uuid();
  const t2: RoutineWithBlocks = {
    id: t2Id,
    title: '4x4 Power Endurance',
    description: 'High-intensity power endurance circuit: continuous sub-max burns with strict 60s rest.',
    category: 'Power Endurance',
    isCustom: false,
    estimatedMinutes: 45,
    createdAt: Date.now() - 2000,
    updatedAt: Date.now() - 2000,
    blocks: [
      {
        id: t2b1Id,
        routineId: t2Id,
        title: 'Set 1: Continuous Burns',
        defaultRestSeconds: 60,
        order: 0,
        boulders: [
          { id: uuid(), blockId: t2b1Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 1, styleTags: ['Overhang'], order: 0 },
          { id: uuid(), blockId: t2b1Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 1, styleTags: ['Steep'], order: 1 },
          { id: uuid(), blockId: t2b1Id, gradeRaw: 'V4', normalizedDifficulty: 4, targetAttempts: 1, styleTags: ['Slopers'], order: 2 },
          { id: uuid(), blockId: t2b1Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 1, styleTags: ['Pumpy'], order: 3 },
        ],
      },
      {
        id: t2b2Id,
        routineId: t2Id,
        title: 'Set 2: Depletion Circuit',
        defaultRestSeconds: 60,
        order: 1,
        boulders: [
          { id: uuid(), blockId: t2b2Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 1, styleTags: ['Overhang'], order: 0 },
          { id: uuid(), blockId: t2b2Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 1, styleTags: ['Steep'], order: 1 },
          { id: uuid(), blockId: t2b2Id, gradeRaw: 'V4', normalizedDifficulty: 4, targetAttempts: 1, styleTags: ['Slopers'], order: 2 },
          { id: uuid(), blockId: t2b2Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 1, styleTags: ['Pumpy'], order: 3 },
        ],
      },
    ],
  };

  // 3. Volume & Technique
  const t3Id = uuid();
  const t3b1Id = uuid();
  const t3b2Id = uuid();
  const t3: RoutineWithBlocks = {
    id: t3Id,
    title: 'Volume & Technique',
    description: '10-15 moderate climbs emphasizing silent footwork, flow, and high volume with quality movement.',
    category: 'Volume',
    isCustom: false,
    estimatedMinutes: 60,
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000,
    blocks: [
      {
        id: t3b1Id,
        routineId: t3Id,
        title: 'Movement Drills',
        defaultRestSeconds: 45,
        order: 0,
        boulders: [
          { id: uuid(), blockId: t3b1Id, gradeRaw: 'V1', normalizedDifficulty: 1, targetAttempts: 1, styleTags: ['Silent Feet'], order: 0 },
          { id: uuid(), blockId: t3b1Id, gradeRaw: 'V2', normalizedDifficulty: 2, targetAttempts: 1, styleTags: ['Slow Motion'], order: 1 },
          { id: uuid(), blockId: t3b1Id, gradeRaw: 'V2', normalizedDifficulty: 2, targetAttempts: 1, styleTags: ['Flagging'], order: 2 },
          { id: uuid(), blockId: t3b1Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 2, styleTags: ['Heel Hooks'], order: 3 },
        ],
      },
      {
        id: t3b2Id,
        routineId: t3Id,
        title: 'Volume Circuit',
        defaultRestSeconds: 90,
        order: 1,
        boulders: [
          { id: uuid(), blockId: t3b2Id, gradeRaw: 'V2', normalizedDifficulty: 2, targetAttempts: 1, styleTags: ['Flow'], order: 0 },
          { id: uuid(), blockId: t3b2Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 1, styleTags: ['Clean Send'], order: 1 },
          { id: uuid(), blockId: t3b2Id, gradeRaw: 'V4', normalizedDifficulty: 4, targetAttempts: 2, styleTags: ['Precision'], order: 2 },
          { id: uuid(), blockId: t3b2Id, gradeRaw: 'V4', normalizedDifficulty: 4, targetAttempts: 2, styleTags: ['Technical'], order: 3 },
          { id: uuid(), blockId: t3b2Id, gradeRaw: 'V3', normalizedDifficulty: 3, targetAttempts: 1, styleTags: ['Endurance'], order: 4 },
          { id: uuid(), blockId: t3b2Id, gradeRaw: 'V2', normalizedDifficulty: 2, targetAttempts: 1, styleTags: ['Cool Down'], order: 5 },
        ],
      },
    ],
  };

  insertRoutine(t1);
  insertRoutine(t2);
  insertRoutine(t3);
}
