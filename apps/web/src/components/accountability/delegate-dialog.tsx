'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Forward } from 'lucide-react';

interface DelegateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelegate: (data: { delegatedToId: string; retainAccountability: boolean }) => void;
  loading?: boolean;
}

export function DelegateDialog({
  open,
  onOpenChange,
  onDelegate,
  loading,
}: DelegateDialogProps) {
  const [delegatedToId, setDelegatedToId] = useState('');
  const [retainAccountability, setRetainAccountability] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!delegatedToId.trim()) return;
    onDelegate({ delegatedToId: delegatedToId.trim(), retainAccountability });
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setDelegatedToId('');
      setRetainAccountability(true);
    }
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5" />
            Delegate Commitment
          </DialogTitle>
          <DialogDescription>
            Assign this commitment to another person. You can choose to retain accountability.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delegatedToId">Contact ID or Name</Label>
            <Input
              id="delegatedToId"
              placeholder="Search for a contact..."
              value={delegatedToId}
              onChange={(e) => setDelegatedToId(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="retainAccountability"
              checked={retainAccountability}
              onCheckedChange={(checked) => setRetainAccountability(checked === true)}
              disabled={loading}
            />
            <Label htmlFor="retainAccountability" className="text-sm font-normal">
              Retain accountability for this commitment
            </Label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !delegatedToId.trim()}>
              {loading ? 'Delegating...' : 'Delegate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
