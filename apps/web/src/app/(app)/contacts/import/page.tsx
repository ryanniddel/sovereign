'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useBulkImportContacts } from '@/hooks/use-contacts';
import { Upload, FileText, CheckCircle } from 'lucide-react';

type ParsedContact = { email: string; name: string; phone?: string; company?: string; title?: string };

function parseCsv(text: string): ParsedContact[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const emailIdx = headers.indexOf('email');
  const nameIdx = headers.indexOf('name');
  const phoneIdx = headers.indexOf('phone');
  const companyIdx = headers.indexOf('company');
  const titleIdx = headers.indexOf('title');

  if (emailIdx === -1 || nameIdx === -1) return [];

  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    return {
      email: cols[emailIdx],
      name: cols[nameIdx],
      phone: phoneIdx >= 0 ? cols[phoneIdx] || undefined : undefined,
      company: companyIdx >= 0 ? cols[companyIdx] || undefined : undefined,
      title: titleIdx >= 0 ? cols[titleIdx] || undefined : undefined,
    };
  }).filter((c) => c.email && c.name);
}

export default function ImportContactsPage() {
  const router = useRouter();
  const bulkImport = useBulkImportContacts();
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [done, setDone] = useState(false);

  const handleParse = () => {
    setParsed(parseCsv(csvText));
  };

  const handleImport = () => {
    bulkImport.mutate(parsed, {
      onSuccess: () => setDone(true),
    });
  };

  if (done) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center py-12">
          <CheckCircle className="h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-lg font-semibold">Import Complete</h2>
          <p className="text-sm text-muted-foreground">{parsed.length} contacts imported.</p>
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
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
              placeholder={`email,name,phone,company,title\njohn@example.com,John Doe,555-0123,Acme Inc,CEO\njane@example.com,Jane Smith,,Widget Corp,CTO`}
            />
          </div>
          <Button variant="outline" onClick={handleParse} disabled={!csvText.trim()}>
            <FileText className="mr-1 h-4 w-4" />Parse CSV
          </Button>
        </CardContent>
      </Card>

      {parsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Preview <Badge variant="secondary">{parsed.length} contacts</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="max-h-64 overflow-y-auto space-y-1">
              {parsed.map((c, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md border p-2 text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{c.email}</span>
                  {c.company && <Badge variant="outline" className="text-xs">{c.company}</Badge>}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setParsed([]); setCsvText(''); }}>Clear</Button>
              <Button onClick={handleImport} disabled={bulkImport.isPending}>
                {bulkImport.isPending ? 'Importing...' : `Import ${parsed.length} Contacts`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
