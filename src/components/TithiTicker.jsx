import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import timings from '../data/timings.json';

export default function TithiTicker() {
  const schedule = timings.durgaPuja2026.schedule;

  const tickerData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (9 = Oct)
    const currentDate = now.getDate();

    // Determine if today falls on an exact Puja Day (Oct 14 to Oct 21, 2026)
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

    const pujaStartDate = new Date(2026, 9, 14, 23, 51, 0); // Oct 14, 2026 (Panchami start)
    const diffTime = pujaStartDate - now;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      activeDay,
      daysLeft: daysLeft > 0 ? daysLeft : null,
    };
  }, [schedule]);

  // Construct ticker items in English
  const items = useMemo(() => {
    // If today is an active puja date, ONLY show that specific day's schedule continuously
    if (tickerData.activeDay) {
      const day = tickerData.activeDay;
      const tithiStartTime = day.tithiStart?.time?.split(' / ')[1] || day.tithiStart?.time;
      const tithiEndTime = day.tithiEnd?.time?.split(' / ')[1] || day.tithiEnd?.time;

      const rituals = (day.ritualsAndTimings || []).map(r => `🪔 ${r.eventEng}: ${r.timeEng}`);

      return [
        `🔴 TODAY: Maha ${day.festivalDayEng}`,
        `⏰ Tithi Duration: ${day.tithiStart.englishDate} (${tithiStartTime}) to ${day.tithiEnd.englishDate} (${tithiEndTime})`,
        ...rituals,
        `🍛 Sarbojanin Bhog Distribution: 12:30 PM – 3:00 PM`,
        `🔔 Evening Sandhya Aarti: 7:00 PM – 8:30 PM`,
        `👉 Tap for Full Puja Schedule & Ritual Timings`
      ].filter(Boolean);
    }

    // When before the schedule: show countdown and key upcoming dates in English
    return [
      tickerData.daysLeft !== null ? `⏳ Durga Puja 2026 Countdown: ${tickerData.daysLeft} Days to Go!` : `🪔 Durga Puja 2026 Schedule & Panchang`,
      `🌸 Maha Panchami: Oct 14 (Puja after 11:51 PM)`,
      `🔔 Maha Shasthi: Oct 16 (Bodhan & Amantran in Evening)`,
      `🌿 Maha Saptami: Oct 17 (Nabapatrika Snan: 7:04 AM – 9:28 AM)`,
      `🔥 Maha Ashtami: Oct 19 (Sandhi Puja within 7:26 AM)`,
      `🪔 Maha Navami: Oct 20 (Navami Puja within 9:28 AM)`,
      `🌺 Vijaya Dashami: Oct 21 (Bisarjan within 8:31 AM, Sindoor Khela)`,
      `👉 Tap anywhere to view the complete Puja Schedule`
    ];
  }, [tickerData]);

  // Duplicate items for seamless infinite scroll
  const marqueeItems = [...items, ...items];

  return (
    <div className="tithi-ticker-bar">
      <div className="tithi-ticker-label">
        <span className="material-symbols-outlined ticker-icon">
          {tickerData.activeDay ? 'notifications_active' : 'schedule'}
        </span>
        <span className="ticker-label-text">
          {tickerData.activeDay ? "TODAY'S TITHI" : "LIVE TITHI"}
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
