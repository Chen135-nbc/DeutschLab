import frameworkData from '../../content/frameworks/a1/a1_extension_framework.json';
import abilityData from '../../content/frameworks/a1/a1_ability_tree.json';

export type FrameworkCatalog = typeof frameworkData;
export type AbilityTree = typeof abilityData;
export type FrameworkBoard = FrameworkCatalog['boards'][number];
export type FrameworkUnit = FrameworkBoard['units'][number];
export type OutlineItem = FrameworkUnit['outline'][number];
export type AbilityBranch = AbilityTree['tree']['children'][number];
export type AbilityNode = AbilityBranch['children'][number];

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`A1 框架校验失败：${message}`);
}
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function validateScaffold(framework: unknown, ability: unknown): { framework: FrameworkCatalog; ability: AbilityTree } {
  ensure(isObject(framework) && isObject(ability), '需要目录与能力树两个 JSON 对象');
  const f = framework as FrameworkCatalog;
  const a = ability as AbilityTree;
  ensure(f.schema_version === '1.0.0' && a.schema_version === '1.0.0', '暂不支持该格式版本');
  ensure(isText(f.catalog_id) && isText(a.tree_id) && a.source_catalog_id === f.catalog_id, '能力树必须引用同一目录');
  ensure(['A1', 'A2', 'B1', 'B2'].includes(f.cefr_level), '无效的等级');
  ensure(isObject(f.source) && isText(f.source.title), '缺少内容来源');
  ensure(isObject(f.counts) && isObject(a.counts), '缺少数量清单');
  ensure(Array.isArray(f.boards) && f.boards.length > 0, '缺少板块');
  ensure(isObject(a.tree) && Array.isArray(a.tree.children) && isText(a.tree.id), '缺少能力树主干');
  const ids = new Set<string>();
  function identify(value: unknown, title: unknown) {
    ensure(isText(value) && isText(title), 'ID 与标题不能为空');
    ensure(!ids.has(value), `重复 ID：${value}`);
    ids.add(value);
  }
  const unitById = new Map<string, FrameworkUnit>();
  const boardById = new Map<string, FrameworkBoard>();
  let outlineCount = 0;
  let goalCount = 0;
  for (const board of f.boards) {
    ensure(isObject(board), '无效板块');
    identify(board.id, board.title);
    ensure(Number.isInteger(board.number) && Array.isArray(board.units), '板块编号或单元列表无效');
    ensure(isText(board.description) && isText(board.a1_bridge) && isText(board.a2_bridge), '缺少板块定位或衔接');
    ensure(Array.isArray(board.completion_criteria) && board.completion_criteria.every(isText), '完成标准无效');
    boardById.set(board.id, board);
    goalCount += board.completion_criteria.length;
    for (const unit of board.units) {
      ensure(isObject(unit), '无效单元');
      identify(unit.id, unit.title);
      ensure(Number.isInteger(unit.number) && Array.isArray(unit.outline), '单元编号或纲要无效');
      ensure(Array.isArray(unit.course_links) && Array.isArray(unit.quest_links), '关联字段必须为数组');
      unitById.set(unit.id, unit);
      for (const item of unit.outline) {
        ensure(isObject(item), '无效细分条目');
        identify(item.id, item.text);
        outlineCount++;
      }
    }
  }
  identify(a.tree.id, a.tree.title);
  ensure(a.tree.children.length === f.boards.length, '能力分支数量与板块不一致');
  let nodeCount = 0;
  for (const [index, branch] of a.tree.children.entries()) {
    ensure(isObject(branch), '无效能力分支');
    identify(branch.id, branch.title);
    const board = boardById.get(branch.source_catalog_id);
    ensure(board && board === f.boards[index] && board.title === branch.title, '分支引用、标题或顺序不一致');
    ensure(Array.isArray(branch.children) && branch.children.length === board.units.length, '主题节点数量不一致');
    ensure(Array.isArray(branch.completion_criteria) && branch.completion_criteria.length === board.completion_criteria.length, '完成目标数量不一致');
    for (const [goalIndex, goal] of branch.completion_criteria.entries()) {
      identify(goal.id, goal.description);
      ensure(goal.description === board.completion_criteria[goalIndex], '完成目标文字或顺序不一致');
    }
    for (const [unitIndex, node] of branch.children.entries()) {
      ensure(isObject(node), '无效主题节点');
      identify(node.id, node.title);
      const unit = unitById.get(node.source_catalog_id);
      ensure(unit && unit === board.units[unitIndex] && unit.title === node.title, '主题引用、标题或顺序不一致');
      ensure(Array.isArray(node.outline_refs) && JSON.stringify(node.outline_refs) === JSON.stringify(unit.outline.map(item => item.id)), '细分条目引用或顺序不一致');
      ensure(Array.isArray(node.skill_leaf_ids) && node.skill_leaf_ids.length === 0, '当前骨架不能新增能力叶片');
      nodeCount++;
    }
  }
  ensure(f.counts.board_count === f.boards.length && f.counts.unit_count === unitById.size && f.counts.outline_item_count === outlineCount && f.counts.board_completion_criteria_count === goalCount, '目录数量清单不一致');
  ensure(a.counts.branch_count === a.tree.children.length && a.counts.topic_node_count === nodeCount && a.counts.board_completion_criteria_count === goalCount, '能力树数量清单不一致');
  return { framework: f, ability: a };
}

export function createScaffold(framework: unknown, ability: unknown) {
  const validated = validateScaffold(framework, ability);
  const boards = validated.framework.boards;
  const units = boards.flatMap(board => board.units);
  const outlineItems = units.flatMap(unit => unit.outline);
  const abilityNodes = validated.ability.tree.children.flatMap(branch => branch.children);
  return {
    ...validated, boards, units, outlineItems, abilityNodes,
    boardById: new Map(boards.map(board => [board.id, board])),
    unitById: new Map(units.map(unit => [unit.id, unit])),
    outlineById: new Map(outlineItems.map(item => [item.id, item])),
    nodeById: new Map(abilityNodes.map(node => [node.id, node])),
    nodeByUnitId: new Map(abilityNodes.map(node => [node.source_catalog_id, node])),
    boardByUnitId: new Map(boards.flatMap(board => board.units.map(unit => [unit.id, board] as const))),
  };
}
export const a1Scaffold = createScaffold(frameworkData, abilityData);
export const getFrameworkBoard = (id: string) => a1Scaffold.boardById.get(id);
export const getFrameworkUnit = (id: string) => a1Scaffold.unitById.get(id);
export const getAbilityNodeForUnit = (id: string) => a1Scaffold.nodeByUnitId.get(id);

export function searchFramework(query: string) {
  const needle = query.trim().toLocaleLowerCase('de');
  if (!needle) return [];
  return a1Scaffold.boards.flatMap(board => {
    const boardMatches = [board.title, board.description, board.a1_bridge, board.a2_bridge, ...board.completion_criteria].some(text => text.toLocaleLowerCase('de').includes(needle));
    return board.units.flatMap(unit => {
      const matchedItems = unit.outline.filter(item => item.text.toLocaleLowerCase('de').includes(needle));
      return boardMatches || unit.title.toLocaleLowerCase('de').includes(needle) || matchedItems.length ? [{ board, unit, matchedItems }] : [];
    });
  });
}

// Stable canonical serialization: object-key order is irrelevant; source array order is preserved.
export function canonicalJSON(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  if (isObject(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
