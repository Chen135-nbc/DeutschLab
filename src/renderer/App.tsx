import { HashRouter, Link, NavLink, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { BookOpen, Blocks, Orbit, BarChart3, Settings, LayoutDashboard, Compass, ChevronRight, Leaf } from 'lucide-react';
import { ProfileProvider, useProfile } from './profile';
import { HomePage } from './pages/Home';
import { CoursesPage, CoursePage, DemoTopicsPage, DemoTopicPage } from './pages/Learning';
import { FrameworkDirectoryPage, FrameworkBoardPage, FrameworkUnitPage } from './pages/Framework';
import { getFrameworkUnit } from '../domain/framework';
import { APP_VERSION } from '../shared/app-info';
import { QuestsPage, QuestPage, CollectionPage } from './pages/Quests';
import { KnowledgePage, StatisticsPage, SettingsPage, NotFoundPage } from './pages/Workspace';
import { StudioCoursePage, StudioSectionPage, KnowledgeFocusPage, PracticeFocusPage } from './pages/Studio21';
import { ExtensionCardFocusPage, ExtensionPracticeFocusPage } from './pages/Extension';

const navigation = [
  { to: '/', title: '学习工作台', icon: LayoutDashboard, section: '首页' },
  { to: '/courses', title: '主线学习', icon: BookOpen, section: '主线学习' },
  { to: '/topics', title: '拓展学习', icon: Blocks, section: '拓展学习' },
  { to: '/quests', title: '趣味副本', icon: Compass, section: '趣味副本' },
  { to: '/knowledge', title: '知识星系', icon: Orbit, section: '知识星系' },
  { to: '/statistics', title: '学习统计', icon: BarChart3, section: '学习统计' },
  { to: '/settings', title: '个人设置', icon: Settings, section: '个人设置' },
];
function Shell() {
  const { snapshot } = useProfile();
  const location = useLocation();
  const current = navigation.find(item => item.to !== '/' && location.pathname.startsWith(item.to)) ?? navigation[0];
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">跳到主要内容</a>
    <aside className="sidebar">
      <div className="window-drag-space" />
      <Link to="/" className="brand" aria-label="DeutschLab 首页"><span className="brand-mark">D.</span><div><strong>DeutschLab</strong><span>你的德语学习实验室</span></div></Link>
      <p className="nav-label">MEIN LERNRAUM</p>
      <nav aria-label="主导航">{navigation.map(({ to, title, icon: Icon }) => <NavLink to={to} key={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={19} strokeWidth={1.65} /><span>{title}</span><span className="nav-dot" /></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="level-card"><span className="level-symbol">{snapshot.settings.level}</span><div><strong>当前学习等级</strong><Link to="/settings">按自己的节奏，慢慢来 <ChevronRight size={12} /></Link></div></div><p><Leaf size={13} />本地优先 · 为长期学习而造</p></div>
    </aside>
    <div className="main-shell">
      <div className="window-bar"><span>DEUTSCHLAB · PERSONAL LEARNING SPACE</span></div>
      <div className="topbar"><div className="breadcrumb"><Link to="/">个人学习工作台</Link><ChevronRight size={13} /><span>{current.section}</span></div><div className="environment"><span className="status-dot" />{snapshot.storage.mode === 'sqlite' ? '本地桌面' : '网页预览 · 不保存数据'}<span className="separator" />A1 框架 · Studio21 第一单元</div></div>
      <main id="main-content" tabIndex={-1} key={location.pathname}><Outlet /></main>
      <footer className="workspace-footer"><span>一点一滴，积累属于你的德语。</span><span>DEUTSCHLAB / {APP_VERSION} · 本地学习空间</span></footer>
    </div>
  </div>;
}
function TopicDetailRouter() {
  const { topicId = '' } = useParams();
  return getFrameworkUnit(topicId) ? <FrameworkUnitPage /> : <DemoTopicPage />;
}
export function App() {
  return <HashRouter><ProfileProvider><Routes>
    <Route path="focus/studio21/practice/:scope" element={<PracticeFocusPage />} />
    <Route path="focus/studio21/:cardId" element={<KnowledgeFocusPage />} />
    <Route path="focus/extension/:topicId/cards/:cardId" element={<ExtensionCardFocusPage />} />
    <Route path="focus/extension/:topicId/practice" element={<ExtensionPracticeFocusPage />} />
    <Route element={<Shell />}>
    <Route index element={<HomePage />} />
    <Route path="courses" element={<CoursesPage />} />
    <Route path="courses/studio21.a1.lektion1" element={<StudioCoursePage />} />
    <Route path="courses/studio21.a1.lektion1/sections/:sectionId" element={<StudioSectionPage />} />
    <Route path="courses/:unitId" element={<CoursePage />} />
    <Route path="topics" element={<FrameworkDirectoryPage />} />
    <Route path="topics/demo" element={<DemoTopicsPage />} />
    <Route path="topics/boards/:boardId" element={<FrameworkBoardPage />} />
    <Route path="topics/:topicId" element={<TopicDetailRouter />} />
    <Route path="topics/:topicId/chapters/:chapterId" element={<DemoTopicPage />} />
    <Route path="quests" element={<QuestsPage />} />
    <Route path="quests/expressions" element={<CollectionPage kind="expressions" />} />
    <Route path="quests/capture" element={<CollectionPage kind="capture" />} />
    <Route path="quests/:questId" element={<QuestPage />} />
    <Route path="knowledge" element={<KnowledgePage />} />
    <Route path="statistics" element={<StatisticsPage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes></ProfileProvider></HashRouter>;
}
