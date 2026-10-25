import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, CircleHelp, RotateCcw, X } from 'lucide-react';
import { getFrameworkUnit } from '../../domain/framework';
import { correctAnswerText, getKnowledgeCard, getPracticeQuestion, getStudioSection, parsePracticeScope, questionsForScope, studioPack, studioUnit, type Answer, type KnowledgeCard, type PracticeQuestion } from '../../domain/studio21';
import { useProfile, useRecordVisit } from '../profile';
import { Badge, Card, Page, SectionHeading } from '../components';

const unitPath = `/courses/${studioUnit.id}`;
const sectionPath = (id: string) => `${unitPath}/sections/${id}`;
const cardPath = (id: string) => `/focus/studio21/${id}`;
const practicePath = (scope: string) => `/focus/studio21/practice/${scope}`;
const statusLabel = { new: '本单元新学', reinforce: '继续深化', recognition: '先能识读' };
const emptyAnswer = (question?: PracticeQuestion): Answer => question?.type === 'match' || question?.type === 'order' ? [] : '';

function CourseStatus() {
  const { snapshot, setMaterialStatus } = useProfile();
  const progress = snapshot.courseProgress;
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ textbookDone: progress.textbookDone, recordingDone: progress.recordingDone });
  useEffect(() => { setDraft({ textbookDone: progress.textbookDone, recordingDone: progress.recordingDone }); }, [progress.textbookDone, progress.recordingDone]);
  async function change(field: 'textbookDone' | 'recordingDone', done: boolean) {
    setDraft(current => ({ ...current, [field]: done }));
    setBusy(true);
    try { await setMaterialStatus(field, done); }
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
      <div><strong>DeutschLab 练习</strong><p>已浏览 {progress.viewedCardIds.length} / {studioPack.cards.length} 张知识卡</p><p>已提交 {answered} 次答题 · {wrong.length} 次错误</p></div>
      <div><strong>实际语言能力</strong><p>尚未通过实际交际任务验证。</p><p>练习正确率不自动点亮能力树。</p></div>
    </div>
    {distinctWrong.length > 0 && <div className="studio-wrong"><strong>可回看的错误知识点</strong><div>{distinctWrong.map(id => { const card = getKnowledgeCard(id); return card && <Link key={id} to={cardPath(id)}>{card.title}<ArrowRight size={14} /></Link>; })}</div></div>}
  </Card>;
}
export function StudioCoursePage() {
  const { snapshot } = useProfile();
  const [query, setQuery] = useState('');
  const matches = query.trim() ? studioPack.cards.filter(card => `${card.title} ${card.category} ${card.core.join(' ')} ${card.example}`.toLocaleLowerCase('de').includes(query.trim().toLocaleLowerCase('de'))) : [];
  useRecordVisit('course', studioUnit.id);
  const last = snapshot.courseProgress.lastLocation;
  return <Page eyebrow="STUDIO21 · A1" title={`${studioUnit.number} · ${studioUnit.title}`} description={`${studioUnit.chineseTitle} · 教材第 ${studioUnit.pages} 页`} action={<Badge tone="green">第一单元已开放</Badge>}>
    <Link className="back-link" to="/courses"><ChevronLeft size={16} />返回课程目录</Link>
    <div className="studio-source-note">根据你提供的课程概要整理。教材 16–23 页为四个教学小节；24–30 页是配套练习，31 页为自测与总结。软件题目与例句均为原创。</div>
    <CourseStatus />
    <div className="studio-search"><label htmlFor="studio-card-search">检索第一单元知识卡</label><input id="studio-card-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索标题、语法、词汇或例句" />{query.trim() && <div className="studio-search-results" aria-live="polite"><p>找到 {matches.length} 张知识卡</p>{matches.map(card => <Link key={card.id} to={`${cardPath(card.id)}?from=unit`}>{card.title}<span>{getStudioSection(card.sectionId)?.title}<ArrowRight size={14} /></span></Link>)}</div>}</div>
    <SectionHeading title="四个教学小节" subtitle="知识卡一次看一张，练习一次做一题" />
    <div className="studio-section-grid">{studioUnit.sections.map((section, index) => {
      const attempted = snapshot.courseProgress.attempts.filter(attempt => section.exerciseIds.includes(attempt.questionId));
      return <Link className="card studio-section-card" key={section.id} to={sectionPath(section.id)}>
        <span className="mini-label">{String(index + 1).padStart(2, '0')} · 教材 {section.pages} 页</span><h2>{section.title}</h2><p>{section.summary}</p>
        <div><span>{section.cardIds.length} 张知识卡 · {section.exerciseIds.length} 道原创题</span><span>{attempted.length ? `已答 ${attempted.length} 次` : '尚未练习'} <ArrowRight size={15} /></span></div>
      </Link>;
    })}</div>
    <Card className="studio-assessment-card"><div><span className="mini-label">教材第 31 页 · 单元自测与总结</span><h2>第一单元综合检测</h2><p>{studioUnit.assessmentIds.length} 道原创混合题，检查交际、词汇、语法、数字与结账基础。</p><p className="help-text">检测反映当前基础知识表现，不等于实际口语能力。</p></div><Link className="button primary" to={practicePath('assessment')}>进入专注检测<ArrowRight size={16} /></Link></Card>
    <p className="help-text">{last ? <>上次位置：<Link className="text-link" to={last}>继续上次学习<ArrowRight size={14} /></Link></> : '打开知识卡或练习后，这里会记住你上次的位置。'}</p>
  </Page>;
}
export function StudioSectionPage() {
  const { sectionId = '' } = useParams();
  const section = getStudioSection(sectionId);
  const { snapshot } = useProfile();
  if (!section) return <Page eyebrow="CONTENT NOT FOUND" title="小节不存在" description="返回课程目录重新选择。"><Link className="button primary" to={unitPath}>返回第一单元</Link></Page>;
  const cards = section.cardIds.map(id => getKnowledgeCard(id)!);
  const completedSessions = snapshot.courseProgress.sessions.filter(item => parsePracticeScope(item.scope).sectionId === section.id && item.completedAt);
  return <Page eyebrow={`${studioUnit.number.toUpperCase()} · ${section.pages} 页`} title={section.title} description={section.summary}>
    <Link className="back-link" to={unitPath}><ChevronLeft size={16} />返回单元总览</Link>
    <div className="studio-source-note">本节对应教材第 {section.pages} 页。知识概括与例句为 DeutschLab 原创整理；请结合纸质教材和录播课学习。</div>
    <SectionHeading title="知识卡" subtitle="点击后进入专注模式，一次只看一个知识点" />
    <div className="studio-card-list">{cards.map((card, index) => <Link className="card studio-card-row" key={card.id} to={cardPath(card.id)}><span className="studio-card-number">{String(index + 1).padStart(2, '0')}</span><div><span className="mini-label">{card.category} · {statusLabel[card.learningStatus]}</span><h2>{card.title}</h2><p>{card.core[0]}</p></div><span>{snapshot.courseProgress.viewedCardIds.includes(card.id) ? '已浏览' : '未浏览'}<ArrowRight size={15} /></span></Link>)}</div>
    <Card className="studio-assessment-card"><div><span className="mini-label">原创练习题库 · {section.exerciseIds.length} 题</span><h2>{section.title} · 小节练习</h2><p>每次抽取约 12 题，答题与错题记录会保留。中途退出可继续。</p><p className="help-text">{completedSessions.length ? `已完成 ${completedSessions.length} 次；可再次练习。` : '尚未完成本节练习。'}</p></div><div className="practice-mode-links"><Link className="button primary" to={practicePath(`${section.id}--basic`)}>基础巩固</Link><Link className="button secondary" to={practicePath(`${section.id}--advanced`)}>综合提高</Link><Link className="button secondary" to={practicePath(`${section.id}--review`)}>错题强化</Link></div></Card>
    <SectionHeading title="关联 A1 拓展专题" subtitle="只表示教材涉及该主题，不代表整个专题已学完" />
    <div className="studio-related">{section.frameworkLinks.map(id => { const topic = getFrameworkUnit(id)!; return <Link key={id} to={`/topics/${id}`}>{topic.title}<ArrowRight size={14} /></Link>; })}</div>
  </Page>;
}
function FocusLayout({ title, trail, current, total, back, onExit, children, footer }: { title: string; trail: string; current: number; total: number; back: string; onExit?: () => void; children: ReactNode; footer: ReactNode }) {
  return <div className="focus-shell"><div className="focus-topbar"><span className="focus-wordmark">D. <span>DeutschLab · Focus Mode</span></span><Link className="focus-exit" to={back} onClick={event => { if (onExit) { event.preventDefault(); onExit(); } }}><X size={17} />退出专注</Link></div>
    <main className="focus-main"><div className="focus-meta"><span>{trail}</span><strong>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</strong></div><div className="focus-progress" aria-label={`进度 ${current} / ${total}`}><span style={{ width: `${Math.min(100, (current / total) * 100)}%` }} /></div><h1>{title}</h1><div className="focus-content">{children}</div><footer className="focus-footer">{footer}</footer></main>
  </div>;
}
function KnowledgeBody({ card }: { card: KnowledgeCard }) {
  return <div className="knowledge-body"><div className="knowledge-tags"><Badge tone="green">{card.category}</Badge><Badge tone="muted">{statusLabel[card.learningStatus]}</Badge><span>教材第 {card.sourcePages} 页</span></div>
    <h2>核心知识</h2><ul>{card.core.map(text => <li key={text}>{text}</li>)}</ul>
    <h2>简要说明</h2><p>{card.explanation}</p>
    <div className="knowledge-example"><span>原创例句</span><strong>{card.example}</strong></div>
    {card.relatedIds.length > 0 && <p className="help-text">相关知识：{card.relatedIds.map(id => getKnowledgeCard(id)?.title).join('、')}</p>}
  </div>;
}
export function KnowledgeFocusPage() {
  const { cardId = '' } = useParams();
  const [params] = useSearchParams();
  const fromUnit = params.get('from') === 'unit';
  const card = getKnowledgeCard(cardId);
  const { viewKnowledgeCard } = useProfile();
  const navigate = useNavigate();
  const seen = useRef('');
  useEffect(() => { if (card && seen.current !== card.id) { seen.current = card.id; void viewKnowledgeCard(card.id); } }, [card, viewKnowledgeCard]);
  const section = card && getStudioSection(card.sectionId);
  const index = section?.cardIds.indexOf(cardId) ?? -1;
  const back = fromUnit || !section ? unitPath : sectionPath(section.id);
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
  if (!card || !section) return <FocusLayout title="知识卡不存在" trail="Studio21" current={0} total={1} back={unitPath} footer={<Link to={unitPath}>返回课程</Link>}><p>请从课程总览重新选择。</p></FocusLayout>;
  return <FocusLayout title={card.title} trail={`${studioUnit.number} / ${section.title}`} current={index + 1} total={section.cardIds.length} back={back} footer={<><div className="focus-step-nav">{index > 0 ? <Link className="button secondary" to={nextCardPath(section.cardIds[index - 1])}><ChevronLeft size={16} />上一个</Link> : <button className="button secondary" disabled><ChevronLeft size={16} />上一个</button>}{index < section.cardIds.length - 1 ? <Link className="button secondary" to={nextCardPath(section.cardIds[index + 1])}>下一个<ChevronRight size={16} /></Link> : <button className="button secondary" disabled>下一个<ChevronRight size={16} /></button>}</div><Link className="button primary" to={practicePath(section.id)}>开始本节练习<ArrowRight size={16} /></Link></>}><KnowledgeBody card={card} /></FocusLayout>;
}
function QuestionInput({ question, value, onChange }: { question: PracticeQuestion; value: Answer; onChange(value: Answer): void }) {
  if (question.type === 'single') return <div className="focus-options">{question.options!.map(option => <button type="button" key={option.id} className={value === option.id ? 'selected' : ''} aria-pressed={value === option.id} onClick={() => onChange(option.id)}><span>{option.id.toUpperCase()}</span>{option.text}</button>)}</div>;
  if (question.type === 'fill') return <div className="focus-fill"><label htmlFor="focus-answer">你的答案</label><input id="focus-answer" autoComplete="off" value={String(value)} onChange={event => onChange(event.target.value)} placeholder="输入德语词或短语" /><p className="help-text">忽略前后空格与字母大小写；德语变音和拼写须正确。</p></div>;
  if (question.type === 'match') return <div className="focus-match">{question.left!.map((left, index) => <label key={left.id}><span>{left.text}</span><select aria-label={`${left.text} 对应的答案`} value={(value as string[])[index] ?? ''} onChange={event => { const next = [...value as string[]]; next[index] = event.target.value; onChange(next); }}><option value="">选择对应项</option>{question.right!.map(right => <option key={right.id} value={right.id}>{right.text}</option>)}</select></label>)}</div>;
  const selected = value as string[];
  return <div className="focus-order"><p>按正确顺序点击：</p><div className="focus-token-row">{question.tokens!.filter(item => !selected.includes(item.id)).map(item => <button type="button" key={item.id} onClick={() => onChange([...selected, item.id])}>{item.text}</button>)}</div><p>你的顺序：</p><div className="focus-token-row chosen">{selected.map(id => { const token = question.tokens!.find(item => item.id === id)!; return <button type="button" key={id} title="点击移除" onClick={() => onChange(selected.filter(item => item !== id))}>{token.text} ×</button>; })}</div></div>;
}
export function PracticeFocusPage() {
  const { scope = '' } = useParams();
  const [params] = useSearchParams();
  const restart = params.get('new') === '1';
  const { sectionId, mode } = parsePracticeScope(scope);
  const section = getStudioSection(sectionId);
  const back = section ? sectionPath(section.id) : unitPath;
  const { snapshot, startPractice, submitAnswer, completePractice, viewKnowledgeCard } = useProfile();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const existingSession = snapshot.courseProgress.sessions.find(item => item.id === sessionId);
  const questions = existingSession?.questionIds?.map(id => getPracticeQuestion(id)!).filter(Boolean) ?? questionsForScope(sectionId);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<Answer>(emptyAnswer(questions[0]));
  const [hintViewed, setHintViewed] = useState(false);
  const [cardViewed, setCardViewed] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef('');
  useEffect(() => {
    if (!questionsForScope(sectionId).length) return;
    const key = `${scope}:${restart}`;
    if (started.current === key) return;
    started.current = key;
    let active = true;
    void startPractice(scope, restart).then(next => {
      if (!active) return;
      const session = next.courseProgress.sessions.find(item => item.scope === scope && !item.completedAt)!;
      setSessionId(session.id);
      const nextIndex = next.courseProgress.attempts.filter(item => item.sessionId === session.id).length;
      setIndex(nextIndex);
      setValue(emptyAnswer((session.questionIds ?? questionsForScope(sectionId).map(item => item.id)).map(id => getPracticeQuestion(id)!)[nextIndex])); setHintViewed(false); setCardViewed(false);
    }).catch(() => { started.current = ''; });
    return () => { active = false; };
  }, [scope, sectionId, restart, startPractice]);
  const session = snapshot.courseProgress.sessions.find(item => item.id === sessionId);
  const attempts = snapshot.courseProgress.attempts.filter(item => item.sessionId === sessionId);
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
      const nextSnapshot = await startPractice(scope, true);
      const nextSession = nextSnapshot.courseProgress.sessions.find(item => item.scope === scope && !item.completedAt)!;
      setSessionId(nextSession.id); setIndex(0); setValue(emptyAnswer(getPracticeQuestion(nextSession.questionIds?.[0] ?? questions[0].id))); setHintViewed(false); setCardViewed(false);
      navigate(practicePath(scope), { replace: true });
    } finally { setBusy(false); }
  }
  if (!questions.length) return <FocusLayout title="练习不存在" trail="Studio21" current={0} total={1} back={unitPath} footer={<Link to={unitPath}>返回课程</Link>}><p>请从单元总览重新选择。</p></FocusLayout>;
  const heading = sectionId === 'assessment' ? '第一单元综合检测' : `${section!.title} · ${mode === 'advanced' ? '综合提高' : mode === 'review' ? '错题强化' : '基础巩固'}`;
  if (!sessionId) return <FocusLayout title="正在恢复练习…" trail={heading} current={0} total={questions.length} back={back} footer={<span />}><p>已提交的答题记录正在读取。</p></FocusLayout>;
  if (finished) {
    const wrong = attempts.filter(item => !item.correct);
    const wrongIds = [...new Set(wrong.map(item => item.knowledgeId))];
    return <FocusLayout title={sectionId === 'assessment' ? '单元检测结果' : '小节练习结果'} trail={heading} current={questions.length} total={questions.length} back={back} footer={<><Link className="button secondary" to={back}>返回课程<ArrowLeft size={16} /></Link><button className="button primary" disabled={busy} onClick={() => void restartRun()}><RotateCcw size={16} />再次练习</button></>}><div className="focus-result"><strong>{attempts.filter(item => item.correct).length} / {questions.length}</strong><p>共作答 {questions.length} 题，答对 {attempts.filter(item => item.correct).length} 题。</p><p>分项结果：{[1, 2, 3].map(level => `Level ${level} ${attempts.filter(item => item.correct && getPracticeQuestion(item.questionId)?.difficulty === level).length}/${questions.filter(item => item.difficulty === level).length}`).join(" · ")}</p><p className="help-text">这是当前基础知识检测结果，不代表实际口语能力，也不会自动改变能力树。</p><h2>错误知识点</h2>{wrongIds.length ? <div className="studio-related">{wrongIds.map(id => { const card = getKnowledgeCard(id); return card && <Link key={id} to={cardPath(id)}>{card.title}<ArrowRight size={14} /></Link>; })}</div> : <p>本次没有答错的知识点。</p>}</div></FocusLayout>;
  }
  if (!question) return <FocusLayout title="本次练习已答完" trail={heading} current={questions.length} total={questions.length} back={back} footer={<button className="button primary" disabled={busy} onClick={() => void finish()}>查看结果<ArrowRight size={16} /></button>}><p>所有答案已保存。点击查看本次结果。</p></FocusLayout>;
  const card = getKnowledgeCard(question.knowledgeId)!;
  const valid = question.type === 'single' ? !!value : question.type === 'fill' ? !!String(value).trim() : question.type === 'match' ? Array.isArray(value) && value.length === question.left!.length && value.every(Boolean) && new Set(value).size === value.length : Array.isArray(value) && value.length === question.tokens!.length;
  return <FocusLayout title={heading} trail={`${studioUnit.number} / ${sectionId === 'assessment' ? '综合检测' : section!.title}`} current={index + 1} total={questions.length} back={back} onExit={requestExit} footer={<>{submitted ? <button className="button primary" onClick={() => index === questions.length - 1 ? void finish() : next()}>{index === questions.length - 1 ? '查看结果' : '下一题'}<ArrowRight size={16} /></button> : <button className="button primary" type="submit" form="practice-form" disabled={!valid || busy}>提交答案<Check size={16} /></button>}<button className="button secondary" onClick={() => { setOverlay(true); setCardViewed(true); void viewKnowledgeCard(card.id, true); }}><BookOpen size={16} />查看相关知识</button></>}>
    <form id="practice-form" onSubmit={event => void submit(event)} onKeyDown={event => { if (event.nativeEvent.isComposing) event.preventDefault(); }}><span className="mini-label">{question.type === 'single' ? '单选题' : question.type === 'fill' ? '填空题' : question.type === 'match' ? '匹配题' : '排序题'} · Level {question.difficulty}</span><h2 className="focus-question">{question.prompt}</h2>
      {submitted ? <div className={`focus-feedback ${submitted.correct ? 'correct' : 'incorrect'}`} role="status"><strong>{submitted.correct ? '回答正确' : '这次还没答对'}</strong><p>正确答案：{correctAnswerText(question)}</p><p>{question.explanation}</p></div> : <><QuestionInput key={question.id} question={question} value={value} onChange={setValue} />{question.hint && <div className="focus-hint"><button type="button" onClick={() => setHintViewed(true)}><CircleHelp size={15} />查看提示</button>{hintViewed && <p>{question.hint}</p>}</div>}</>}
    </form>
    {overlay && <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="相关知识卡"><div className="focus-overlay-panel"><button className="focus-overlay-close" autoFocus onClick={() => setOverlay(false)} aria-label="关闭知识卡"><X size={18} /></button><span className="mini-label">相关知识 · 返回后保留当前题目</span><h2>{card.title}</h2><KnowledgeBody card={card} /><button className="button primary" onClick={() => setOverlay(false)}>返回题目</button></div></div>}
    {exitConfirm && <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="退出练习"><div className="focus-overlay-panel"><h2>退出当前练习？</h2><p>已提交的题目已保存。当前未提交的答案不会计入记录，回来后可继续作答。</p><div className="focus-dialog-actions"><button className="button secondary" autoFocus onClick={() => setExitConfirm(false)}>继续作答</button><button className="button primary" onClick={() => navigate(back)}>放弃草稿并返回</button></div></div></div>}
  </FocusLayout>;
}
