import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Compass, Blocks, BarChart3, ArrowUpRight, Clock3, Sparkles } from 'lucide-react';
import { catalog, getUnit } from '../../domain/catalog';
import { a1Scaffold } from '../../domain/framework';
import { useProfile } from '../profile';
import { Badge, BakeryIllustration, Card, DeskIllustration, EmptyState, ModuleLink, Page, SectionHeading } from '../components';
import { studioPack, studioUnit, startPack } from '../../domain/studio21';

export function HomePage() {
  const { snapshot } = useProfile();
  const recent = snapshot.visits.filter(v => v.kind === 'course').filter((v, i, list) => list.findIndex(a => a.refId === v.refId) === i).slice(0, 2);
  const nextCoursePath = snapshot.courseProgress.lastLocation ?? snapshot.startProgress.lastLocation ?? `/courses/${startPack.unit.id}`;
  const quest = catalog.quests[0];
  return <Page eyebrow="DEIN LERNRAUM" title="学习工作台" description="从一句问候开始，让德语一点点走进日常。" action={<span className="page-tag"><span className="status-dot" />个人学习空间</span>}>
    <div className="home-intro-grid">
      <section className="hero"><div className="hero-copy"><div className="hero-kicker"><span className="hero-level">{snapshot.settings.level}</span> DEUTSCH LERNEN, SCHRITT FÜR SCHRITT.</div><h2>保持好奇，<br />把每一步学扎实。</h2><p>跟随主线建立基础，在生活情境中发现语言。<br />这里是你可以慢慢成长的学习空间。</p><Link className="button hero-button" to={nextCoursePath}>继续 Studio21 学习<ArrowRight size={17} /></Link><span className="hero-footnote">Start 引导单元与第一单元 · 原创知识卡和练习</span></div><DeskIllustration /></section>
      <Card className="course-progress"><div className="card-label"><BookOpen size={17} />STUDIO21 主线<Badge tone="green">第一单元已开放</Badge></div><h3>{studioUnit.title}</h3><p>{studioUnit.chineseTitle}<br />{studioUnit.sections.length} 个教学小节 · {studioPack.cards.length} 张知识卡</p><div className="progress-caption"><span>知识卡浏览</span><span>{snapshot.courseProgress.viewedCardIds.length} / {studioPack.cards.length} 张</span></div><div className="progress-track"><span style={{ width: `${snapshot.courseProgress.viewedCardIds.length / studioPack.cards.length * 100}%` }} /></div><Link className="text-link" to={`/courses/${studioUnit.id}`}>打开第一单元<ArrowUpRight size={15} /></Link></Card>
    </div>
    <div className="overview-strip"><div><span className="metric-icon"><BookOpen size={18} /></span><p>Studio21 第一单元<strong>可以开始学习</strong></p></div><div><span className="metric-icon"><Clock3 size={18} /></span><p>已提交答题<strong>{snapshot.courseProgress.attempts.length} 次</strong></p></div><div><span className="metric-icon"><Sparkles size={18} /></span><p>独立运用能力<strong>待验证</strong></p></div><Link to="/statistics">查看学习统计<ArrowUpRight size={16} /></Link></div>
    <div className="home-lower-grid"><section><SectionHeading title="最近浏览的课程" subtitle="浏览足迹与学习记录分别保存" to="/courses" linkLabel="课程目录" />
      {recent.length ? <div className="recent-list">{recent.map(visit => { const unit = getUnit(visit.refId); return visit.refId === startPack.unit.id ? <Link className="recent-course" key={visit.id} to={`/courses/${startPack.unit.id}`}><span className="unit-number">S</span><div><span className="mini-label">A1 · Studio21 Einstieg</span><h3>{startPack.unit.title}</h3><p>{startPack.unit.chineseTitle}</p></div><Badge tone="green">引导单元</Badge><ArrowUpRight size={17} /></Link> : visit.refId === studioUnit.id ? <Link className="recent-course" key={visit.id} to={`/courses/${studioUnit.id}`}><span className="unit-number">01</span><div><span className="mini-label">A1 · Studio21</span><h3>{studioUnit.title}</h3><p>{studioUnit.chineseTitle}</p></div><Badge tone="green">第一单元</Badge><ArrowUpRight size={17} /></Link> : unit && <Link className="recent-course" key={visit.id} to={`/courses/${unit.id}`}><span className="unit-number">{unit.number}</span><div><span className="mini-label">A1 · {unit.category}</span><h3>{unit.title}</h3><p>{unit.germanTitle}</p></div><Badge /><ArrowUpRight size={17} /></Link>; })}</div> : <Card><EmptyState title="还没有浏览记录" description="打开引导单元后，可以从这里快速返回。" action={<Link to={`/courses/${startPack.unit.id}`} className="text-link">开始 Start<ArrowRight size={15} /></Link>} /></Card>}
      <SectionHeading title="让学习多一点连接" />
      <div className="module-grid"><ModuleLink icon={Blocks} title="拓展学习" description={`${a1Scaffold.boards.length} 板块 · ${a1Scaffold.units.length} 个专题单元`} to="/topics" /><ModuleLink icon={BarChart3} title="知识与成长" description="看见每一步的学习证据" to="/statistics" color="sand" /></div>
    </section><section><SectionHeading title="去生活里遇见德语" subtitle="趣味副本 · 平行德国人生" to="/quests" linkLabel="副本中心" />
      <Link className="quest-preview card" to={`/quests/${quest.id}?entry=library`}><div className="quest-preview-art"><Badge /><BakeryIllustration /></div><div className="quest-preview-copy"><span className="mini-label">A1 · 原创生活情境</span><h3>{quest.title}<ArrowUpRight size={18} /></h3><p>{quest.germanTitle}</p><div className="quest-preview-footer"><span><Compass size={14} />场景预览</span><span>剧情训练待开发</span></div></div></Link>
    </section></div>
    <div className="quiet-note"><span>GUT ZU WISSEN</span><p>Studio21 第一单元根据你提供的概要整理，题目和例句均为原创；其他主线单元与副本仍为 DEMO。浏览知识卡和答题分别记录，能力仍需实际验证。</p></div>
  </Page>;
}
