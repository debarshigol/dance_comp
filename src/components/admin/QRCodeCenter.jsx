import React, { useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { useCompetition } from '../../context/CompetitionContext';
import { 
  QrCode, 
  Download, 
  Copy, 
  ExternalLink, 
  Smartphone, 
  Sparkles, 
  Share2, 
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function QRCodeCenter() {
  const { currentRound, setActiveRole, showToast } = useCompetition();
  const canvasRef = useRef(null);

  // Public audience voting URL with ?role=audience fail-safe
  const votingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/audience?role=audience`
    : 'https://dancefest.live/audience?role=audience';

  const copyVotingUrl = () => {
    navigator.clipboard.writeText(votingUrl);
    showToast('Audience voting URL copied to clipboard!');
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-canvas-download');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `dancefest-voting-qr-${currentRound?.id || 'event'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showToast('QR Code image downloaded successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <QrCode className="w-6 h-6 text-pink-500" />
          <span>Audience Voting QR Code</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Big Interactive QR Display Card */}
        <div className="lg:col-span-5 glass-panel-glow rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden border border-pink-500/30">
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>Active for: {currentRound?.name}</span>
          </div>

          {/* QR Code Container */}
          <div className="p-5 bg-white rounded-3xl shadow-2xl shadow-pink-500/20 mb-6 transition-transform hover:scale-105 duration-300">
            <QRCodeSVG
              value={votingUrl}
              size={220}
              level="H"
              includeMargin={false}
              fgColor="#030712"
              bgColor="#ffffff"
            />
            {/* Hidden canvas for downloading PNG */}
            <div className="hidden">
              <QRCodeCanvas
                id="qr-canvas-download"
                value={votingUrl}
                size={800}
                level="H"
                includeMargin={true}
                fgColor="#030712"
                bgColor="#ffffff"
              />
            </div>
          </div>

          <p className="text-xs text-slate-300 font-semibold mb-5">
            Scan to Vote
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full">
            <button
              onClick={downloadQRCode}
              className="flex-1 min-w-[130px] py-2.5 px-4 bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={() => setActiveRole('audience')}
              className="flex-1 min-w-[130px] py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-4 h-4 text-pink-400" />
              <span>Open Voter View</span>
            </button>
          </div>
        </div>

        {/* Link Details & Usage Guidelines */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          {/* URL Box */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Share2 className="w-4 h-4 text-pink-400" />
              <span>Direct Public URL</span>
            </h3>

            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-white/10">
              <input
                type="text"
                readOnly
                value={votingUrl}
                className="bg-transparent text-xs font-mono text-pink-300 flex-1 px-2 focus:outline-none truncate"
              />
              <button
                onClick={copyVotingUrl}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>

          {/* Quick Stage Projector Preview */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-xs">Stage Display</h4>
              <p className="text-[11px] text-slate-400">
                Auditorium screen view with live leaderboard and QR code.
              </p>
            </div>
            <button
              onClick={() => setActiveRole('stage')}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all shrink-0"
            >
              Open Stage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
