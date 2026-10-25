import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, RotateCcw, X } from 'lucide-react';
import { getFrameworkUnit } from '../../domain/framework';
import { correctAnswerText, getCourseSection, getKnowledgeCard, getPracticeQuestion, getStudioPack, parsePracticeScope, questionsForScope, studioPack, startPack, studioUnit, type Answer, type KnowledgeCard, type PracticeQuestion, type StudioPack } from '../../domain/studio21';
import { useProfile, useRecordVisit } from '../profile';
import { Badge, Card, Page, SectionHeading } from '../components';
import { ClassroomInstructions } from '../ClassroomInstructions';

const unitPath = `/courses/${studioUnit.id}`;
const cardPath = (id: string) => `/focus/studio21/${id}`;
const practicePath = (scope: string) => `/focus/studio21/practice/${scope}`;
const coursePath = (unitId: string) => `/courses/${unitId}`;
const sectionPathFor = (unitId: string, sectionId: string) => `${coursePath(unitId)}/sections/${sectionId}`;
const practicePathFor = (unitId: string, scope: string) => unitId === studioUnit.id ? practicePath(scope) : `/focus/studio21/${unitId}/practice/${scope}`;
const progressFor = (unitId: string, snapshot: ReturnType<typeof useProfile>['snapshot']) => unitId === startPack.unit.id ? snapshot.startProgress : snapshot.courseProgress;
const statusLabel = { new: '本单元新学', reinforce: '继续深化', recognition: '先能识读', exposure: '初步接触' };
const cardStatusLabel = (card: KnowledgeCard) => card.unitId === startPack.unit.id
  ? ({ new: '核心掌握', reinforce: '继续深化', recognition: '理解识读', exposure: '初步接触' } as const)[card.learningStatus]
  : statusLabel[card.learningStatus];
const emptyAnswer = (question?: PracticeQuestion): Answer => question?.type === 'match' || question?.type === 'order' ? [] : '';

function CourseStatus({ pack }: { pack: StudioPack }) {
  const { snapshot, setMaterialStatus } = useProfile();
  const progress = progressFor(pack.unit.id, snapshot);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ textbookDone: progress.textbookDone, recordingDone: progress.recordingDone });
  useEffect(() => { setDraft({ textbookDone: progress.textbookDone, recordingDone: progress.recordingDone }); }, [progress.textbookDone, progress.recordingDone]);
  async function change(field: 'textbookDone' | 'recordingDone', done: boolean) {
    setDraft(current => ({ ...current, [field]: done }));
    setBusy(true);
    try { await setMaterialStatus(field, done, pack.unit.id); }
    catch { setDraft({ textbookDone: progress.textbookDone, recordingDone: progress.recordingDone }); }
    finally { setBusy(false); }
  }
  const answered = progress.attempts.length;
  const wrong = progress.attempts.filter(attempt => !attempt.correct);
  const distinctWrong = [...new Set(wrong.map(attempt => attempt.knowledgeId))];
  return <Card className="studio-state-card">
    <h2>三类状态，分别记录</h2>
    <div className="studio-status-grid">
      <div><strong>教材与录播</strong><label><input type="checkbox" checked={draft.recordingDone} disabled={busy} onChange={event => void change('recordingDone', event.target.checked)} /> 已完成录播课</label><label><input type="checkbox" checked={draft.textbookDone} disabled={busy} onChange={event => void change('textbookDone', event.target.checked)} /> 已完成教材相关内容</label></div>
      <div><strong>DeutschLab 练习</strong><p>已浏览 {progress.viewedCardIds.length} / {pack.cards.length} 张知识卡</p><p>已提交 {answered} 次答题 · {wrong.length} 次错误</p></div>
      <div><strong>实际语言能力</strong><p>尚未通过实际交际任务验证。</p><p>练习正确率不自动点亮能力树。</p></div>
    </div>
    {pack.unit.id === startPack.unit.id && <p className="help-text">Start 基础学习：{progress.basicCompleted ? '已通过本单元综合检测' : '尚未通过综合检测'}。标准为综合检测至少答对 80%；这不代表完整 A1 能力。</p>}
    {distinctWrong.length > 0 && <div className="studio-wrong"><strong>可回看的错误知识点</strong><div>{distinctWrong.map(id => { const card = getKnowledgeCard(id); return card && <Link key={id} to={cardPath(id)}>{card.title}<ArrowRight size={14} /></Link>; })}</div></div>}
  </Card>;
}
export function StudioCoursePage({ courseId }: { courseId?: string } = {}) {
  const { unitId: routeUnitId } = useParams();
  const unitId = routeUnitId ?? courseId ?? studioUnit.id;
  const pack = getStudioPack(unitId) ?? studioPack;
  const isStart = pack.unit.id === startPack.unit.id;
  const { snapshot } = useProfile();
  const [query, setQuery] = useState('');
  const matches = query.trim() ? pack.cards.filter(card => `${card.title} ${card.category} ${card.core.join(' ')} ${card.example}`.toLocaleLowerCase('de').includes(query.trim().toLocaleLowerCase('de'))) : [];
  useRecordVisit('course', pack.unit.id);
  const progress = progressFor(pack.unit.id, snapshot);
  const last = progress.lastLocation;
  return <Page eyebrow="STUDIO21 · A1" title={isStart ? 'Start auf Deutsch · 德语入门' : `${studioUnit.number} · ${studioUnit.title}`} description={`${pack.unit.chineseTitle} · 教材第 ${pack.unit.pages} 页`} action={<Badge tone="green">{isStart ? '引导单元已开放' : '第一单元已开放'}</Badge>}>
    <Link className="back-link" to="/courses"><ChevronLeft size={16} />返回课程目录</Link>
    <div className="studio-source-note">{isStart ? startPack.source.note : '根据你提供的课程概要整理。教材 16–23 页为四个教学小节；24–30 页是配套练习，31 页为自测与总结。软件题目与例句均为原创。'}</div>
    {isStart && <Card className="start-intro"><SectionHeading title="先知道这单元要做什么" /><p>{pack.unit.intro}</p><p className="help-text">核心掌握、理解识读和初步接触分开标注。没有配套音频的内容不作听力评分。</p><ClassroomInstructions /></Card>}
    <CourseStatus pack={pack} />
    <div className="studio-search"><label htmlFor="studio-card-search">检索{isStart ? '引导单元' : '第一单元'}知识卡</label><input id="studio-card-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索标题、语法、词汇或例句" />{query.trim() && <div className="studio-search-results" aria-live="polite"><p>找到 {matches.length} 张知识卡</p>{matches.map(card => <Link key={card.id} to={`${cardPath(card.id)}?from=unit`}>{card.title}<span>{getCourseSection(pack.unit.id, card.sectionId)?.title}<ArrowRight size={14} /></span></Link>)}</div>}</div>
    <SectionHeading title="四个教学小节" subtitle="知识卡一次看一张，练习一次做一题" />
    <div className="studio-section-grid">{pack.unit.sections.map((section, index) => {
      const attempted = progress.attempts.filter(attempt => section.exerciseIds.includes(attempt.questionId));
      return <Link className="card studio-section-card" key={section.id} to={sectionPathFor(pack.unit.id, section.id)}>
        <span className="mini-label">{String(index + 1).padStart(2, '0')} · 教材 {section.pages} 页</span><h2>{section.title}</h2><p>{section.summary}</p>
        <div><span>{section.cardIds.length} 张知识卡 · {section.exerciseIds.length} 道原创题</span><span>{attempted.length ? `已答 ${attempted.length} 次` : '尚未练习'} <ArrowRight size={15} /></span></div>
      </Link>;
    })}</div>
    <Card className="studio-assessment-card"><div><span className="mini-label">{isStart ? 'Start · 入门知识检测' : '教材第 31 页 · 单元自测与总结'}</span><h2>{isStart ? 'Start 综合检测' : '第一单元综合检测'}</h2><p>{pack.unit.assessmentIds.length} 道原创混合题，检查{isStart ? '词汇识读、问候、资料问答、字母、阅读及课堂指令' : '交际、词汇、语法、数字与结账基础'}。</p><p className="help-text">检测反映当前基础知识表现，不等于实际口语能力。</p></div><Link className="button primary" to={practicePathFor(pack.unit.id, 'assessment')}>进入专注检测<ArrowRight size={16} /></Link></Card>
    {isStart && <Card className="start-summary"><SectionHeading title="学习总结与归档" subtitle="按实际记录回看，不把浏览当作掌握" /><p>知识卡已浏览 {progress.viewedCardIds.length} / {pack.cards.length} 张；四节中已完成练习 {pack.unit.sections.filter(section => progress.sessions.some(session => !!session.completedAt && parsePracticeScope(session.scope).sectionId === section.id)).length} / 4 节。</p><p>综合检测：{progress.basicCompleted ? '达到基础学习标准' : '尚未达到基础学习标准'}。字母发音和听辨还需配合可靠音频，实际交流能力尚未验证。</p><Link className="text-link" to={coursePath(studioUnit.id)}>继续 Lektion 1 · Kaffee oder Tee?<ArrowRight size={15} /></Link></Card>}
    <p className="help-text">{last ? <>上次位置：<Link className="text-link" to={last}>继续上次学习<ArrowRight size={14} /></Link></> : '打开知识卡或练习后，这里会记住你上次的位置。'}</p>
  </Page>;
}
export function StudioSectionPage({ courseId }: { courseId?: string } = {}) {
  const { unitId: routeUnitId, sectionId = '' } = useParams();
  const unitId = routeUnitId ?? courseId ?? studioUnit.id;
  const pack = getStudioPack(unitId) ?? studioPack;
  const section = getCourseSection(pack.unit.id, sectionId);
  const isStart = pack.unit.id === startPack.unit.id;
  const unitLink = coursePath(pack.unit.id);
  const { snapshot } = useProfile();
  if (!section) return <Page eyebrow="CONTENT NOT FOUND" title="小节不存在" description="返回课程目录重新选择。"><Link className="button primary" to={unitLink}>返回单元</Link></Page>;
  const progress = progressFor(pack.unit.id, snapshot);
  const cards = section.cardIds.map(id => getKnowledgeCard(id)!);
  const completedSessions = progress.sessions.filter(item => parsePracticeScope(item.scope).sectionId === section.id && item.completedAt);
  return <Page eyebrow={`${pack.unit.number.toUpperCase()} · ${section.pages} 页`} title={section.title} description={section.summary}>
    <Link className="back-link" to={unitLink}><ChevronLeft size={16} />返回单元总览</Link>
    <div className="studio-source-note">本节对应教材第 {section.pages} 页。知识概括与例句为 DeutschLab 原创整理；请结合纸质教材和录播课学习。</div>
    {section.guide && <Card className="start-guide"><SectionHeading title="本节导读" /><h3>学习目标</h3><ul>{section.guide.goals.map(goal => <li key={goal}>{goal}</li>)}</ul><h3>教材任务怎么做</h3><ol>{section.guide.tasks.map(task => <li key={task}>{task}</li>)}</ol><p className="help-text">本节总结：{section.guide.wrapUp}</p><ClassroomInstructions compact /></Card>}
    <SectionHeading title="知识卡" subtitle="点击后进入专注模式，一次只看一个知识点" />
    <div className="studio-card-list">{cards.map((card, index) => <Link className="card studio-card-row" key={card.id} to={cardPath(card.id)}><span className="studio-card-number">{String(index + 1).padStart(2, '0')}</span><div><span className="mini-label">{card.category} · {cardStatusLabel(card)}</span><h2>{card.title}</h2><p>{card.core[0]}</p></div><span>{progress.viewedCardIds.includes(card.id) ? '已浏览' : '未浏览'}<ArrowRight size={15} /></span></Link>)}</div>
    <Card className="studio-assessment-card"><div><span className="mini-label">原创练习题库 · {section.exerciseIds.length} 题</span><h2>{section.title} · 小节练习</h2><p>每次抽取约 12 题，答题与错题记录会保留。中途退出可继续。</p><p className="help-text">{completedSessions.length ? `已完成 ${completedSessions.length} 次；可再次练习。` : '尚未完成本节练习。'}</p></div><div className="practice-mode-links"><Link className="button primary" to={practicePathFor(pack.unit.id, `${section.id}--basic`)}>基础巩固</Link><Link className="button secondary" to={practicePathFor(pack.unit.id, `${section.id}--advanced`)}>综合提高</Link><Link className="button secondary" to={practicePathFor(pack.unit.id, `${section.id}--review`)}>错题强化</Link></div></Card>
    {!isStart && <><SectionHeading title="关联 A1 拓展专题" subtitle="只表示教材涉及该主题，不代表整个专题已学完" /><div className="studio-related">{section.frameworkLinks.map(id => { const topic = getFrameworkUnit(id)!; return <Link key={id} to={`/topics/${id}`}>{topic.title}<ArrowRight size={14} /></Link>; })}</div></>}
    {isStart && <p className="help-text">Start 不开放新的自学拓展专题，也不会改变 A1 能力树。完整动词变位等知识在后续正式单元学习。</p>}
  </Page>;
}
export function FocusLayout({ title, trail, current, total, back, onExit, children, footer }: { title: string; trail: string; current: number; total: number; back: string; onExit?: () => void; children: ReactNode; footer: ReactNode }) {
  return <div className="focus-shell"><div className="focus-topbar"><span className="focus-wordmark">D. <span>DeutschLab · Focus Mode</span></span><Link className="focus-exit" to={back} onClick={event => { if (onExit) { event.preventDefault(); onExit(); } }}><X size={17} />退出专注</Link></div>
    <main className="focus-main"><div className="focus-meta"><span>{trail}</span><strong>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</strong></div><div className="focus-progress" aria-label={`进度 ${current} / ${total}`}><span style={{ width: `${Math.min(100, (current / total) * 100)}%` }} /></div><h1>{title}</h1><div className="focus-content">{children}</div><footer className="focus-footer">{footer}</footer></main>
  </div>;
}
function KnowledgeBody({ card }: { card: KnowledgeCard }) {
  return <div className="knowledge-body"><div className="knowledge-tags"><Badge tone="green">{card.category}</Badge><Badge tone="muted">{cardStatusLabel(card)}</Badge><span>教材第 {card.sourcePages} 页</span></div>
    <h2>核心知识</h2><ul>{card.core.map(text => <li key={text}>{text}</li>)}</ul>
    <h2>简要说明</h2><p>{card.explanation}</p>
    <div className="knowledge-example"><span>原创例句</span><strong>{card.example}</strong></div>
    {card.id === `${startPack.unit.id}.card.alphabet` && <div className="start-alphabet"><h3>完整字母名称 · IPA 仅供书面参考</h3><div>{startPack.alphabet?.map(item => <span key={item.letter}><strong>{item.letter}</strong><small>/{item.ipa}/</small></span>)}</div><p className="help-text">此表没有声音；请结合教材或可靠录音核对发音。</p></div>}
    {!!card.details?.length && <details className="start-card-details"><summary>展开中文补充说明</summary><ul>{card.details.map(detail => <li key={detail}>{detail}</li>)}</ul></details>}
    {card.relatedIds.length > 0 && <p className="help-text">相关知识：{card.relatedIds.map(id => getKnowledgeCard(id)?.title).join('、')}</p>}
  </div>;
}
export function KnowledgeFocusPage() {
  const { cardId = '' } = useParams();
  const [params] = useSearchParams();
  const fromUnit = params.get('from') === 'unit';
  const card = getKnowledgeCard(cardId);
  const pack = card && getStudioPack(card.unitId);
  const { viewKnowledgeCard } = useProfile();
  const navigate = useNavigate();
  const seen = useRef('');
  useEffect(() => { if (card && seen.current !== card.id) { seen.current = card.id; void viewKnowledgeCard(card.id); } }, [card, viewKnowledgeCard]);
  const section = card && getCourseSection(card.unitId, card.sectionId);
  const index = section?.cardIds.indexOf(cardId) ?? -1;
  const back = fromUnit || !section || !pack ? coursePath(card?.unitId ?? studioUnit.id) : sectionPathFor(pack.unit.id, section.id);
  const nextCardPath = (id: string) => `${cardPath(id)}${fromUnit ? '?from=unit' : ''}`;
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!section || event.isComposing) return;
      if (event.key === 'Escape') { navigate(back); return; }
      if ((event.target as HTMLElement)?.closest('input, textarea, select, button, a')) return;
      if (event.key === 'ArrowLeft' && index > 0) navigate(nextCardPath(section.cardIds[index - 1]));
      if (event.key === 'ArrowRight' && index < section.cardIds.length - 1) navigate(nextCardPath(section.cardIds[index + 1]));
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [section, index, back, navigate, fromUnit]);
  if (!card || !section || !pack) return <FocusLayout title="知识卡不存在" trail="Studio21" current={0} total={1} back={unitPath} footer={<Link to={unitPath}>返回课程</Link>}><p>请从课程总览重新选择。</p></FocusLayout>;
  return <FocusLayout title={card.title} trail={`${pack.unit.number} / ${section.title}`} current={index + 1} total={section.cardIds.length} back={back} footer={<><div className="focus-step-nav">{index > 0 ? <Link className="button secondary" to={nextCardPath(section.cardIds[index - 1])}><ChevronLeft size={16} />上一个</Link> : <button className="button secondary" disabled><ChevronLeft size={16} />上一个</button>}{index < section.cardIds.length - 1 ? <Link className="button secondary" to={nextCardPath(section.cardIds[index + 1])}>下一个<ChevronRight size={16} /></Link> : <button className="button secondary" disabled>下一个<ChevronRight size={16} /></button>}</div><Link className="button primary" to={practicePathFor(pack.unit.id, section.id)}>开始本节练习<ArrowRight size={16} /></Link></>}><KnowledgeBody card={card} /></FocusLayout>;
}
function QuestionInput({ question, value, onChange }: { question: PracticeQuestion; value: Answer; onChange(value: Answer): void }) {
  if (question.type === 'single') return <div className="focus-options">{question.options!.map(option => <button type="button" key={option.id} className={value === option.id ? 'selected' : ''} aria-pressed={value === option.id} onClick={() => onChange(option.id)}><span>{option.id.toUpperCase()}</span>{option.text}</button>)}</div>;
  if (question.type === 'fill') return <div className="focus-fill"><label htmlFor="focus-answer">你的答案</label><input id="focus-answer" autoComplete="off" value={String(value)} onChange={event => onChange(event.target.value)} placeholder="输入德语词或短语" /><p className="help-text">忽略前后空格与字母大小写；德语变音和拼写须正确。</p></div>;
  if (question.type === 'match') return <div className="focus-match">{question.left!.map((left, index) => <label key={left.id}><span>{left.text}</span><select aria-label={`${left.text} 对应的答案`} value={(value as string[])[index] ?? ''} onChange={event => { const next = [...value as string[]]; next[index] = event.target.value; onChange(next); }}><option value="">选择对应项</option>{question.right!.map(right => <option key={right.id} value={right.id}>{right.text}</option>)}</select></label>)}</div>;
  const selected = value as string[];
  return <div className="focus-order"><p>按正确顺序点击：</p><div className="focus-token-row">{question.tokens!.filter(item => !selected.includes(item.id)).map(item => <button type="button" key={item.id} onClick={() => onChange([...selected, item.id])}>{item.text}</button>)}</div><p>你的顺序：</p><div className="focus-token-row chosen">{selected.map(id => { const token = question.tokens!.find(item => item.id === id)!; return <button type="button" key={id} title="点击移除" onClick={() => onChange(selected.filter(item => item !== id))}>{token.text} ×</button>; })}</div></div>;
}
export function PracticeFocusPage() {
  const { scope = '', unitId = studioUnit.id } = useParams();
  const pack = getStudioPack(unitId) ?? studioPack;
  const [params] = useSearchParams();
  const restart = params.get('new') === '1';
  const { sectionId, mode } = parsePracticeScope(scope);
  const section = getCourseSection(pack.unit.id, sectionId);
  const back = section ? sectionPathFor(pack.unit.id, section.id) : coursePath(pack.unit.id);
  const { snapshot, startPractice, submitAnswer, completePractice, viewKnowledgeCard } = useProfile();
  const progress = progressFor(pack.unit.id, snapshot);
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const existingSession = progress.sessions.find(item => item.id === sessionId);
  const questions = existingSession?.questionIds?.map(id => getPracticeQuestion(id)!).filter(Boolean) ?? questionsForScope(sectionId, pack);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<Answer>(emptyAnswer(questions[0]));
  const [hintViewed, setHintViewed] = useState(false);
  const [cardViewed, setCardViewed] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef('');
  useEffect(() => {
    if (!questionsForScope(sectionId, pack).length) return;
    const key = `${scope}:${restart}`;
    if (started.current === key) return;
    started.current = key;
    let active = true;
    void startPractice(scope, restart, pack.unit.id).then(next => {
      if (!active) return;
      const nextProgress = progressFor(pack.unit.id, next);
      const session = nextProgress.sessions.find(item => item.scope === scope && !item.completedAt)!;
      setSessionId(session.id);
      const nextIndex = nextProgress.attempts.filter(item => item.sessionId === session.id).length;
      setIndex(nextIndex);
      setValue(emptyAnswer((session.questionIds ?? questionsForScope(sectionId, pack).map(item => item.id)).map(id => getPracticeQuestion(id)!)[nextIndex])); setHintViewed(false); setCardViewed(false);
    }).catch(() => { started.current = ''; });
    return () => { active = false; };
  }, [scope, sectionId, restart, startPractice, pack]);
  const session = progress.sessions.find(item => item.id === sessionId);
  const attempts = progress.attempts.filter(item => item.sessionId === sessionId);
  const question = questions[index];
  const submitted = question && attempts.find(item => item.questionId === question.id);
  const finished = !!session?.completedAt;
  function requestExit() {
    if (!submitted && (typeof value === 'string' ? !!value.trim() : value.length > 0)) setExitConfirm(true);
    else navigate(back);
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (overlay) setOverlay(false); else if (exitConfirm) setExitConfirm(false); else requestExit(); } };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!sessionId || !question || busy || submitted) return;
    setBusy(true);
    try { await submitAnswer(sessionId, question.id, value, hintViewed, cardViewed); }
    catch { /* Provider shows a save error; the answer remains editable. */ }
    finally { setBusy(false); }
  }
  function next() { setValue(emptyAnswer(questions[index + 1])); setHintViewed(false); setCardViewed(false); setIndex(index + 1); }
  async function finish() { if (!sessionId || busy) return; setBusy(true); try { await completePractice(sessionId); } finally { setBusy(false); } }
  async function restartRun() {
    if (busy) return;
    setBusy(true);
    try {
      const nextSnapshot = await startPractice(scope, true, pack.unit.id);
      const nextSession = progressFor(pack.unit.id, nextSnapshot).sessions.find(item => item.scope === scope && !item.completedAt)!;
      setSessionId(nextSession.id); setIndex(0); setValue(emptyAnswer(getPracticeQuestion(nextSession.questionIds?.[0] ?? questions[0].id))); setHintViewed(false); setCardViewed(false);
      navigate(practicePathFor(pack.unit.id, scope), { replace: true });
    } finally { setBusy(false); }
  }
  if (!questions.length) return <FocusLayout title="练习不存在" trail="Studio21" current={0} total={1} back={coursePath(pack.unit.id)} footer={<Link to={coursePath(pack.unit.id)}>返回课程</Link>}><p>请从单元总览重新选择。</p></FocusLayout>;
  const heading = sectionId === 'assessment' ? `${pack.unit.id === startPack.unit.id ? 'Start' : '第一单元'}综合检测` : `${section!.title} · ${mode === 'advanced' ? '综合提高' : mode === 'review' ? '错题强化' : '基础巩固'}`;
  if (!sessionId) return <FocusLayout title="正在恢复练习…" trail={heading} current={0} total={questions.length} back={back} footer={<span />}><p>已提交的答题记录正在读取。</p></FocusLayout>;
  if (finished) {
    const wrong = attempts.filter(item => !item.correct);
    const wrongIds = [...new Set(wrong.map(item => item.knowledgeId))];
    return <FocusLayout title={sectionId === 'assessment' ? '单元检测结果' : '小节练习结果'} trail={heading} current={questions.length} total={questions.length} back={back} footer={<><Link className="button secondary" to={back}>返回课程<ArrowLeft size={16} /></Link><button className="button primary" disabled={busy} onClick={() => void restartRun()}><RotateCcw size={16} />再次练习</button></>}><div className="focus-result"><strong>{attempts.filter(item => item.correct).length} / {questions.length}</strong><p>共作答 {questions.length} 题，答对 {attempts.filter(item => item.correct).length} 题。</p><p>分项结果：{[1, 2, 3].map(level => `Level ${level} ${attempts.filter(item => item.correct && getPracticeQuestion(item.questionId)?.difficulty === level).length}/${questions.filter(item => item.difficulty === level).length}`).join(" · ")}</p>{pack.unit.id === startPack.unit.id && sectionId === 'assessment' && <p>{attempts.filter(item => item.correct).length >= Math.ceil(questions.length * 0.8) ? '已达到 Start 基础学习通过标准（至少 80%）。' : '本次未达到 Start 基础学习通过标准；可以回看知识卡并重练。'}</p>}<p className="help-text">这是当前基础知识检测结果，不代表实际口语能力，也不会自动改变能力树。</p><h2>错误知识点</h2>{wrongIds.length ? <div className="studio-related">{wrongIds.map(id => { const card = getKnowledgeCard(id); return card && <Link key={id} to={cardPath(id)}>{card.title}<ArrowRight size={14} /></Link>; })}</div> : <p>本次没有答错的知识点。</p>}</div></FocusLayout>;
  }
  if (!question) return <FocusLayout title="本次练习已答完" trail={heading} current={questions.length} total={questions.length} back={back} footer={<button className="button primary" disabled={busy} onClick={() => void finish()}>查看结果<ArrowRight size={16} /></button>}><p>所有答案已保存。点击查看本次结果。</p></FocusLayout>;
  const card = getKnowledgeCard(question.knowledgeId)!;
  const valid = question.type === 'single' ? !!value : question.type === 'fill' ? !!String(value).trim() : question.type === 'match' ? Array.isArray(value) && value.length === question.left!.length && value.every(Boolean) && new Set(value).size === value.length : Array.isArray(value) && value.length === question.tokens!.length;
  return <FocusLayout title={heading} trail={`${pack.unit.number} / ${sectionId === 'assessment' ? '综合检测' : section!.title}`} current={index + 1} total={questions.length} back={back} onExit={requestExit} footer={<>{submitted ? <button className="button primary" onClick={() => index === questions.length - 1 ? void finish() : next()}>{index === questions.length - 1 ? '查看结果' : '下一题'}<ArrowRight size={16} /></button> : <button className="button primary" type="submit" form="practice-form" disabled={!valid || busy}>提交答案<Check size={16} /></button>}<button className="button secondary" onClick={() => { setOverlay(true); setCardViewed(true); void viewKnowledgeCard(card.id, true); }}><BookOpen size={16} />查看相关知识</button></>}>
    <form id="practice-form" onSubmit={event => void submit(event)} onKeyDown={event => { if (event.nativeEvent.isComposing) event.preventDefault(); }}><span className="mini-label">{question.type === 'single' ? '单选题' : question.type === 'fill' ? '填空题' : question.type === 'match' ? '匹配题' : '排序题'} · Level {question.difficulty}</span><h2 className="focus-question">{question.prompt}</h2>
      {submitted ? <div className={`focus-feedback ${submitted.correct ? 'correct' : 'incorrect'}`} role="status"><strong>{submitted.correct ? '回答正确' : '这次还没答对'}</strong><p>正确答案：{correctAnswerText(question)}</p><p>{question.explanation}</p></div> : <><QuestionInput key={question.id} question={question} value={value} onChange={setValue} />{question.hint && <div className="focus-hint"><button type="button" onClick={() => setHintViewed(true)}><CircleHelp size={15} />查看提示</button>{hintViewed && <p>{question.hint}</p>}</div>}</>}
    </form>
    {overlay && <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="相关知识卡"><div className="focus-overlay-panel"><button className="focus-overlay-close" autoFocus onClick={() => setOverlay(false)} aria-label="关闭知识卡"><X size={18} /></button><span className="mini-label">相关知识 · 返回后保留当前题目</span><h2>{card.title}</h2><KnowledgeBody card={card} /><button className="button primary" onClick={() => setOverlay(false)}>返回题目</button></div></div>}
    {exitConfirm && <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="退出练习"><div className="focus-overlay-panel"><h2>退出当前练习？</h2><p>已提交的题目已保存。当前未提交的答案不会计入记录，回来后可继续作答。</p><div className="focus-dialog-actions"><button className="button secondary" autoFocus onClick={() => setExitConfirm(false)}>继续作答</button><button className="button primary" onClick={() => navigate(back)}>放弃草稿并返回</button></div></div></div>}
  </FocusLayout>;
}
