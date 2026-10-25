import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, ChevronRight, Compass, Layers3, ListTree, Search, Target } from 'lucide-react';
import { a1Scaffold, getFrameworkBoard, getFrameworkUnit, getAbilityNodeForUnit, searchFramework, type FrameworkUnit } from '../../domain/framework';
import { applicationFor, coverageFor } from '../../domain/progress';
import { useProfile, useRecordVisit } from '../profile';
import { BackLink, Badge, Card, EmptyState, Page, Placeholder, SectionHeading } from '../components';
import { MissingContent } from './Learning';

export function FrameworkNotice() {
  return <div className="framework-notice"><Badge tone="green">A1 目录骨架</Badge><p>来源：{a1Scaffold.framework.source.title}。详细讲义与训练待填充，导入和浏览不会改变学习或运用状态。</p></div>;
}
function FrameworkSearch({ value, onChange, label = '搜索 A1 拓展目录' }: { value: string; onChange(value: string): void; label?: string }) {
  return <label className="search-field framework-search"><Search size={18} /><input aria-label={label} value={value} onChange={event => onChange(event.target.value)} placeholder="搜索板块、单元标题或细分学习内容…" />{value && <button onClick={() => onChange('')} aria-label="清除目录搜索">×</button>}</label>;
}
export function StateBadges({ unit }: { unit: FrameworkUnit }) {
  const { snapshot } = useProfile();
  const coverage = coverageFor(unit, snapshot.frameworkProgress);
  const node = getAbilityNodeForUnit(unit.id)!;
  const application = applicationFor(node.id, snapshot.frameworkProgress);
  return <div className="state-badges"><Badge tone={coverage.status === 'not_started' ? 'muted' : 'green'}>学习：{coverage.label}</Badge><Badge tone="muted">运用：{application.label}</Badge></div>;
}
export function FrameworkDirectoryPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const results = searchFramework(query);
  return <Page eyebrow="A1 · SELBSTLERNRAHMEN" title="拓展学习" description="以自学专题连接当前所学，自由浏览，不是一套必须依次学完的课程表。" action={<Link className="text-link" to="/topics/demo">查看界面演示<ArrowUpRight size={15} /></Link>}>
    <FrameworkNotice />
    <div className="framework-overview"><div><span className="mini-label">{a1Scaffold.framework.source.title}</span><h2>{a1Scaffold.boards.length} 大板块，逐步填充的学习骨架</h2><p>主线顺序仍跟随 Studio21；专题允许由多个主线单元部分覆盖。</p></div><div className="framework-counts"><span><strong>{a1Scaffold.boards.length}</strong>板块</span><span><strong>{a1Scaffold.units.length}</strong>单元</span><span><strong>{a1Scaffold.outlineItems.length}</strong>细分内容</span><span><strong>{a1Scaffold.framework.counts.board_completion_criteria_count}</strong>完成目标</span></div></div>
    <div className="filter-bar"><FrameworkSearch value={query} onChange={value => setParams(value ? { q: value } : {}, { replace: true })} /><span className="result-count">{query.trim() ? `${results.length} 个相关单元` : '保留源文件层级与顺序'}</span></div>
    {query.trim() ? <>{results.length ? <div className="framework-search-results">{results.map(({ board, unit, matchedItems }) => <Link className="card framework-result" key={unit.id} to={`/topics/${unit.id}`} data-unit-id={unit.id}><div className="framework-result-header"><span className="mini-label">板块 {String(board.number).padStart(2, '0')} · {board.title}</span><ArrowUpRight size={16} /></div><h2>{unit.title}</h2><p>{(matchedItems[0] ?? unit.outline[0])?.text}</p><StateBadges unit={unit} /></Link>)}</div> : <Card><EmptyState title="没有找到相关单元" description="试试原有板块标题、单元名称，或细分内容中的关键词。" action={<button className="button secondary" onClick={() => setParams({})}>清除搜索</button>} /></Card>}</> : <div className="framework-board-grid">{a1Scaffold.boards.map(board => <Link className="card framework-board-card" key={board.id} to={`/topics/boards/${board.id}`} data-board-id={board.id}><div className="framework-board-top"><span className="board-number">{String(board.number).padStart(2, '0')}</span><Badge tone="muted">{board.units.length} 单元</Badge></div><h2>{board.title}</h2><p>{board.description}</p><div className="board-topic-preview">{board.units.slice(0, 2).map(unit => <span key={unit.id}>{unit.title}</span>)}<span>…</span></div><div className="course-card-bottom"><span>纲要已导入 · 教学待填充</span><span>查看板块<ArrowRight size={16} /></span></div></Link>)}</div>}
    <div className="quiet-note"><span>两类状态</span><p>学习覆盖以细分内容为基础；运用能力需要独立练习、自评或评估证据。目录导入不会点亮能力。</p></div>
  </Page>;
}
export function FrameworkBoardPage() {
  const { boardId = '' } = useParams();
  const board = getFrameworkBoard(boardId);
  if (!board) return <MissingContent label="A1 板块" to="/topics" />;
  return <Page eyebrow={`A1 · 板块 ${String(board.number).padStart(2, '0')}`} title={board.title} description={board.description} action={<Badge tone="muted">目录骨架</Badge>}>
    <BackLink to="/topics">返回 A1 拓展目录</BackLink><FrameworkNotice />
    <div className="board-context-grid"><Card className="detail-card"><SectionHeading title="板块定位与等级衔接" /><div className="bridge-copy"><span className="field-label">本板块定位</span><p>{board.description}</p><span className="field-label">A1 阶段</span><p>{board.a1_bridge}</p><span className="field-label">A1 → A2 衔接</span><p>{board.a2_bridge}</p></div></Card><Card className="detail-card"><SectionHeading title="完成标准" subtitle="目标说明，不表示已经达成" /><ol className="completion-goals">{board.completion_criteria.map((goal, index) => <li key={goal} data-goal-id={a1Scaffold.ability.tree.children.find(branch => branch.source_catalog_id === board.id)!.completion_criteria[index].id}><span>{String(index + 1).padStart(2, '0')}</span><p>{goal}</p></li>)}</ol><Link className="text-link" to={`/statistics?tab=skills&board=${board.id}`}>在能力树中查看<ListTree size={16} /></Link></Card></div>
    <SectionHeading title="单元目录" subtitle={`${board.units.length} 个单元 · 按源文件顺序显示，可自由浏览`} /><Card className="framework-unit-list">{board.units.map(unit => <Link to={`/topics/${unit.id}`} key={unit.id} data-unit-id={unit.id}><span className="chapter-index">{String(unit.number).padStart(2, '0')}</span><div className="framework-unit-title"><strong>{unit.title}</strong><span>{unit.outline.length} 条细分内容 · 详细教学待填充</span></div><StateBadges unit={unit} /><ChevronRight size={17} /></Link>)}</Card>
  </Page>;
}
export function FrameworkUnitPage() {
  const { topicId = '' } = useParams();
  const unit = getFrameworkUnit(topicId);
  useRecordVisit('topic', unit?.id);
  const { snapshot } = useProfile();
  if (!unit) return <MissingContent label="A1 单元" to="/topics" />;
  const board = a1Scaffold.boardByUnitId.get(unit.id)!;
  const node = getAbilityNodeForUnit(unit.id)!;
  const coverage = coverageFor(unit, snapshot.frameworkProgress);
  const application = applicationFor(node.id, snapshot.frameworkProgress);
  return <Page eyebrow={`A1 · ${board.title}`} title={unit.title} description="自学拓展单元 · 保留原始细分纲要，详细内容逐步增加。" action={<Badge tone="muted">纲要 · 待填充</Badge>}>
    <BackLink to={`/topics/boards/${board.id}`}>返回板块 · {board.title}</BackLink><FrameworkNotice />
    <div className="detail-grid" data-framework-unit-id={unit.id}><div><Card className="detail-card"><SectionHeading title="细分学习内容" subtitle={`${unit.outline.length} 条 · 原文保留，当前只读`} /><ol className="outline-list">{unit.outline.map((item, index) => <li key={item.id} data-outline-id={item.id}><span className="outline-number">{String(index + 1).padStart(2, '0')}</span><div><p>{item.text}</p><span className="outline-state">{coverage.coveredIds.has(item.id) ? '已有覆盖记录' : '未开始'}</span></div></li>)}</ol><p className="source-note">框架来源：{a1Scaffold.framework.source.title} · 源数据标注第 {unit.source_page_start} 页</p></Card><Placeholder compact title="详细讲解与基础训练待填充" description="本阶段只提供框架纲要，没有词汇表、讲义、题库或强制的每日练习流程。" /></div>
      <div><Card className="detail-card framework-status-card"><SectionHeading title="学习与运用" /><div className="axis-status"><span>学习覆盖</span><Badge tone="muted">{coverage.label}</Badge></div><p className="help-text">{coverage.coveredIds.size} / {coverage.total} 条细分内容已有覆盖记录</p><div className="progress-track"><span style={{ width: `${coverage.total ? coverage.coveredIds.size / coverage.total * 100 : 0}%` }} /></div><div className="axis-status"><span>运用能力</span><Badge tone="muted">{application.label}</Badge></div><p className="help-text">{application.record ? `来源：${application.record.source === 'self' ? '用户自评' : application.record.source === 'assessment' ? '独立评估记录' : '练习记录'}。${application.record.note ?? ''}` : '尚无练习、自评或评估证据。浏览不代表掌握。'}</p><Link className="text-link" to={`/statistics?tab=skills&board=${board.id}`}>查看对应能力节点<ListTree size={15} /></Link></Card>
        <Card className="detail-card"><span className="card-label"><BookOpen size={17} />关联主线</span><EmptyState title="尚未关联主线" description="未来可只关联本单元的一部分细分内容，也可关联多个 Studio21 单元。" /></Card>
        <Card className="detail-card"><span className="card-label"><Compass size={17} />关联副本</span><EmptyState title="尚未开放" description="没有为此框架单元预先制作或猜测副本关联。" /></Card>
      </div></div>
  </Page>;
}
export function A1AbilityTreePanel() {
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const branches = a1Scaffold.ability.tree.children;
  const [expanded, setExpanded] = useState(new Set(branches.map(branch => branch.id)));
  const matches = query.trim() ? new Set(searchFramework(query).map(result => result.unit.id)) : null;
  useEffect(() => {
    const boardId = params.get('board');
    if (boardId && getFrameworkBoard(boardId)) document.getElementById(`ability-${boardId}`)?.scrollIntoView({ block: 'start' });
  }, [params]);
  const visibleBranches = branches.filter(branch => !matches || branch.children.some(node => matches.has(node.source_catalog_id)));
  function toggle(id: string) { setExpanded(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  return <div className="ability-tree-panel"><FrameworkNotice /><Card className="ability-root"><span className="icon-tile sage"><ListTree size={26} strokeWidth={1.4} /></span><div><span className="mini-label">能力主题主干</span><h2>{a1Scaffold.ability.tree.title}</h2><p>{a1Scaffold.ability.tree.description}</p></div><div className="ability-root-count"><strong>{branches.length} 分支 · {a1Scaffold.abilityNodes.length} 主题</strong><span>未增加能力叶片或评估成绩</span></div></Card>
    <div className="tree-toolbar"><FrameworkSearch value={query} onChange={setQuery} label="搜索 A1 能力主题" /><button className="button secondary" onClick={() => setExpanded(new Set(branches.map(branch => branch.id)))}>全部展开</button><button className="button secondary" onClick={() => setExpanded(new Set())}>全部收起</button></div>
    <div className="ability-legend"><span><Layers3 size={15} />学习覆盖：未开始 / 部分覆盖 / 已学习</span><span><Target size={15} />运用能力：未评估 / 练习中 / 自评掌握 / 有评估证据</span></div>
    {visibleBranches.length ? <div className="ability-branches">{visibleBranches.map(branch => {
      const board = getFrameworkBoard(branch.source_catalog_id)!;
      const nodes = branch.children.filter(node => !matches || matches.has(node.source_catalog_id));
      const open = expanded.has(branch.id);
      return <Card className="ability-branch" key={branch.id}><div id={`ability-${board.id}`} className="ability-branch-heading"><button className="branch-toggle" aria-expanded={open} aria-controls={`children-${branch.id}`} onClick={() => toggle(branch.id)}><ChevronRight size={18} className={open ? 'expanded' : ''} /><span className="branch-number">{String(board.number).padStart(2, '0')}</span><h3>{board.title}</h3><span className="result-count">{nodes.length} 个主题</span></button><Link className="text-link" to={`/topics/boards/${board.id}`}>板块说明<ArrowUpRight size={14} /></Link></div>{open && <div className="ability-topic-grid" id={`children-${branch.id}`}>{nodes.map(node => {
        const unit = getFrameworkUnit(node.source_catalog_id)!;
        return <Link className="ability-topic" key={node.id} to={`/topics/${unit.id}`} data-ability-node-id={node.id} data-source-unit-id={unit.id}><div className="ability-topic-title"><span className="small-dot" /><strong>{unit.title}</strong><ArrowUpRight size={14} /></div><StateBadges unit={unit} /></Link>;
      })}</div>}</Card>;
    })}</div> : <Card><EmptyState title="没有找到相关能力主题" description="可搜索单元标题或纲要内容。" action={<button className="button secondary" onClick={() => setQuery('')}>清除搜索</button>} /></Card>}
    <div className="quiet-note"><span>能力需要证据</span><p>课程学过、选择题正确或剧情点击，都不能自动证明能独立运用语言。本阶段只读，不提供自动或手动点亮能力的操作。</p></div>
  </div>;
}
