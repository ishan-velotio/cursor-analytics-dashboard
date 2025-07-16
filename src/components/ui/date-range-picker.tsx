import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const presetRanges = [
  {
    label: 'Last 7 days',
    getValue: () => ({
      startDate: subDays(new Date(), 7),
      endDate: new Date()
    })
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      startDate: subDays(new Date(), 30),
      endDate: new Date()
    })
  },
  {
    label: 'Last 90 days',
    getValue: () => ({
      startDate: subDays(new Date(), 90),
      endDate: new Date()
    })
  },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetSelect = (preset: typeof presetRanges[0]) => {
    onChange(preset.getValue());
    setIsOpen(false);
  };

  const formatDateRange = (range: DateRange) => {
    return `${format(range.startDate, 'MMM d, yyyy')} - ${format(range.endDate, 'MMM d, yyyy')}`;
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium">
          {formatDateRange(value)}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <div className="space-y-1">
              {presetRanges.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-200 mt-2 pt-2">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={format(value.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newStartDate = new Date(e.target.value);
                      onChange({ ...value, startDate: newStartDate });
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={format(value.endDate, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      const newEndDate = new Date(e.target.value);
                      onChange({ ...value, endDate: newEndDate });
                    }}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 