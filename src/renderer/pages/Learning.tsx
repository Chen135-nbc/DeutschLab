import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, ChevronRight, Compass, Layers3, Check } from 'lucide-react';
import { catalog, getUnit, getTopic, getQuest } from '../../domain/catalog';
import { levels, type Level } from '../../shared/contracts';
import { useRecordVisit } from '../profile';
import { BackLink, Badge, Card, DemoNotice, EmptyState, Page, Placeholder, SectionHeading } from '../components';
import { studioA1Catalog, studioUnit, startPack } from '../../domain/studio21';

function LevelNavigation({ level, onChange }: { level: Level; onChange(level: Level): void }) {
  return <div className="level-navigation" aria-label="课程等级">{levels.map(item => <button key={item} aria-pressed={level === item} className={level === item ? 'selected' : ''} onClick={() => onChange(item)}><strong>{item}</strong><span>{item === 'A1' ? '基础启程' : item === 'A2' ? '日常沟通' : item === 'B1' ? '独立表达' : '深入交流'}</span>{item !== 'A1' && <span className="level-later">待扩展</span>}</button>)}</div>;
}
export function CoursesPage() {
  const [params, setParams] = useSearchParams();
  const level = levels.includes(params.get('level') as Level) ? params.get('level') as Level : 'A1';
  const units = catalog.units.filter(unit => unit.level === level);
  return <Page eyebrow="DER ROTE FADEN" title="主线学习" description="以 Studio21 为主线，循序渐进地建立词汇与语法基础。">
    <LevelNavigation level={level} onChange={value => setParams({ level: value })} />
    {level === 'A1' && <><SectionHeading title="Studio21 · A1 主线课程" subtitle="1 个引导单元、12 个正式单元、4 个 Station 复习节点" /><Link className="card studio-feature-course start-feature-course" data-studio-node-id={startPack.unit.id} to={`/courses/${startPack.unit.id}`}><div><span className="mini-label">EINSTIEG · 教材第 {startPack.unit.pages} 页</span><h2>Start auf Deutsch</h2><p>德语入门 · 四节中文教学引导、知识卡、原创练习与综合检测</p></div><span className="button primary">进入引导单元<ArrowRight size={16} /></span></Link><Link className="card studio-feature-course" data-studio-node-id={studioUnit.id} to={`/courses/${studioUnit.id}`}><div><span className="mini-label">{studioUnit.number} · 教材第 {studioUnit.pages} 页</span><h2>{studioUnit.title}</h2><p>{studioUnit.chineseTitle} · 四个教学小节、知识卡、原创练习及单元检测</p></div><span className="button primary">进入第一单元<ArrowRight size={16} /></span></Link><div className="studio-future-catalog"><SectionHeading title="后续课程节点" subtitle="仅保留结构；教材标题、页码及 Station 实际位置待原书目录核对" /><div>{studioA1Catalog.nodes.filter(node => node.status === 'placeholder').map(node => <Card key={node.id} className="studio-future-node" data-studio-node-id={node.id}><span className="mini-label">{node.kind === 'station' ? '阶段复习' : '正式单元'} · 待导入</span><strong>{node.label}</strong><span>内容尚未开放</span></Card>)}</div></div></>}
    <div className="section-heading"><div><h2>Studio21 · {level} 演示目录</h2><p>其余单元待取得教材材料后逐步建立；以下是保留的界面演示</p></div><Badge tone="muted">{units.length ? `${units.length} 个演示单元` : '暂无内容'}</Badge></div>
    {units.length ? <><DemoNotice /><div className="course-grid">{units.map(unit => <Link className="card course-card" to={`/courses/${unit.id}`} key={unit.id}><div className="course-card-top"><span className="course-number">{unit.number}</span><Badge /></div><span className="mini-label">{unit.level} · {unit.category}</span><h2>{unit.title}</h2><p className="german-subtitle">{unit.germanTitle}</p><p>{unit.description}</p><div className="tag-list">{unit.vocabulary.slice(0, 3).map(word => <span key={word}>{word}</span>)}</div><div className="course-card-bottom"><span>未开始学习</span><span>查看单元<ArrowRight size={16} /></span></div></Link>)}</div></> : <Card><EmptyState title={`${level} 内容将随学习逐步扩展`} description="当前阶段只提供少量 A1 演示数据，不预建未来等级课程。" action={<button className="button secondary" onClick={() => setParams({ level: 'A1' })}>返回 A1 演示目录</button>} /></Card>}
    <div className="quiet-note"><span>跟随真实课程</span><p>主线将提供核心词汇、基础语法与单元检测；完整练习和评分引擎将在后续阶段接入。</p></div>
  </Page>;
}
export function CoursePage() {
  const { unitId = '' } = useParams();
  const unit = getUnit(unitId);
  useRecordVisit('course', unit?.id);
  if (!unit) return <MissingContent label="课程单元" to="/courses" />;
  return <Page eyebrow="KURSEINHEIT · A1 DEMO" title={unit.title} description={unit.germanTitle} action={<Badge />}>
    <BackLink to="/courses">返回主线目录</BackLink><DemoNotice />
    <div className="detail-grid"><div><Card className="detail-card"><span className="card-label"><BookOpen size={17} />单元概览</span><p className="detail-lead">{unit.description}</p><h3>演示学习目标</h3><ul className="objective-list">{unit.objectives.map(goal => <li key={goal}><span><Check size={13} /></span>{goal}</li>)}</ul><SectionHeading title="核心词汇" /><div className="vocabulary-grid">{unit.vocabulary.map(word => <span key={word}>{word}</span>)}</div><SectionHeading title="基础语法" /><div className="simple-list">{unit.grammar.map(item => <p key={item}><span className="small-dot" />{item}</p>)}</div></Card>
      <Card className="detail-card"><SectionHeading title="练习与检测" subtitle="题型将在后续阶段接入" /><div className="practice-types">{['词汇四选一', '语法匹配 / 选择 / 填空', '单元简短检测'].map(name => <div key={name}><span>{name}</span><Badge tone="muted">未实现</Badge></div>)}</div></Card></div>
      <div><Card className="detail-card"><Badge tone="muted">未开始学习</Badge><h3>先了解单元结构</h3><p>本次浏览会留下足迹，不计为课程已学习，也不生成成绩。</p><button className="button primary full-width" disabled>开始练习 · 后续阶段</button></Card><Card className="detail-card"><SectionHeading title="关联拓展" />{unit.topicIds.map(id => { const topic = getTopic(id); return topic && <Link className="association-link" key={id} to={`/topics/${id}`}><Layers3 size={18} /><div><strong>{topic.title}</strong><span>原创专题 · DEMO</span></div><ChevronRight size={16} /></Link>; })}</Card></div></div>
  </Page>;
}
export function DemoTopicsPage() {
  return <Page eyebrow="ÜBER DEN LEHRPLAN HINAUS" title="拓展学习" description="让课程知识与专题、场景和真实交际任务产生连接。">
    <DemoNotice>专题为原创框架演示，尚未映射你的真实 A1/A2 自学框架。</DemoNotice>
    <SectionHeading title="A1 · 自学专题" subtitle="两个板块，两种走进语言的方式" />
    <div className="topic-grid">{catalog.topics.map((topic, index) => <Link className="card topic-card" key={topic.id} to={`/topics/${topic.id}`}><span className={`topic-icon icon-tile ${index ? 'sand' : 'sage'}`}><Layers3 size={28} strokeWidth={1.4} /></span><div className="topic-meta"><span className="mini-label">板块 {topic.number} / {topic.block}</span><Badge /></div><h2>{topic.title}</h2><p className="german-subtitle">{topic.germanTitle}</p><p>{topic.description}</p><div className="course-card-bottom"><span>{topic.chapters.length} 个演示章节</span><span>进入专题<ArrowUpRight size={16} /></span></div></Link>)}</div>
    <div className="quiet-note"><span>学会正确造句</span><p>拓展课内的基础造句将关注词形、变位、语序、冠词和格；表达版本的深化另有独立入口。</p></div>
  </Page>;
}
export function DemoTopicPage() {
  const { topicId = '', chapterId } = useParams();
  const topic = getTopic(topicId);
  const chapterIndex = chapterId !== undefined && /^\d+$/.test(chapterId) ? Number(chapterId) : -1;
  const invalidChapter = chapterId !== undefined && (!topic || chapterIndex < 0 || chapterIndex >= topic.chapters.length);
  useRecordVisit('topic', !invalidChapter ? topic?.id : undefined);
  if (!topic || invalidChapter) return <MissingContent label="专题或章节" to="/topics" />;
  const isChapter = chapterId !== undefined;
  return <Page eyebrow={`${topic.block} · A1 DEMO`} title={isChapter ? topic.chapters[chapterIndex] : topic.title} description={topic.germanTitle} action={<Badge />}>
    <BackLink to={isChapter ? `/topics/${topic.id}` : '/topics/demo'}>{isChapter ? '返回专题详情' : '返回演示专题目录'}</BackLink><DemoNotice>原创专题结构示例，与已导入的真实 A1 框架分开。讲解、基础造句与训练尚未接入。</DemoNotice>
    <div className="detail-grid"><div><Card className="detail-card"><SectionHeading title={isChapter ? '章节概览' : '专题概览'} /><p className="detail-lead">{topic.description}</p><p>{topic.notes}</p>{isChapter ? <Placeholder compact title="章节讲解与基础造句待接入" description="当前提供章节路由与布局。内容导入后，将在这里展示知识讲解与基础训练。" /> : <><SectionHeading title="章节目录" /><div className="chapter-list">{topic.chapters.map((chapter, index) => <Link key={chapter} to={`/topics/${topic.id}/chapters/${index}`}><span className="chapter-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{chapter}</strong><span>内容待接入 · DEMO</span></div><ChevronRight size={17} /></Link>)}</div></>}</Card>
      <Card className="detail-card"><SectionHeading title="关联主线单元" />{topic.unitIds.map(id => { const unit = getUnit(id); return unit && <Link className="association-link" key={id} to={`/courses/${id}`}><BookOpen size={18} /><div><strong>{unit.title}</strong><span>{unit.germanTitle}</span></div><ChevronRight size={16} /></Link>; })}</Card></div>
      <Card className="detail-card"><SectionHeading title="课内趣味副本" subtitle="将专题带进生活情境" />{topic.questIds.map(id => { const quest = getQuest(id); return quest && <div className="embedded-quest" key={id}><span className="icon-tile sage"><Compass size={25} /></span><Badge /><h3>{quest.title}</h3><p>{quest.description}</p><Link className="button primary full-width" to={`/quests/${quest.id}?entry=topic&topic=${topic.id}`}>查看关联副本<ArrowRight size={16} /></Link><p className="help-text">默认定向训练预览 · 与副本中心共用内容</p></div>; })}</Card></div>
  </Page>;
}
export function MissingContent({ label, to }: { label: string; to: string }) {
  return <Page eyebrow="CONTENT NOT FOUND" title={`${label}不存在`} description="该内容可能尚未导入，或链接已失效。"><Card><EmptyState title="回到目录继续浏览" description="现有数据不会因为无效链接而改变。" action={<Link className="button primary" to={to}>返回目录</Link>} /></Card></Page>;
}
