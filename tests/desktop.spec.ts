import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { FrameworkCatalog, AbilityTree } from '../src/domain/framework';

const framework: FrameworkCatalog = JSON.parse(readFileSync(resolve('content/frameworks/a1/a1_extension_framework.json'), 'utf8'));
const ability: AbilityTree = JSON.parse(readFileSync(resolve('content/frameworks/a1/a1_ability_tree.json'), 'utf8'));
const studio = JSON.parse(readFileSync(resolve('content/studio21/a1/lektion1.json'), 'utf8'));

let app: ElectronApplication;
let page: Page;
const profile = mkdtempSync(join(tmpdir(), 'deutschlab-desktop-'));
const errors: string[] = [];
const remoteRequests: string[] = [];
async function launch() {
  app = await electron.launch({
    ...(process.env.DEUTSCHLAB_EXECUTABLE ? { executablePath: process.env.DEUTSCHLAB_EXECUTABLE, args: [] } : { args: [resolve('.')] }),
    env: { ...process.env, DEUTSCHLAB_DATA_DIR: profile, DEUTSCHLAB_TEST: '1', DEUTSCHLAB_DEV_URL: '' },
  });
  page = await app.firstWindow();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) remoteRequests.push(request.url()); });
  await expect(page.getByRole('heading', { name: '学习工作台', exact: true })).toBeVisible();
}
async function go(label: string) {
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: label, exact: true }).click();
  await expect(page.getByRole('heading', { name: label, exact: true, level: 1 })).toBeVisible();
}
async function capture(path: string, fullPage = false) {
  await expect(page.locator('.page, .focus-main').first()).toHaveCSS('opacity', '1');
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path, fullPage, animations: 'disabled' });
}
async function answerCurrent(question: any) {
  if (question.type === 'single') {
    const label = question.options.find((item: any) => item.id === question.answer).text;
    await page.locator('.focus-options button').filter({ hasText: label }).click();
  }
  else if (question.type === 'fill') await page.getByRole('textbox', { name: '你的答案' }).fill(question.answer);
  else if (question.type === 'match') for (const [i, left] of question.left.entries()) await page.getByRole('combobox', { name: `${left.text} 对应的答案` }).selectOption(question.answer[i]);
  else for (const id of question.answer) await page.locator('.focus-token-row:not(.chosen)').getByRole('button', { name: question.tokens.find((item: any) => item.id === id).text, exact: true }).click();
  await page.getByRole('button', { name: '提交答案' }).click();
}
test.beforeAll(launch);
test.afterAll(async () => { await app?.close(); });

test('七个主页面可以切换，导航状态正确', async () => {
  for (const label of ['主线学习', '拓展学习', '趣味副本', '知识星系', '学习统计', '个人设置', '学习工作台']) {
    await go(label);
    await expect(page.getByRole('heading', { name: label, exact: true, level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
  }
});

test('两个演示课程可进入详情，未来等级为空且明确标注', async () => {
  await go('主线学习');
  for (const title of ['第一句，Hallo', '一份日常，小小的愿望']) {
    await page.locator('.course-card').filter({ hasText: title }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '开始练习 · 后续阶段' })).toBeDisabled();
    await expect(page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '主线学习', exact: true })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('link', { name: '返回主线目录' }).click();
  }
  await page.getByRole('button', { name: /A2.*日常沟通/ }).click();
  await expect(page.getByRole('heading', { name: 'A2 内容将随学习逐步扩展' })).toBeVisible();
  await page.getByRole('button', { name: '返回 A1 演示目录' }).click();
});

test('专题章节可导航，副本双入口使用同一对象与内容修订', async () => {
  await go('拓展学习');
  await page.getByRole('link', { name: '查看界面演示' }).click();
  await page.locator('.topic-card').filter({ hasText: '认识彼此' }).click();
  await page.getByRole('link', { name: /从问候开始/ }).click();
  await expect(page.getByRole('heading', { name: '从问候开始', exact: true })).toBeVisible();
  await page.getByRole('link', { name: '返回专题详情' }).click();
  await page.getByRole('link', { name: '查看关联副本' }).click();
  const embedded = await page.locator('[data-quest-id]').getAttribute('data-quest-id');
  const revision = await page.locator('[data-quest-revision]').getAttribute('data-quest-revision');
  await expect(page.getByText('从拓展课进入 · 默认定向训练')).toBeVisible();
  await page.getByRole('switch', { name: /显示教学备注/ }).uncheck();
  await expect(page.getByText('演示训练目标')).toBeHidden();
  await page.getByRole('button', { name: '自由探索', exact: true }).click();
  await expect(page.getByRole('button', { name: '自由探索', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await go('趣味副本');
  await page.locator('.quest-library-card').click();
  await expect(page.locator('[data-quest-id]')).toHaveAttribute('data-quest-id', embedded!);
  await expect(page.locator('[data-quest-revision]')).toHaveAttribute('data-quest-revision', revision!);
  await expect(page.getByText('从独立副本中心进入')).toBeVisible();
  await expect(page.getByRole('button', { name: '开始训练 · 后续阶段' })).toBeDisabled();
});

test('副本搜索、等级过滤、清空状态和两个占位模块', async () => {
  await go('趣味副本');
  await page.getByRole('textbox', { name: '搜索副本' }).fill('not-a-quest');
  await expect(page.getByRole('heading', { name: '没有符合条件的副本' })).toBeVisible();
  await page.getByRole('button', { name: '清除筛选' }).click();
  await page.getByRole('textbox', { name: '搜索副本' }).fill('Bäckerei');
  await expect(page.locator('.quest-library-card')).toHaveCount(1);
  await page.getByRole('combobox', { name: '筛选副本等级' }).selectOption('A2');
  await expect(page.locator('.quest-library-card')).toHaveCount(0);
  await page.getByRole('button', { name: '清除筛选' }).click();
  await page.getByRole('navigation', { name: '副本分类' }).getByRole('link', { name: '一句话的100种可能' }).click();
  await expect(page.getByRole('heading', { name: '表达集合将在后续阶段开放' })).toBeVisible();
  await page.getByRole('navigation', { name: '副本分类' }).getByRole('link', { name: '真实世界德语采集' }).click();
  await expect(page.getByRole('heading', { name: '文本采集将在后续阶段开放' })).toBeVisible();
});

test('统计区分浏览与学习，知识节点可跳转课程', async () => {
  await go('知识星系');
  await page.locator('.knowledge-node').filter({ hasText: '问候与告别' }).click();
  await page.locator('.knowledge-detail').getByRole('link', { name: /第一句，Hallo/ }).click();
  await expect(page.getByRole('heading', { name: '第一句，Hallo', exact: true })).toBeVisible();
  await go('学习统计');
  await page.getByRole('button', { name: '德语能力树', exact: true }).click();
  await expect(page.locator('.ability-topic')).toHaveCount(68);
  await expect(page.locator('.ability-topic').getByText('运用：未评估', { exact: true })).toHaveCount(68);
  await page.getByRole('button', { name: '学习记录', exact: true }).click();
  await expect(page.getByRole('heading', { name: '暂无学习记录' })).toBeVisible();
  await expect(page.locator('.history-list a').first()).toBeVisible();
});

test('A1 板块标题、顺序、说明和 16 条完成目标与源文件一致', async () => {
  await go('拓展学习');
  await expect(page.locator('.framework-board-card')).toHaveCount(8);
  await expect(page.locator('.framework-board-card h2')).toHaveText(framework.boards.map(board => board.title));
  for (const board of framework.boards) {
    await page.locator(`[data-board-id="${board.id}"]`).click();
    await expect(page.getByRole('heading', { name: board.title, exact: true, level: 1 })).toBeVisible();
    await expect(page.locator('.bridge-copy p')).toHaveText([board.description, board.a1_bridge, board.a2_bridge]);
    await expect(page.locator('.completion-goals li p')).toHaveText(board.completion_criteria);
    await expect(page.locator('.framework-unit-title strong')).toHaveText(board.units.map(unit => unit.title));
    await page.getByRole('link', { name: '返回 A1 拓展目录' }).click();
  }
  await expect(page.locator('.framework-board-card')).toHaveCount(8);
  await capture('test-results/deutschlab-a1-directory.png');
});

test('68 个单元保留原有纲要；两个已开放专题有内容，其余仍是占位', async () => {
  test.setTimeout(60000);
  const units = framework.boards.flatMap(board => board.units);
  for (const unit of units) {
    await page.evaluate(id => { location.hash = `/topics/${id}`; }, unit.id);
    await expect(page.getByRole('heading', { name: unit.title, exact: true, level: 1 })).toBeVisible();
    if (['A1-B03-U01', 'A1-B06-U04'].includes(unit.id)) {
      await expect(page.locator('.extension-section')).toHaveCount(unit.outline.length);
      for (const item of unit.outline) await expect(page.locator('.extension-section .mini-label').filter({ hasText: item.text })).toHaveCount(1);
      await expect(page.getByText('完整专题已开放', { exact: true })).toBeVisible();
    } else {
      await expect(page.locator('.outline-list li p')).toHaveText(unit.outline.map(item => item.text));
      expect(await page.locator('.outline-list li').evaluateAll(items => items.map(item => item.getAttribute('data-outline-id')))).toEqual(unit.outline.map(item => item.id));
      await expect(page.getByRole('heading', { name: '尚未关联主线', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: '尚未开放', exact: true })).toBeVisible();
      await expect(page.locator('.framework-status-card').getByText('未开始', { exact: true })).toBeVisible();
      await expect(page.locator('.framework-status-card').getByText('未评估', { exact: true })).toBeVisible();
    }
  }
  const snapshot = await page.evaluate(() => window.deutschlab!.getSnapshot());
  expect(snapshot.frameworkProgress).toEqual({ learning: {}, application: {} });
  await capture('test-results/deutschlab-a1-unit.png');
});

test('A1 标题/细分内容搜索，以及能力树 8 分支 68 节点共享同一专题路由', async () => {
  await go('拓展学习');
  await page.getByRole('textbox', { name: '搜索 A1 拓展目录' }).fill('ä/ö/ü');
  await expect(page.locator('.framework-result')).toHaveCount(1);
  await expect(page.locator('.framework-result h2')).toHaveText('发音与拼读预备');
  await page.getByRole('textbox', { name: '搜索 A1 拓展目录' }).fill('not-a-topic-987');
  await expect(page.getByRole('heading', { name: '没有找到相关单元' })).toBeVisible();
  await page.getByRole('button', { name: '清除搜索', exact: true }).click();
  await go('学习统计');
  await page.getByRole('button', { name: '德语能力树', exact: true }).click();
  await expect(page.locator('.ability-branch')).toHaveCount(8);
  await expect(page.locator('.ability-topic')).toHaveCount(68);
  const links = await page.locator('.ability-topic').evaluateAll(items => items.map(item => ({ id: item.getAttribute('data-ability-node-id'), unit: item.getAttribute('data-source-unit-id'), href: item.getAttribute('href') })));
  const nodes = ability.tree.children.flatMap(branch => branch.children);
  expect(links).toEqual(nodes.map(node => ({ id: node.id, unit: node.source_catalog_id, href: `#/topics/${node.source_catalog_id}` })));
  await expect(page.locator('.ability-topic').getByText('学习：未开始', { exact: true })).toHaveCount(68);
  await expect(page.locator('.ability-topic').getByText('运用：未评估', { exact: true })).toHaveCount(68);
  await page.getByRole('button', { name: '全部收起' }).click();
  await expect(page.locator('.ability-topic')).toHaveCount(0);
  await page.getByRole('button', { name: '全部展开' }).click();
  await expect(page.locator('.ability-topic')).toHaveCount(68);
  await capture('test-results/deutschlab-a1-ability.png');
  await page.locator('.ability-topic').last().click();
  await expect(page.locator('[data-framework-unit-id]')).toHaveAttribute('data-framework-unit-id', nodes.at(-1)!.source_catalog_id);
});

test('五档字号及自定义即时生效，非法输入不会更改页面字号', async () => {
  await go('个人设置');
  const select = page.getByRole('combobox', { name: '界面文字大小', exact: true });
  for (const [value, pixels] of [['small', 12], ['standard', 14], ['large', 16], ['extra-large', 18], ['largest', 20]] as const) {
    await select.selectOption(value);
    await expect(page.locator('html')).toHaveCSS('font-size', `${pixels}px`);
  }
  await select.selectOption('custom');
  const input = page.getByRole('spinbutton', { name: '自定义字号', exact: true });
  await expect(input).toHaveValue('20');
  for (const invalid of ['', '11', '25', '14.5']) {
    await input.fill(invalid);
    await page.getByRole('button', { name: '应用', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('请输入 12–24 之间的整数。');
    await expect(page.locator('html')).toHaveCSS('font-size', '20px');
  }
  await input.fill('19');
  await input.press('Enter');
  await expect(page.locator('html')).toHaveCSS('font-size', '19px');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await go('拓展学习');
  await expect(page.locator('h1')).toHaveCSS('font-size', '38px');
  await go('个人设置');
  await expect(select).toHaveValue('custom');
  await expect(input).toHaveValue('19');
  await capture('test-results/deutschlab-font-size.png');
  await select.selectOption('standard');
  await expect(page.locator('html')).toHaveCSS('font-size', '14px');
});

test('A1 新目录、板块、单元与能力树在最小窗口和最大字号中没有横向溢出', async () => {
  await go('个人设置');
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('large');
  await expect(page.locator('html')).toHaveAttribute('data-font-size', 'large');
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('custom');
  await page.getByRole('spinbutton', { name: '自定义字号', exact: true }).fill('24');
  await page.getByRole('button', { name: '应用', exact: true }).click();
  await expect(page.locator('html')).toHaveCSS('font-size', '24px');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(960, 640));
  for (const path of ['/topics', '/topics/boards/A1-B01', '/topics/A1-B01-U01', '/statistics?tab=skills']) {
    await page.evaluate(path => { location.hash = path; }, path);
    await expect(page.locator('.framework-notice')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), path).toBe(false);
  }
  await go('个人设置');
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('standard');
  await expect(page.locator('html')).toHaveAttribute('data-font-size', 'standard');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1360, 900));
});

test('设置与浏览记录经过完整退出重开后保留，数据弹窗可关闭', async () => {
  await go('个人设置');
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('custom');
  await page.getByRole('spinbutton', { name: '自定义字号', exact: true }).fill('19');
  await page.getByRole('button', { name: '应用', exact: true }).click();
  await expect(page.locator('html')).toHaveCSS('font-size', '19px');
  await page.getByRole('combobox', { name: '当前学习等级', exact: true }).selectOption('A2');
  await expect(page.getByRole('status')).toHaveText('设置已保存到本地。');
  await page.getByRole('switch', { name: '减少动态效果', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  await page.getByRole('button', { name: '查看数据位置' }).click();
  await expect(page.getByRole('dialog')).toContainText('deutschlab.sqlite');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  const before = await page.evaluate(() => window.deutschlab!.getSnapshot());
  await app.close();
  await launch();
  await go('个人设置');
  await expect(page.getByRole('combobox', { name: '当前学习等级', exact: true })).toHaveValue('A2');
  await expect(page.getByRole('combobox', { name: '界面文字大小', exact: true })).toHaveValue('custom');
  await expect(page.getByRole('spinbutton', { name: '自定义字号', exact: true })).toHaveValue('19');
  await expect(page.locator('html')).toHaveCSS('font-size', '19px');
  await expect(page.getByRole('switch', { name: '减少动态效果', exact: true })).toBeChecked();
  const after = await page.evaluate(() => window.deutschlab!.getSnapshot());
  expect(after.visits).toEqual(before.visits);
  await page.getByRole('combobox', { name: '当前学习等级', exact: true }).selectOption('A1');
  await expect(page.getByRole('status')).toHaveText('设置已保存到本地。');
});

test('桌面窗口适配、最大字号和未知路由不会出现横向溢出', async () => {
  await go('个人设置');
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('large');
  await expect(page.locator('html')).toHaveAttribute('data-font-size', 'large');
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('custom');
  await page.getByRole('spinbutton', { name: '自定义字号', exact: true }).fill('24');
  await page.getByRole('button', { name: '应用', exact: true }).click();
  await expect(page.locator('html')).toHaveCSS('font-size', '24px');
  for (const [width, height] of [[960, 640], [1280, 820], [1680, 1040]]) {
    await app.evaluate(({ BrowserWindow }, size) => BrowserWindow.getAllWindows()[0].setContentSize(size[0], size[1]), [width, height]);
    for (const label of ['学习工作台', '主线学习', '拓展学习', '趣味副本', '知识星系', '学习统计', '个人设置']) {
      await go(label);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow, `${label} at ${width} x ${height}`).toBe(false);
      if (width === 960 && ['学习工作台', '个人设置'].includes(label)) {
        await capture(`test-results/deutschlab-max-font-${label === '个人设置' ? 'settings' : 'home'}.png`);
      }
    }
  }
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('standard');
  await expect(page.locator('html')).toHaveAttribute('data-font-size', 'standard');
  await page.evaluate(() => { location.hash = '/not-found'; });
  await expect(page.getByRole('heading', { name: '这里还没有页面' })).toBeVisible();
  await page.getByRole('link', { name: '返回工作台', exact: true }).click();
});

test('打包资源离线可用，没有页面异常或远程请求', async () => {
  await app.context().setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: '学习工作台', exact: true })).toBeVisible();
  await go('趣味副本');
  await page.locator('.quest-library-card').click();
  await expect(page.getByRole('heading', { name: '清晨的面包房', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(remoteRequests).toEqual([]);
  await go('学习工作台');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1360, 900));
  await page.screenshot({ path: 'test-results/deutschlab-home.png', fullPage: true, animations: 'disabled' });
  await go('趣味副本');
  await page.locator('.quest-library-card').click();
  await expect(page.getByRole('heading', { name: '清晨的面包房', exact: true })).toBeVisible();
  await page.screenshot({ path: 'test-results/deutschlab-quest.png', fullPage: true, animations: 'disabled' });
});

test('真实第一单元、知识卡专注模式、小节练习和重启续学', async () => {
  await go('主线学习');
  await page.locator('.studio-feature-course').click();
  await expect(page.locator('.studio-section-card')).toHaveCount(4);
  await page.getByLabel('已完成录播课').check();
  await page.locator('.studio-section-card').first().click();
  await page.locator('.studio-card-row').first().click();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await expect(page.locator('.knowledge-body')).toContainText('Guten Tag. Ich heiße Mia.');
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: '基础巩固' }).click();
  await expect(page.locator('.focus-question')).toBeVisible();
  const started = await page.evaluate(() => window.deutschlab!.getSnapshot());
  const session = started.courseProgress.sessions[0];
  expect(session.questionIds).toHaveLength(12);
  const first = studio.questions.find((q: { id: string }) => q.id === session.questionIds![0]);
  await expect(page.locator('.focus-question')).toHaveText(first.prompt);
  await page.getByRole('button', { name: '查看相关知识' }).click();
  await expect(page.getByRole('dialog', { name: '相关知识卡' })).toBeVisible();
  await page.getByRole('button', { name: '返回题目' }).click();
  await answerCurrent(first);
  await expect(page.getByRole('status')).toContainText('回答正确');
  await page.getByRole('link', { name: '退出专注' }).click();
  await app.close();
  await launch();
  await go('主线学习');
  await page.locator('.studio-feature-course').click();
  await expect(page.getByLabel('已完成录播课')).toBeChecked();
  await page.locator('.studio-section-card').first().click();
  await page.getByRole('link', { name: '基础巩固' }).click();
  await expect(page.locator('.focus-question')).toBeVisible();
  const resumed = await page.evaluate(() => window.deutschlab!.getSnapshot());
  expect(resumed.courseProgress.sessions[0].id).toBe(session.id);
  expect(resumed.courseProgress.attempts[0].cardViewed).toBe(true);
  for (const id of session.questionIds!.slice(1)) {
    const question = studio.questions.find((q: { id: string }) => q.id === id);
    await answerCurrent(question);
    await expect(page.getByRole('status')).toContainText('回答正确');
    await page.getByRole('button', { name: id === session.questionIds!.at(-1) ? '查看结果' : '下一题' }).click();
  }
  await expect(page.locator('.focus-result')).toContainText('12 / 12');
  const saved = await page.evaluate(() => window.deutschlab!.getSnapshot());
  expect(saved.courseProgress.attempts.filter(a => a.sessionId === session.id)).toHaveLength(12);
  expect(saved.frameworkProgress.application).toEqual({});
  await capture('test-results/deutschlab-studio-focus-result.png');
});

test('四题型与综合检测可作答，错误知识点可回看且重练产生新记录', async () => {
  if (await page.locator('.focus-shell').count()) await page.getByRole('link', { name: '返回课程' }).click();
  await go('主线学习');
  await page.locator('.studio-feature-course').click();
  const before = await page.evaluate(() => window.deutschlab!.getSnapshot());
  const priorAttempts = before.courseProgress.attempts.length;
  const priorAssessments = before.courseProgress.sessions.filter(session => session.scope === 'assessment').length;
  await page.getByRole('link', { name: '进入专注检测' }).click();
  const questions = studio.questions.filter((question: { sectionId: string }) => question.sectionId === 'assessment');
  for (const [index, question] of questions.entries()) {
    await expect(page.locator('.focus-question')).toHaveText(question.prompt);
    if (question.type === 'single') {
      const option = question.options.find((item: { id: string }) => item.id === (index === 0 ? 'b' : question.answer));
      await page.locator('.focus-options').getByRole('button', { name: new RegExp(option.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
    } else if (question.type === 'fill') {
      await page.getByRole('textbox', { name: '你的答案' }).fill(question.answer.toUpperCase());
    } else if (question.type === 'match') {
      for (const [i, left] of question.left.entries()) await page.getByRole('combobox', { name: `${left.text} 对应的答案` }).selectOption(question.answer[i]);
    } else {
      for (const id of question.answer) {
        const token = question.tokens.find((item: { id: string }) => item.id === id);
        await page.locator('.focus-token-row:not(.chosen)').getByRole('button', { name: token.text, exact: true }).click();
      }
    }
    await page.getByRole('button', { name: '提交答案' }).click();
    await expect(page.getByRole('status')).toContainText(index === 0 ? '这次还没答对' : '回答正确');
    await page.getByRole('button', { name: index === questions.length - 1 ? '查看结果' : '下一题' }).click();
  }
  await expect(page.getByRole('heading', { name: '单元检测结果' })).toBeVisible();
  await expect(page.locator('.focus-result')).toContainText('17 / 18');
  await expect(page.locator('.focus-result')).toContainText('问候与自我介绍');
  let snapshot = await page.evaluate(() => window.deutschlab!.getSnapshot());
  expect(snapshot.courseProgress.attempts.length).toBe(priorAttempts + 18);
  expect(snapshot.frameworkProgress.application).toEqual({});
  await page.getByRole('button', { name: '再次练习' }).click();
  await expect(page.locator('.focus-question')).toHaveText(questions[0].prompt);
  snapshot = await page.evaluate(() => window.deutschlab!.getSnapshot());
  expect(snapshot.courseProgress.sessions.filter(session => session.scope === 'assessment').length).toBe(priorAssessments + 2);
  await page.getByRole('link', { name: '退出专注' }).click();
  await go('学习统计');
  await page.getByRole('button', { name: '学习记录', exact: true }).click();
  await expect(page.locator('.studio-record-row')).toHaveCount(Math.min(30, priorAttempts + 18));
  await expect(page.locator('.studio-records')).toContainText('问候与自我介绍');
  await capture('test-results/deutschlab-studio-records.png');
});

test('四个小节都能打开知识卡与练习，搜索可回到单元，草稿退出有提示', async () => {
  if (await page.locator('.focus-shell').count()) await page.getByRole('link', { name: '返回课程' }).click();
  await go('主线学习');
  await page.locator('.studio-feature-course').click();
  await page.getByRole('searchbox', { name: '检索第一单元知识卡' }).fill('siebzig');
  await expect(page.locator('.studio-search-results a')).toHaveCount(1);
  await page.locator('.studio-search-results a').click();
  await expect(page.getByRole('heading', { name: '数字易错点', exact: true })).toBeVisible();
  await capture('test-results/deutschlab-studio-card.png');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Lektion 1 · Kaffee oder Tee?', exact: true })).toBeVisible();
  for (const [index, section] of studio.unit.sections.entries()) {
    await page.locator('.studio-section-card').nth(index).click();
    await expect(page.getByRole('heading', { name: section.title, exact: true })).toBeVisible();
    await expect(page.locator('.studio-card-row')).toHaveCount(section.cardIds.length);
    await page.getByRole('link', { name: '基础巩固' }).click();
    await expect(page.locator('.focus-question')).toBeVisible();
    await expect(page.locator('.sidebar')).toHaveCount(0);
    const state = await page.evaluate(() => window.deutschlab!.getSnapshot());
    const first = studio.questions.find((question: { id: string }) => question.id === state.courseProgress.sessions[0].questionIds![0]);
    await expect(page.locator('.focus-question')).toHaveText(first.prompt);
    if (index === 0) await capture('test-results/deutschlab-studio-question.png');
    if (index === 1) {
      if (first.type === 'single') await page.locator('.focus-options button').first().click();
      else if (first.type === 'fill') await page.getByRole('textbox', { name: '你的答案' }).fill('Entwurf');
      else if (first.type === 'match') await page.getByRole('combobox').first().selectOption(first.answer[0]);
      else await page.locator('.focus-token-row:not(.chosen) button').first().click();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog', { name: '退出练习' })).toContainText('未提交的答案');
      await page.getByRole('button', { name: '继续作答' }).click();
      if (first.type === 'order') await page.locator('.focus-token-row.chosen button').first().click();
      else if (first.type === 'match') await page.getByRole('combobox').first().selectOption('');
    }
    await answerCurrent(first);
    await expect(page.getByRole('status')).toContainText('回答正确');
    await page.getByRole('link', { name: '退出专注' }).click();
    await expect(page.getByRole('heading', { name: section.title, exact: true })).toBeVisible();
    await page.getByRole('link', { name: '返回单元总览' }).click();
  }
});

test('第一单元和专注模式在最小桌面窗口、最大字号下可以使用', async () => {
  await go('个人设置');
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('custom');
  await page.getByRole('spinbutton', { name: '自定义字号' }).fill('24');
  await page.getByRole('button', { name: '应用', exact: true }).click();
  await expect(page.locator('html')).toHaveCSS('font-size', '24px');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(960, 640));
  await go('主线学习');
  await page.locator('.studio-feature-course').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator('.studio-section-card').first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator('.studio-card-row').first().click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole('link', { name: '开始本节练习' }).click();
  await expect(page.locator('.focus-question')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole('link', { name: '退出专注' }).click();
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1360, 900));
  await go('个人设置');
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('standard');
});

test('两个 A1 拓展专题可从原目录进入，知识卡与练习复用专注模式并保留记录', async () => {
  test.setTimeout(60000);
  await go('个人设置');
  await page.getByRole('combobox', { name: '界面文字大小', exact: true }).selectOption('custom');
  await page.getByRole('spinbutton', { name: '自定义字号' }).fill('24');
  await page.getByRole('button', { name: '应用', exact: true }).click();
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(960, 640));
  await go('拓展学习');
  await page.locator('[data-board-id="A1-B03"]').click();
  await page.locator('[data-unit-id="A1-B03-U01"]').click();
  await expect(page.getByRole('heading', { name: '数字与基础数量', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('.extension-section')).toHaveCount(3);
  await expect(page.locator('.extension-vocab')).toHaveCount(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator('.extension-card-links a').first().click();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await expect(page.locator('.knowledge-body')).toContainText('sechzehn');
  await page.getByRole('link', { name: '下一个' }).click();
  await expect(page.locator('.focus-meta')).toContainText('数字与基础数量');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: '数字与基础数量', exact: true, level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /开始或继续练习/ }).click();
  await expect(page.locator('.focus-question')).toBeVisible();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await expect(page.getByText(/Level [123]/)).toBeVisible();
  const started = await page.evaluate(() => window.deutschlab!.getSnapshot());
  const session = started.extensionProgress.sessions[0];
  expect(session.itemIds).toHaveLength(9);
  await page.getByRole('button', { name: '查看相关知识' }).click();
  await expect(page.getByRole('dialog', { name: '相关专题知识' })).toBeVisible();
  await page.getByRole('button', { name: '返回题目' }).click();
  await page.locator('.focus-options button').first().click();
  await page.getByRole('button', { name: '保存本题' }).click();
  await expect(page.locator('.focus-feedback')).toContainText('参考答案');
  await page.getByRole('link', { name: '退出专注' }).click();
  await app.close();
  await launch();
  await go('拓展学习');
  await page.locator('[data-board-id="A1-B03"]').click();
  await page.locator('[data-unit-id="A1-B03-U01"]').click();
  await page.getByRole('link', { name: /开始或继续练习/ }).click();
  const resumed = await page.evaluate(() => window.deutschlab!.getSnapshot());
  expect(resumed.extensionProgress.sessions[0].id).toBe(session.id);
  expect(resumed.extensionProgress.attempts.filter(item => item.sessionId === session.id)).toHaveLength(1);
  await expect(page.locator('.focus-question')).toBeVisible();
  await page.getByRole('link', { name: '退出专注' }).click();
  await go('拓展学习');
  await page.locator('[data-board-id="A1-B06"]').click();
  await page.locator('[data-unit-id="A1-B06-U04"]').click();
  await expect(page.getByRole('heading', { name: '饮料', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('.extension-vocab')).toHaveCount(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator('.extension-tasks a').first().click();
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await page.getByRole('textbox', { name: '写出你的短句' }).fill('Ich trinke gern Tee.');
  await page.getByRole('button', { name: '查看参考答案并自我核对' }).click();
  await expect(page.locator('.extension-reference')).toContainText('常见错误');
  await page.getByRole('button', { name: '需要巩固' }).click();
  await page.getByRole('button', { name: '保存本题' }).click();
  await expect(page.locator('.focus-feedback')).toContainText('自核对');
  await page.getByRole('button', { name: '下一题' }).click();
  await page.getByRole('link', { name: '退出专注' }).click();
  const saved = await page.evaluate(() => window.deutschlab!.getSnapshot());
  expect(saved.extensionProgress.attempts.some(item => item.topicId === 'A1-B06-U04' && item.selfCheck === 'needs_work')).toBe(true);
  expect(saved.frameworkProgress.application[ability.tree.children[5].children[3].id].status).toBe('in_practice');
  expect(saved.frameworkProgress.application[ability.tree.children[5].children[4].id]).toBeUndefined();
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1360, 900));
  expect(errors).toEqual([]);
});
