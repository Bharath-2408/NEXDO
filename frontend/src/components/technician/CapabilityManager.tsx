import React, { useState } from 'react';
import { Plus, X, Shield } from 'lucide-react';
import { useTechnician } from '../../store/TechnicianContext';
import { ALL_AVAILABLE_CAPABILITIES } from '../../constants/capabilities';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const CapabilityManager: React.FC = () => {
  const {
    capabilities,
    addCapability,
    removeCapability,
    toggleCapabilityActive,
    updateExperienceLevel,
  } = useTechnician();

  const [addModalOpen, setAddModalOpen] = useState(false);

  const availableToAdd = ALL_AVAILABLE_CAPABILITIES.filter(
    (c) => !capabilities.some((existing) => existing.id === c.id)
  );

  return (
    <div className="w-full text-left">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-extrabold text-[#071A36]">
            Technician Capabilities ({capabilities.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            A NEXDO technician can handle multiple services. You receive eligible requests across all active capabilities.
          </p>
        </div>
        <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setAddModalOpen(true)}>
          Add Skill
        </Button>
      </div>

      {/* Active Capabilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {capabilities.map((cap) => (
          <div
            key={cap.id}
            className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {cap.category}
                  </span>
                  <h4 className="font-bold text-sm text-[#071A36]">{cap.name}</h4>
                </div>
                <button
                  onClick={() => removeCapability(cap.id)}
                  className="text-slate-300 hover:text-rose-600 p-1 rounded-full transition-colors"
                  title="Remove capability"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-2.5">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-bold text-blue-700 border border-blue-200/70">
                  {cap.experienceLevel}
                </span>
                {cap.isCertified && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-200/70 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Verified Cert
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cap.active}
                  onChange={() => toggleCapabilityActive(cap.id)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] font-medium text-slate-600">
                  {cap.active ? 'Receiving Requests' : 'Paused'}
                </span>
              </label>

              <select
                value={cap.experienceLevel}
                onChange={(e) =>
                  updateExperienceLevel(cap.id, e.target.value as any)
                }
                className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
              >
                <option value="BEGINNER">Beginner (1-2 yrs)</option>
                <option value="INTERMEDIATE">Intermediate (3-5 yrs)</option>
                <option value="EXPERT">Expert (5+ yrs)</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Add Capability Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Service Capability">
        <div className="text-left">
          <p className="text-xs text-slate-500 mb-3">
            Select additional skills you are certified or experienced in providing:
          </p>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {availableToAdd.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">All available capabilities already added!</p>
            ) : (
              availableToAdd.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">{item.category}</span>
                    <span className="text-xs font-bold text-slate-800">{item.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      addCapability(item.id);
                      setAddModalOpen(false);
                    }}
                  >
                    Add
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
