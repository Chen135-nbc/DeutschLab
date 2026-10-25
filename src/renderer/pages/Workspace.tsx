import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Database, FolderOpen, Orbit, SlidersHorizontal, Info, Download, Upload, ShieldCheck, Compass, Layers3 } from 'lucide-react';
import { catalog, getUnit } from '../../domain/catalog';
import { levels, type Settings, type Visit } from '../../shared/contracts';
import { useProfile } from '../profile';
import { Badge, Card, DemoNotice, EmptyState, Modal, Page, SectionHeading } from '../components';
import { A1AbilityTreePanel } from './Framework';
import { getFrameworkUnit } from '../../domain/framework';
import { APP_VERSION } from '../../shared/app-info';
import { getKnowledgeCard, startPack, studioUnit } from '../../domain/studio21';
import { FontSizeControl } from '../FontSizeControl';

export function KnowledgePage() {
  const [selected, setSelected] = useState(catalog.knowledge[0].id);
  const node = catalog.knowledge.find(item => item.id === selected)!;
  return <Page eyebrow="WISSEN VERBINDEN" title="知识星系" description="从单个知识点出发，逐渐看见词汇、语法与表达之间的联系。">
    <DemoNotice>当前是简化的知识关系占位页。节点和连线均为演示结构，不表示已掌握或自动生成的关联。</DemoNotice>
    <div className="knowledge-grid"><Card className="knowledge-map"><div className="map-caption"><span><Orbit size={17} />A1 · 演示知识结构</span><Badge tone="muted">图谱框架</Badge></div><div className="map-area"><svg viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true"><path d="M140 155L415 77L365 238L140 155" fill="none" stroke="#c4d0bf" strokeDasharray="5 6" /></svg>{catalog.knowledge.map((item, index) => <button style={{ left: `${[23, 69, 61][index]}%`, top: `${[52, 26, 79][index]}%` }} key={item.id} className={`knowledge-node node-${index} ${selected === item.id ? 'selected' : ''}`} onClick={() => setSelected(item.id)} aria-pressed={selected === item.id}><span>{item.kind}</span><strong>{item.title}</strong><small>{item.germanTitle}</small></button>)}</div><div className="map-legend"><span className="small-dot" />原创 DEMO 节点<span>点击节点查看关联单元</span></div></Card>
      <Card className="detail-card knowledge-detail"><Badge>{node.kind} · DEMO</Badge><h2>{node.title}</h2><p className="german-subtitle">{node.germanTitle}</p><p>{node.description}</p><SectionHeading title="关联课程" />{node.unitIds.map(id => { const unit = getUnit(id); return unit && <Link className="association-link" to={`/courses/${id}`} key={id}><BookOpen size={18} /><div><strong>{unit.title}</strong><span>A1 · 演示单元</span></div><ArrowUpRight size={15} /></Link>; })}<p className="help-text">跨分支关联与学习状态将在后续接入。</p></Card></div>
    <SectionHeading title="知识列表" subtitle="同一个知识点可以关联多个课程与专题" /><Card className="knowledge-list">{catalog.knowledge.map(item => <button className={selected === item.id ? 'selected' : ''} key={item.id} onClick={() => setSelected(item.id)}><span className="icon-tile sage"><Orbit size={19} /></span><div><strong>{item.title}</strong><span>{item.germanTitle}</span></div><Badge tone="muted">{item.kind}</Badge><ArrowUpRight size={16} /></button>)}</Card>
  </Page>;
}
function visitLink(visit: Visit) {
  return visit.kind === 'course' ? `/courses/${visit.refId}` : visit.kind === 'topic' ? `/topics/${visit.refId}` : `/quests/${visit.refId}?entry=library`;
}
export function StatisticsPage() {
  const { snapshot } = useProfile();
  const [params, setParams] = useSearchParams();
  const tab = ['progress', 'skills', 'records'].includes(params.get('tab') ?? '') ? params.get('tab')! : 'progress';
  const startAttempts = snapshot.startProgress.attempts;
  const lessonAttempts = snapshot.courseProgress.attempts;
  const renderAttempts = (attempts: typeof lessonAttempts, className: string) => attempts.slice(0, 30).map(attempt => {
    const question = JSON.parse(attempt.questionSnapshot) as { prompt: string };
    const card = getKnowledgeCard(attempt.knowledgeId);
    return <div className={className} key={attempt.id}><span className={attempt.correct ? 'correct' : 'incorrect'}>{attempt.correct ? '正确' : '错误'}</span><div><strong>{question.prompt}</strong><p>{card?.title ?? attempt.knowledgeId} · {attempt.hintViewed ? '查看过提示' : '未看提示'} · {attempt.cardViewed ? '查看过知识卡' : '未看知识卡'}</p></div><time dateTime={attempt.answeredAt}>{new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }).format(new Date(attempt.answeredAt))}</time>{card && <Link to={`/focus/studio21/${card.id}`} aria-label={`回看${card.title}`}><ArrowUpRight size={16} /></Link>}</div>;
  });
  return <Page eyebrow="DEIN FORTSCHRITT" title="学习统计" description="让进度有记录，让能力有证据。按自己的节奏积累。">
    <div className="tabs" aria-label="统计视图">{[{ id: 'progress', title: '学习进度' }, { id: 'skills', title: '德语能力树' }, { id: 'records', title: '学习记录' }].map(item => <button aria-pressed={tab === item.id} key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setParams({ tab: item.id })}>{item.title}</button>)}</div>
    {tab === 'progress' && <>
      <div className="stat-grid">
        <Card className="stat-card"><span className="stat-label">当前学习等级</span><strong>{snapshot.settings.level}<span>个人设置</span></strong><p>等级设置不代表能力已验证</p></Card>
        <Card className="stat-card"><span className="stat-label">Studio21 教材学习</span><strong>{snapshot.courseProgress.textbookDone ? '已标记' : '—'}<span>{snapshot.courseProgress.textbookDone ? '第一单元教材' : '尚未标记'}</span></strong><p>录播课：{snapshot.courseProgress.recordingDone ? '已完成' : '未标记'}</p></Card>
        <Card className="stat-card"><span className="stat-label">DeutschLab 答题</span><strong>{lessonAttempts.length + startAttempts.length}<span>次提交</span></strong><p>知识卡浏览：{snapshot.courseProgress.viewedCardIds.length + snapshot.startProgress.viewedCardIds.length} 张</p></Card>
      </div>
      <Card className="progress-chart"><SectionHeading title="Start auf Deutsch · 基础学习" subtitle="引导单元的教材状态、知识卡与检测记录单独保存" /><div className="studio-summary"><p>教材：{snapshot.startProgress.textbookDone ? '已手动标记' : '未标记'} · 录播：{snapshot.startProgress.recordingDone ? '已手动标记' : '未标记'} · 知识卡：{snapshot.startProgress.viewedCardIds.length} / {startPack.cards.length}</p><p>已答 {startAttempts.length} 次；综合检测：{snapshot.startProgress.basicCompleted ? '达到基础学习标准' : '尚未达到基础学习标准'}。实际语言能力仍需独立验证。</p><Link className="text-link" to={`/courses/${startPack.unit.id}`}>查看引导单元<ArrowUpRight size={16} /></Link></div></Card>
      <Card className="progress-chart"><SectionHeading title="学习的足迹" subtitle="教材状态、练习结果与实际能力分别记录" />{snapshot.courseProgress.attempts.length ? <div className="studio-summary"><p>已提交 {snapshot.courseProgress.attempts.length} 次答案；其中 {snapshot.courseProgress.attempts.filter(attempt => attempt.correct).length} 次正确。</p><Link className="text-link" to={`/courses/${studioUnit.id}`}>查看第一单元<ArrowUpRight size={16} /></Link></div> : <div className="chart-empty"><div className="chart-grid" aria-hidden="true" /><EmptyState title="第一份练习记录，留给未来的你" description="完成第一单元的客观题后，这里会显示答题足迹。" /></div>}</Card>
      <div className="quiet-note"><span>分开记录</span><p>教材/录播完成由你标记；客观题只说明当前基础知识表现；实际运用能力仍需独立证据。</p></div>
    </>}
    {tab === 'skills' && <A1AbilityTreePanel />}
    {tab === 'records' && <>
      {startAttempts.length > 0 && <Card className="start-records"><SectionHeading title="Start 引导单元答题记录" subtitle="每次提交独立保存，错误知识点可直接回看" />{renderAttempts(startAttempts, 'studio-record-row start-record-row')}<p className="help-text">显示最近 30 次；完整历史与当时题目快照保存在本地数据库。</p></Card>}
      {lessonAttempts.length > 0 && <Card className="studio-records"><SectionHeading title="Studio21 第一单元答题记录" subtitle="每次提交独立保存，错误知识点可直接回看" />{renderAttempts(lessonAttempts, 'studio-record-row')}<p className="help-text">显示最近 30 次；全部答题历史仍保存在本地数据库。旧版题目快照随每次提交保留。</p></Card>}
      {startAttempts.length === 0 && lessonAttempts.length === 0 && <Card><EmptyState title="暂无学习记录" description="完成引导单元或第一单元客观题后，这里会显示每次提交与错误知识点。" /></Card>}
      <SectionHeading title="界面浏览记录" subtitle="只记录内容访问，不作为学习表现或课程完成的证据" />
      <Card className="history-list">{snapshot.visits.length ? snapshot.visits.map(visit => <Link key={visit.id} to={visitLink(visit)}><span className="icon-tile sage">{visit.kind === 'course' ? <BookOpen size={18} /> : visit.kind === 'topic' ? <Layers3 size={18} /> : <Compass size={18} />}</span><div><strong>{visit.title}</strong><span>{visit.refId === startPack.unit.id ? 'Studio21 引导单元' : visit.refId === studioUnit.id ? 'Studio21 第一单元' : getFrameworkUnit(visit.refId) ? 'A1 框架' : 'DEMO'} · {visit.kind === 'course' ? '课程' : visit.kind === 'topic' ? '专题' : '副本'}浏览</span></div><time dateTime={visit.visitedAt}>{new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' }).format(new Date(visit.visitedAt))}</time><ArrowUpRight size={16} /></Link>) : <EmptyState title="尚无浏览足迹" description="打开一个内容详情页后，浏览足迹会显示在这里。" />}</Card>
    </>}
  </Page>;
}
export function SettingsPage() {
  const { snapshot, updateSettings, notify } = useProfile();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(snapshot.settings);
  const [modal, setModal] = useState<'data' | 'about' | null>(null);
  async function change(patch: Partial<Settings>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setSaving(true);
    try { await updateSettings(next); notify(snapshot.storage.mode === 'sqlite' ? '设置已保存到本地。' : '预览设置已更新；关闭预览后不会保存。'); }
    catch { setDraft(snapshot.settings); /* Provider displays the save error. */ }
    finally { setSaving(false); }
  }
  return <Page eyebrow="DEIN ARBEITSPLATZ" title="个人设置" description="整理学习空间，让 DeutschLab 更适合你的日常使用。">
    <Card className="settings-card"><SectionHeading title="应用基本设置" /><div className="setting-row"><span className="setting-icon"><BookOpen size={20} /></span><div><h3>当前学习等级</h3><p>用于显示个人学习阶段，不会自动解锁课程或认证能力。</p></div><select aria-label="当前学习等级" value={draft.level} disabled={saving} onChange={event => void change({ level: event.target.value as Settings['level'] })}>{levels.map(level => <option key={level}>{level}</option>)}</select></div><div className="setting-row"><span className="setting-icon"><SlidersHorizontal size={20} /></span><div><h3>界面文字大小</h3><p>全局调整页面文字。选择预设或输入自定义字号，保存后立即生效。</p></div><FontSizeControl value={draft.fontSize} disabled={saving} onChange={fontSize => change({ fontSize })} /></div><label className="setting-row toggle-row"><span className="setting-icon"><Orbit size={20} /></span><div><h3>减少动态效果</h3><p>减少页面入场与交互过渡动画。</p></div><input type="checkbox" role="switch" aria-label="减少动态效果" checked={draft.reducedMotion} disabled={saving} onChange={event => void change({ reducedMotion: event.target.checked })} /><span className="toggle-track" /></label></Card>
    <Card className="settings-card"><SectionHeading title="数据管理" subtitle="个人记录与内容版本分开保存" /><div className="setting-row"><span className="setting-icon"><Database size={20} /></span><div><h3>本地数据</h3><p>{snapshot.storage.mode === 'sqlite' ? '基本设置、Start 与第一单元的学习和答题记录、浏览足迹已保存在本地。' : '网页预览使用临时内存；请使用桌面应用保存记录。'}</p></div><Badge tone={snapshot.storage.mode === 'sqlite' ? 'green' : 'muted'}>{snapshot.storage.mode === 'sqlite' ? '本地保存' : '临时预览'}</Badge></div><div className="data-actions"><button className="button secondary" onClick={() => setModal('data')}><FolderOpen size={16} />查看数据位置</button><button className="button secondary" disabled><Upload size={16} />导入内容 · 未实现</button><button className="button secondary" disabled><Download size={16} />备份与恢复 · 未实现</button></div><div className="privacy-note"><ShieldCheck size={18} /><p>本阶段不接入云服务、GPT API 或 iCloud。学习档案的备份与恢复将在后续阶段完成。</p></div></Card>
    <Card className="settings-card"><div className="setting-row"><span className="setting-icon"><Info size={20} /></span><div><h3>关于 DeutschLab</h3><p>个人德语学习工作台 · Studio21 Start 与第一单元 v{APP_VERSION}</p></div><button className="button secondary" onClick={() => setModal('about')}>应用说明</button></div></Card>
    <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'data' ? '本地数据位置' : '关于 DeutschLab'}>{modal === 'data' ? <><p>当前保存基本设置、课程内容版本、Start 与第一单元的手动学习状态、知识卡浏览、每次答题和浏览足迹；能力树状态独立存储。</p><code className="storage-path">{snapshot.storage.path ?? '网页预览 · 临时内存，不写入本地文件'}</code><p className="help-text">数据导入、备份与恢复尚未实现。请勿在应用运行期间手动修改数据库文件。</p></> : <><span className="brand-mark">D.</span><h3>DeutschLab · v{APP_VERSION}</h3><p>一个跟随真实课程、逐步生长的个人学习空间。</p><p>当前包含桌面外壳、A1 自学框架与能力树骨架，以及 Studio21 Start 与第一单元的知识卡、原创练习和专注模式。其他主线单元与副本仍为 DEMO；AI、剧情与同步未实现。</p></>}</Modal>
  </Page>;
}
export function NotFoundPage() {
  return <Page eyebrow="SEITE NICHT GEFUNDEN" title="这里还没有页面" description="链接可能已失效，回到学习工作台继续。"><Card><EmptyState title="重新找到你的学习方向" description="使用左侧导航访问现有模块。" action={<Link className="button primary" to="/">返回工作台</Link>} /></Card></Page>;
}
