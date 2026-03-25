import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Checklist from './components/Checklist';
import Training from './components/Training';
import TillyTally from './components/TillyTally';
import Survey from './components/Survey';
import TVGuide from './components/TVGuide';
import { ShiftInfo, View, ShiftReport } from './types';
import { Logo, DENOMINATIONS, OPENING_TASKS, CLOSING_TASKS, OWNER_EMAIL, NOTIFICATIONS, StaffNotification } from './constants';
import { summarizeShift } from './services/geminiService';

const getSavedState = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [currentShift, setCurrentShift] = useState<ShiftInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [staffName, setStaffName] = useState<string>(() => getSavedState('cc_staff_name', ''));
  const [nameInput, setNameInput] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  const [selectedNotification, setSelectedNotification] = useState<StaffNotification | null>(null);

  const [openingCompleted, setOpeningCompleted] = useState<string[]>(() =>
    getSavedState('cc_opening_completed', [])
  );
  const [closingCompleted, setClosingCompleted] = useState<string[]>(() =>
    getSavedState('cc_closing_completed', [])
  );
  const [cashCounts, setCashCounts] = useState<Record<string, number>>(() =>
    getSavedState('cc_cash_counts', {})
  );
  const [inventory, setInventory] = useState(() => getSavedState('cc_inventory', ''));
  const [maintenance, setMaintenance] = useState(() => getSavedState('cc_maintenance', ''));
  const [notes, setNotes] = useState(() => getSavedState('cc_notes', ''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editableReport, setEditableReport] = useState<string>('');

  const OWNER_PHONE = '1-5155542606';

  useEffect(() => { localStorage.setItem('cc_opening_completed', JSON.stringify(openingCompleted)); }, [openingCompleted]);
  useEffect(() => { localStorage.setItem('cc_closing_completed', JSON.stringify(closingCompleted)); }, [closingCompleted]);
  useEffect(() => { localStorage.setItem('cc_cash_counts', JSON.stringify(cashCounts)); }, [cashCounts]);
  useEffect(() => { localStorage.setItem('cc_inventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('cc_maintenance', JSON.stringify(maintenance)); }, [maintenance]);
  useEffect(() => { localStorage.setItem('cc_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { if (staffName) localStorage.setItem('cc_staff_name', JSON.stringify(staffName)); }, [staffName]);

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      } else if (Notification.permission === "granted") {
        const newNotif = NOTIFICATIONS.find(n => n.isNew);
        if (newNotif) {
          setTimeout(() => {
            new Notification("Copper Cup Staff Update", {
              body: newNotif.subject,
              icon: "https://i.postimg.cc/wvvKTCP2/Copper-Cup-logo.png"
            });
          }, 2000);
        }
      }
    }
  }, []);

  const fetchShiftData = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      const name = staffName || 'Staff Member';
      const mockShift: ShiftInfo = {
        id: '123',
        employeeName: name,
        role: 'Bartender',
        startTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        endTime: 'N/A',
      };
      setCurrentShift(mockShift);
      setIsLoading(false);
    }, 400);
  }, [staffName]);

  useEffect(() => {
    fetchShiftData();
  }, [fetchShiftData]);

  // Show name prompt if no name saved
  useEffect(() => {
    if (!isLoading && !staffName) {
      setShowNamePrompt(true);
    }
  }, [isLoading, staffName]);

  const handleNameSubmit = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setStaffName(trimmed);
    setShowNamePrompt(false);
    setCurrentShift(prev => prev ? { ...prev, employeeName: trimmed } : prev);
  };

  const handleToggleOpening = (task: string) => {
    setOpeningCompleted(prev =>
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const handleToggleClosing = (task: string) => {
    setClosingCompleted(prev =>
      prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]
    );
  };

  const handleCountChange = (den: string, val: number) => {
    setCashCounts(prev => ({ ...prev, [den]: val }));
  };

  const resetShiftData = () => {
    setOpeningCompleted([]);
    setClosingCompleted([]);
    setCashCounts({});
    setInventory('');
    setMaintenance('');
    setNotes('');
    setEditableReport('');
    localStorage.removeItem('cc_opening_completed');
    localStorage.removeItem('cc_closing_completed');
    localStorage.removeItem('cc_cash_counts');
    localStorage.removeItem('cc_inventory');
    localStorage.removeItem('cc_maintenance');
    localStorage.removeItem('cc_notes');
    // Keep staff name so they don't have to re-enter it next shift
    setActiveView('dashboard');
  };

  const sendTextReport = (finalMessage: string) => {
    const smsUrl = `sms:${OWNER_PHONE}?body=${encodeURIComponent(finalMessage)}`;
    window.location.href = smsUrl;
  };

  const sendReadReceipt = (notification: StaffNotification) => {
    const subject = `READ RECEIPT: ${notification.subject}`;
    const body = `Staff member has opened and read the following notification:\n\nSubject: ${notification.subject}\nDate: ${notification.date}\n\nTimestamp: ${new Date().toLocaleString()}`;
    const mailtoUrl = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    setSelectedNotification(null);
  };

  const handleSurveySubmit = async () => {
    setIsSubmitting(true);
    const total = DENOMINATIONS.reduce((acc, den) => acc + (den.value * (cashCounts[den.label] || 0)), 0);
    const checklistsCompleted = openingCompleted.length === OPENING_TASKS.length && closingCompleted.length === CLOSING_TASKS.length;

    const report: ShiftReport = {
      inventoryIssues: inventory,
      brokenItems: maintenance,
      generalNotes: notes,
      tillyTallyTotal: total,
      checklistsCompleted
    };

    const summaryText = await summarizeShift(report, currentShift);

    const cashBreakdown = DENOMINATIONS.map(den => {
      const count = cashCounts[den.label] || 0;
      return `* ${den.label}: ${count} (x$${den.value.toFixed(2)})`;
    }).join('\n');

    const urgentNotice = !checklistsCompleted
      ? `**Urgent Notice:**\n* **Checklists:** Please note that the shift checklists were **not completed**.\n\n`
      : '';

    const fullMessage = `Subject: Shift Briefing - The Copper Cup\n\nHi Eric,\n\nPlease find the summary for ${currentShift?.employeeName || staffName || 'Staff Member'}'s recent shift:\n\n${urgentNotice}${summaryText || "Shift summary generated."}\n\n**Shift Overview:**\n${cashBreakdown}\n\n**Cash Total: $${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n\n* **Inventory & Maintenance:** ${inventory || maintenance ? (inventory + ' ' + maintenance).trim() : 'No issues or broken items reported.'}\n* **General Notes:** ${notes || 'None.'}`;

    setEditableReport(fullMessage);
    setIsSubmitting(false);
    setActiveView('summary');
  };

  // Name prompt overlay
  const renderNamePrompt = () => (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/90 animate-fadeIn">
      <div className="bg-[#121212] w-full max-w-sm rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 text-center">
          <Logo />
          <h3 className="text-xl font-serif text-[#bc6c25] mt-2">Who's working tonight?</h3>
          <p className="text-zinc-500 text-sm mt-1">Enter your name for the shift report.</p>
        </div>
        <div className="p-6 space-y-4">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            placeholder="Your first name..."
            autoFocus
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 text-lg focus:outline-none focus:border-[#bc6c25] transition-colors placeholder:text-zinc-600"
          />
          <button
            onClick={handleNameSubmit}
            disabled={!nameInput.trim()}
            className="w-full copper-gradient text-white font-bold py-3 rounded-xl disabled:opacity-40 transition-all active:scale-[0.98]"
          >
            Start Shift →
          </button>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="py-2">
        <Logo />
        {staffName && (
          <div className="text-center -mt-4">
            <span className="text-zinc-500 text-sm">Welcome back, </span>
            <button
              onClick={() => setShowNamePrompt(true)}
              className="text-[#bc6c25] text-sm font-semibold hover:underline"
            >
              {staffName}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-6 bg-[#bc6c25] rounded-full"></div>
          <h2 className="text-xl font-serif text-zinc-100 tracking-wide">Staff Notifications</h2>
        </div>

        {NOTIFICATIONS.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {NOTIFICATIONS.map((notif) => (
              <button
                key={notif.id}
                onClick={() => setSelectedNotification(notif)}
                className="bg-[#1a1a1a] rounded-xl p-4 border border-zinc-800 shadow-lg text-left transition-all hover:border-[#bc6c25]/40 hover:bg-[#222] active:scale-[0.98] group flex justify-between items-center"
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    {notif.isNew && <span className="w-2 h-2 rounded-full bg-[#bc6c25]"></span>}
                    <h3 className="font-bold text-zinc-100 text-sm group-hover:text-[#bc6c25] transition-colors leading-tight">
                      {notif.subject}
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase tracking-tighter text-zinc-600">
                    {notif.date}
                  </span>
                </div>
                <svg className="w-4 h-4 text-zinc-700 group-hover:text-[#bc6c25] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <svg className="w-8 h-8 text-zinc-700 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-zinc-600 text-sm italic font-medium">No new staff notifications.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setActiveView('tvguide')}
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-[#bc6c25]/30 transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 bg-[#bc6c25]/10 rounded-full flex items-center justify-center text-[#bc6c25] group-hover:bg-[#bc6c25] group-hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V20M17 4V20M3 8H21M3 12H21M3 16H21" />
            </svg>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 group-hover:text-zinc-200">TV Guide</span>
        </button>
        <button
          onClick={() => setActiveView('training')}
          className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-2 hover:border-[#bc6c25]/30 transition-all active:scale-95 group"
        >
          <div className="w-10 h-10 bg-[#bc6c25]/10 rounded-full flex items-center justify-center text-[#bc6c25] group-hover:bg-[#bc6c25] group-hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 group-hover:text-zinc-200">Training</span>
        </button>
      </div>

      {NOTIFICATIONS.length > 0 && (
        <div className="bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/50 flex flex-col items-center text-center space-y-2">
          <p className="text-zinc-500 text-xs italic font-medium">
            "Tap a notification to read the full message and confirm receipt."
          </p>
        </div>
      )}

      {selectedNotification && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 animate-fadeIn">
          <div className="bg-[#121212] w-full max-w-md rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#bc6c25] font-bold block mb-1">STAFF MEMO</span>
                <h3 className="text-lg font-serif text-zinc-100">{selectedNotification.subject}</h3>
              </div>
              <button onClick={() => setSelectedNotification(null)} className="text-zinc-500 hover:text-white p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 text-zinc-300 leading-relaxed">
              <p className="mb-4">{selectedNotification.content}</p>
              <span className="text-xs text-zinc-600 block pt-4 border-t border-zinc-800">
                Posted: {selectedNotification.date}
              </span>
            </div>
            <div className="p-4 bg-zinc-900/50 border-t border-zinc-800">
              <button
                onClick={() => sendReadReceipt(selectedNotification)}
                className="w-full copper-gradient text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Confirm Read & Send Receipt
              </button>
              <p className="text-[9px] text-center text-zinc-600 mt-2 italic">
                This will send a read confirmation to {OWNER_EMAIL}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSummaryView = () => (
    <div className="space-y-6 animate-fadeIn py-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#bc6c25]/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-[#bc6c25]/20">
          <svg className="w-8 h-8 text-[#bc6c25]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h2 className="text-2xl font-serif text-[#bc6c25]">Edit Your Report</h2>
        <p className="text-zinc-500 text-sm mt-1">Review and proofread before sending to owner.</p>
      </div>

      <div className="relative">
        <textarea
          value={editableReport}
          onChange={(e) => setEditableReport(e.target.value)}
          className="w-full bg-[#161616] border border-zinc-800 rounded-2xl p-6 text-zinc-200 text-sm leading-relaxed font-mono min-h-[400px] focus:ring-1 focus:ring-[#bc6c25] focus:border-[#bc6c25] outline-none transition-all shadow-inner"
          placeholder="Type your report here..."
        />
        <div className="absolute top-2 right-4 text-[10px] uppercase font-bold text-zinc-600 tracking-widest pointer-events-none">
          Editable Preview
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => sendTextReport(editableReport)}
          className="w-full copper-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-[#bc6c25]/20 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Send via Text Message
        </button>
        <button
          onClick={resetShiftData}
          className="w-full bg-zinc-900 text-zinc-400 py-4 rounded-xl border border-zinc-800 font-medium hover:text-red-400 hover:border-red-900/40 transition-all"
        >
          Finalize & Wipe All Shift Data
        </button>
      </div>
      <p className="text-[10px] text-center text-zinc-600 italic">
        Your data is auto-saved. Only "Finalize & Wipe" clears the checklists and notes.
      </p>
    </div>
  );

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {showNamePrompt && renderNamePrompt()}
      {activeView === 'dashboard' && renderDashboard()}
      {activeView === 'checklist' && (
        <div className="space-y-12">
          <Checklist type="opening" completedItems={openingCompleted} onToggle={handleToggleOpening} />
          <div className="border-t border-zinc-800 pt-12">
            <Checklist type="closing" completedItems={closingCompleted} onToggle={handleToggleClosing} />
          </div>
        </div>
      )}
      {activeView === 'training' && <Training />}
      {activeView === 'tvguide' && <TVGuide />}
      {activeView === 'tillytally' && <TillyTally counts={cashCounts} onCountChange={handleCountChange} />}
      {activeView === 'survey' && (
        <Survey
          inventory={inventory}
          maintenance={maintenance}
          notes={notes}
          onChange={(f, v) => {
            if (f === 'inventory') setInventory(v);
            if (f === 'maintenance') setMaintenance(v);
            if (f === 'notes') setNotes(v);
          }}
          onSubmit={handleSurveySubmit}
          isSubmitting={isSubmitting}
        />
      )}
      {activeView === 'summary' && renderSummaryView()}
    </Layout>
  );
};

export default App;
