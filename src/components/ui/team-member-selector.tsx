import { useState, useMemo } from 'react';
import { Check, ChevronDown, Users, X } from 'lucide-react';
import { TeamMember } from '@/lib/cursor-api';
import { cn } from '@/lib/utils';

interface TeamMemberSelectorProps {
  members: TeamMember[];
  selectedMembers: string[];
  onChange: (selectedEmails: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TeamMemberSelector({
  members,
  selectedMembers,
  onChange,
  placeholder = "Select team members",
  className
}: TeamMemberSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    
    return members.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [members, searchTerm]);

  const handleMemberToggle = (email: string) => {
    const isSelected = selectedMembers.includes(email);
    
    if (isSelected) {
      onChange(selectedMembers.filter(e => e !== email));
    } else {
      onChange([...selectedMembers, email]);
    }
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      onChange([]);
    } else {
      onChange(members.map(m => m.email));
    }
  };

  const selectedMembersText = useMemo(() => {
    if (selectedMembers.length === 0) return placeholder;
    if (selectedMembers.length === 1) {
      const member = members.find(m => m.email === selectedMembers[0]);
      return member?.name || member?.email || 'Unknown';
    }
    if (selectedMembers.length === members.length) return 'All members';
    return `${selectedMembers.length} members selected`;
  }, [selectedMembers, members, placeholder]);

  const handleRemoveMember = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedMembers.filter(e => e !== email));
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium truncate">
            {selectedMembersText}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>

      {/* Selected members chips (when multiple selected) */}
      {selectedMembers.length > 1 && selectedMembers.length < members.length && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedMembers.slice(0, 3).map(email => {
            const member = members.find(m => m.email === email);
            return (
              <span
                key={email}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
              >
                {member?.name || email}
                <button
                  onClick={(e) => handleRemoveMember(email, e)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {selectedMembers.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md">
              +{selectedMembers.length - 3} more
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={handleSelectAll}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md flex items-center gap-2"
            >
              <div className={cn(
                "w-4 h-4 border rounded flex items-center justify-center",
                selectedMembers.length === members.length
                  ? "bg-blue-600 border-blue-600"
                  : selectedMembers.length > 0
                  ? "bg-blue-600 border-blue-600"
                  : "border-gray-300"
              )}>
                {selectedMembers.length === members.length && (
                  <Check className="w-3 h-3 text-white" />
                )}
                {selectedMembers.length > 0 && selectedMembers.length < members.length && (
                  <div className="w-2 h-2 bg-white rounded-sm" />
                )}
              </div>
              <span className="font-medium">
                {selectedMembers.length === members.length ? 'Deselect All' : 'Select All'}
              </span>
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredMembers.map((member) => {
              const isSelected = selectedMembers.includes(member.email);
              
              return (
                <button
                  key={member.email}
                  onClick={() => handleMemberToggle(member.email)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-3"
                >
                  <div className={cn(
                    "w-4 h-4 border rounded flex items-center justify-center",
                    isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  )}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-700 truncate">
                      {member.email} • {member.role}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredMembers.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-700">
              No members found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
} 