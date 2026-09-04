import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  RotateCcw, 
  Pencil, 
  Trash2, 
  Calendar, 
  Sparkles, 
  AlertCircle,
  X,
  Target
} from 'lucide-react';
import { Goal } from '../types';
import { 
  createGoal, 
  updateGoal, 
  toggleGoalStatus, 
  deleteGoal 
} from '../lib/goalService';
import { MindVaultMark } from './MindVaultLogo';

interface GoalsViewProps {
  goals: Goal[];
  userId: string;
  isVaultLocked?: boolean;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  userId,
  isVaultLocked = false,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Delete confirmation modal state
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter active and completed goals
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const openAddModal = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setValidationError(null);
    setModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setTargetDate(goal.targetDate || '');
    setValidationError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setTargetDate('');
    setValidationError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Please give your goal a title.');
      return;
    }

    if (trimmedTitle.length > 120) {
      setValidationError('Title must be 120 characters or less.');
      return;
    }

    if (description.trim().length > 500) {
      setValidationError('Description must be 500 characters or less.');
      return;
    }

    if (!userId) {
      setValidationError('You must be signed in to save goals.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingGoal) {
        await updateGoal(userId, editingGoal.id, {
          title: trimmedTitle,
          description: description.trim() || undefined,
          targetDate: targetDate ? targetDate.trim() : undefined,
        });
      } else {
        await createGoal(userId, {
          title: trimmedTitle,
          description: description.trim() || undefined,
          targetDate: targetDate ? targetDate.trim() : undefined,
        });
      }
      closeModal();
    } catch (err: any) {
      console.error('Failed to save goal:', err);
      setValidationError(err.message || 'Failed to save goal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (goal: Goal) => {
    if (!userId || isVaultLocked) return;
    try {
      await toggleGoalStatus(userId, goal.id, goal.status);
    } catch (err) {
      console.error('Failed to toggle goal status:', err);
    }
  };

  const confirmDelete = async () => {
    if (!goalToDelete || !userId) return;
    setDeleting(true);
    try {
      await deleteGoal(userId, goalToDelete.id);
      setGoalToDelete(null);
    } catch (err) {
      console.error('Failed to delete goal:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-16">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-theme/60">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Target className="w-4 h-4 text-accent" />
            </div>
            <h1 className="font-display font-bold text-2xl text-theme-primary tracking-tight">
              Goals
            </h1>
          </div>
          <p className="text-xs md:text-sm text-theme-secondary font-serif-body italic">
            "Small steps still move you forward."
          </p>
        </div>

        <button
          id="goals-add-btn"
          onClick={openAddModal}
          disabled={isVaultLocked || !userId}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Empty State when zero goals exist */}
      {goals.length === 0 && (
        <div className="bg-surface-card border border-dashed border-theme rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-surface-secondary border border-theme flex items-center justify-center text-accent">
            <MindVaultMark className="w-6 h-6 text-accent" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-display font-semibold text-base text-theme-primary">
              Give something you're working toward a place to live.
            </h3>
            <p className="text-xs text-theme-secondary font-serif-body">
              Create your first goal and keep it close alongside your journal thoughts.
            </p>
          </div>
          <button
            onClick={openAddModal}
            disabled={isVaultLocked || !userId}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold shadow-xs hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create your first goal</span>
          </button>
        </div>
      )}

      {/* Active Goals Section */}
      {goals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-xs tracking-wider uppercase text-theme-muted flex items-center gap-2">
              <span>Active Goals</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-secondary border border-theme text-theme-primary font-mono text-[10px]">
                {activeGoals.length}
              </span>
            </h2>
          </div>

          {activeGoals.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface-card border border-theme text-center text-xs text-theme-muted font-serif-body">
              All goals completed! Take a moment to appreciate your progress, or add something new you'd like to pursue.
            </div>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal) => {
                const isTargetOverdue = goal.targetDate && new Date(goal.targetDate) < new Date(new Date().toDateString());
                return (
                  <div
                    key={goal.id}
                    id={`goal-item-${goal.id}`}
                    className="group bg-surface-card border border-theme hover:border-accent/40 rounded-2xl p-4 md:p-5 shadow-xs transition-all flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Checkbox Complete Action */}
                      <button
                        id={`goal-toggle-${goal.id}`}
                        onClick={() => handleToggle(goal)}
                        disabled={isVaultLocked}
                        title="Mark goal as complete"
                        className="mt-0.5 w-5 h-5 rounded-md border-2 border-theme-muted/50 hover:border-accent hover:bg-accent/15 flex items-center justify-center text-transparent hover:text-accent transition-all shrink-0 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-sm md:text-base text-theme-primary break-words">
                          {goal.title}
                        </h3>

                        {goal.description && (
                          <p className="text-xs text-theme-secondary font-serif-body leading-relaxed break-words">
                            {goal.description}
                          </p>
                        )}

                        {goal.targetDate && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <Calendar className={`w-3.5 h-3.5 ${isTargetOverdue ? 'text-amber-500' : 'text-accent'}`} />
                            <span className={`text-[11px] font-mono ${isTargetOverdue ? 'text-amber-500 font-medium' : 'text-theme-muted'}`}>
                              Target: {new Date(goal.targetDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              {isTargetOverdue && ' (due)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Controls: Edit & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        id={`goal-edit-${goal.id}`}
                        onClick={() => openEditModal(goal)}
                        disabled={isVaultLocked}
                        title="Edit goal"
                        className="p-1.5 rounded-lg hover:bg-surface-secondary text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`goal-delete-${goal.id}`}
                        onClick={() => setGoalToDelete(goal)}
                        disabled={isVaultLocked}
                        title="Delete goal"
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-theme-muted hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed Goals Section */}
      {completedGoals.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-theme/40">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-xs tracking-wider uppercase text-theme-muted flex items-center gap-2">
              <span>Completed Goals</span>
              <span className="px-2 py-0.5 rounded-full bg-surface-secondary border border-theme text-theme-muted font-mono text-[10px]">
                {completedGoals.length}
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                id={`goal-completed-${goal.id}`}
                className="group bg-surface-card/60 border border-theme/60 rounded-2xl p-4 md:p-5 shadow-xs transition-all flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Completed Badge / Reopen Toggle */}
                  <div className="mt-0.5 w-5 h-5 rounded-md bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <h3 className="font-display font-medium text-sm md:text-base text-theme-secondary line-through break-words opacity-80">
                      {goal.title}
                    </h3>

                    {goal.completedAt && (
                      <p className="text-[11px] text-theme-muted font-mono">
                        Completed on {new Date(goal.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Reopen and Delete */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    id={`goal-reopen-${goal.id}`}
                    onClick={() => handleToggle(goal)}
                    disabled={isVaultLocked}
                    title="Reopen goal"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-secondary hover:bg-surface-secondary/80 border border-theme text-theme-secondary hover:text-accent text-xs font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reopen</span>
                  </button>

                  <button
                    id={`goal-delete-completed-${goal.id}`}
                    onClick={() => setGoalToDelete(goal)}
                    disabled={isVaultLocked}
                    title="Delete goal"
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-theme-muted hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="w-full max-w-lg bg-surface-card border border-theme rounded-3xl p-6 md:p-7 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-display font-bold text-lg text-theme-primary">
                  {editingGoal ? 'Edit Goal' : 'New Goal'}
                </h3>
              </div>

              <button
                onClick={closeModal}
                disabled={submitting}
                className="p-1.5 rounded-xl hover:bg-surface-secondary text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {validationError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Title Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="goal-title-input" className="font-medium text-theme-primary">
                    Goal Title <span className="text-accent">*</span>
                  </label>
                  <span className="font-mono text-[11px] text-theme-muted">
                    {title.length}/120
                  </span>
                </div>
                <input
                  id="goal-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                  placeholder="e.g., Read for 20 minutes every evening"
                  maxLength={120}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-theme text-theme-primary placeholder:text-theme-muted text-sm focus:outline-none focus:border-accent"
                />
              </div>

              {/* Description Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="goal-desc-input" className="font-medium text-theme-secondary">
                    Description <span className="text-theme-muted font-normal">(optional)</span>
                  </label>
                  <span className="font-mono text-[11px] text-theme-muted">
                    {description.length}/500
                  </span>
                </div>
                <textarea
                  id="goal-desc-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Why this matters to you, or small steps you can take..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-theme text-theme-primary placeholder:text-theme-muted text-xs md:text-sm focus:outline-none focus:border-accent resize-none font-serif-body"
                />
              </div>

              {/* Target Date Field */}
              <div className="space-y-1.5">
                <label htmlFor="goal-target-date-input" className="block text-xs font-medium text-theme-secondary">
                  Target Date <span className="text-theme-muted font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="goal-target-date-input"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-secondary border border-theme text-theme-primary text-xs md:text-sm focus:outline-none focus:border-accent"
                  />
                  {targetDate && (
                    <button
                      type="button"
                      onClick={() => setTargetDate('')}
                      className="px-2.5 py-2 rounded-xl bg-surface-secondary border border-theme hover:border-theme-muted text-theme-muted hover:text-theme-primary text-xs transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-theme/60">
                <button
                  id="goal-cancel-btn"
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface-secondary/80 border border-theme text-theme-secondary text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="goal-save-btn"
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-4.5 py-2 rounded-xl bg-accent hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {goalToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-surface-card border border-theme rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="font-display font-bold text-base text-theme-primary">
                Delete Goal?
              </h3>
            </div>

            <p className="text-xs text-theme-secondary font-serif-body leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-theme-primary">"{goalToDelete.title}"</span>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setGoalToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-surface-secondary hover:bg-surface-secondary/80 border border-theme text-theme-secondary text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="goal-confirm-delete-btn"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
