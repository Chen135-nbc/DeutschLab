import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, Construction, X, type LucideIcon } from 'lucide-react';

export function Badge({ children = 'DEMO', tone = 'demo' }: { children?: ReactNode; tone?: 'demo' | 'muted' | 'green' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Card({ children, className = '', ...attributes }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section className={`card ${className}`} {...attributes}>{children}</section>;
}
export function Page({ eyebrow, title, description, children, action }: { eyebrow: string; title: string; description: string; children: ReactNode; action?: ReactNode }) {
  return <div className="page"><header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</header>{children}</div>;
}
export function SectionHeading({ title, subtitle, to, linkLabel = '查看全部' }: { title: string; subtitle?: string; to?: string; linkLabel?: string }) {
  return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{to && <Link className="text-link" to={to}>{linkLabel}<ArrowUpRight size={15} /></Link>}</div>;
}
export function Placeholder({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return <div className={`placeholder ${compact ? 'compact' : ''}`}><span className="placeholder-icon"><Construction size={22} strokeWidth={1.5} /></span><Badge tone="muted">后续阶段</Badge><h3>{title}</h3><p>{description}</p></div>;
}
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-orbit" aria-hidden="true"><span /></div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function DemoNotice({ children }: { children?: ReactNode }) {
  return <div className="demo-notice"><Badge /> <p>{children ?? '以下为原创 A1 演示内容，用于体验界面结构，不是 Studio21 真实教材章节。'}</p></div>;
}
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link className="back-link" to={to}><ChevronRight size={15} />{children}</Link>;
}
export function ModuleLink({ icon: Icon, title, description, to, color = 'sage' }: { icon: LucideIcon; title: string; description: string; to: string; color?: string }) {
  return <Link className="module-link" to={to}><span className={`icon-tile ${color}`}><Icon size={23} strokeWidth={1.6} /></span><div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight size={18} className="trailing-icon" /></Link>;
}
export function Modal({ open, onClose, title, children }: { open: boolean; onClose(): void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    else if (!open && ref.current?.open) ref.current?.close();
  }, [open]);
  return <dialog ref={ref} onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === ref.current) onClose(); }} aria-labelledby="modal-title">
    <header className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={20} /></button></header>
    <div className="modal-content">{children}</div>
    <footer><button className="button primary" onClick={onClose}>知道了</button></footer>
  </dialog>;
}
export function BakeryIllustration() {
  return <svg className="bakery-art" viewBox="0 0 480 270" fill="none" aria-hidden="true">
    <circle cx="350" cy="67" r="38" fill="#dfbe85" opacity=".7" />
    <path d="M38 229H442" stroke="#607767" opacity=".3" />
    <path d="M94 120L240 46L386 120" stroke="#546d5c" strokeWidth="2" />
    <path d="M112 114H368V228H112V114Z" fill="#f8f3e7" stroke="#546d5c" strokeWidth="2" />
    <path d="M99 122H381L369 154H112L99 122Z" fill="#536d5a" />
    <path d="M141 122L149 154M187 122L191 154M239 122V154M291 122L286 154M339 122L332 154" stroke="#e9e3cc" strokeWidth="20" />
    <path d="M140 175H225V217H140V175Z" fill="#d8e1d2" stroke="#546d5c" strokeWidth="1.5" />
    <path d="M251 170H330V228H251V170Z" fill="#d8e1d2" stroke="#546d5c" strokeWidth="1.5" />
    <path d="M290 170V228M140 197H225" stroke="#546d5c" strokeWidth="1.5" />
    <circle cx="311" cy="203" r="2.5" fill="#546d5c" />
    <path d="M158 204C147 194 164 177 177 184C188 174 206 183 202 198L198 204H158Z" fill="#c6a275" />
    <path d="M166 190L171 198M181 186L186 197" stroke="#f8f3e7" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 229V176M64 206C42 202 41 185 64 187M64 195C81 191 86 174 65 178" stroke="#607767" strokeWidth="2" />
    <path d="M411 229V192M411 209C393 204 396 190 411 196M411 204C429 201 430 185 411 188" stroke="#607767" strokeWidth="2" />
    <rect x="175" y="85" width="130" height="23" rx="2" fill="#546d5c" />
    <text x="240" y="100" textAnchor="middle" fontFamily="Georgia, serif" fontSize="12" letterSpacing="2" fill="#f8f3e7">BÄCKEREI</text>
  </svg>;
}
export function DeskIllustration() {
  return <svg className="desk-art" viewBox="0 0 300 230" fill="none" aria-hidden="true">
    <circle cx="174" cy="101" r="73" stroke="currentColor" opacity=".2" />
    <circle cx="174" cy="101" r="53" stroke="currentColor" opacity=".15" />
    <path d="M74 178H254M205 151V83M205 123C169 120 172 94 205 108M205 106C237 99 241 77 206 86" stroke="currentColor" strokeWidth="2" opacity=".6" />
    <path d="M190 151H220L217 176H193L190 151Z" fill="currentColor" opacity=".25" />
    <path d="M86 167H174V176H86V167Z" fill="currentColor" opacity=".65" />
    <path d="M93 154H168V166H93V154Z" fill="currentColor" opacity=".3" />
    <path d="M104 144H175V153H104V144Z" fill="currentColor" opacity=".5" />
    <path d="M109 134L132 106L162 131L149 145L109 134Z" stroke="currentColor" strokeWidth="1.5" opacity=".6" />
    <text x="131" y="78" fill="currentColor" fontFamily="Georgia, serif" fontSize="38" opacity=".8">Aa</text>
    <path d="M89 89H117M230 136H247M239 128V144" stroke="currentColor" opacity=".4" />
  </svg>;
}
