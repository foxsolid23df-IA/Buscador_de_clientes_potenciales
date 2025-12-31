import React from 'react';
import { Lead, LeadStatus } from '../types';
import { Globe, Mail, Phone, User, ExternalLink, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ResultsTableProps {
  leads: Lead[];
  onEnrich: (leadId: string) => void;
  onEnrichAll: () => void;
  isProcessing: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ leads, onEnrich, onEnrichAll, isProcessing }) => {
  if (leads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
          <SearchIcon className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Sin resultados aún</h3>
        <p className="text-slate-500 mt-1">Realiza una búsqueda para encontrar prospectos.</p>
      </div>
    );
  }

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case LeadStatus.Discovered:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Descubierto</span>;
      case LeadStatus.Enriching:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Investigando</span>;
      case LeadStatus.Completed:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Completo</span>;
      case LeadStatus.Failed:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" /> Error</span>;
    }
  };

  const pendingCount = leads.filter(l => l.status === LeadStatus.Discovered).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800">Resultados ({leads.length})</h3>
        {pendingCount > 0 && (
          <button
            onClick={onEnrichAll}
            disabled={isProcessing}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            Investigar Todo ({pendingCount})
          </button>
        )}
      </div>
      
      <div className="overflow-auto custom-scrollbar flex-1">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Negocio</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contacto</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Investigación Profunda</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">{lead.name}</span>
                    <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      {lead.address}
                    </span>
                    {lead.sourceUrl && (
                      <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Ver en Maps
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {lead.phone ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" /> {lead.phone}
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Sin teléfono</span>
                    )}
                     {lead.email ? (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Mail className="w-3 h-3 text-slate-400" /> {lead.email}
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Sin email</span>
                    )}
                    {lead.website ? (
                        <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline mt-1">
                             <Globe className="w-3 h-3" /> Website
                        </a>
                    ) : (
                         <span className="text-xs text-slate-400 italic">Sin web</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {lead.owner ? (
                        <span className="text-sm font-medium text-slate-900 bg-amber-50 px-2 py-1 rounded border border-amber-100">{lead.owner}</span>
                    ) : (
                        <span className="text-xs text-slate-400">Desconocido</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(lead.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {lead.status === LeadStatus.Discovered && (
                    <button
                      onClick={() => onEnrich(lead.id)}
                      disabled={isProcessing}
                      className="text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded transition-all"
                    >
                      Investigar
                    </button>
                  )}
                  {lead.status === LeadStatus.Failed && (
                     <button
                     onClick={() => onEnrich(lead.id)}
                     disabled={isProcessing}
                     className="text-slate-600 hover:text-slate-900 font-medium text-xs border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded transition-all"
                   >
                     Reintentar
                   </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Simple Icon component for the empty state
const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export default ResultsTable;
