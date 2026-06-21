import { AlertCircle, XCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '@shared/types';

interface ErrorMessageProps {
  type?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  details?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  dismissible?: boolean;
  onDismiss?: () => void;
  userRole?: UserRole;
  errorCode?: string;
  timestamp?: string;
}

const typeConfig = {
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-500',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-500',
    titleColor: 'text-yellow-800',
    textColor: 'text-yellow-700',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-500',
    titleColor: 'text-green-800',
    textColor: 'text-green-700',
  },
};

// Role-spezifische Hilfe-Texte für häufige Fehler
const roleSpecificHelp: Record<string, Record<UserRole, string>> = {
  'PERMISSION_DENIED': {
    kore_admin: 'Als Super Admin sollten Sie alle Berechtigungen haben. Kontaktieren Sie den Support.',
    tenant_admin: 'Diese Aktion erfordert möglicherweise Super Admin Rechte. Wenden Sie sich an KORE.',
    regional_manager: 'Diese Funktion ist nur für Administratoren verfügbar. Kontaktieren Sie Ihren Admin.',
    multisite_manager: 'Diese Funktion ist nur für höhere Rollen verfügbar. Kontaktieren Sie Ihren Regional Manager.',
    store_manager: 'Diese Funktion ist nur für Manager-Ebenen verfügbar. Sprechen Sie mit Ihrem Regional Manager.',
    learner: 'Diese Funktion steht nur Managern zur Verfügung. Wenden Sie sich an Ihren Store Manager.',
  },
  'STORE_ACCESS_DENIED': {
    kore_admin: 'Prüfen Sie die Store-Zuweisungen im Admin-Bereich.',
    tenant_admin: 'Überprüfen Sie die Store-Berechtigungen in der Benutzerverwaltung.',
    regional_manager: 'Dieser Store ist nicht Ihrer Region zugeordnet.',
    multisite_manager: 'Dieser Store ist nicht Ihren Stores zugeordnet.',
    store_manager: 'Sie sind nicht als Manager für diesen Store berechtigt.',
    learner: 'Sie haben keinen Zugang zu diesem Store. Kontaktieren Sie Ihren Manager.',
  },
  'TOOL_NOT_AVAILABLE': {
    kore_admin: 'Prüfen Sie die Tool-Konfiguration für diesen Tenant.',
    tenant_admin: 'Dieses Tool ist möglicherweise nicht für Ihr Unternehmen freigeschaltet.',
    regional_manager: 'Dieses Tool ist für Ihre Region nicht verfügbar.',
    multisite_manager: 'Dieses Tool ist für Ihre Stores nicht freigeschaltet.',
    store_manager: 'Dieses Tool ist für Ihren Store nicht verfügbar.',
    learner: 'Dieses Tool steht Ihnen nicht zur Verfügung.',
  },
};

export function ErrorMessage({
  type = 'error',
  title,
  message,
  details,
  actions,
  dismissible = false,
  onDismiss,
  userRole,
  errorCode,
  timestamp,
}: ErrorMessageProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  // Zeige role-spezifische Hilfe wenn verfügbar
  const roleHelp = errorCode && userRole && roleSpecificHelp[errorCode]?.[userRole];

  return (
    <div className={`border rounded-lg p-lg ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-md">
        <Icon size={20} className={`${config.iconColor} flex-shrink-0 mt-[1px]`} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-body text-body font-medium ${config.titleColor} mb-xs`}>
              {title}
            </h3>
          )}
          
          <p className={`font-body text-small ${config.textColor} leading-relaxed`}>
            {message}
          </p>

          {details && (
            <details className="mt-sm">
              <summary className={`font-body text-caption ${config.textColor} cursor-pointer hover:opacity-80`}>
                Weitere Details anzeigen
              </summary>
              <div className={`mt-xs p-sm bg-white/50 rounded text-[0.7rem] ${config.textColor} font-mono`}>
                {details}
                {errorCode && (
                  <>
                    <br />
                    <span className="font-body">Fehlercode: {errorCode}</span>
                  </>
                )}
                {timestamp && (
                  <>
                    <br />
                    <span className="font-body">Zeit: {new Date(timestamp).toLocaleString('de-DE')}</span>
                  </>
                )}
              </div>
            </details>
          )}

          {roleHelp && (
            <div className="mt-sm p-sm bg-white/70 rounded border-l-2 border-current">
              <p className={`font-body text-caption ${config.textColor}`}>
                <strong>Hilfe für Ihre Rolle:</strong> {roleHelp}
              </p>
            </div>
          )}

          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-sm mt-md">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`px-md py-xs text-caption font-medium rounded transition-colors ${
                    action.variant === 'primary'
                      ? `bg-kore-ink text-kore-white hover:bg-kore-ink/90`
                      : `bg-white/70 ${config.textColor} hover:bg-white`
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}