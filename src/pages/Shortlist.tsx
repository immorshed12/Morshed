import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShortlistItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  ListTodo,
  Loader2,
  Calendar
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Shortlist() {
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'Piece', note: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'shortlist'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShortlistItem));
      setItems(docs);
    });
    return unsubscribe;
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'shortlist'), {
        ...newItem,
        isDone: false,
        createdAt: serverTimestamp()
      });
      setNewItem({ name: '', quantity: '', unit: 'Piece', note: '' });
      toast.success('Added to shortlist');
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDone = async (item: ShortlistItem) => {
    try {
      await updateDoc(doc(db, 'shortlist', item.id), {
        isDone: !item.isDone
      });
    } catch (error: any) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this item?')) {
      try {
        await deleteDoc(doc(db, 'shortlist', id));
        toast.success('Item removed');
      } catch (error: any) {
        toast.error('Error: ' + error.message);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchase Shortlist</h1>
        <p className="text-muted-foreground">Keep track of items that need to be restocked.</p>
      </div>

      <Card className="border-none shadow-lg overflow-hidden bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Quick Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5">
              <Input 
                placeholder="Item Name" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Input 
                placeholder="Qty" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
              />
            </div>
            <div className="md:col-span-3">
              <Input 
                placeholder="Note (optional)" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-xl"
                value={newItem.note}
                onChange={(e) => setNewItem(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full h-12 rounded-xl bg-white text-primary hover:bg-white/90 font-bold" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.map((item) => (
          <Card 
            key={item.id} 
            className={cn(
              "border-none shadow-sm transition-all duration-300",
              item.isDone ? "opacity-60 bg-secondary/30" : "hover:shadow-md"
            )}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <button 
                onClick={() => toggleDone(item)}
                className={cn(
                  "transition-colors",
                  item.isDone ? "text-emerald-500" : "text-muted-foreground hover:text-primary"
                )}
              >
                {item.isDone ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className={cn(
                    "text-xl font-bold truncate",
                    item.isDone && "line-through text-muted-foreground"
                  )}>
                    {item.name}
                  </h3>
                  {item.quantity && (
                    <Badge variant="secondary" className="rounded-lg">
                      {item.quantity} {item.unit}
                    </Badge>
                  )}
                </div>
                {item.note && <p className="text-sm text-muted-foreground mt-1">{item.note}</p>}
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {item.createdAt?.toDate ? format(item.createdAt.toDate(), 'MMM d, yyyy') : 'Just now'}
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-center py-20 bg-secondary/20 rounded-3xl border-2 border-dashed">
            <ListTodo className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
            <p className="text-xl font-medium text-muted-foreground">Your shortlist is empty</p>
            <p className="text-muted-foreground">Add items that you need to restock soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
