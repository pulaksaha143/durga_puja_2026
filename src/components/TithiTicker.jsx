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

    // Check if we are during Durga Puja 2026 (Oct 14 to Oct 21, 2026)
    // For general testing, also handles other years/dates
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

    const pujaStartDate = new Date(2026, 9, 15); // Oct 15, 2026
    const diffTime = pujaStartDate - now;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      activeDay,
      daysLeft: daysLeft > 0 ? daysLeft : null,
    };
  }, [schedule]);

  // Construct ticker items
  const items = useMemo(() => {
    if (tickerData.activeDay) {
      const day = tickerData.activeDay;
      const ritual = day.ritualsAndTimings?.[0];
      return [
        `🔴 আজ ${day.festivalDayBen} (${day.festivalDayEng})`,
        `⏰ তিথি: ${day.tithiStart?.time} থেকে ${day.tithiEnd?.time}`,
        ritual ? `🪔 বিশেষ পূজা: ${ritual.eventBen} (${ritual.timeEng})` : null,
        `🍛 সার্বজনীন ভোগ বিতরণ: দুপুর ১২:৩০ - ৩:০০`,
        `🔔 সান্ধ্য আরতি: সন্ধ্যা ৭:০০ - ৮:৩০`,
        `👉 সম্পূর্ণ পুজো ও পঞ্চিকা সময়সূচী দেখতে ক্লিক করুন`
      ].filter(Boolean);
    }

    // Upcoming Schedule Ticker
    return [
      tickerData.daysLeft !== null ? `⏳ দুর্গাপূজা ২০২৬ বাকি: ${tickerData.daysLeft} দিন` : `🪔 দুর্গাপূজা ২০২৬ পঞ্জিকা সময়সূচী`,
      `🌸 পঞ্চমী: ১৪ অক্টোবর (রাত্রি ১১:৫১ এর পর)`,
      `🔔 মহাষষ্ঠী (বোধন ও আমন্ত্রণ): ১৬ অক্টোবর সায়ংকালে`,
      `🌿 মহাসপ্তমী (নবপত্রিকা স্নান ও প্রবেশ): ১৭ অক্টোবর সকাল ৭:০৪ - ৯:২৮`,
      `🔥 মহাষ্টমী ও সন্ধিপূজা: ১৯ অক্টোবর সকাল ৭:২৬ এর মধ্যে`,
      `🪔 মহানবমী পূজা ও ব্রত সমাপন: ২০ অক্টোবর সকাল ৯:২৮ এর মধ্যে`,
      `🌺 বিজয়া দশমী ও বিসর্জন: ২১ অক্টোবর সকাল ৮:৩১ এর মধ্যে`,
      `👉 বিস্তারিত নির্ঘণ্ট দেখতে এখানে ট্যাপ করুন`
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
          {tickerData.activeDay ? 'আজকের তিথি' : 'সময়সূচী'}
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
