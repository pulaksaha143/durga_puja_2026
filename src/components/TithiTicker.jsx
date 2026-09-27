import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import timings from '../data/timings.json';

const getEngTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.includes(' / ') ? timeStr.split(' / ')[1].trim() : timeStr.trim();
};

export default function TithiTicker() {
  const pujaData = timings.durgaPuja2026;
  const schedule = pujaData.schedule;

  const tickerData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (9 = Oct)
    const currentDate = now.getDate();

    // Check if today falls on an exact Puja Day in October 2026
    let activeDay = null;

    if (currentYear === 2026 && currentMonth === 9) {
      if (currentDate === 14 || currentDate === 15) {
        activeDay = schedule.find(s => s.festivalDayEng === 'Panchami');
      } else if (currentDate === 16) {
        activeDay = schedule.find(s => s.festivalDayEng === 'Shasthi');
      } else if (currentDate === 17) {
        activeDay = schedule.find(s => s.festivalDayEng === 'Saptami (Day 1)');
      } else if (currentDate === 18) {
        activeDay = schedule.find(s => s.festivalDayEng === 'Saptami (Day 2)');
      } else if (currentDate === 19) {
        activeDay = schedule.find(s => s.festivalDayEng === 'Ashtami');
      } else if (currentDate === 20) {
        activeDay = schedule.find(s => s.festivalDayEng === 'Navami');
      } else if (currentDate === 21) {
        activeDay = schedule.find(s => s.festivalDayEng === 'Vijaya Dashami');
      }
    }

    return { activeDay };
  }, [schedule]);

  // Construct items strictly using data from timings.json (no emojis, no external data)
  const items = useMemo(() => {
    // If today is a festival date, ONLY display this specific day's schedule from timings.json
    if (tickerData.activeDay) {
      const day = tickerData.activeDay;
      const startTime = getEngTime(day.tithiStart?.time);
      const endTime = getEngTime(day.tithiEnd?.time);

      const ritualItems = (day.ritualsAndTimings || []).map(
        r => `${r.eventEng}: ${r.timeEng}`
      );

      return [
        `TODAY: ${day.festivalDayEng}`,
        `Tithi: ${day.tithiStart.englishDate} (${startTime}) to ${day.tithiEnd.englishDate} (${endTime})`,
        ...ritualItems
      ];
    }

    // Before or outside the festival schedule: build items strictly from timings.json
    const allItems = [];

    schedule.forEach(day => {
      const startTime = getEngTime(day.tithiStart?.time);
      const endTime = getEngTime(day.tithiEnd?.time);

      allItems.push(
        `${day.festivalDayEng}: ${day.tithiStart.englishDate} (${startTime}) to ${day.tithiEnd.englishDate} (${endTime})`
      );

      (day.ritualsAndTimings || []).forEach(r => {
        allItems.push(`${r.eventEng}: ${r.timeEng}`);
      });
    });

    if (pujaData.goddessTransit) {
      allItems.push(`Goddess Arrival: ${pujaData.goddessTransit.arrival.english}`);
      allItems.push(`Goddess Departure: ${pujaData.goddessTransit.departure.english}`);
    }

    return allItems;
  }, [tickerData, schedule, pujaData]);

  // Duplicate items for seamless infinite marquee scroll
  const marqueeItems = [...items, ...items];

  return (
    <div className="tithi-ticker-bar">
      <div className="tithi-ticker-label">
        <span className="ticker-label-text">
          {tickerData.activeDay ? "TODAY'S TITHI" : "TITHI SCHEDULE"}
        </span>
      </div>

      <Link to="/schedule" className="tithi-ticker-track-link" title="View Full Puja Schedule">
        <div className="tithi-ticker-track">
          {marqueeItems.map((text, idx) => (
            <span key={idx} className="tithi-ticker-item">
              {text}
              <span className="ticker-divider">•</span>
            </span>
          ))}
        </div>
      </Link>
    </div>
  );
}
