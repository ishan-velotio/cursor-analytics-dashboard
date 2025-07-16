import { useState, useMemo } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useTeamMembers } from '@/hooks/useCursorData';
import { useMemberValidation } from '@/hooks/useTeams';
import { cn } from '@/lib/utils';

interface MemberSearchProps {
  onAddMember: (email: string) => void;
  excludeEmails?: string[];
  className?: string;
}

export function MemberSearch({ onAddMember, excludeEmails = [], className }: MemberSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const { data: cursorMembers, isLoading } = useTeamMembers();
  // const { validateMember: _validateMember } = useMemberValidation();

  const filteredMembers = useMemo(() => {
    if (!cursorMembers?.teamMembers || !searchTerm) return [];
    
    const term = searchTerm.toLowerCase();
    return cursorMembers.teamMembers
      .filter(member => 
        // Exclude already added members
        !excludeEmails.includes(member.email) &&
        // Filter by search term
        (member.name.toLowerCase().includes(term) || 
         member.email.toLowerCase().includes(term))
      )
      .slice(0, 10); // Limit to 10 results for performance
  }, [cursorMembers, searchTerm, excludeEmails]);

  const handleMemberSelect = async (email: string) => {
    onAddMember(email);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setIsOpen(value.length > 0);
  };

  const handleDirectAdd = () => {
    if (searchTerm && !excludeEmails.includes(searchTerm)) {
      onAddMember(searchTerm);
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members or enter email..."
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => searchTerm && setIsOpen(true)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Direct Add Button (for manual email entry) */}
        {searchTerm && !filteredMembers.some(m => m.email === searchTerm) && (
          <button
            onClick={handleDirectAdd}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            title="Add email directly"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (searchTerm.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-gray-700">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Loading team members...
            </div>
          )}
          
          {!isLoading && filteredMembers.length > 0 && (
            <>
              <div className="p-2 text-xs text-gray-700 bg-gray-50 border-b">
                Found {filteredMembers.length} members
              </div>
              {filteredMembers.map((member) => (
                <button
                  key={member.email}
                  onClick={() => handleMemberSelect(member.email)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-700">{member.email}</div>
                    </div>
                    <UserPlus className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </>
          )}
          
          {!isLoading && filteredMembers.length === 0 && searchTerm.length > 0 && (
            <div className="p-4 text-center text-gray-700">
              <div className="mb-2">No matching team members found</div>
              {searchTerm.includes('@') && (
                <button
                  onClick={handleDirectAdd}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 mx-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  Add &quot;{searchTerm}&quot; directly
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 