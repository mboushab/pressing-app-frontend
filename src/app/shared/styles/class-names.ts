export const classNames = {
  container: 'max-w-6xl mx-auto px-4 py-6',
  pageHeader: 'flex flex-wrap items-center justify-between gap-3 mb-5',
  pageTitle: 'text-2xl font-semibold text-slate-800',
  card: 'bg-white rounded-xl border border-slate-200 shadow-sm',
  buttonPrimary:
    'inline-flex items-center justify-center gap-1.5 bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed',
  buttonSecondary:
    'inline-flex items-center justify-center gap-1.5 bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-slate-50',
  buttonWarning:
    'inline-flex items-center justify-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-orange-600',
  buttonDanger:
    'inline-flex items-center justify-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg font-medium cursor-pointer hover:bg-red-700',
  iconButton:
    'inline-flex items-center justify-center size-9 rounded-lg text-slate-500 cursor-pointer hover:bg-slate-100 hover:text-slate-800',
  iconButtonDanger:
    'inline-flex items-center justify-center size-9 rounded-lg text-slate-400 cursor-pointer hover:bg-red-50 hover:text-red-600',
  input:
    'border border-slate-300 bg-white rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:border-cyan-600',
  label: 'block text-sm font-medium text-slate-700 mb-1',
  fieldError: 'text-red-600 text-sm mt-1',
  table: 'w-full text-sm',
  th: 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200',
  td: 'px-4 py-3 border-b border-slate-100 text-slate-700',
  empty: 'py-12 text-center text-slate-500',
} as const;
