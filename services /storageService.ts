import { AWBRecord, User, ChatMessage, ViewType, GroupCreatePayload, ChatGroup } from '../types';

const API_URL = "https://script.google.com/macros/s/AKfycbyahGxDOYN6BxLXIlufM0sfd8B-CU8VMEqmCiQsd3WDCrJJi4C8tGq4aeohJp0DwF_m/exec";

export const SHEETS = {
  AWB: "AWB",
  PRE: "PRÉ",
  USERS: "CADASTRO USUÁRIO",
  CHAT: "CHAT",
  GROUPS: "ESPACO"
};

const normalizePermission = (p: string): ViewType | null => {
  const clean = p.trim().toUpperCase();
  if (clean.includes('DASHBOARD')) return 'dashboard';
  if (clean.includes('RELATORIO')) return 'reports';
  if (clean.includes('HISTORICO')) return 'history';
  if (clean.includes('CHAT')) return 'chat';
  if (clean.includes('FOLLOW-UP-PRE')) return 'follow-up-pre';
  if (clean.includes('FOLLOW-UP')) return 'follow-up';
  if (clean.includes('CONFIGURA')) return 'settings';
  return null;
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        redirect: 'follow'
      });
      if (response.ok) return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, 1000));
    }
  }
  throw new Error("Falha na conexão com a API.");
};

export const getApiUrl = () => API_URL;

export const storageService = {
  getChatMessages: async (sheet: string): Promise<ChatMessage[]> => {
    try {
      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "CHAT_GET", sheet })
      });
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      
      return data.map((item: any) => ({
        id: String(item.id || item.ID || ""),
        user: String(item.user || "Operador"),
        text: String(item.text || ""),
        img: String(item.img || ""),
        timestamp: String(item.timestamp || ""),
        type: String(item.img || "").startsWith('http') ? 'image' : 'text'
      }));
    } catch (error) {
      return [];
    }
  },

  saveChatMessage: async (sheet: string, data: Partial<ChatMessage>) => {
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "CHAT_SAVE", sheet, data })
    });
    return await response.json();
  },

  uploadFile: async (file: File): Promise<string> => {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const fullBase64 = await base64Promise;
    const base64 = fullBase64.split(',')[1];
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "UPLOAD", data: { fileName: file.name, mimeType: file.type, base64 } })
    });
    const result = await response.json();
    return result.id ? `https://lh3.googleusercontent.com/d/${result.id}` : result.url;
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const response = await fetch(`${API_URL}?sheet=${SHEETS.USERS}&t=${Date.now()}`);
      const data = await response.json();
      return (Array.isArray(data) ? data : []).map((u: any) => {
        // Normalização estrita do status do banco de dados
        const rawStatus = String(u.STATUS || u.status || '').toLowerCase().trim();
        const normalizedStatus = rawStatus === 'ativo' ? 'ativo' : 'inativo';

        return {
          ...u,
          id: String(u.ID || u.id || ''),
          name: String(u.USUÁRIO || u.name || ''),
          email: String(u["E-MAIL"] || u.email || ''),
          role: String(u.PAPEL || u.role || '').toLowerCase() === 'admin' ? 'admin' : 'user',
          status: normalizedStatus,
          bio: String(u.Bio || u.bio || ''),
          location: String(u.Location || u.location || ''),
          birthday: String(u.Birthday || u.birthday || ''),
          cargo: String(u.Cargo || u.cargo || ''),
          allowedViews: String(u["Permissões de Tela (Módulos)"] || '').split(/[;|,]/).map(p => normalizePermission(p)).filter((v): v is ViewType => v !== null)
        };
      });
    } catch (error) {
      return [];
    }
  },

  saveUser: async (user: any) => {
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "SAVE", sheet: SHEETS.USERS, data: user })
    });
    return await response.json();
  },

  getRecords: async (sheet: string = SHEETS.AWB): Promise<AWBRecord[]> => {
    try {
      const response = await fetch(`${API_URL}?sheet=${encodeURIComponent(sheet)}&t=${Date.now()}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  },

  saveRecord: async (record: Partial<AWBRecord>, sheet: string = SHEETS.AWB) => {
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "SAVE", sheet, data: record })
    });
    return response.json();
  },

  deleteRecord: async (id: string, sheet: string = SHEETS.AWB) => {
    const response = await fetchWithRetry(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "DELETE", sheet, data: { id } })
    });
    return response.json();
  },

  buildDM: (userA: string, userB: string) => {
    const sorted = [userA, userB].sort();
    return "DM_" + sorted.join("_").replace(/\s+/g, '_').toLowerCase();
  },

  getGroups: async (): Promise<ChatGroup[]> => {
    try {
      const response = await fetch(`${API_URL}?sheet=${SHEETS.GROUPS}&t=${Date.now()}`);
      const data = await response.json();
      return (Array.isArray(data) ? data : []).map((g: any) => {
        let parsedMembers: string[] = [];
        try {
          const rawMembers = g.members || g.MEMBERS || '';
          if (typeof rawMembers === 'string' && rawMembers.startsWith('[')) {
            parsedMembers = JSON.parse(rawMembers).map(String);
          } else if (typeof rawMembers === 'string') {
            parsedMembers = rawMembers.split(',').map(s => String(s).trim()).filter(Boolean);
          } else if (Array.isArray(rawMembers)) {
            parsedMembers = rawMembers.map(String);
          }
        } catch (e) {
          console.error("Erro ao parsear members do grupo", e);
        }

        return {
          name: String(g.name || g.NAME || ''),
          sheetName: String(g.name || g.NAME || ''),
          type: 'group' as const,
          unreadCount: 0,
          lastReadCount: 0,
          members: parsedMembers
        };
      });
    } catch (error) { return []; }
  },

  createGroup: async (payload: GroupCreatePayload) => {
    const response = await fetchWithRetry(API_URL, {
      method: 'POST', body: JSON.stringify({ action: "GROUP_CREATE", data: payload })
    });
    return await response.json();
  }
};

export const formatDate = (dateStr: any): string => {
  if (!dateStr || dateStr === '-') return '-';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('pt-BR');
};

export const toInputDate = (dateStr: any): string => {
  if (!dateStr || dateStr === '-') return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};
