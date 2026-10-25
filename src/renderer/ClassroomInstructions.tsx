import { classroomInstructions } from '../domain/studio21';

export function ClassroomInstructions({ compact = false }: { compact?: boolean }) {
  return <details className={`classroom-instructions ${compact ? 'compact' : ''}`}>
    <summary>常见教材指令 · 点开查看中文</summary>
    <p className="help-text">{classroomInstructions.sourceNote}</p>
    <dl>{classroomInstructions.items.map(item => <div key={item.id}><dt lang="de">{item.german}</dt><dd><strong>{item.chinese}</strong><span>{item.action}</span></dd></div>)}</dl>
  </details>;
}
