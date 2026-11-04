import React, { useState } from 'react';
import { generateCropCalendar } from './cropCalendarEngine.js';
import { saveProfile } from './profileStore.js';
import { saveReminder } from '../reminders/remindersStore.js';

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];

function toBnDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => '০১২৩৪৫৬৭৮৯'[digit]);
}

function formatDate(isoStr, lang) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  if (lang === 'bn') {
    return `${toBnDigits(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${toBnDigits(d.getFullYear())}`;
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function CropCalendarView({ profile, lang = 'bn', t, onEdit, onProfileUpdated }) {
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const calendar = generateCropCalendar(profile);
  const { current_stage, progress_pct, days_elapsed, tasks, next_task, is_estimated } = calendar;

  const showFeedback = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3000);
  };

  const handleToggleComplete = async (taskId) => {
    const completedSet = new Set(profile.completed_task_ids || []);
    if (completedSet.has(taskId)) {
      completedSet.delete(taskId);
    } else {
      completedSet.add(taskId);
    }

    const updated = {
      ...profile,
      completed_task_ids: Array.from(completedSet),
    };
    await saveProfile(updated);
    onProfileUpdated?.(updated);
    showFeedback(lang === 'bn' ? 'কাজের অগ্রগতি সংরক্ষিত হয়েছে।' : 'Task status updated.');
  };

  const handleEnableReminder = async (task) => {
    try {
      await saveReminder({
        title: lang === 'bn' ? task.title_bn : task.title_en,
        description: lang === 'bn' ? task.instructions_bn : task.instructions_en,
        due_date: task.target_date,
        due_time: '08:30',
        source: 'crop_calendar',
      });

      const reminderSet = new Set(profile.active_reminder_ids || []);
      reminderSet.add(task.id);

      const updated = {
        ...profile,
        active_reminder_ids: Array.from(reminderSet),
      };
      await saveProfile(updated);
      onProfileUpdated?.(updated);
      showFeedback(lang === 'bn' ? 'স্মরণবার্তা সক্রিয় করা হয়েছে। সময়মতো নোটিফিকেশন পাবেন।' : 'Reminder scheduled successfully.');
    } catch (e) {
      console.error('Failed to enable reminder:', e);
    }
  };

  const seasonNameMap = {
    boro: t('profile.seasonBoro'),
    aman: t('profile.seasonAman'),
    aus: t('profile.seasonAus'),
  };

  return (
    <div data-testid="crop-calendar-view" className="space-y-5">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border-2 border-leaf-600/30 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <h2 className="text-base font-bold text-gray-900">{t('profile.myField')}</h2>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-semibold text-leaf-700 bg-leaf-50 hover:bg-leaf-100 border border-leaf-300 rounded-lg px-2.5 py-1 transition"
          >
            ✏️ {t('profile.editSetup')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
            <span className="text-gray-500 block text-[10px]">অবস্থান / Location</span>
            <span className="font-bold text-gray-800">
              {profile.upazila_name_bn ? `${profile.upazila_name_bn}, ` : ''}{profile.district_name_bn || '—'}
            </span>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
            <span className="text-gray-500 block text-[10px]">মৌসুম ও জাত / Variety</span>
            <span className="font-bold text-gray-800">
              {seasonNameMap[profile.season] || 'বোরো'} • {profile.variety || 'ব্রি ধান'}
            </span>
          </div>
        </div>
      </div>

      {/* Crop Progress Card */}
      <div className="bg-gradient-to-r from-leaf-700 to-leaf-800 rounded-2xl p-4 text-white shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-leaf-200 text-[10px]">
            {t('profile.currentStage')}
          </span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold">
            {lang === 'bn' ? toBnDigits(progress_pct) : progress_pct}% {lang === 'bn' ? 'অগ্রগতি' : 'Progress'}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-bold">
            {lang === 'bn' ? current_stage.name_bn : current_stage.name_en}
          </h3>
          <p className="text-xs text-leaf-100 mt-0.5">
            {t('profile.daysElapsed').replace('{d}', lang === 'bn' ? toBnDigits(days_elapsed) : days_elapsed)}
            {is_estimated && ` (${t('profile.approximateDate')})`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress_pct}%` }}
          />
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-2.5 text-xs text-emerald-800 font-semibold text-center animate-fade-in">
          ✓ {actionMessage}
        </div>
      )}

      {/* Next Important Task Card */}
      {next_task && (
        <div
          data-testid="next-task-card"
          className="bg-amber-50/80 rounded-2xl border-2 border-amber-300 p-4 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>🔔</span> {t('profile.nextTaskTitle')}
            </span>
            <span className="text-[11px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              {formatDate(next_task.target_date, lang)}
            </span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900">
              {lang === 'bn' ? next_task.title_bn : next_task.title_en}
            </h4>
            <p className="text-xs text-gray-700 mt-1 leading-relaxed">
              {lang === 'bn' ? next_task.instructions_bn : next_task.instructions_en}
            </p>
          </div>

          <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleToggleComplete(next_task.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800"
            >
              ✓ {t('profile.markCompleted')}
            </button>

            {next_task.has_reminder ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100 px-2.5 py-1 rounded-xl">
                ✓ {t('profile.reminderActive')}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleEnableReminder(next_task)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-leaf-700 hover:bg-leaf-800 text-white shadow-xs transition"
              >
                ⏰ {t('profile.enableReminder')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chronological Timeline */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <span>📅</span> {t('profile.timelineTitle')}
        </h3>

        <div className="space-y-2.5">
          {tasks.map((task, idx) => {
            const isExpanded = expandedTaskId === task.id;
            const isDone = task.is_completed;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border p-3 space-y-2 transition shadow-2xs ${
                  isDone
                    ? 'border-gray-200 bg-gray-50/60 opacity-80'
                    : task.status === 'due'
                    ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs mt-0.5 border ${
                        isDone
                          ? 'bg-leaf-600 text-white border-leaf-600'
                          : 'border-gray-300 hover:border-leaf-600'
                      }`}
                      aria-label="Toggle task"
                    >
                      {isDone ? '✓' : ''}
                    </button>
                    <div>
                      <div className={`text-xs font-bold ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {idx + 1}. {lang === 'bn' ? task.title_bn : task.title_en}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {formatDate(task.target_date, lang)}
                        {task.is_estimated && ` (${t('profile.approximateDate')})`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.has_reminder && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                        ⏰
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="text-xs text-leaf-700 font-semibold px-1 py-0.5 hover:underline"
                    >
                      {isExpanded ? 'লুকান' : 'বিস্তারিত'}
                    </button>
                  </div>
                </div>

                {/* Expandable Learning Details */}
                {isExpanded && (
                  <div className="pt-2 border-t border-gray-100 text-xs space-y-2 text-gray-700 leading-relaxed bg-leaf-50/40 rounded-lg p-2.5">
                    <div>
                      <span className="font-bold text-leaf-900">{t('profile.whyItMatters')} </span>
                      <span>{lang === 'bn' ? task.why_bn : task.why_en}</span>
                    </div>
                    <div>
                      <span className="font-bold text-leaf-900">{t('profile.howToDo')} </span>
                      <span>{lang === 'bn' ? task.instructions_bn : task.instructions_en}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center justify-between pt-1 border-t border-gray-200/60">
                      <span>{t('profile.source')}: {task.source_ref}</span>
                      {!task.has_reminder && (
                        <button
                          type="button"
                          onClick={() => handleEnableReminder(task)}
                          className="font-bold text-leaf-800 underline"
                        >
                          + {t('profile.enableReminder')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

