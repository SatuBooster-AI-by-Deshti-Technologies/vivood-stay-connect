// API клиент для замены Supabase
const API_BASE = 'http://194.32.141.216:3005/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface Session {
  access_token: string;
}

interface AuthResponse {
  user: User;
  session: Session;
}

class APIClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error);
    }

    return response.json();
  }

  // Auth methods
  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await this.post('/auth/register', { email, password, name });
    this.token = response.session.access_token;
    localStorage.setItem('auth_token', this.token!);
    return response;
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const response = await this.post('/auth/login', { email, password });
    this.token = response.session.access_token;
    localStorage.setItem('auth_token', this.token!);
    return response;
  }

  async signOut() {
    await this.post('/auth/logout', {});
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async getSession() {
    if (!this.token) {
      return { session: null };
    }
    
    try {
      const data = await this.get('/auth/me');
      return { session: { access_token: this.token }, ...data };
    } catch (error) {
      this.token = null;
      localStorage.removeItem('auth_token');
      return { session: null };
    }
  }

  // Accommodations
  async getAccommodations() {
    return this.get('/accommodations');
  }

  async getAdminAccommodations() {
    return this.get('/accommodations/admin');
  }

  async createAccommodation(data: any) {
    return this.post('/accommodations', data);
  }

  async updateAccommodation(id: string, data: any) {
    return this.put(`/accommodations/${id}`, data);
  }

  async deleteAccommodation(id: string) {
    return this.delete(`/accommodations/${id}`);
  }

  // Bookings
  async createBooking(data: any) {
    return this.post('/bookings', data);
  }

  async getBookings() {
    return this.get('/bookings');
  }

  async updateBooking(id: string, data: any) {
    return this.put(`/bookings/${id}`, data);
  }

  async getCalendarEvents() {
    return this.get('/bookings/calendar');
  }

  // Clients
  async getClients() {
    return this.get('/clients');
  }

  async createClient(data: any) {
    return this.post('/clients', data);
  }

  async updateClient(id: string, data: any) {
    return this.put(`/clients/${id}`, data);
  }

  async deleteClient(id: string) {
    return this.delete(`/clients/${id}`);
  }

  async getClient(id: string) {
    return this.get(`/clients/${id}`);
  }

  // Stats
  async getStats() {
    return this.get('/stats');
  }

  // Utility method to get image URL
  getImageUrl(imagePath: string) {
    if (!imagePath) return '';
    return `${API_BASE.replace('/api', '')}${imagePath}`;
  }
}

export const api = new APIClient();

// Compatibility layer for existing Supabase code
export const supabase = {
  auth: {
    signUp: (options: { email: string; password: string; options: { data: { name: string } } }) =>
      api.signUp(options.email, options.password, options.options.data.name).then(data => ({ data, error: null })),
    
    signInWithPassword: (options: { email: string; password: string }) =>
      api.signIn(options.email, options.password).then(data => ({ data, error: null })).catch(error => ({ data: null, error })),
    
    signOut: () => api.signOut().then(() => ({ error: null })),
    
    getSession: () => api.getSession().then(data => ({ data })),
    
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      // Simplified version - в реальном приложении нужна более сложная логика
      const session = localStorage.getItem('auth_token') ? { access_token: localStorage.getItem('auth_token') } : null;
      callback('SIGNED_IN', session);
      
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  },

  from: (table: string) => ({
    select: (columns = '*') => ({
      then: async (resolve: (data: any) => void) => {
        let data;
        switch (table) {
          case 'accommodation_types':
            data = await api.getAdminAccommodations();
            break;
          case 'bookings':
            data = await api.getBookings();
            break;
          case 'clients':
            data = await api.getClients();
            break;
          case 'profiles':
            const session = await api.getSession();
            data = session.profile ? [session.profile] : [];
            break;
          default:
            data = [];
        }
        resolve({ data, error: null });
      }
    }),
    
    insert: (values: any) => ({
      then: async (resolve: (data: any) => void) => {
        try {
          let result;
          switch (table) {
            case 'accommodation_types':
              result = await api.createAccommodation(values);
              break;
            case 'bookings':
              result = await api.createBooking(values);
              break;
            case 'clients':
              result = await api.createClient(values);
              break;
            default:
              throw new Error(`Insert not implemented for ${table}`);
          }
          resolve({ data: result, error: null });
        } catch (error) {
          resolve({ data: null, error });
        }
      }
    }),
    
    update: (values: any) => ({
      eq: (column: string, value: any) => ({
        then: async (resolve: (data: any) => void) => {
          try {
            let result;
            switch (table) {
              case 'accommodation_types':
                result = await api.updateAccommodation(value, values);
                break;
              case 'bookings':
                result = await api.updateBooking(value, values);
                break;
              case 'clients':
                result = await api.updateClient(value, values);
                break;
              default:
                throw new Error(`Update not implemented for ${table}`);
            }
            resolve({ data: result, error: null });
          } catch (error) {
            resolve({ data: null, error });
          }
        }
      })
    }),
    
    delete: () => ({
      eq: (column: string, value: any) => ({
        then: async (resolve: (data: any) => void) => {
          try {
            let result;
            switch (table) {
              case 'accommodation_types':
                result = await api.deleteAccommodation(value);
                break;
              case 'clients':
                result = await api.deleteClient(value);
                break;
              default:
                throw new Error(`Delete not implemented for ${table}`);
            }
            resolve({ data: result, error: null });
          } catch (error) {
            resolve({ data: null, error });
          }
        }
      })
    })
  }),

  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        try {
          const result = await api.uploadFile(file);
          return { data: { path: result.imageUrl }, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },

      getPublicUrl: (path: string) => ({
        data: { publicUrl: api.getImageUrl(path) }
      })
    })
  },

  // Accounting API
  async getAccountingEntries(params?: any) {
    return this.get('/accounting/entries', params);
  },

  async createAccountingEntry(data: any) {
    return this.post('/accounting/entries', data);
  },

  async updateAccountingEntry(id: string, data: any) {
    return this.put(`/accounting/entries/${id}`, data);
  },

  async deleteAccountingEntry(id: string) {
    return this.delete(`/accounting/entries/${id}`);
  },

  async getAccounts() {
    return this.get('/accounting/accounts');
  },

  async getTrialBalance(params?: any) {
    return this.get('/accounting/trial-balance', params);
  },

  async getProfitLoss(params?: any) {
    return this.get('/accounting/profit-loss', params);
  },

  // Audit API
  async getAuditLogs(params?: any) {
    return this.get('/audit/log', params);
  },

  async getAuditStats(params?: any) {
    return this.get('/audit/stats', params);
  },

  async getAuditRecord(table: string, id: string) {
    return this.get(`/audit/record/${table}/${id}`);
  }
};