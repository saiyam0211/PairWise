import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHEET_HEADERS = ['Spent on', 'Amount', 'Qty', 'Date', 'Spent by'];
const PAIRWISE_SPREADSHEET_TITLE = 'PairWise — Shared Spending';

type Partnership = {
  id: string;
  google_spreadsheet_id: string | null;
  google_sheets_enabled: boolean;
  google_sheets_cycle_tab: string | null;
  current_cycle_start_at: string | null;
  cycle_start_day: number;
  currency_code: string;
};

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured on the server.');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description ?? data.error ?? 'Failed to refresh Google token');
  }
  return data.access_token as string;
}

function cycleSheetName(cycleStartAt: string): string {
  const d = new Date(cycleStartAt);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function sanitizeSheetTitle(title: string): string {
  return title.replace(/[\\/?*[\]]/g, '-').slice(0, 100);
}

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatQty(quantity: number | null, unit: string | null): string {
  if (quantity == null) return '';
  const qty = Number(quantity);
  if (!Number.isFinite(qty)) return '';
  const qtyText = Number.isInteger(qty) ? String(qty) : String(qty);
  return unit ? `${qtyText} ${unit}` : qtyText;
}

async function getSpreadsheet(accessToken: string, spreadsheetId: string) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? 'Failed to load spreadsheet');
  }
  return data;
}

async function batchUpdate(accessToken: string, spreadsheetId: string, requests: unknown[]) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? 'Failed to update spreadsheet');
  }
  return data;
}

async function appendValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: string[][],
) {
  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append`,
  );
  url.searchParams.set('valueInputOption', 'USER_ENTERED');
  url.searchParams.set('insertDataOption', 'INSERT_ROWS');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? 'Failed to append row');
  }
  return data;
}

function uniqueSheetTitle(existingTitles: string[], baseTitle: string): string {
  const sanitized = sanitizeSheetTitle(baseTitle);
  if (!existingTitles.includes(sanitized)) return sanitized;

  let counter = 2;
  while (existingTitles.includes(`${sanitized} (${counter})`)) {
    counter += 1;
  }
  return `${sanitized} (${counter})`;
}

async function ensureSheetTab(
  accessToken: string,
  partnership: Partnership,
  admin: ReturnType<typeof createClient>,
): Promise<string> {
  const spreadsheetId = partnership.google_spreadsheet_id!;
  const cycleStartAt = partnership.current_cycle_start_at ?? new Date().toISOString();
  const desiredBase = cycleSheetName(cycleStartAt);

  const spreadsheet = await getSpreadsheet(accessToken, spreadsheetId);
  const existingTitles = (spreadsheet.sheets ?? []).map((s: { properties: { title: string } }) => s.properties.title);
  const currentTab = partnership.google_sheets_cycle_tab;

  if (currentTab && existingTitles.includes(currentTab)) {
    return currentTab;
  }

  const tabTitle = uniqueSheetTitle(existingTitles, desiredBase);

  await batchUpdate(accessToken, spreadsheetId, [
    {
      addSheet: {
        properties: { title: tabTitle },
      },
    },
  ]);

  await appendValues(accessToken, spreadsheetId, `'${tabTitle}'!A1`, [SHEET_HEADERS]);

  await admin
    .from('partnerships')
    .update({ google_sheets_cycle_tab: tabTitle })
    .eq('id', partnership.id);

  return tabTitle;
}

async function syncTransaction(
  transactionId: string,
  partnership: Partnership,
  accessToken: string,
  admin: ReturnType<typeof createClient>,
) {
  const { data: tx, error } = await admin
    .from('transactions')
    .select('id, amount_cents, description, quantity, unit, occurred_at, user_id, google_sheets_synced_at, partnership_id')
    .eq('id', transactionId)
    .single();

  if (error || !tx) throw new Error('Transaction not found');
  if (tx.partnership_id !== partnership.id) throw new Error('Transaction not in partnership');
  if (tx.google_sheets_synced_at) return { skipped: true };

  const { data: spender } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', tx.user_id)
    .single();

  const { data: refreshedPartnership } = await admin
    .from('partnerships')
    .select('*')
    .eq('id', partnership.id)
    .single();

  const tabTitle = await ensureSheetTab(accessToken, refreshedPartnership as Partnership, admin);

  const row = [
    tx.description?.trim() || '—',
    formatAmount(tx.amount_cents, partnership.currency_code),
    formatQty(tx.quantity, tx.unit),
    formatDate(tx.occurred_at),
    spender?.display_name?.trim() || 'Partner',
  ];

  await appendValues(accessToken, partnership.google_spreadsheet_id!, `'${tabTitle}'!A:E`, [row]);

  await admin
    .from('transactions')
    .update({ google_sheets_synced_at: new Date().toISOString() })
    .eq('id', tx.id);

  return { ok: true };
}

async function listSpreadsheets(accessToken: string) {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('q', "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  url.searchParams.set('fields', 'files(id,name,modifiedTime)');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? 'Failed to list spreadsheets');
  }

  return (data.files ?? []).map((file: { id: string; name: string; modifiedTime?: string }) => ({
    id: file.id,
    name: file.name,
    modifiedTime: file.modifiedTime ?? null,
  }));
}

async function createPairwiseSpreadsheet(
  partnership: Partnership,
  accessToken: string,
  admin: ReturnType<typeof createClient>,
) {
  const cycleStartAt = partnership.current_cycle_start_at ?? new Date().toISOString();
  const tabTitle = sanitizeSheetTitle(cycleSheetName(cycleStartAt));

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title: PAIRWISE_SPREADSHEET_TITLE },
      sheets: [{ properties: { title: tabTitle } }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? 'Failed to create spreadsheet');
  }

  const spreadsheetId = data.spreadsheetId as string;
  const sheetTitle = data.sheets?.[0]?.properties?.title ?? tabTitle;

  await appendValues(accessToken, spreadsheetId, `'${sheetTitle}'!A1`, [SHEET_HEADERS]);

  await admin
    .from('partnerships')
    .update({
      google_spreadsheet_id: spreadsheetId,
      google_spreadsheet_name: PAIRWISE_SPREADSHEET_TITLE,
      google_sheets_enabled: true,
      google_sheets_cycle_tab: sheetTitle,
    })
    .eq('id', partnership.id);

  return {
    id: spreadsheetId,
    name: PAIRWISE_SPREADSHEET_TITLE,
    tab: sheetTitle,
  };
}

async function loadGoogleContext(admin: ReturnType<typeof createClient>, userId: string) {
  const { data: profile } = await admin
    .from('profiles')
    .select('partnership_id')
    .eq('id', userId)
    .single();

  if (!profile?.partnership_id) throw new Error('No partnership');

  const { data: partnership, error: partnershipError } = await admin
    .from('partnerships')
    .select('*')
    .eq('id', profile.partnership_id)
    .single();

  if (partnershipError || !partnership) throw new Error('Partnership not found');

  const { data: secrets } = await admin
    .from('partnership_secrets')
    .select('google_refresh_token')
    .eq('partnership_id', partnership.id)
    .single();

  if (!secrets?.google_refresh_token) throw new Error('Sign in with Google first');

  const accessToken = await refreshAccessToken(secrets.google_refresh_token);
  return { partnership: partnership as Partnership, accessToken, admin };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const body = await req.json();
    const action = body.action as string;

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (action === 'list_spreadsheets' || action === 'create_spreadsheet') {
      const { partnership, accessToken } = await loadGoogleContext(admin, user.id);

      if (partnership.creator_id !== user.id) {
        throw new Error('Only the budget creator can manage Google Sheets');
      }

      if (action === 'list_spreadsheets') {
        const files = await listSpreadsheets(accessToken);
        return new Response(JSON.stringify({ files }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const created = await createPairwiseSpreadsheet(partnership, accessToken, admin);
      return new Response(JSON.stringify(created), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('partnership_id')
      .eq('id', user.id)
      .single();

    if (!profile?.partnership_id) throw new Error('No partnership');

    const { data: partnership, error: partnershipError } = await admin
      .from('partnerships')
      .select('*')
      .eq('id', profile.partnership_id)
      .single();

    if (partnershipError || !partnership) throw new Error('Partnership not found');
    if (!partnership.google_sheets_enabled || !partnership.google_spreadsheet_id) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: secrets } = await admin
      .from('partnership_secrets')
      .select('google_refresh_token')
      .eq('partnership_id', partnership.id)
      .single();

    if (!secrets?.google_refresh_token) throw new Error('Google Sheets is not connected');

    const accessToken = await refreshAccessToken(secrets.google_refresh_token);

    if (action === 'ensure_cycle_sheet') {
      const tabTitle = await ensureSheetTab(accessToken, partnership as Partnership, admin);
      return new Response(JSON.stringify({ ok: true, tab: tabTitle }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'sync_transaction') {
      if (!body.transaction_id) throw new Error('transaction_id is required');
      const result = await syncTransaction(body.transaction_id, partnership as Partnership, accessToken, admin);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Unknown action');
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
