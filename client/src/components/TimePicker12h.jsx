import { parseTimeTo12h, time12hTo24h } from '../lib/formatters';

export default function TimePicker12h({ value, onChange, className = '', disabled = false }) {
  const { hour, minute, period } = parseTimeTo12h(value || '17:00');

  const handleHourChange = (newHour) => {
    onChange(time12hTo24h(newHour, minute, period));
  };

  const handleMinuteChange = (newMin) => {
    onChange(time12hTo24h(hour, newMin, period));
  };

  const handlePeriodChange = (newPeriod) => {
    onChange(time12hTo24h(hour, minute, newPeriod));
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesList = ['00', '15', '30', '45'];

  return (
    <div className={`flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs shadow-sm ${className}`}>
      {/* Hour Select */}
      <select
        value={hour}
        disabled={disabled}
        onChange={(e) => handleHourChange(e.target.value)}
        className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer py-1 px-1 rounded hover:bg-slate-50"
      >
        {hoursList.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="font-bold text-slate-400">:</span>

      {/* Minute Select */}
      <select
        value={minute}
        disabled={disabled}
        onChange={(e) => handleMinuteChange(e.target.value)}
        className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer py-1 px-1 rounded hover:bg-slate-50"
      >
        {minutesList.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* Period Toggle (ص / م) */}
      <div className="flex rounded bg-slate-100 p-0.5 ml-1 border border-slate-200/60">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handlePeriodChange('am')}
          className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all ${
            period === 'am'
              ? 'bg-[#0C3C82] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="صباحاً"
        >
          ص
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handlePeriodChange('pm')}
          className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-all ${
            period === 'pm'
              ? 'bg-[#0C3C82] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="مساءً"
        >
          م
        </button>
      </div>
    </div>
  );
}
