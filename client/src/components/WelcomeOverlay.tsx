import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { RoleWelcome } from './RoleWelcome';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '@shared/types';

interface WelcomeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  userName: string;
}

export function WelcomeOverlay({ isOpen, onClose, role, userName }: WelcomeOverlayProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-sm sm:p-md transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-kore-white rounded-lg shadow-2xl max-w-4xl w-full mx-auto max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-lg sm:p-xl border-b border-kore-border sticky top-0 bg-kore-white rounded-t-lg">
          <div>
            <h1 className="font-display text-h2 text-kore-ink mb-xs">
              Willkommen bei KORE
            </h1>
            <p className="font-body text-small text-kore-mid">
              Deine rollenspezifische Einführung
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-[40px] h-[40px] rounded-md hover:bg-kore-surface transition-colors flex items-center justify-center text-kore-mid hover:text-kore-ink"
            aria-label="Schließen"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-lg sm:p-xl">
          <RoleWelcome 
            role={role} 
            userName={userName} 
            isFirstLogin={true}
          />

          {/* Additional Welcome Content */}
          <div className="mt-xl pt-xl border-t border-kore-border">
            <h3 className="font-display text-h3 text-kore-ink mb-md">
              Nächste Schritte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
              <WelcomeStep
                number="1"
                title="Profil vervollständigen"
                description="Vervollständige deine Benutzereinstellungen und Präferenzen"
              />
              <WelcomeStep
                number="2"
                title="Tools erkunden"
                description="Entdecke die verfügbaren Tools für deine Rolle"
              />
              <WelcomeStep
                number="3"
                title="Team kontaktieren"
                description="Bei Fragen wende dich an deinen Vorgesetzten oder Support"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-sm justify-end">
              <button
                onClick={handleClose}
                className="px-lg py-md border border-kore-border text-kore-ink hover:border-kore-mid hover:bg-kore-surface transition-colors font-body text-small"
              >
                Später
              </button>
              <button
                onClick={handleClose}
                className="px-lg py-md bg-kore-ink text-kore-white hover:bg-kore-ink/90 transition-colors font-body text-small flex items-center gap-sm"
              >
                <span>Los geht's</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({ number, title, description }: { 
  number: string; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="text-center">
      <div className="w-8 h-8 rounded-full bg-kore-brass text-kore-white flex items-center justify-center font-body text-small font-medium mx-auto mb-sm">
        {number}
      </div>
      <h4 className="font-body text-small font-medium text-kore-ink mb-xs">
        {title}
      </h4>
      <p className="font-body text-caption text-kore-mid leading-relaxed">
        {description}
      </p>
    </div>
  );
}