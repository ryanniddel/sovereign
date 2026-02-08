'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useBulkImportContacts } from '@/hooks/use-contacts';
import { Upload, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

type ParsedContact = { email: string; name: string; phone?: string; company?: string; title?: string };

type ParseResult = {
  contacts: ParsedContact[];
  errors: string[];
  skipped: number;
};

/** Parse a single CSV line respecting quoted fields */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): ParseResult {
  const lines = text.trim().split('\n').map((l) => l.replace(/\r$/, ''));
  const errors: string[] = [];

  if (lines.length < 2) {
    return { contacts: [], errors: ['CSV must have a header row and at least one data row.'], skipped: 0 };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const emailIdx = headers.indexOf('email');
  const nameIdx = headers.indexOf('name');
  const phoneIdx = headers.indexOf('phone');
  const companyIdx = headers.indexOf('company');
  const titleIdx = headers.indexOf('title');

  if (emailIdx === -1) errors.push('Missing required "email" column in header.');
  if (nameIdx === -1) errors.push('Missing required "name" column in header.');
  if (errors.length > 0) return { contacts: [], errors, skipped: 0 };

  const contacts: ParsedContact[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = parseCsvLine(lines[i]);
    const email = cols[emailIdx]?.trim();
    const name = cols[nameIdx]?.trim();

    if (!email || !name) {
      skipped++;
      errors.push(`Row ${i + 1}: Missing ${!email ? 'email' : 'name'}, skipped.`);
      continue;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      skipped++;
      errors.push(`Row ${i + 1}: Invalid email "${email}", skipped.`);
      continue;
    }

    contacts.push({
      email,
      name,
      phone: phoneIdx >= 0 ? cols[phoneIdx]?.trim() || undefined : undefined,
      company: companyIdx >= 0 ? cols[companyIdx]?.trim() || undefined : undefined,
      title: titleIdx >= 0 ? cols[titleIdx]?.trim() || undefined : undefined,
    });
  }

  return { contacts, errors, skipped };
}

export default function ImportContactsPage() {
  const router = useRouter();
  const bulkImport = useBulkImportContacts();
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [done, setDone] = useState(false);

  const handleParse = () => {
    setResult(parseCsv(csvText));
  };

  const handleImport = () => {
    if (!result) return;
    bulkImport.mutate(result.contacts, {
      onSuccess: () => setDone(true),
    });
  };

  if (done) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center py-12">
          <CheckCircle className="h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-lg font-semibold">Import Complete</h2>
          <p className="text-sm text-muted-foreground">{result?.contacts.length} contacts imported.</p>
          <Button className="mt-4" onClick={() => router.push('/contacts')}>View Contacts</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Import Contacts</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />Paste CSV Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>CSV format: email, name, phone, company, title (header row required)</Label>
            <Textarea
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setResult(null); }}
              rows={8}
              placeholder={`email,name,phone,company,title\njohn@example.com,John Doe,555-0123,Acme Inc,CEO\n"jane@example.com","Smith, Jane",,"Widget Corp",CTO`}
            />
          </div>
          <Button variant="outline" onClick={handleParse} disabled={!csvText.trim()}>
            <FileText className="mr-1 h-4 w-4" />Parse CSV
          </Button>
        </CardContent>
      </Card>

      {/* Parse errors */}
      {result && result.errors.length > 0 && (
        <Card className="border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              {result.skipped} row{result.skipped !== 1 ? 's' : ''} skipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-0.5 text-xs text-muted-foreground">
              {result.errors.slice(0, 10).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {result.errors.length > 10 && (
                <li>...and {result.errors.length - 10} more</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Valid contacts preview */}
      {result && result.contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Preview <Badge variant="secondary">{result.contacts.length} contacts</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {result.contacts.map((c, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md border p-2 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.email}</span>
                  {c.company && <Badge variant="outline" className="text-xs">{c.company}</Badge>}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setResult(null); setCsvText(''); }}>Clear</Button>
              <Button onClick={handleImport} disabled={bulkImport.isPending}>
                {bulkImport.isPending ? 'Importing...' : `Import ${result.contacts.length} Contacts`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No valid contacts after parse */}
      {result && result.contacts.length === 0 && result.errors.length > 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No valid contacts found. Fix the errors above and try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
