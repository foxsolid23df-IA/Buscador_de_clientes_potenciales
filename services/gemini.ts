import { GoogleGenAI } from "@google/genai";
import { Lead, LeadStatus } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Gemini 2.5 Flash with Google Maps Grounding to find businesses.
 * This replaces the need for the Places API.
 */
export const findBusinesses = async (industry: string, location: string): Promise<Lead[]> => {
  try {
    const prompt = `Encuentra 10 negocios de tipo "${industry}" en "${location}". 
    Proporciona una lista detallada. Asegúrate de incluir el nombre exacto y la dirección de cada uno.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
            retrievalConfig: {
                latLng: {
                    // Defaulting to center of US if unavailable, ideally this comes from user location
                    // but Maps grounding works well with text query location too.
                    latitude: 37.0902,
                    longitude: -95.7129
                }
            }
        }
      }
    });

    const leads: Lead[] = [];
    const candidates = response.candidates;
    
    if (candidates && candidates[0]) {
        const groundingChunks = candidates[0].groundingMetadata?.groundingChunks;
        
        // Extract structured data from Maps grounding chunks
        if (groundingChunks) {
            groundingChunks.forEach((chunk) => {
                if (chunk.maps) {
                    const place = chunk.maps;
                    // Verify we haven't added this place ID already
                    const exists = leads.find(l => l.placeId === place.placeId);
                    
                    if (!exists && place.title) {
                        leads.push({
                            id: crypto.randomUUID(),
                            placeId: place.placeId,
                            name: place.title,
                            address: place.address || "Dirección no disponible",
                            status: LeadStatus.Discovered,
                            sourceUrl: place.uri,
                            website: "",
                            phone: "",
                            email: "",
                            owner: ""
                        });
                    }
                }
            });
        }
    }

    return leads;
  } catch (error) {
    console.error("Error finding businesses:", error);
    throw error;
  }
};

/**
 * Uses Gemini 3 Flash Preview with Google Search Grounding to enrich lead data.
 * This performs the "Web Scraping" and "Deep Research" simulation.
 */
export const enrichLead = async (lead: Lead): Promise<Lead> => {
  try {
    // We ask for a JSON response in the prompt to make parsing easier, 
    // even though we are using the Search tool.
    const prompt = `
      Actúa como un investigador experto en negocios.
      
      Objetivo: Encontrar información de contacto y propietario para el siguiente negocio:
      Nombre: "${lead.name}"
      Dirección: "${lead.address}"
      
      Usa Google Search para encontrar:
      1. El sitio web oficial.
      2. Un número de teléfono público.
      3. Un correo electrónico de contacto (info, sales, contacto, etc.).
      4. El nombre del dueño, fundador o CEO (Investigación profunda).
      
      Devuelve la respuesta ESTRICTAMENTE como un bloque de código JSON válido con el siguiente formato, sin texto adicional antes o después:
      \`\`\`json
      {
        "website": "url encontrada o vacío",
        "phone": "número o vacío",
        "email": "email o vacío",
        "owner": "nombre encontrado o vacío"
      }
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    
    // Parse the JSON from the markdown block
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    
    let enrichedData = { website: "", phone: "", email: "", owner: "" };
    
    if (jsonMatch) {
        try {
            enrichedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } catch (e) {
            console.warn("Failed to parse enrichment JSON", e);
        }
    }

    return {
      ...lead,
      website: enrichedData.website !== "vacío" ? enrichedData.website : lead.website,
      phone: enrichedData.phone !== "vacío" ? enrichedData.phone : lead.phone,
      email: enrichedData.email !== "vacío" ? enrichedData.email : "",
      owner: enrichedData.owner !== "vacío" ? enrichedData.owner : "",
      status: LeadStatus.Completed
    };

  } catch (error) {
    console.error(`Error enriching lead ${lead.name}:`, error);
    return {
        ...lead,
        status: LeadStatus.Failed,
        notes: "Error en la investigación"
    };
  }
};
