import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Compass, Search, MapPin, UserRound, Quote, Check, Layers3, MessagesSquare, Bookmark } from 'lucide-react';
import { catalog, getQuest, getTopic } from '../../domain/catalog';
import { useRecordVisit } from '../profile';
import { BackLink, Badge, BakeryIllustration, Card, DemoNotice, EmptyState, Page, Placeholder, SectionHeading } from '../components';
import { MissingContent } from './Learning';

function QuestNavigation({ current }: { current: 'all' | 'parallel' | 'expressions' | 'capture' }) {
  return <nav className="tabs" aria-label="副本分类">{[
    { id: 'all', to: '/quests', text: '全部副本' },
    { id: 'parallel', to: '/quests?type=parallel', text: '平行德国人生' },
    { id: 'expressions', to: '/quests/expressions', text: '一句话的100种可能' },
    { id: 'capture', to: '/quests/capture', text: '真实世界德语采集' },
  ].map(tab => <Link className={current === tab.id ? 'active' : ''} key={tab.id} to={tab.to} aria-current={current === tab.id ? 'page' : undefined}>{tab.text}</Link>)}</nav>;
}
export function QuestsPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('all');
  const parallel = params.get('type') === 'parallel';
  const quests = catalog.quests.filter(quest => (level === 'all' || quest.level === level) &&
    `${quest.title} ${quest.germanTitle} ${quest.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <Page eyebrow="DEUTSCH ERLEBEN" title="趣味副本" description="在小小的生活场景中，让学过的德语有机会被用起来。">
    <QuestNavigation current={parallel ? 'parallel' : 'all'} /><DemoNotice>当前只有一个原创 A1 副本。这里只提供场景预览，剧情与语言训练将在后续接入。</DemoNotice>
    <div className="filter-bar"><label className="search-field"><Search size={18} /><input aria-label="搜索副本" placeholder="搜索场景、主题或德语关键词…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="清除搜索" onClick={() => setQuery('')}>×</button>}</label><select aria-label="筛选副本等级" value={level} onChange={event => setLevel(event.target.value)}><option value="all">全部等级</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option></select><span className="result-count">{quests.length} 个演示副本</span></div>
    {quests.length ? <div className="quest-library-grid">{quests.map(quest => <Link className="card quest-library-card" key={quest.id} to={`/quests/${quest.id}?entry=library`}><div className="quest-preview-art"><Badge /><BakeryIllustration /></div><div className="quest-library-copy"><span className="mini-label">{quest.level} · 平行德国人生</span><h2>{quest.title}</h2><p className="german-subtitle">{quest.germanTitle}</p><p>{quest.description}</p><div className="quest-library-bottom"><span><MapPin size={14} />{quest.location}</span><span>场景预览<ArrowUpRight size={16} /></span></div></div></Link>)}<div className="future-quest"><span className="future-compass"><Compass size={36} strokeWidth={1} /></span><h3>新的场景，随学习到来</h3><p>地点、人物和任务会随着真实课程逐渐增加。</p><span>每一个副本，都可以再次回来</span></div></div> : <Card><EmptyState title="没有符合条件的副本" description="试试其他关键词，或清除筛选后浏览现有演示场景。" action={<button className="button secondary" onClick={() => { setQuery(''); setLevel('all'); setParams({}); }}>清除筛选</button>} /></Card>}
  </Page>;
}
export function QuestPage() {
  const { questId = '' } = useParams();
  const quest = getQuest(questId);
  const [params] = useSearchParams();
  const fromTopic = params.get('entry') === 'topic';
  const topic = fromTopic ? getTopic(params.get('topic') ?? '') : undefined;
  const [mode, setMode] = useState<'directed' | 'explore'>('directed');
  const [annotations, setAnnotations] = useState(true);
  useRecordVisit('quest', quest?.id);
  if (!quest) return <MissingContent label="趣味副本" to="/quests" />;
  return <Page eyebrow="PARALLELES LEBEN · A1 DEMO" title={quest.title} description={quest.germanTitle} action={<Badge />}>
    <BackLink to={topic ? `/topics/${topic.id}` : '/quests'}>{topic ? `返回专题 · ${topic.title}` : '返回副本中心'}</BackLink><DemoNotice>场景为原创演示。当前是界面预览，不会开启剧情、评价自由口语或产生学习成绩。</DemoNotice>
    <div className="detail-grid" data-quest-id={quest.id} data-quest-revision={quest.revision}><div><Card className="scene-card"><div className="scene-art"><BakeryIllustration /><span className="scene-label">{quest.sceneLabel}</span></div><div className="scene-copy"><div className="scene-meta"><span><MapPin size={15} />{quest.location}</span><span><UserRound size={15} />{quest.npc}</span></div><p>{quest.description}</p><blockquote><Quote size={21} /><span>{quest.npcLine}</span><cite>NPC 台词示例 · 未接入配音</cite></blockquote><p className="help-text">可以先尝试开口说德语。应用目前不会听取或评价你的自由回答。</p></div></Card>
      <Card className="detail-card"><SectionHeading title="关联拓展专题" />{quest.topicIds.map(id => { const linked = getTopic(id); return linked && <Link className="association-link" to={`/topics/${id}`} key={id}><Layers3 size={18} /><div><strong>{linked.title}</strong><span>{linked.germanTitle}</span></div><ArrowUpRight size={16} /></Link>; })}</Card></div>
      <div><Card className="detail-card quest-options"><SectionHeading title="探索设置" subtitle={fromTopic ? '从拓展课进入 · 默认定向训练' : '从独立副本中心进入'} /><span className="field-label">玩法预览</span><div className="segmented-control" aria-label="副本玩法">{([{ value: 'directed', label: '定向训练' }, { value: 'explore', label: '自由探索' }] as const).map(item => <button aria-pressed={mode === item.value} key={item.value} className={mode === item.value ? 'selected' : ''} onClick={() => setMode(item.value)}>{item.label}</button>)}</div><p className="help-text">{mode === 'directed' ? '围绕明确的语言目标，体验生活情境。' : '在有限的预设事件中自由选择探索方向。'}</p><label className="toggle-row"><span><strong>显示教学备注</strong><small>目标、提示与知识标签</small></span><input type="checkbox" role="switch" checked={annotations} onChange={event => setAnnotations(event.target.checked)} /><span className="toggle-track" /></label>{annotations && <div className="quest-goals"><span className="mini-label">演示训练目标</span><ul className="objective-list">{quest.goals.map(goal => <li key={goal}><span><Check size={13} /></span>{goal}</li>)}</ul></div>}<div className="story-status"><Badge tone="muted">剧情未开启</Badge><p>正式探索与练习重玩将在剧情系统接入后分别提供。当前预览不改写世界事实。</p></div><button className="button primary full-width" disabled>开始训练 · 后续阶段</button></Card><Placeholder compact title="剧情与评分尚未接入" description="未来的剧情意图只推动分支，不代表口语评分。" /></div></div>
  </Page>;
}
export function CollectionPage({ kind }: { kind: 'expressions' | 'capture' }) {
  const expressions = kind === 'expressions';
  return <Page eyebrow={expressions ? 'EIN GEDANKE, VIELE WEGE' : 'DEUTSCH IN DER WELT'} title={expressions ? '一句话的100种可能' : '真实世界德语采集'} description={expressions ? '一个交际意图，在不同等级、语境与语气中，拥有不同的表达。' : '保存生活中遇见的真实德语，让语言学习有自己的出处。'}>
    <QuestNavigation current={kind} /><Card className="collection-intro"><span className="icon-tile sand">{expressions ? <MessagesSquare size={30} strokeWidth={1.4} /> : <Bookmark size={30} strokeWidth={1.4} />}</span><div><h2>{expressions ? '从正确表达，走向恰当表达' : '把真实语言留在学习档案里'}</h2><p>{expressions ? '这里将按意图保存等级、语境、语气与语体各异的表达版本，与基础语法造句训练分别组织。' : '这里将手动保存真实文本、主题、推荐等级与出处。后续再逐步扩展阅读、听力与写作任务。'}</p><Badge tone="muted">页面框架 · 未实现内容保存</Badge></div></Card>
    <Placeholder title={expressions ? '表达集合将在后续阶段开放' : '文本采集将在后续阶段开放'} description={expressions ? '当前没有伪造的表达收藏或练习成绩。' : '未来只保存合法提供的材料，并保留出处；当前没有自动采集或同步。'} />
    <Link className="text-link" to="/quests">返回副本中心<ArrowRight size={16} /></Link>
  </Page>;
}
