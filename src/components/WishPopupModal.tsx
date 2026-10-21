import React, { useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import { playCelebrationChime } from '../utils/sound';

export const WishPopupModal: React.FC = () => {
  const { activeWishPopup, setActiveWishPopup, settings } = useLeave();

  useEffect(() => {
    if (activeWishPopup && settings.wishSoundEnabled !== false) {
      playCelebrationChime();
    }
  }, [activeWishPopup, settings.wishSoundEnabled]);

  if (!activeWishPopup) return null;

  const handleClose = () => {
    setActiveWishPopup(null);
  };

  const handleReplayChime = () => {
    playCelebrationChime();
  };

  const isAnniversary = activeWishPopup.type === 'anniversary';
  const isWeekend = activeWishPopup.type === 'weekend';
  const isIndianHoliday = activeWishPopup.type === 'indian_holiday';
  const isPublicHoliday = activeWishPopup.type === 'public_holiday' || activeWishPopup.type === 'special_holiday';

  const gradientHeader = isAnniversary
    ? 'from-amber-500 via-rose-500 to-purple-600'
    : isWeekend
    ? 'from-emerald-500 via-teal-500 to-cyan-600'
    : isIndianHoliday
    ? 'from-orange-500 via-amber-500 to-rose-600'
    : isPublicHoliday
    ? 'from-red-500 via-rose-500 to-red-600'
    : 'from-primary via-secondary to-tertiary';

  const badgeText = isAnniversary
    ? 'Work Anniversary Milestone'
    : isWeekend
    ? 'Weekend Celebration Wish'
    : isIndianHoliday
    ? 'Festive Indian Greeting'
    : isPublicHoliday
    ? 'Singapore Public Holiday'
    : 'Special Celebration';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wish-title"
    >
      <div
        className="w-full max-w-sm sm:max-w-md bg-surface-card rounded-3xl shadow-2xl border border-surface-container overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Festive Header Banner with Gradient & Decorative Sparkles */}
        <div className={`relative px-6 pt-7 pb-6 bg-gradient-to-br ${gradientHeader} text-white flex flex-col items-center text-center overflow-hidden`}>
          {/* Background festive glow elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/20 blur-xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/15 blur-lg pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Close celebration popup"
            className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          {/* Badge */}
          <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wider uppercase mb-3 text-white border border-white/30 shadow-xs">
            {badgeText}
          </span>

          {/* Large Emoji / Icon Badge with bounce */}
          <div className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/40 mb-3 animate-bounce">
            <span className="text-4xl select-none" role="img" aria-label="Celebration">
              {activeWishPopup.emoji || (isAnniversary ? '🎉' : isWeekend ? '🌴' : isIndianHoliday ? '🪔' : '✨')}
            </span>
          </div>

          <h2 id="wish-title" className="text-xl sm:text-2xl font-bold leading-tight drop-shadow-xs px-2">
            {activeWishPopup.title}
          </h2>

          {activeWishPopup.subtitle && (
            <p className="text-xs sm:text-sm text-white/90 font-medium mt-1 drop-shadow-xs">
              {activeWishPopup.subtitle}
            </p>
          )}
        </div>

        {/* Wish Content Body */}
        <div className="p-6 flex flex-col gap-4 bg-surface-card">
          <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container text-center">
            <p className="text-body-md text-on-surface leading-relaxed text-sm sm:text-base font-normal">
              {activeWishPopup.message}
            </p>
          </div>

          {/* Sound Controls & Preview */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">
                {settings.wishSoundEnabled !== false ? 'volume_up' : 'volume_off'}
              </span>
              <span>
                {settings.wishSoundEnabled !== false ? 'Chime sound played' : 'Sound currently muted in Settings'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleReplayChime}
              className="px-2.5 py-1 rounded-full bg-primary-container text-on-primary-fixed hover:bg-primary-fixed text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Play celebration chime sound"
            >
              <span className="material-symbols-outlined text-[14px]">replay</span>
              <span>Replay</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold hover:opacity-95 active:scale-[0.98] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Thank You! ✨</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
