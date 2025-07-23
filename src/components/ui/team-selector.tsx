import { useState, useMemo } from 'react';
import { Check, ChevronDown, Users, Search } from 'lucide-react';
import { useTeams } from '@/hooks/useTeams';
import { cn } from '@/lib/utils';

interface TeamSelectorProps {
  selectedTeam: string | null;
  onChange: (teamName: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function TeamSelector({
  selectedTeam,
  onChange,
  placeholder = "Select a team",
  className
}: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { teams, isLoading } = useTeams();

  const selectedTeamData = useMemo(() => {
    return teams.find(team => team.name === selectedTeam);
  }, [teams, selectedTeam]);

  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    
    return teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  const displayText = useMemo(() => {
    if (!selectedTeam) return placeholder;
    if (selectedTeamData) {
      return `${selectedTeamData.name} (${selectedTeamData.memberCount} members)`;
    }
    return selectedTeam;
  }, [selectedTeam, selectedTeamData, placeholder]);

  const handleTeamSelect = (teamName: string | null) => {
    onChange(teamName);
    setIsOpen(false);
    setSearchTerm(''); // Clear search when selecting
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm(''); // Clear search when closing
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg', className)}>
        <Users className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-700">Loading teams...</span>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => handleOpenChange(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium truncate">
            {displayText}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* All Members Option */}
            <button
              onClick={() => handleTeamSelect(null)}
              className={cn(
                'flex items-center justify-between w-full px-4 py-2 text-left hover:bg-gray-50',
                !selectedTeam && 'bg-blue-50 text-blue-600'
              )}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-900">All Members</span>
              </div>
              {!selectedTeam && <Check className="w-4 h-4" />}
            </button>

            {/* Team Options */}
            {filteredTeams.map((team) => (
              <button
                key={team.name}
                onClick={() => handleTeamSelect(team.name)}
                className={cn(
                  'flex items-center justify-between w-full px-4 py-2 text-left hover:bg-gray-50',
                  selectedTeam === team.name && 'bg-blue-50 text-blue-600'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium capitalize text-gray-900">
                      {team.name}
                    </span>
                    <span className="text-xs text-gray-700">
                      {team.memberCount} members
                    </span>
                  </div>
                </div>
                {selectedTeam === team.name && <Check className="w-4 h-4" />}
              </button>
            ))}

            {filteredTeams.length === 0 && searchTerm && (
              <div className="px-4 py-3 text-center">
                <p className="text-sm text-gray-700">No teams found matching &quot;{searchTerm}&quot;</p>
              </div>
            )}

            {teams.length === 0 && !searchTerm && (
              <div className="px-4 py-3 text-center">
                <p className="text-sm text-gray-700">No teams created yet</p>
                <p className="text-sm text-gray-500 mt-1">Use the Manage button to create teams</p>
              </div>
            )}
          </div>

          {/* Manage Teams option removed - now a separate button */}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => handleOpenChange(false)}
        />
      )}
    </div>
  );
} 