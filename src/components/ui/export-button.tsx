'use client';

import { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { 
  exportData, 
  ExportFormat, 
  ExportDataType, 
  ExportOptions,
  EXPORT_FORMAT_INFO,
  EXPORT_DATA_TYPE_INFO
} from '@/lib/export-utils';
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teamMembers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dailyUsage: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spending: any[];
  filters: {
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    selectedTeam?: string;
    selectedMembers?: string[];
  };
  className?: string;
  disabled?: boolean;
}

export function ExportButton({ 
  teamMembers,
  dailyUsage,
  spending,
  filters, 
  className, 
  disabled = false 
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat, dataType: ExportDataType) => {
    setIsExporting(true);
    setIsOpen(false);

    try {
      const options: ExportOptions = {
        format,
        dataType,
        dateRange: filters.dateRange,
        selectedTeam: filters.selectedTeam,
        selectedMembers: filters.selectedMembers
      };

      await exportData(teamMembers, dailyUsage, spending, options);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getDataCount = (dataType: ExportDataType): number => {
    switch (dataType) {
      case 'summary-report':
        return 1; // Always one summary report
      case 'team-members':
        return teamMembers?.length || 0;
      case 'spending':
        return spending?.length || 0;
      case 'daily-usage':
        return dailyUsage?.length || 0;
      default:
        return 0;
    }
  };

  if (disabled) {
    return (
      <button
        disabled
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed',
          className
        )}
      >
        <Download className="w-4 h-4" />
        Export Data
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
          isExporting && 'opacity-50 cursor-wait',
          className
        )}
      >
        <Download className={cn('w-4 h-4', isExporting && 'animate-bounce')} />
        {isExporting ? 'Exporting...' : 'Export Data'}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Export Options</h3>
              
              {/* Current Filters Display */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs">
                <p className="text-gray-700 font-medium mb-1">Current Filters:</p>
                <div className="space-y-1 text-gray-700">
                  <p>📅 {filters.dateRange.startDate.toLocaleDateString()} - {filters.dateRange.endDate.toLocaleDateString()}</p>
                  {filters.selectedTeam && <p>👥 Team: {filters.selectedTeam}</p>}
                  {filters.selectedMembers && filters.selectedMembers.length > 0 && (
                    <p>👤 {filters.selectedMembers.length} member(s) selected</p>
                  )}
                </div>
              </div>

              {/* Data Types */}
              <div className="space-y-1">
                {Object.entries(EXPORT_DATA_TYPE_INFO).map(([dataType, info]) => {
                  const count = getDataCount(dataType as ExportDataType);
                  return (
                    <div key={dataType} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{info.label}</h4>
                          <p className="text-xs text-gray-700">{info.description}</p>
                          <p className="text-xs text-blue-600 font-medium">
                            {dataType === 'summary-report' ? 'Ready to export' : `${count} records`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {Object.entries(EXPORT_FORMAT_INFO).map(([format, formatInfo]) => (
                          <button
                            key={format}
                            onClick={() => handleExport(format as ExportFormat, dataType as ExportDataType)}
                            disabled={dataType !== 'summary-report' && count === 0}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs rounded-lg transition-colors',
                              (dataType === 'summary-report' || count > 0)
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            )}
                          >
                            <span>{formatInfo.icon}</span>
                            <span>{formatInfo.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Format Descriptions */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Format Information:</h4>
                <div className="space-y-1 text-xs text-gray-700">
                  {Object.entries(EXPORT_FORMAT_INFO).map(([format, info]) => (
                    <p key={format}>
                      <strong>{info.icon} {info.label}:</strong> {info.description}
                    </p>
                  ))}
                </div>
              </div>
              
              {/* Note about format matching */}
              <div className="mt-3 pt-2 border-t border-gray-100">
                <p className="text-xs text-blue-600">
                  💡 Exports match your existing cursor-usage format exactly
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 