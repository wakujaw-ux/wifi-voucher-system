import { Calendar } from "lucide-react";

// Kazi ya kupata tarehe ya ndani (Local Time) badala ya UTC
const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

const today = () => getLocalDateString(new Date());

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return getLocalDateString(d);
};

const DateRangeFilter = ({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onApply,
  onClear,
}) => {
  const setQuick = (days) => {
    const from = daysAgo(days);
    const to = today();

    // 1. Badilisha inputs
    onFromChange(from);
    onToChange(to);

    // 2. Tuma ombi (Apply) papo hapo
    onApply(from, to);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-medium text-gray-500 mr-2">Haraka:</span>
        <button
          onClick={() => setQuick(0)}
          className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
        >
          Leo
        </button>
        <button
          onClick={() => setQuick(7)}
          className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
        >
          Wiki 1
        </button>
        <button
          onClick={() => setQuick(30)}
          className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
        >
          Mwezi 1
        </button>
        <button
          onClick={() => setQuick(90)}
          className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
        >
          Miezi 3
        </button>
        <button
          onClick={() => setQuick(180)}
          className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
        >
          Miezi 6
        </button>
        <button
          onClick={() => setQuick(365)}
          className="text-xs px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-50"
        >
          Mwaka 1
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        <div className="flex gap-2">
          {/* Kitufe hiki sasa kinatumia onApply() bila parameters, kitachukua state ya sasa */}
          <button
            onClick={() => onApply()}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            Tumia
          </button>
          <button
            onClick={onClear}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Safisha
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangeFilter;
