import { useState } from 'react';
import { Download, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/storage';

export function ExportImport() {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const exportProgress = () => {
    try {
      const data = {
        user: storage.getUser(),
        flashcards: storage.getFlashCards(),
        challenges: storage.getChallenges(),
        chats: storage.getChatsSync(),
        progress: storage.getProgress(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
              a.download = `codivus-progress-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Your progress has been exported successfully!",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const importProgress = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!data.user || !data.version) {
          throw new Error('Invalid data format');
        }

        // Import data
        storage.saveUser(data.user);
        if (data.flashcards) storage.saveFlashCards(data.flashcards);
        if (data.challenges) storage.saveChallenges(data.challenges);
        if (data.chats) storage.saveChatsSync(data.chats);
        if (data.progress) storage.saveProgress(data.progress);

        toast({
          title: "Import Complete",
          description: "Your progress has been imported successfully!",
        });

        // Reload page to reflect changes
        setTimeout(() => window.location.reload(), 1000);
        
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Invalid file format or corrupted data.",
          variant: "destructive",
        });
      } finally {
        setImporting(false);
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Data Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={exportProgress} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Progress
          </Button>
          
          <div className="relative">
            <Button variant="outline" className="w-full flex items-center gap-2" disabled={importing}>
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import Progress'}
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importProgress}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={importing}
            />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Export your progress as a JSON file for backup or transfer to another device. 
          All your achievements, streaks, and learning progress will be preserved.
        </p>
      </CardContent>
    </Card>
  );
}