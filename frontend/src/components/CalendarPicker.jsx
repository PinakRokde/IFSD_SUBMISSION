import { useMemo, useState } from 'react';
import dayjs from 'dayjs';

const CalendarPicker = ({ value, onChange }) => {
  const initial = value ? dayjs(value) : dayjs();
  const [month, setMonth] = useState(initial.startOf('month'));
  const [time, setTime] = useState(initial.format('HH:mm'));

  const daysMatrix = useMemo(() => {
    const start = month.startOf('week');
    return Array.from({ length: 42 }, (_, idx) => start.add(idx, 'day'));
  }, [month]);

  const handleSelectDay = (date) => {
    const next = date.hour(Number(time.split(':')[0])).minute(Number(time.split(':')[1] || '0'));
    onChange(next.format('YYYY-MM-DDTHH:mm'));
  };

  const handleTimeChange = (evt) => {
    setTime(evt.target.value);
    const current = value ? dayjs(value) : dayjs();
    const next = current.hour(Number(evt.target.value.split(':')[0])).minute(Number(evt.target.value.split(':')[1] || '0'));
    onChange(next.format('YYYY-MM-DDTHH:mm'));
  };

  const isSelected = (date) => value && dayjs(value).isSame(date, 'day');
  const isToday = (date) => dayjs().isSame(date, 'day');

  return (
    <div className="calendar-picker">
      <div className="calendar-header">
        <button type="button" onClick={() => setMonth(month.subtract(1, 'month'))}>
          ‹
        </button>
        <p>{month.format('MMMM YYYY')}</p>
        <button type="button" onClick={() => setMonth(month.add(1, 'month'))}>
          ›
        </button>
      </div>
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <span key={label} className="calendar-weekday">
            {label}
          </span>
        ))}
        {daysMatrix.map((date) => {
          const outside = !date.isSame(month, 'month');
          return (
            <button
              type="button"
              key={date.format('YYYY-MM-DD')}
              className={`calendar-day ${outside ? 'muted' : ''} ${isToday(date) ? 'today' : ''} ${
                isSelected(date) ? 'selected' : ''
              }`}
              onClick={() => handleSelectDay(date)}
            >
              {date.date()}
            </button>
          );
        })}
      </div>
      <div className="calendar-time">
        <label>
          Time
          <input type="time" value={time} onChange={handleTimeChange} />
        </label>
      </div>
    </div>
  );
};

export default CalendarPicker;
