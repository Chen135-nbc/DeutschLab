import { useEffect, useState } from 'react';
import { fontSizeOptions, fontSizePixels, fontSizeRange, isFontSize, type FontSize } from '../shared/typography';

export function FontSizeControl({ value, disabled, onChange }: {
  value: FontSize;
  disabled: boolean;
  onChange(value: FontSize): Promise<void>;
}) {
  const [custom, setCustom] = useState(String(fontSizePixels(value)));
  const [error, setError] = useState('');
  useEffect(() => { setCustom(String(fontSizePixels(value))); setError(''); }, [value]);

  return <div className="font-size-control">
    <select aria-label="界面文字大小" value={typeof value === 'number' ? 'custom' : value} disabled={disabled}
      onChange={event => void onChange(event.target.value === 'custom' ? fontSizePixels(value) : event.target.value as FontSize)}>
      {fontSizeOptions.map(option => <option key={option.value} value={option.value}>{option.label} · {option.pixels} px</option>)}
      <option value="custom">自定义字号</option>
    </select>
    {typeof value === 'number' && <form className="custom-font-size" noValidate onSubmit={event => {
      event.preventDefault();
      const pixels = Number(custom);
      if (!custom.trim() || !isFontSize(pixels)) { setError(`请输入 ${fontSizeRange.min}–${fontSizeRange.max} 之间的整数。`); return; }
      setError('');
      void onChange(pixels);
    }}>
      <div className="custom-font-input">
        <input aria-label="自定义字号" aria-describedby="font-size-hint" aria-invalid={!!error}
          type="number" min={fontSizeRange.min} max={fontSizeRange.max} step={1} value={custom} disabled={disabled}
          onChange={event => { setCustom(event.target.value); setError(''); }} />
        <span>px</span>
        <button className="button secondary" type="submit" disabled={disabled}>应用</button>
      </div>
      <p id="font-size-hint" className="help-text">{fontSizeRange.min}–{fontSizeRange.max} px，输入后按回车或点击应用。</p>
      {error && <p className="font-size-error" role="alert">{error}</p>}
    </form>}
  </div>;
}
