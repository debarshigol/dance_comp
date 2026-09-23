import React, { useState, useRef } from 'react';
import { useCompetition } from '../../context/CompetitionContext';
import { compressImage } from '../../utils/imageCompressor';
import {
  UserPlus,
  Trash2,
  Edit3,
  Upload,
  Image as ImageIcon,
  Search,
  User,
  Users,
  Phone,
  Sparkles,
  Check,
  X,
  ShieldCheck,
  CreditCard,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function CandidateManager() {
  const { 
    candidates, 
    addCandidate, 
    updateCandidate, 
    deleteCandidate, 
    isCandidateQualifiedForRound2,
    showToast 
  } = useCompetition();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [revealedIds, setRevealedIds] = useState({});
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    candidateNumber: '',
    name: '',
    phone: '',
    age: 21,
    govtIdType: 'Passport',
    govtIdNumber: '',
    category: 'Solo / Contemporary',
    style: '',
    song: '',
    bio: '',
    photo: ''
  });

  const govtIdTypes = [
    'Passport',
    'Driving License',
    'National ID / Aadhaar',
    'State ID Card',
    'Voter Card'
  ];

  const handleOpenAdd = () => {
    setEditingCandidate(null);
    setFormData({
      candidateNumber: '#' + String(candidates.length + 1).padStart(2, '0'),
      name: '',
      phone: '',
      age: 22,
      govtIdType: 'Passport',
      govtIdNumber: '',
      category: 'Solo / Contemporary',
      style: '',
      song: '',
      bio: '',
      photo: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cand) => {
    setEditingCandidate(cand);
    setFormData({
      candidateNumber: cand.candidateNumber || '',
      name: cand.name,
      phone: cand.phone || '',
      age: cand.age || 20,
      govtIdType: cand.govtIdType || 'Passport',
      govtIdNumber: cand.govtIdNumber || '',
      category: cand.category || 'Solo / Open',
      style: cand.style || '',
      song: cand.song || '',
      bio: cand.bio || '',
      photo: cand.photo
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressedBase64 = await compressImage(file, 800, 0.82);
      setFormData(prev => ({ ...prev, photo: compressedBase64 }));
      showToast('Photo uploaded & optimized for mobile!');
    } catch (err) {
      showToast('Error optimizing image: ' + err.message, 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Competitor name is required', 'error');
      return;
    }

    if (editingCandidate) {
      updateCandidate(editingCandidate.id, formData);
    } else {
      addCandidate(formData);
    }
    setIsModalOpen(false);
  };

  const toggleIdReveal = (id) => {
    setRevealedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    c.candidateNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <span>Competitors</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
              {candidates.length}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search competitor..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/30 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Competitor</span>
          </button>
        </div>
      </div>

      {/* Competitors Grid (Admin Complete View) */}
      {filteredCandidates.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Competitors Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchTerm ? 'No competitors match your search term.' : 'There are no competitors registered in the database yet. Click below to add your first competitor.'}
            </p>
          </div>
          {!searchTerm && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/30 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register First Competitor</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredCandidates.map((candidate) => {
            const isIdRevealed = !!revealedIds[candidate.id];

            return (
              <div
                key={candidate.id}
                className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-white/10 hover:border-pink-500/40"
              >
                <div>
                  {/* Header Image */}
                  <div className="relative aspect-square w-full bg-slate-900 rounded-2xl overflow-hidden">
                    <img
                      src={candidate.photo}
                      alt={candidate.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                    {/* Top-right Edit/Delete */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(candidate)}
                        className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                        title="Edit Competitor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCandidateToDelete(candidate)}
                        className="p-1.5 rounded-lg bg-rose-950/80 backdrop-blur-md text-rose-300 hover:text-rose-100 hover:bg-rose-900 transition-all"
                        title="Delete Competitor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom overlay: Name */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-extrabold text-white text-sm truncate drop-shadow-md">
                        {candidate.name}
                      </h3>
                    </div>
                  </div>

                  {/* Body Details with Govt ID Info (Admin Secure Audit View) */}
                  <div className="p-3 space-y-2 text-xs">
                    {/* ID, Age badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-pink-600/90 text-white font-mono font-black text-[10px] shadow">
                        {candidate.candidateNumber}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-white text-[10px] font-bold border border-white/10">
                        Age: {candidate.age || 21}
                      </span>
                      {isCandidateQualifiedForRound2(candidate.id) ? (
                        <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/40 text-[10px] font-bold ml-auto">
                          Top 10 Finalist
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-white/5 text-[10px] font-medium ml-auto">
                          Round 1
                        </span>
                      )}
                    </div>
                    {/* Phone & Govt ID Box */}
                    <div className="bg-slate-950/80 p-2 rounded-xl border border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" /> Phone:
                        </span>
                        <span className="font-mono text-slate-200">{candidate.phone || 'N/A'}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                        <span className="text-slate-400 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-pink-400" /> {candidate.govtIdType || 'Govt ID'}:
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-amber-300">
                            {isIdRevealed ? (candidate.govtIdNumber || 'N/A') : (candidate.govtIdNumber ? '••••' + candidate.govtIdNumber.slice(-4) : 'N/A')}
                          </span>
                          {candidate.govtIdNumber && (
                            <button
                              onClick={() => toggleIdReveal(candidate.id)}
                              className="p-0.5 text-slate-400 hover:text-white"
                            >
                              {isIdRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Competitor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-xl rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-pink-400" />
                <span>{editingCandidate ? 'Edit Competitor Profile' : 'Register New Competitor'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Candidate Badge # *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.candidateNumber}
                    onChange={(e) => setFormData({ ...formData, candidateNumber: e.target.value })}
                    placeholder="#01"
                    className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Competitor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Maya Lin"
                    className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 234-8901"
                    className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="99"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    placeholder="23"
                    className="w-full px-3 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Govt ID Verification Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-950/70 p-3 rounded-xl border border-pink-500/20">
                <div>
                  <label className="block text-pink-300 font-bold mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Govt ID Type *
                  </label>
                  <select
                    value={formData.govtIdType}
                    onChange={(e) => setFormData({ ...formData, govtIdType: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-pink-500"
                  >
                    {govtIdTypes.map(type => (
                      <option key={type} value={type} className="bg-slate-900">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-pink-300 font-bold mb-1">
                    Govt ID Document # *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.govtIdNumber}
                    onChange={(e) => setFormData({ ...formData, govtIdNumber: e.target.value })}
                    placeholder="e.g. P7829104 or DL-90281"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Photo
                </label>
                <div className="flex items-center gap-4 p-3 bg-slate-900/70 border border-white/10 rounded-xl">
                  <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-white/10 relative">
                    {formData.photo ? (
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-500 m-auto mt-5" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isCompressing}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium inline-flex items-center gap-1.5 transition-all text-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isCompressing ? 'Compressing...' : 'Upload Image'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-lg shadow-pink-600/30 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCandidate ? 'Save Changes' : 'Register Competitor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Popup Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-md rounded-3xl p-6 relative border border-rose-500/30 text-center space-y-4 shadow-2xl shadow-rose-950/50">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-white">
                Do you really want to delete?
              </h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to delete competitor <span className="text-pink-300 font-bold">"{candidateToDelete.name}"</span> ({candidateToDelete.candidateNumber})?
              </p>
              <p className="text-[11px] text-rose-400/90 font-medium bg-rose-950/30 p-2 rounded-xl border border-rose-500/20">
                This action will permanently remove their profile and all scoring data from the database.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition-all border border-white/10"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = candidateToDelete;
                  setCandidateToDelete(null);
                  await deleteCandidate(target.id);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/40 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
