import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, RotateCcw, X } from 'lucide-react';
import { getAbilityNodeForUnit, getFrameworkUnit } from '../../domain/framework';
import { getExtensionPack, extensionItem, extensionIsProduction, linkedStudioUnitId, type ExtensionCard, type ProductionPrompt } from '../../domain/extension';
import { correctAnswerText, getKnowledgeCard } from '../../domain/studio21';
import { applicationFor, coverageFor } from '../../domain/progress';
import { useProfile } from '../profile';
import { BackLink, Badge, Card, Page, SectionHeading } from '../components';
import { FocusLayout } from './Studio21';

const topicPath = (id: string) => `/topics/${id}`;
const cardPath = (topicId: string, cardId: string) => `/focus/extension/${topicId}/cards/${cardId}`;
const practicePath = (topicId: string, taskId?: string) => `/focus/extension/${topicId}/practice${taskId ? `?task=${taskId}` : ''}`;

function ExtensionCardBody({ card }: { card: ExtensionCard }) {
  return <div className="knowledge-body"><h2>{card.title}</h2><ul>{card.body.map(line => <li key={line}>{line}</li>)}</ul>
    <div className="knowledge-example"><span>原创例句</span><strong>{card.example}</strong></div>
    {card.studioCardIds.length > 0 && <p className="help-text">关联主线：{card.studioCardIds.map(id => getKnowledgeCard(id)?.title).join('、')}</p>}
  </div>;
}
export function ExtensionTopicPage({ topicId }: { topicId: string }) {
  const pack = getExtensionPack(topicId)!;
  const unit = getFrameworkUnit(topicId)!;
  const node = getAbilityNodeForUnit(topicId)!;
  const { snapshot } = useProfile();
  const progress = snapshot.extensionProgress;
  const viewed = new Set(progress.viewedCardIds);
  const attempts = progress.attempts.filter(item => item.topicId === topicId);
  const completed = progress.sessions.filter(item => item.topicId === topicId && item.completedAt);
  const coverage = coverageFor(unit, snapshot.frameworkProgress);
  const application = applicationFor(node.id, snapshot.frameworkProgress);
  const last = progress.lastPositions[topicId];
  return <Page eyebrow="A1 · 自学拓展" title={unit.title} description={pack.intro} action={<Badge tone="green">完整专题已开放</Badge>}>
    <BackLink to={`/topics/boards/${getFrameworkUnit(topicId) && topicId.split('-U')[0]}`}>返回原有板块</BackLink>
    <div className="extension-overview-grid"><Card><SectionHeading title="学习目标" subtitle="在主线第一单元基础上灵活使用" /><ul className="extension-list">{pack.goals.map(goal => <li key={goal}>{goal}</li>)}</ul><p className="help-text">完成标准：{pack.completion}</p></Card>
      <Card><SectionHeading title="学习状态" /><p>已浏览 {pack.cards.filter(card => viewed.has(card.id)).length} / {pack.cards.length} 张专题知识卡</p><p>已提交 {attempts.length} 次作答 · 完成 {completed.length} 次练习</p><p>学习覆盖：{coverage.label} · 运用能力：{application.label}</p><p className="help-text">浏览和一次练习均不代表已经具备独立表达能力。</p>{last && <Link className="text-link" to={last}>继续上次位置<ArrowRight size={15} /></Link>}</Card></div>
    <Card className="extension-link-card"><div><span className="mini-label">关联主线 · Studio21 A1</span><h2>Lektion 1 · Kaffee oder Tee?</h2><p>主线已学习基础数字或饮料；本专题补充生活信息与主动表达。</p><p className="help-text">复习入口：{pack.studioCardIds.map(id => getKnowledgeCard(id)?.title).join('、')}</p></div><Link className="button secondary" to={`/courses/${linkedStudioUnitId}`}>返回主线</Link></Card>
    <SectionHeading title="细分学习内容" subtitle="保留原框架的三条纲要；每个知识点可单独学习" />
    {pack.sections.map(section => <Card className="extension-section" key={section.outlineId}><span className="mini-label">{section.outlineId} · {unit.outline.find(item => item.id === section.outlineId)?.text}</span><h2>{section.title}</h2><p>{section.summary}</p><div className="extension-card-links">{section.cardIds.map(id => { const card = pack.cards.find(item => item.id === id)!; return <Link key={id} to={cardPath(topicId, id)}>{card.title}<span>{viewed.has(id) ? '已浏览' : '开始学习'}<ArrowRight size={14} /></span></Link>; })}</div></Card>)}
    <SectionHeading title="词汇与表达拓展" subtitle="冠词作为词条信息记录；新增词汇不要求完整格变化" />
    <div className="extension-vocab-grid">{pack.vocabulary.map(item => <Card className="extension-vocab" key={item.id}><span className="mini-label">{item.tags.join(' · ')}</span><h3>{item.term}</h3><p>{item.meaning}</p>{item.plural && <p className="help-text">复数：{item.plural}</p>}<p>搭配：{item.collocation}</p><p className="extension-example">{item.example}</p></Card>)}</div>
    <SectionHeading title="基础语言运用" subtitle="客观题自动反馈；短句题对照参考答案自行核对" />
    <Card className="extension-link-card"><div><h2>专题练习</h2><p>{pack.questions.length} 道客观题与 {pack.production.length} 道短句题组成题库，每次抽取 7 道客观题和 2 道短句题。</p><p className="help-text">已提交答案会保存；自核对结果不作为机器评分。</p></div><Link className="button primary" to={practicePath(topicId)}>开始或继续练习<ArrowRight size={16} /></Link></Card>
    <SectionHeading title="专题小任务" subtitle="每项都是当前 A1 阶段可完成的短任务" />
    <div className="extension-tasks">{pack.tasks.map(task => <Card key={task.id}><h3>{task.title}</h3><p>{task.instruction}</p><span className="mini-label">{task.itemIds.length} 道短句题 · 自我核对</span><Link className="text-link" to={practicePath(topicId, task.id)}>进入小任务<ArrowRight size={15} /></Link></Card>)}</div>
    <Card><SectionHeading title="专题学习总结" /><p>已浏览的知识卡：{pack.cards.filter(card => viewed.has(card.id)).map(card => card.title).join('、') || '暂无'}</p><p>客观题正确：{attempts.filter(item => item.correct === true).length} / {attempts.filter(item => item.correct !== null).length}；短句自核对：{attempts.filter(item => item.selfCheck === 'can_do').length} 次可做到、{attempts.filter(item => item.selfCheck === 'needs_work').length} 次需巩固。</p><p>对应能力节点：{node.title} · {application.label}。真实交流能力仍待以后验证。</p><Link className="text-link" to={`/statistics?tab=skills&board=${topicId.split('-U')[0]}`}>查看能力树<ArrowRight size={15} /></Link></Card>
  </Page>;
}

export function ExtensionCardFocusPage() {
  const { topicId = '', cardId = '' } = useParams();
  const pack = getExtensionPack(topicId);
  const card = pack?.cards.find(item => item.id === cardId);
  const index = pack?.cards.findIndex(item => item.id === cardId) ?? -1;
  const { viewExtensionCard } = useProfile();
  const navigate = useNavigate();
  const recorded = useRef('');
  useEffect(() => { if (!card || recorded.current === card.id) return; recorded.current = card.id; void viewExtensionCard(topicId, card.id); }, [topicId, card, viewExtensionCard]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') navigate(topicPath(topicId)); if (event.key === 'ArrowRight' && pack?.cards[index + 1]) navigate(cardPath(topicId, pack.cards[index + 1].id)); if (event.key === 'ArrowLeft' && pack?.cards[index - 1]) navigate(cardPath(topicId, pack.cards[index - 1].id)); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [topicId, pack, index, navigate]);
  if (!pack || !card) return <FocusLayout title="知识卡不存在" trail="拓展学习" current={0} total={1} back="/topics" footer={<Link to="/topics">返回目录</Link>}><p>请从专题目录重新进入。</p></FocusLayout>;
  return <FocusLayout title={card.title} trail={`${getFrameworkUnit(topicId)?.title} / ${pack.sections.find(section => section.outlineId === card.outlineId)?.title}`} current={index + 1} total={pack.cards.length} back={topicPath(topicId)} footer={<><Link className="button secondary" to={index > 0 ? cardPath(topicId, pack.cards[index - 1].id) : topicPath(topicId)}><ArrowLeft size={16} />上一个</Link>{pack.cards[index + 1] ? <Link className="button primary" to={cardPath(topicId, pack.cards[index + 1].id)}>下一个<ArrowRight size={16} /></Link> : <Link className="button primary" to={practicePath(topicId)}>开始练习<ArrowRight size={16} /></Link>}</>}><ExtensionCardBody card={card} /><p className="help-text">已浏览只记录学习足迹，不等于掌握。</p></FocusLayout>;
}

export function ProductionPromptEditor({ prompt, answer, onChange, showReference, onReveal, selfCheck, onSelfCheck }: { prompt: ProductionPrompt; answer: string; onChange(value: string): void; showReference: boolean; onReveal(): void; selfCheck: 'can_do' | 'needs_work' | ''; onSelfCheck(value: 'can_do' | 'needs_work'): void }) {
  return <div className="extension-production"><p className="focus-question">{prompt.task}</p><p className="help-text">可用词汇：{prompt.hints.join(' · ')}</p><label htmlFor="extension-answer">写出你的短句</label><textarea id="extension-answer" value={answer} onChange={event => onChange(event.target.value)} rows={4} placeholder="先自己写，再查看参考答案" />
    {!showReference ? <button type="button" className="button secondary" disabled={!answer.trim()} onClick={onReveal}>查看参考答案并自我核对</button> : <div className="extension-reference"><strong>参考答案：{prompt.reference}</strong><p>核对要点：{prompt.checks.join('；')}</p><p>常见错误：{prompt.commonError}</p><p className="help-text">参考答案是示例，符合核对要点的其他 A1 短句也可能正确；请自行判断。</p><div className="practice-mode-links"><button type="button" className={`button ${selfCheck === 'can_do' ? 'primary' : 'secondary'}`} onClick={() => onSelfCheck('can_do')}>我能表达</button><button type="button" className={`button ${selfCheck === 'needs_work' ? 'primary' : 'secondary'}`} onClick={() => onSelfCheck('needs_work')}>需要巩固</button></div></div>}
  </div>;
}

export function ExtensionPracticeFocusPage() {
  const { topicId = '' } = useParams();
  const [params] = useSearchParams();
  const taskId = params.get('task') ?? undefined;
  const pack = getExtensionPack(topicId);
  const task = pack?.tasks.find(item => item.id === taskId);
  const back = topicPath(topicId);
  const { snapshot, startExtensionPractice, submitExtensionAnswer, completeExtensionPractice } = useProfile();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [showReference, setShowReference] = useState(false);
  const [selfCheck, setSelfCheck] = useState<'can_do' | 'needs_work' | ''>('');
  const [overlay, setOverlay] = useState(false);
  const [busy, setBusy] = useState(false);
  const started = useRef('');
  const key = `${topicId}:${taskId ?? 'practice'}`;
  useEffect(() => { if (!pack || started.current === key) return; started.current = key; let active = true; void startExtensionPractice(topicId, false, taskId).then(next => { if (!active) return; const s = next.extensionProgress.sessions.find(item => item.topicId === topicId && item.scope === (taskId ?? 'practice') && !item.completedAt)!; setSessionId(s.id); setIndex(next.extensionProgress.attempts.filter(item => item.sessionId === s.id).length); }).catch(() => { started.current = ''; }); return () => { active = false; }; }, [key, pack, topicId, taskId, startExtensionPractice]);
  const session = snapshot.extensionProgress.sessions.find(item => item.id === sessionId);
  const items = session?.itemIds.map(id => pack && extensionItem(pack, id)).filter(Boolean) ?? [];
  const item = items[index];
  const attempts = snapshot.extensionProgress.attempts.filter(entry => entry.sessionId === sessionId);
  const submitted = item && attempts.find(entry => entry.itemId === item.id);
  const title = task?.title ?? `${getFrameworkUnit(topicId)?.title ?? '拓展专题'} · 基础运用`;
  const reset = () => { setAnswer(''); setShowReference(false); setSelfCheck(''); setOverlay(false); };
  const next = () => { reset(); setIndex(index + 1); };
  const leave = () => { if (!submitted && answer.trim() && !window.confirm('当前短句尚未提交。已提交记录会保留，确定退出吗？')) return; navigate(back); };
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (overlay) setOverlay(false); else leave(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); });
  async function submit() { if (!sessionId || !item || busy || submitted) return; setBusy(true); try { await submitExtensionAnswer(sessionId, item.id, answer, extensionIsProduction(item) ? selfCheck as 'can_do' | 'needs_work' : undefined); } finally { setBusy(false); } }
  async function finish() { if (!sessionId || busy) return; setBusy(true); try { await completeExtensionPractice(sessionId); } finally { setBusy(false); } }
  async function restart() { if (busy) return; setBusy(true); try { const result = await startExtensionPractice(topicId, true, taskId); const s = result.extensionProgress.sessions.find(entry => entry.topicId === topicId && entry.scope === (taskId ?? 'practice') && !entry.completedAt)!; setSessionId(s.id); setIndex(0); reset(); } finally { setBusy(false); } }
  if (!pack || (taskId && !task)) return <FocusLayout title="专题练习不存在" trail="拓展学习" current={0} total={1} back="/topics" footer={<Link to="/topics">返回目录</Link>}><p>请从专题页重新进入。</p></FocusLayout>;
  if (!session) return <FocusLayout title="正在恢复专题练习…" trail={title} current={0} total={1} back={back} footer={<span />}><p>读取已保存的题单与记录。</p></FocusLayout>;
  if (session.completedAt) return <FocusLayout title="专题练习结果" trail={title} current={items.length} total={items.length} back={back} footer={<><Link className="button secondary" to={back}>返回专题<ArrowLeft size={15} /></Link><button className="button primary" onClick={() => void restart()} disabled={busy}><RotateCcw size={15} />再次练习</button></>}><div className="focus-result"><strong>{attempts.filter(entry => entry.correct === true).length} / {attempts.filter(entry => entry.correct !== null).length}</strong><p>客观题正确数 / 客观题总数。短句自核对：{attempts.filter(entry => entry.selfCheck === 'can_do').length} 次可做到，{attempts.filter(entry => entry.selfCheck === 'needs_work').length} 次需巩固。</p><p className="help-text">自核对不是自动评分；能力树只显示练习中，不自动标记完全掌握。</p></div></FocusLayout>;
  if (!item) return <FocusLayout title="本次题目已完成" trail={title} current={items.length} total={items.length} back={back} footer={<button className="button primary" disabled={busy} onClick={() => void finish()}>查看结果<ArrowRight size={16} /></button>}><p>提交的答案已经保存。</p></FocusLayout>;
  const production = extensionIsProduction(item);
  const card = pack.cards.find(entry => entry.id === item.knowledgeId)!;
  const valid = production ? !!answer.trim() && !!selfCheck : !!answer;
  return <FocusLayout title={title} trail={`${getFrameworkUnit(topicId)?.title} / ${production ? '短句自核对' : '客观题'}`} current={index + 1} total={items.length} back={back} onExit={leave} footer={<>{submitted ? <button className="button primary" onClick={() => index === items.length - 1 ? void finish() : next()}>{index === items.length - 1 ? '查看结果' : '下一题'}<ArrowRight size={16} /></button> : <button className="button primary" disabled={!valid || busy} onClick={() => void submit()}><Check size={16} />保存本题</button>}<button className="button secondary" onClick={() => setOverlay(true)}><BookOpen size={16} />查看相关知识</button></>}>
    <span className="mini-label">Level {production ? item.level : item.difficulty} · {production ? '短句练习 · 自我核对' : '单选题 · 自动判分'}</span>
    {submitted ? <div className={`focus-feedback ${submitted.correct === false || submitted.selfCheck === 'needs_work' ? 'incorrect' : 'correct'}`} role="status"><strong>{production ? `自核对：${submitted.selfCheck === 'can_do' ? '我能表达' : '需要巩固'}` : submitted.correct ? '回答正确' : '这次还没答对'}</strong><p>你的答案：{String(submitted.answer)}</p><p>参考答案：{production ? item.reference : correctAnswerText(item)}</p><p>{production ? item.commonError : item.explanation}</p></div> : production ? <ProductionPromptEditor prompt={item} answer={answer} onChange={setAnswer} showReference={showReference} onReveal={() => setShowReference(true)} selfCheck={selfCheck} onSelfCheck={setSelfCheck} /> : <div><h2 className="focus-question">{item.prompt}</h2><div className="focus-options">{item.options!.map(option => <button type="button" key={option.id} className={answer === option.id ? 'selected' : ''} onClick={() => setAnswer(option.id)}>{option.text}</button>)}</div></div>}
    {overlay && <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="相关专题知识"><div className="focus-overlay-panel"><button className="focus-overlay-close" autoFocus onClick={() => setOverlay(false)} aria-label="关闭知识卡"><X size={18} /></button><ExtensionCardBody card={card} /><button className="button primary" onClick={() => setOverlay(false)}>返回题目</button></div></div>}
  </FocusLayout>;
}
