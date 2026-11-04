import React, { useState, useEffect } from 'react';
import useT from '../../i18n/useT.js';
import PageContainer from '../../components/PageContainer.jsx';
import {
  listReminders,
  saveReminder,
  updateReminderStatus,
  deleteReminder,
  getLocalTodayStr,
} from './remindersStore.js';
import {
  formatBengaliDate,
  formatRelativeBengali,
  getActivityPresets,
  getFutureDateStr,
  toBanglaDigits,
} from './remindersLogic.js';

export default function RemindersPage() {
  const { lang } = useT();
  const isBn = lang === 'bn';
  const today = getLocalTodayStr();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Reminder Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(() => getFutureDateStr(3));
  const [formError, setFormError] = useState(null);

  const presets = getActivityPresets(lang);

  async function loadData() {
    setLoading(true);
    try {
      const all = await listReminders({ includeCompleted: true });
      setReminders(all || []);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeReminders = reminders.filter(
    (r) => r.status === 'upcoming' || r.status === 'due'
  );
  const completedReminders = reminders.filter(
    (r) => r.status === 'completed'
  );

  async function handleToggleStatus(reminder) {
    const nextStatus = reminder.status === 'completed' ? 'upcoming' : 'completed';
    await updateReminderStatus(reminder.id, nextStatus);
    loadData();
  }

  async function handleDelete(id) {
    await deleteReminder(id);
    loadData();
  }

  function handleSelectPreset(preset) {
    setNewTitle(preset.title);
    setNewDesc(preset.description);
    setNewDate(getFutureDateStr(preset.defaultDays));
    setFormError(null);
  }

  async function handleCreateReminder(e) {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError(isBn ? 'কাজের নাম লিখুন বা নিচের তালিকা থেকে বেছে নিন' : 'Please provide a title');
      return;
    }
    if (!newDate) {
      setFormError(isBn ? 'তারিখ নির্বাচন করুন' : 'Please choose a date');
      return;
    }
    if (newDate < today) {
      setFormError(isBn ? 'পূর্বের কোনো তারিখ নির্বাচন করা যাবে না' : 'Cannot select a past date');
      return;
    }

    try {
      await saveReminder({
        title: newTitle.trim(),
        description: newDesc.trim(),
        due_date: newDate,
        source: 'manual',
      });

      // Clear & close
      setNewTitle('');
      setNewDesc('');
      setNewDate(getFutureDateStr(3));
      setShowAddModal(false);
      setFormError(null);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Error saving reminder');
    }
  }

  return (
    <PageContainer className="py-4 space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span aria-hidden="true">⏰</span>
            <span>{isBn ? 'স্মরণবার্তা ও ফসল সেবা' : 'Reminders & Crop Care'}</span>
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            {isBn
              ? 'রোগ পর্যবেক্ষণ ও মাঠের জরুরি কাজের সময়সূচি'
              : 'Crop inspection and timely monitoring schedule'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="min-h-[44px] px-3 sm:px-4 py-2 bg-leaf-600 hover:bg-leaf-700 active:bg-leaf-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 focus-visible:outline-2 focus-visible:outline-leaf-700"
        >
          <span className="text-base font-bold">+</span>
          <span>{isBn ? 'নতুন স্মরণবার্তা' : 'New Reminder'}</span>
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="w-full flex rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`flex-1 min-h-[40px] text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'active'
              ? 'bg-white text-leaf-800 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>{isBn ? 'আসন্ন ও আজকের কাজ' : 'Upcoming & Today'}</span>
          <span className="px-1.5 py-0.2 bg-leaf-100 text-leaf-800 rounded-full text-[10px]">
            {isBn ? toBanglaDigits(activeReminders.length) : activeReminders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`flex-1 min-h-[40px] text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 ${
            activeTab === 'completed'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>{isBn ? 'সম্পন্ন কাজ' : 'Completed'}</span>
          <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 rounded-full text-[10px]">
            {isBn ? toBanglaDigits(completedReminders.length) : completedReminders.length}
          </span>
        </button>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-500">
          {isBn ? 'স্মরণবার্তা লোড হচ্ছে…' : 'Loading reminders…'}
        </div>
      ) : activeTab === 'active' ? (
        activeReminders.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center space-y-2">
            <span className="text-3xl block" aria-hidden="true">🌱</span>
            <h3 className="font-bold text-sm text-gray-800">
              {isBn ? 'আপাতত কোনো জরুরি স্মরণবার্তা নেই' : 'No upcoming reminders right now'}
            </h3>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              {isBn
                ? 'ধানের পাতার ছবি পরীক্ষা করার পর অথবা ওপরের "+ নতুন স্মরণবার্তা" বোতাম চেপে কাজের তালিকা তৈরি করুন।'
                : 'Diagnose a leaf or tap "+ New Reminder" to add an inspection reminder.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {activeReminders.map((r) => {
              const rel = formatRelativeBengali(r.due_date, today);
              return (
                <div
                  key={r.id}
                  className="bg-white border border-gray-200 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-snug">
                      {r.title}
                    </h3>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${rel.badgeClass}`}
                    >
                      {rel.text}
                    </span>
                  </div>

                  {r.description && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {r.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <span className="flex items-center space-x-1">
                      <span aria-hidden="true">📅</span>
                      <span>{formatBengaliDate(r.due_date)}</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(r)}
                        className="min-h-[40px] px-3 py-1.5 bg-leaf-50 hover:bg-leaf-100 active:bg-leaf-200 text-leaf-800 font-bold text-xs rounded-xl border border-leaf-200 transition-colors flex items-center space-x-1 focus-visible:outline-2 focus-visible:outline-leaf-700"
                      >
                        <span aria-hidden="true">✓</span>
                        <span>{isBn ? 'সম্পন্ন' : 'Done'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="min-h-[40px] px-2.5 py-1.5 text-gray-400 hover:text-red-600 active:text-red-700 font-bold text-xs rounded-xl transition-colors focus-visible:outline-2"
                        aria-label={isBn ? 'মুছে ফেলুন' : 'Delete'}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        completedReminders.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-500">
            {isBn ? 'কোনো সম্পন্ন কাজের রেকর্ড নেই' : 'No completed reminders yet'}
          </div>
        ) : (
          <div className="space-y-3 w-full">
            {completedReminders.map((r) => (
              <div
                key={r.id}
                className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 opacity-80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-gray-700 line-through">
                    {r.title}
                  </h3>
                  <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">
                    {isBn ? 'সম্পন্ন হয়েছে' : 'Completed'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                  <span>{formatBengaliDate(r.due_date)}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(r)}
                      className="text-xs font-semibold text-leaf-700 hover:underline min-h-[36px] flex items-center px-1"
                    >
                      {isBn ? 'পুনরায় সক্রিয়' : 'Reopen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-gray-400 hover:text-red-600 min-h-[36px] flex items-center px-1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Manual Creation Modal / Drawer */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-reminder-title"
          className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs"
        >
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h2 id="add-reminder-title" className="font-bold text-base text-gray-900">
                {isBn ? 'নতুন ফসল সেবা স্মরণবার্তা' : 'New Crop Care Reminder'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-2.5 font-medium">
                {formError}
              </div>
            )}

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                {isBn ? 'প্রস্তাবিত কাজের তালিকা (এক চাপে পূরণ করুন):' : 'Suggested Activities:'}
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className="text-left text-xs p-2 rounded-xl border border-gray-200 hover:border-leaf-500 hover:bg-leaf-50/50 transition-colors"
                  >
                    <span className="font-bold text-gray-900 block">{p.title}</span>
                    <span className="text-[11px] text-gray-500 line-clamp-1">{p.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateReminder} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {isBn ? 'কাজের বিবরণ / নাম' : 'Title / Task Name'}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={isBn ? 'যেমন: আক্রান্ত ধান গাছ পুনর্নিরীক্ষণ' : 'e.g. Inspect blast symptoms'}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-leaf-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {isBn ? 'অতিরিক্ত মন্তব্য (ঐচ্ছিক)' : 'Description (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={isBn ? 'যেমন: উত্তর দিকের ৩টি ধানের গোছা পরীক্ষা' : 'Additional notes'}
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-leaf-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  {isBn ? 'কবে মনে করিয়ে দিতে চান?' : 'Due Date'}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[1, 3, 5, 7].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setNewDate(getFutureDateStr(days))}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 font-semibold"
                    >
                      {days === 1
                        ? (isBn ? 'আগামীকাল' : 'Tomorrow')
                        : (isBn ? `${toBanglaDigits(days)} দিন পর` : `In ${days} days`)}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  min={today}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-leaf-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center space-x-2">
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] bg-leaf-600 hover:bg-leaf-700 text-white font-bold text-xs sm:text-sm rounded-xl py-2 px-4 shadow-xs"
                >
                  {isBn ? 'স্মরণবার্তা সংরক্ষণ করুন' : 'Save Reminder'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="min-h-[44px] px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm rounded-xl font-semibold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offline & Notification Guidance Note */}
      <div className="bg-leaf-50/70 border border-leaf-200/60 rounded-xl p-3 text-[11px] text-leaf-950 space-y-1">
        <p className="font-bold flex items-center space-x-1">
          <span aria-hidden="true">💡</span>
          <span>{isBn ? 'কৃষক ভাইদের জন্য তথ্য:' : 'Helpful Information:'}</span>
        </p>
        <p className="leading-relaxed">
          {isBn
            ? 'ইন্টারনেট বন্ধ থাকলেও আপনার সব স্মরণবার্তা ডিভাইসে সংরক্ষিত থাকে। অ্যাপ চালু করলে আজকের করণীয় স্বয়ংক্রিয়ভাবে সামনে চলে আসবে।'
            : 'Reminders are stored safely on your device and work completely offline.'}
        </p>
      </div>
    </PageContainer>
  );
}
