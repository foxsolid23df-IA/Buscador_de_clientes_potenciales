import React, { useState, useCallback } from 'react';
import { Database, Download, Sparkles } from 'lucide-react';
import { Lead, SearchParams, LeadStatus } from './types';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import * as geminiService from './services/gemini';

const App: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CSV Export Function
  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = ['Nombre', 'Dirección', 'Teléfono', 'Email', 'Web', 'Propietario/CEO', 'Estado', 'Map URL'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => [
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${lead.address.replace(/"/g, '""')}"`,
        `"${(lead.phone || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${(lead.website || '').replace(/"/g, '""')}"`,
        `"${(lead.owner || '').replace(/"/g, '""')}"`,
        lead.status,
        lead.sourceUrl || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Maps Discovery
  const handleSearch = async (params: SearchParams) => {
    setIsSearching(true);
    setError(null);
    setLeads([]); // Clear previous results

    try {
      const results = await geminiService.findBusinesses(params.industry, params.location);
      if (results.length === 0) {
        setError("No se encontraron negocios con esos criterios. Intenta ampliar la ubicación.");
      }
      setLeads(results);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al buscar en Google Maps. Por favor verifica tu API Key.");
    } finally {
      setIsSearching(false);
    }
  };

  // Single Item Enrichment
  const handleEnrichLead = useCallback(async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    // Optimistic update to show loading state
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: LeadStatus.Enriching } : l));

    try {
      const enrichedLead = await geminiService.enrichLead(lead);
      setLeads(prev => prev.map(l => l.id === leadId ? enrichedLead : l));
    } catch (err) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: LeadStatus.Failed } : l));
    }
  }, [leads]);

  // Bulk Enrichment
  const handleEnrichAll = async () => {
    setIsEnriching(true);
    const pendingLeads = leads.filter(l => l.status === LeadStatus.Discovered || l.status === LeadStatus.Failed);
    
    // Process in small batches to be nice to the browser/rate limits
    // Note: In a real prod app, you'd use a queue system.
    const BATCH_SIZE = 3;
    for (let i = 0; i < pendingLeads.length; i += BATCH_SIZE) {
        const batch = pendingLeads.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(lead => handleEnrichLead(lead.id)));
    }
    
    setIsEnriching(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 text-white p-2 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">LeadGenius <span className="text-brand-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-4">
             {leads.length > 0 && (
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Extracción Inteligente de Negocios</h2>
          <p className="text-slate-600">
            Encuentra clientes potenciales en Google Maps, extrae sus datos de contacto e identifica a los propietarios utilizando inteligencia artificial avanzada.
          </p>
        </div>

        {/* Search Form */}
        <SearchForm onSearch={handleSearch} isLoading={isSearching} />

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <Sparkles className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="mb-12">
           <ResultsTable 
              leads={leads} 
              onEnrich={handleEnrichLead} 
              onEnrichAll={handleEnrichAll}
              isProcessing={isEnriching}
           />
        </div>

      </main>
    </div>
  );
};

export default App;
