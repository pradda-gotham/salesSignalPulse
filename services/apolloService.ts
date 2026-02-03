// Apollo.io API Service for Contact Enrichment
// Documentation: https://apolloio.github.io/apollo-api-docs/

interface ApolloContact {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    linkedin_url: string | null;
    title: string;
    email: string | null;
    sanitized_phone: string | null;
    organization_name: string;
    organization: {
        name: string;
        website_url: string;
        linkedin_url: string | null;
    } | null;
}

interface ApolloCompany {
    id: string;
    name: string;
    website_url: string;
    linkedin_url: string | null;
    primary_domain: string;
    estimated_num_employees: number;
    annual_revenue: string | null;
    industry: string;
    publicly_traded_symbol: string | null;
}

interface ApolloPersonSearchResponse {
    people: ApolloContact[];
    pagination: {
        page: number;
        per_page: number;
        total_entries: number;
        total_pages: number;
    };
}

interface ApolloCompanySearchResponse {
    organizations: ApolloCompany[];
    pagination: {
        page: number;
        per_page: number;
        total_entries: number;
        total_pages: number;
    };
}

// Use Vite proxy to avoid CORS issues in development
// In production, this should point to your backend API
const APOLLO_API_BASE = import.meta.env.DEV
    ? '/api/apollo'  // Proxied through Vite dev server
    : 'https://api.apollo.io/v1';  // Direct call (requires backend proxy in production)


async function makeApolloRequest<T>(endpoint: string, body: any): Promise<T> {
    const apiKey = import.meta.env.VITE_APOLLO_API_KEY;

    if (!apiKey) {
        console.error('VITE_APOLLO_API_KEY is missing from environment variables');
        throw new Error('Apollo API key not configured');
    }

    console.log(`[Apollo] Requesting: ${endpoint}`);
    console.log(`[Apollo] Base URL: ${APOLLO_API_BASE}`);

    try {
        const response = await fetch(`${APOLLO_API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'X-Api-Key': apiKey
            },
            body: JSON.stringify(body)
        });

        console.log(`[Apollo] Response Status: ${response.status} ${response.statusText}`);
        console.log(`[Apollo] Response Headers:`, JSON.stringify([...response.headers.entries()]));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Apollo API Error:', response.status, errorText);
            throw new Error(`Apollo API error: ${response.status} - ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();
        // console.log(`[Apollo] Success Response from ${endpoint}`);
        return data;
    } catch (error) {
        console.error(`[Apollo] Network/Fetch Error for ${endpoint}:`, error);
        throw error;
    }
}

export const apolloService = {
    /**
     * Find a company by name using the search endpoint
     * This is more reliable than enrich and works with just the company name
     */
    async findCompany(companyName: string): Promise<ApolloCompany | null> {
        try {
            console.log('[Apollo] Searching for company:', companyName);

            const response = await makeApolloRequest<ApolloCompanySearchResponse>('/mixed_companies/search', {
                q_organization_name: companyName,
                page: 1,
                per_page: 1
            });

            const company = response.organizations?.[0];
            if (company) {
                console.log('[Apollo] Company found:', company.name, '| Domain:', company.primary_domain);
                return company;
            }

            console.warn('[Apollo] No company found for:', companyName);
            return null;
        } catch (error) {
            console.warn('[Apollo] Company search failed:', error);
            return null;
        }
    },

    /**
     * Find decision makers at a company by domain and role keywords
     */
    async findDecisionMakers(
        companyDomain: string,
        roleKeywords: string[] = ['CEO', 'Director', 'Manager', 'Head']
    ): Promise<ApolloContact[]> {
        try {
            console.log('[Apollo] Searching for contacts at:', companyDomain);

            // Build title query - Apollo uses OR logic between array items
            const titleQuery = roleKeywords.join(' OR ');

            const response = await makeApolloRequest<ApolloPersonSearchResponse>('/mixed_people/api_search', {
                q_organization_domains: companyDomain,
                person_titles: roleKeywords,
                page: 1,
                per_page: 5 // Get top 5 contacts
            });

            console.log('[Apollo] Found', response.people?.length || 0, 'contacts');
            console.log('[Apollo] Contact data:', JSON.stringify(response.people?.[0], null, 2));
            return response.people || [];
        } catch (error) {
            console.warn('[Apollo] Contact search failed:', error);
            return [];
        }
    },

    /**
     * Enrich a person to get full details (email, phone, full name)
     * This costs credits but returns complete contact information
     */
    async enrichPerson(personId: string): Promise<ApolloContact | null> {
        try {
            console.log('[Apollo] Enriching person:', personId);

            const response = await makeApolloRequest<{ person: ApolloContact }>('/people/match', {
                id: personId,
                reveal_personal_emails: true
                // Note: reveal_phone_number requires webhook_url for async delivery
            });

            if (response.person) {
                console.log('[Apollo] Enriched:', response.person.name || `${response.person.first_name} ${response.person.last_name}`);
                return response.person;
            }
            return null;
        } catch (error) {
            console.warn('[Apollo] Person enrichment failed:', error);
            return null;
        }
    },

    /**
     * Find and enrich decision makers - gets full contact details
     */
    async findAndEnrichDecisionMakers(
        companyDomain: string,
        roleKeywords: string[] = ['CEO', 'Director', 'Manager', 'Head'],
        maxContacts: number = 3
    ): Promise<ApolloContact[]> {
        try {
            // Step 1: Search for contacts (free, no credits)
            console.log('[Apollo] Searching for contacts at:', companyDomain);

            const searchResponse = await makeApolloRequest<ApolloPersonSearchResponse>('/mixed_people/api_search', {
                q_organization_domains_list: [companyDomain],
                person_titles: roleKeywords,
                page: 1,
                per_page: maxContacts
            });

            const searchResults = searchResponse.people || [];
            console.log('[Apollo] Found', searchResults.length, 'contacts to enrich');

            if (searchResults.length === 0) {
                return [];
            }

            // Step 2: Enrich each contact to get full details (costs credits)
            const enrichedContacts: ApolloContact[] = [];

            for (const person of searchResults.slice(0, maxContacts)) {
                try {
                    const enriched = await this.enrichPerson(person.id);
                    if (enriched) {
                        enrichedContacts.push(enriched);
                    }
                } catch (e) {
                    console.warn('[Apollo] Failed to enrich contact:', person.id);
                }
            }

            console.log('[Apollo] Successfully enriched', enrichedContacts.length, 'contacts');
            return enrichedContacts;
        } catch (error) {
            console.warn('[Apollo] Find and enrich failed:', error);
            return [];
        }
    }
};
