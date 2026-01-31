import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CreditSetting {
  key: string;
  value_int: number;
  description: string | null;
}

export function AICreditSettingsSection() {
  const [settings, setSettings] = useState<CreditSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('ai_credit_settings')
      .select('*')
      .order('key');

    if (error) {
      toast.error('Failed to load settings', { description: error.message });
    } else {
      setSettings(data || []);
      const values: Record<string, number> = {};
      for (const setting of data || []) {
        values[setting.key] = setting.value_int;
      }
      setEditedValues(values);
    }
    setIsLoading(false);
  };

  const handleValueChange = (key: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditedValues(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handleSave = async (key: string) => {
    const newValue = editedValues[key];
    const originalSetting = settings.find(s => s.key === key);
    
    if (!originalSetting || originalSetting.value_int === newValue) {
      return; // No changes
    }

    setSavingKey(key);
    
    const { error } = await supabase
      .from('ai_credit_settings')
      .update({ value_int: newValue })
      .eq('key', key);

    if (error) {
      toast.error('Failed to update setting', { description: error.message });
    } else {
      // Update local state
      setSettings(prev => prev.map(s => 
        s.key === key ? { ...s, value_int: newValue } : s
      ));
      setSavedKey(key);
      toast.success('Setting updated', {
        description: `${formatKeyLabel(key)} is now ${newValue}`,
      });
      
      // Clear saved indicator after 2 seconds
      setTimeout(() => setSavedKey(null), 2000);
    }
    
    setSavingKey(null);
  };

  const handleSaveAll = async () => {
    const changedSettings = settings.filter(
      s => editedValues[s.key] !== s.value_int
    );

    if (changedSettings.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSavingKey('all');

    let successCount = 0;
    for (const setting of changedSettings) {
      const { error } = await supabase
        .from('ai_credit_settings')
        .update({ value_int: editedValues[setting.key] })
        .eq('key', setting.key);

      if (!error) {
        successCount++;
      }
    }

    if (successCount === changedSettings.length) {
      toast.success('All settings updated');
      fetchSettings(); // Refresh
    } else {
      toast.error('Some settings failed to update');
    }

    setSavingKey(null);
  };

  const formatKeyLabel = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const hasChanges = settings.some(s => editedValues[s.key] !== s.value_int);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Credit Settings</CardTitle>
          <CardDescription>Configure token and credit settings for all users</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>AI Credit Settings</CardTitle>
          <CardDescription>
            Configure token and credit settings for all users. Changes take effect immediately.
          </CardDescription>
        </div>
        {hasChanges && (
          <Button 
            onClick={handleSaveAll} 
            disabled={savingKey === 'all'}
            size="sm"
          >
            {savingKey === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.map((setting) => {
          const isChanged = editedValues[setting.key] !== setting.value_int;
          const isSaving = savingKey === setting.key;
          const isSaved = savedKey === setting.key;

          return (
            <div key={setting.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={setting.key} className="text-sm font-medium">
                  {formatKeyLabel(setting.key)}
                </Label>
                {isChanged && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave(setting.key)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isSaved ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              <Input
                id={setting.key}
                type="number"
                min="0"
                value={editedValues[setting.key] ?? setting.value_int}
                onChange={(e) => handleValueChange(setting.key, e.target.value)}
                className={isChanged ? 'border-primary' : ''}
              />
              {setting.description && (
                <p className="text-xs text-muted-foreground">
                  {setting.description}
                </p>
              )}
            </div>
          );
        })}

        {settings.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No credit settings found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
