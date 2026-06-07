import { supabase } from '@/lib/supabase';

export type GoogleSpreadsheetFile = {
  id: string;
  name: string;
  modifiedTime: string | null;
};

export type GoogleSheetsStatus = {
  connected: boolean;
  oauthReady: boolean;
  enabled: boolean;
  spreadsheet_id: string | null;
  spreadsheet_name: string | null;
  cycle_tab: string | null;
};

export async function fetchGoogleSheetsStatus(): Promise<GoogleSheetsStatus> {
  const { data, error } = await supabase.rpc('google_sheets_status');
  if (error) throw new Error(error.message);

  const row = Array.isArray(data) ? data[0] : data;
  return {
    connected: Boolean(row?.connected),
    oauthReady: Boolean(row?.oauth_ready),
    enabled: Boolean(row?.enabled),
    spreadsheet_id: row?.spreadsheet_id ?? null,
    spreadsheet_name: row?.spreadsheet_name ?? null,
    cycle_tab: row?.cycle_tab ?? null,
  };
}

export async function saveGoogleOAuthToken(refreshToken: string) {
  const { error } = await supabase.rpc('save_google_oauth_token', {
    p_refresh_token: refreshToken,
  });
  if (error) throw new Error(error.message);
}

export async function setGoogleSpreadsheet(spreadsheetId: string, spreadsheetName: string) {
  const { error } = await supabase.rpc('set_google_spreadsheet', {
    p_spreadsheet_id: spreadsheetId,
    p_spreadsheet_name: spreadsheetName,
  });
  if (error) throw new Error(error.message);
}

export async function listGoogleSpreadsheets(): Promise<GoogleSpreadsheetFile[]> {
  const { data, error } = await supabase.functions.invoke('sheets-sync', {
    body: { action: 'list_spreadsheets' },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return (data?.files ?? []) as GoogleSpreadsheetFile[];
}

export async function createPairwiseSpreadsheet(): Promise<{
  id: string;
  name: string;
  tab: string;
}> {
  const { data, error } = await supabase.functions.invoke('sheets-sync', {
    body: { action: 'create_spreadsheet' },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as { id: string; name: string; tab: string };
}

export async function setGoogleSheetsEnabled(enabled: boolean) {
  const { error } = await supabase.rpc('set_google_sheets_enabled', { p_enabled: enabled });
  if (error) throw new Error(error.message);
}

export async function disconnectGoogleSheets() {
  const { error } = await supabase.rpc('disconnect_google_sheets');
  if (error) throw new Error(error.message);
}

export function formatSpreadsheetDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
