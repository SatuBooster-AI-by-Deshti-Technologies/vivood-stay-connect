import { supabase as supabaseClient } from "@/integrations/supabase/client";

// Интерфейсы для типизации
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

// Основной API клиент работающий с Supabase
class APIClient {
  // Auth methods
  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) throw new Error(error.message);
    if (!data.user || !data.session) throw new Error('Registration failed');

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: name,
        role: 'user'
      },
      session: {
        access_token: data.session.access_token
      }
    };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw new Error(error.message);
    if (!data.user || !data.session) throw new Error('Login failed');

    // Получаем профиль пользователя для роли
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, name')
      .eq('user_id', data.user.id)
      .single();

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || data.user.user_metadata?.name || '',
        role: (profile?.role as 'admin' | 'user') || 'user'
      },
      session: {
        access_token: data.session.access_token
      }
    };
  }

  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw new Error(error.message);
  }

  async getSession() {
    const { data } = await supabaseClient.auth.getSession();
    
    if (!data.session) {
      return { session: null };
    }

    // Получаем профиль для дополнительной информации
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, name')
      .eq('user_id', data.session.user.id)
      .single();

    return {
      session: data.session,
      user: {
        id: data.session.user.id,
        email: data.session.user.email!,
        name: profile?.name || data.session.user.user_metadata?.name || '',
        role: (profile?.role as 'admin' | 'user') || 'user'
      },
      profile
    };
  }

  // Accommodations
  async getAccommodations() {
    const { data, error } = await supabaseClient
      .from('accommodation_types')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async getAdminAccommodations() {
    const { data, error } = await supabaseClient
      .from('accommodation_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async createAccommodation(accommodationData: any) {
    const { data, error } = await supabaseClient
      .from('accommodation_types')
      .insert(accommodationData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateAccommodation(id: string, accommodationData: any) {
    const { data, error } = await supabaseClient
      .from('accommodation_types')
      .update(accommodationData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteAccommodation(id: string) {
    const { error } = await supabaseClient
      .from('accommodation_types')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  // Bookings
  async createBooking(bookingData: any) {
    const { data, error } = await supabaseClient
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getBookings() {
    const { data, error } = await supabaseClient
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async updateBooking(id: string, bookingData: any) {
    const { data, error } = await supabaseClient
      .from('bookings')
      .update(bookingData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getCalendarEvents() {
    const { data, error } = await supabaseClient
      .from('bookings')
      .select('id, accommodation_type, check_in, check_out, status, name, guests')
      .order('check_in', { ascending: true });

    if (error) throw new Error(error.message);
    
    // Преобразуем в формат для календаря
    return data.map(booking => ({
      id: booking.id,
      title: `${booking.name} - ${booking.accommodation_type}`,
      start: new Date(booking.check_in),
      end: new Date(booking.check_out),
      resource: {
        status: booking.status,
        guests: booking.guests
      }
    }));
  }

  // Clients
  async getClients() {
    const { data, error } = await supabaseClient
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async createClient(clientData: any) {
    const { data, error } = await supabaseClient
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateClient(id: string, clientData: any) {
    const { data, error } = await supabaseClient
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteClient(id: string) {
    const { error } = await supabaseClient
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async getClient(id: string) {
    const { data, error } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // Stats - базовая статистика
  async getStats() {
    const [bookingsResult, clientsResult, accommodationsResult] = await Promise.all([
      supabaseClient.from('bookings').select('id, total_price, status', { count: 'exact' }),
      supabaseClient.from('clients').select('id', { count: 'exact' }),
      supabaseClient.from('accommodation_types').select('id', { count: 'exact' })
    ]);

    if (bookingsResult.error) throw new Error(bookingsResult.error.message);
    if (clientsResult.error) throw new Error(clientsResult.error.message);
    if (accommodationsResult.error) throw new Error(accommodationsResult.error.message);

    const totalRevenue = bookingsResult.data?.reduce((sum, booking) => 
      sum + (parseFloat(booking.total_price?.toString() || '0') || 0), 0) || 0;

    const pendingBookings = bookingsResult.data?.filter(b => b.status === 'pending').length || 0;

    return {
      totalBookings: bookingsResult.count || 0,
      totalClients: clientsResult.count || 0,
      totalAccommodations: accommodationsResult.count || 0,
      totalRevenue,
      pendingBookings
    };
  }

  // File upload через Supabase Storage
  async uploadFile(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabaseClient.storage
      .from('accommodation-images')
      .upload(fileName, file);

    if (error) throw new Error(error.message);

    const { data: urlData } = supabaseClient.storage
      .from('accommodation-images')
      .getPublicUrl(fileName);

    return {
      imageUrl: urlData.publicUrl,
      path: fileName
    };
  }

  // Utility method to get image URL
  getImageUrl(imagePath: string) {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    
    const { data } = supabaseClient.storage
      .from('accommodation-images')
      .getPublicUrl(imagePath);
    
    return data.publicUrl;
  }

  // Accounting methods
  async getAccountingEntries(params?: any) {
    const { data, error } = await supabaseClient
      .from('accounting_entries')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async createAccountingEntry(entryData: any) {
    const { data: session } = await supabaseClient.auth.getSession();
    if (!session.session?.user) throw new Error('Not authenticated');

    const { data, error } = await supabaseClient
      .from('accounting_entries')
      .insert({ ...entryData, created_by: session.session.user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateAccountingEntry(id: string, entryData: any) {
    const { data, error } = await supabaseClient
      .from('accounting_entries')
      .update(entryData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteAccountingEntry(id: string) {
    const { error } = await supabaseClient
      .from('accounting_entries')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  async getAccounts() {
    const { data, error } = await supabaseClient
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('code');

    if (error) throw new Error(error.message);
    return data;
  }

  async getTrialBalance(params?: any) {
    // Это упрощенная версия - в реальности нужна сложная SQL логика
    const { data, error } = await supabaseClient
      .from('accounting_entries')
      .select('debit_account, credit_account, amount');

    if (error) throw new Error(error.message);
    
    const balance: Record<string, number> = {};
    data.forEach(entry => {
      balance[entry.debit_account] = (balance[entry.debit_account] || 0) + parseFloat(entry.amount.toString());
      balance[entry.credit_account] = (balance[entry.credit_account] || 0) - parseFloat(entry.amount.toString());
    });

    return Object.entries(balance).map(([account, amount]) => ({
      account,
      debit: amount > 0 ? amount : 0,
      credit: amount < 0 ? Math.abs(amount) : 0
    }));
  }

  async getProfitLoss(params?: any) {
    // Упрощенная версия отчета о прибылях и убытках
    const { data, error } = await supabaseClient
      .from('accommodation_types')
      .select('price');

    if (error) throw new Error(error.message);
    
    return {
      revenue: data.reduce((sum, item) => sum + parseFloat(item.price.toString()), 0),
      expenses: 0,
      profit: data.reduce((sum, item) => sum + parseFloat(item.price.toString()), 0)
    };
  }

  // Audit methods
  async getAuditLogs(params?: any) {
    const { data, error } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    return data;
  }

  async getAuditStats(params?: any) {
    const { data, error } = await supabaseClient
      .from('audit_logs')
      .select('action', { count: 'exact' });

    if (error) throw new Error(error.message);
    
    const stats = {
      total: data.length,
      inserts: data.filter(log => log.action === 'INSERT').length,
      updates: data.filter(log => log.action === 'UPDATE').length,
      deletes: data.filter(log => log.action === 'DELETE').length
    };

    return stats;
  }

  async getAuditRecord(table: string, id: string) {
    const { data, error } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .eq('table_name', table)
      .eq('record_id', id)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }
}

export const api = new APIClient();

// Полный Supabase клиент для совместимости
export const supabase = supabaseClient;