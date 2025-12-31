export interface Lead {
  id: string;
  name: string;
  address: string;
  placeId?: string;
  website?: string;
  phone?: string;
  email?: string;
  owner?: string;
  status: 'discovered' | 'enriching' | 'completed' | 'failed';
  sourceUrl?: string; // Google Maps or Website URL found
  notes?: string;
}

export interface SearchParams {
  industry: string;
  location: string;
}

export enum LeadStatus {
  Discovered = 'discovered',
  Enriching = 'enriching',
  Completed = 'completed',
  Failed = 'failed'
}
