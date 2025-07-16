import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Users, 
  X, 
  Check, 
  AlertTriangle,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { useTeams, useTeamMembers, useMemberValidation, useAllExistingMembers } from '@/hooks/useTeams';
import { useTeamMembers as useCursorMembers } from '@/hooks/useCursorData';
import { MemberSearch } from './member-search';
import { cn } from '@/lib/utils';

interface TeamManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamManagement({ isOpen, onClose }: TeamManagementProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingMembers, setEditingMembers] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<Map<string, boolean>>(new Map());
  const lastSyncedTeam = useRef<string | null>(null);
  const lastSyncedMembers = useRef<string[]>([]);

  const { teams, createTeam, deleteTeam } = useTeams();
  const { members, updateMembers, isUpdating } = useTeamMembers(selectedTeam);
  // const { validateMember: _validateMember } = useMemberValidation();
  const { data: cursorMembers } = useCursorMembers();
  const { isExistingMember } = useAllExistingMembers();

  const selectedTeamData = useMemo(() => {
    return teams.find(team => team.name === selectedTeam);
  }, [teams, selectedTeam]);

  // Initialize editing members when team is selected or members data loads
  useEffect(() => {
    // Check if team changed
    if (selectedTeam !== lastSyncedTeam.current) {
      lastSyncedTeam.current = selectedTeam;
      lastSyncedMembers.current = [...members];
      setEditingMembers([...members]);
      return;
    }

    // Check if members data changed for the same team
    const membersChanged = members.length !== lastSyncedMembers.current.length ||
      members.some(email => !lastSyncedMembers.current.includes(email));

    if (selectedTeam && membersChanged) {
      lastSyncedMembers.current = [...members];
      setEditingMembers([...members]);
    }
  }, [selectedTeam, members]);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    try {
      await createTeam(newTeamName.toLowerCase());
      setNewTeamName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create team:', error);
    }
  };

  const handleDeleteTeam = async (teamName: string) => {
    if (!confirm(`Are you sure you want to delete team "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteTeam(teamName);
      if (selectedTeam === teamName) {
        setSelectedTeam(null);
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  const handleAddMember = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if already added
    if (editingMembers.includes(normalizedEmail)) {
      return;
    }

    // Add member to editing list
    setEditingMembers(prev => [...prev, normalizedEmail]);
    
    // Check if this member already exists in any team (skip validation if they do)
    if (isExistingMember(normalizedEmail)) {
      // Member already exists in another team - mark as valid (already verified)
      setValidationResults(prev => new Map(prev).set(normalizedEmail, true));
      console.log(`Skipping validation for ${normalizedEmail} - already exists in teams`);
      return;
    }
    
    // Check if this member came from our Cursor team search
    const memberFromCursor = cursorMembers?.teamMembers.find(m => m.email === normalizedEmail);
    
    if (memberFromCursor) {
      // Member found in Cursor team via search
      setValidationResults(prev => new Map(prev).set(normalizedEmail, true));
    } else {
      // External member (manual entry)
      setValidationResults(prev => new Map(prev).set(normalizedEmail, false));
    }
  };

  const handleRemoveMember = (email: string) => {
    setEditingMembers(prev => prev.filter(e => e !== email));
    setValidationResults(prev => {
      const newMap = new Map(prev);
      newMap.delete(email);
      return newMap;
    });
  };

  const handleSaveMembers = async () => {
    if (!selectedTeam) return;

    try {
      await updateMembers({ members: editingMembers });
    } catch (error) {
      console.error('Failed to update team members:', error);
    }
  };

  const hasChanges = useMemo(() => {
    if (!selectedTeam) return false;
    
    const originalSet = new Set(members);
    const editingSet = new Set(editingMembers);
    
    return originalSet.size !== editingSet.size || 
           !Array.from(originalSet).every(email => editingSet.has(email));
  }, [members, editingMembers, selectedTeam]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Team Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Teams List */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Teams</h3>
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">New</span>
              </button>
            </div>

            {/* Create Team Form */}
            {isCreating && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  placeholder="Team name (lowercase, no spaces)"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTeam()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTeam}
                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewTeamName('');
                    }}
                    className="flex-1 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Teams List */}
            <div className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.name}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedTeam === team.name 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50'
                  )}
                  onClick={() => setSelectedTeam(team.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <div>
                        <div className="font-medium capitalize">{team.name}</div>
                        <div className="text-sm text-gray-500">
                          {team.memberCount} members
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team.name);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {teams.length === 0 && !isCreating && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No teams created yet</p>
                  <p className="text-sm">Click &quot;New&quot; to create your first team</p>
                </div>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="flex-1 p-4 overflow-y-auto">
            {selectedTeamData ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium capitalize">
                    {selectedTeamData.name} Members
                  </h3>
                  {hasChanges && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMembers(members)}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveMembers}
                        disabled={isUpdating}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Member */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add Team Members
                  </label>
                  <MemberSearch
                    onAddMember={handleAddMember}
                    excludeEmails={editingMembers}
                    className="w-full"
                  />
                </div>

                {/* Members List */}
                <div className="space-y-2">
                  {editingMembers.map((email) => {
                    const validationStatus = validationResults.get(email);
                    const member = cursorMembers?.teamMembers.find(m => m.email === email);
                    
                    // Determine status
                    let statusIcon, statusColor, statusText, bgColor, borderColor;
                    
                    if (validationStatus === true) {
                      // Valid Cursor team member
                      statusIcon = <Check className="w-4 h-4 text-green-500" />;
                      statusColor = 'text-green-600';
                      statusText = 'Cursor team member';
                      bgColor = 'bg-green-50';
                      borderColor = 'border-green-200';
                    } else if (validationStatus === false && validationResults.has(email)) {
                      // Validated but not found in Cursor team (external member)
                      statusIcon = <AlertTriangle className="w-4 h-4 text-amber-500" />;
                      statusColor = 'text-amber-600';
                      statusText = 'External member (not in Cursor team)';
                      bgColor = 'bg-amber-50';
                      borderColor = 'border-amber-200';
                    } else {
                      // Not validated yet
                      statusIcon = <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />;
                      statusColor = 'text-gray-600';
                      statusText = 'Validating...';
                      bgColor = 'bg-gray-50';
                      borderColor = 'border-gray-200';
                    }
                    
                    return (
                      <div
                        key={email}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition-colors',
                          bgColor,
                          borderColor
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {statusIcon}
                          <div>
                            <div className="font-medium">
                              {member?.name || email}
                            </div>
                            {member?.name && (
                              <div className="text-sm text-gray-700">{email}</div>
                            )}
                            <div className={cn('text-sm', statusColor)}>
                              {statusText}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(email)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {editingMembers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No members in this team</p>
                      <p className="text-sm">Add members using the input above</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a team to manage members</p>
                <p className="text-sm">Choose a team from the left panel</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 