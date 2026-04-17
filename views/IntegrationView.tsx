import React, { useState } from 'react';
import { Mail, Briefcase, CheckCircle2, Link2, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const IntegrationView: React.FC = () => {
  const { isDarkMode } = useTheme();

  const [connected, setConnected] = useState<Record<string, boolean>>({
    gmail: false,
    outlook: false,
    hubspot: false,
    salesforce: false,
    'other-mail': false,
    'other-crm': false,
  });

  const handleConnect = (id: string) => {
    setConnected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const integrations = [
    {
      category: 'Mail Configuration',
      icon: Mail,
      items: [
        { id: 'gmail', name: 'Gmail', description: 'Connect your Google Workspace email to send dossiers directly.' },
        { id: 'outlook', name: 'Outlook', description: 'Connect your Microsoft 365 email to automatically sync communications.' },
        { id: 'other-mail', name: 'Any other', description: 'Connect via IMAP/SMTP for custom or traditional mail servers.' }
      ]
    },
    {
      category: 'CRM Integration',
      icon: Briefcase,
      items: [
        { id: 'hubspot', name: 'HubSpot', description: 'Sync leads, update deal stages, and push dossiers to HubSpot CRM.' },
        { id: 'salesforce', name: 'Salesforce', description: 'Bi-directional sync with Salesforce for comprehensive pipeline management.' },
        { id: 'other-crm', name: 'Any other', description: 'Connect any CRM via Webhooks or generic REST API integration.' }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-[32px] font-bold tracking-tight mb-2" style={{ color: isDarkMode ? '#EDEDED' : '#191C1E', fontFamily: "'Newsreader', Georgia, serif" }}>
          Integrations
        </h1>
        <p className="text-[15px]" style={{ color: isDarkMode ? '#94A3B8' : '#4A5568' }}>
          Connect Leadpulse with your favorite tools to streamline your workflow.
        </p>
      </div>

      <div className="space-y-8">
        {integrations.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }}>
                <section.icon className="w-4 h-4" style={{ color: isDarkMode ? '#EDEDED' : '#191C1E' }} />
              </div>
              <h2 className="text-xl font-semibold" style={{ color: isDarkMode ? '#EDEDED' : '#191C1E' }}>
                {section.category}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((item) => (
                <div 
                  key={item.id}
                  className="rounded-xl p-6 transition-all duration-200 border relative overflow-hidden group"
                  style={{
                    background: isDarkMode ? '#141414' : '#FFFFFF',
                    borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
                  }}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="text-lg font-bold mb-1" style={{ color: isDarkMode ? '#EDEDED' : '#191C1E' }}>{item.name}</h3>
                      <p className="text-sm" style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}>{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 relative z-10">
                    <div className="flex items-center gap-2">
                       {connected[item.id] ? (
                         <>
                           <CheckCircle2 className="w-5 h-5 text-green-500" />
                           <span className="text-sm font-medium text-green-500">Connected</span>
                         </>
                       ) : (
                         <>
                           <Link2 className="w-5 h-5" style={{ color: isDarkMode ? '#64748B' : '#94A3B8' }} />
                           <span className="text-sm font-medium" style={{ color: isDarkMode ? '#64748B' : '#94A3B8' }}>Not Connected</span>
                         </>
                       )}
                    </div>
                    
                    <button
                      onClick={() => handleConnect(item.id)}
                      className="px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                      style={{
                        background: connected[item.id] 
                          ? (isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9')
                          : '#635BFF',
                        color: connected[item.id]
                          ? (isDarkMode ? '#EDEDED' : '#191C1E')
                          : '#FFFFFF',
                      }}
                    >
                      {connected[item.id] ? 'Disconnect' : 'Connect'}
                      {!connected[item.id] && <ExternalLink className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationView;
