import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Calendar, 
  Eye, 
  Trash2, 
  Download,
  Filter,
  ArrowUpDown,
  Printer
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';

export default function History() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'invoices'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
      setInvoices(docs);
    });
    return unsubscribe;
  }, []);

  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toString().includes(searchQuery) ||
    inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.customerPhone.includes(searchQuery)
  );

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteDoc(doc(db, 'invoices', id));
        toast.success('Invoice deleted');
      } catch (error: any) {
        toast.error('Error: ' + error.message);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid': return <Badge className="bg-emerald-500 hover:bg-emerald-600 rounded-lg">Paid</Badge>;
      case 'Due': return <Badge variant="destructive" className="rounded-lg">Due</Badge>;
      case 'Partial': return <Badge variant="outline" className="text-orange-600 border-orange-600 rounded-lg">Partial</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground">View and manage all your past sales records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl gap-2">
            <Calendar className="w-5 h-5" /> Filter Date
          </Button>
          <Button variant="outline" className="rounded-xl gap-2">
            <Download className="w-5 h-5" /> Export All
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-secondary/30 pb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by invoice #, customer name or phone..."
              className="pl-12 h-12 rounded-xl border-none bg-background shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="pl-6 font-bold">Invoice #</TableHead>
                <TableHead className="font-bold">Date & Time</TableHead>
                <TableHead className="font-bold">Customer</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="font-bold text-right">Total Amount</TableHead>
                <TableHead className="pr-6 text-right font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv) => (
                <TableRow key={inv.id} className="group hover:bg-secondary/30 transition-colors border-b last:border-0">
                  <TableCell className="pl-6 font-bold text-primary">#{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {inv.date?.toDate ? format(inv.date.toDate(), 'MMM d, yyyy') : 'N/A'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {inv.date?.toDate ? format(inv.date.toDate(), 'h:mm a') : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{inv.customerName || 'Walk-in Customer'}</span>
                      <span className="text-xs text-muted-foreground">{inv.customerPhone || 'No phone'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(inv.status)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    ৳{inv.subtotal.toLocaleString()}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(inv.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInvoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No sales records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden">
          {selectedInvoice && (
            <div className="flex flex-col h-full max-h-[90vh]">
              <DialogHeader className="p-8 bg-primary text-primary-foreground">
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-3xl font-bold">Invoice #{selectedInvoice.invoiceNumber}</DialogTitle>
                    <p className="opacity-90 mt-1">
                      {selectedInvoice.date?.toDate ? format(selectedInvoice.date.toDate(), 'MMMM d, yyyy • h:mm a') : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                      <p className="text-xs uppercase tracking-wider opacity-80">Total Amount</p>
                      <p className="text-2xl font-bold">৳{selectedInvoice.subtotal}</p>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <ScrollArea className="flex-1 p-8">
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Customer Info</h4>
                    <div className="space-y-1">
                      <p className="font-bold text-lg">{selectedInvoice.customerName || 'Walk-in Customer'}</p>
                      <p className="text-muted-foreground">{selectedInvoice.customerPhone}</p>
                      <p className="text-muted-foreground">{selectedInvoice.customerAddress}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Payment Summary</h4>
                    <div className="space-y-1">
                      <div className="flex justify-end gap-4">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-bold">{selectedInvoice.status}</span>
                      </div>
                      <div className="flex justify-end gap-4">
                        <span className="text-muted-foreground">Paid:</span>
                        <span className="font-bold text-emerald-600">৳{selectedInvoice.paidAmount}</span>
                      </div>
                      <div className="flex justify-end gap-4">
                        <span className="text-muted-foreground">Due:</span>
                        <span className="font-bold text-rose-600">৳{selectedInvoice.dueAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Order Items</h4>
                  <div className="border rounded-2xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-secondary/30">
                        <TableRow>
                          <TableHead className="font-bold">Item</TableHead>
                          <TableHead className="text-center font-bold">Qty</TableHead>
                          <TableHead className="text-right font-bold">Price</TableHead>
                          <TableHead className="text-right font-bold">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">{item.quantity} {item.unit}</TableCell>
                            <TableCell className="text-right">৳{item.price}</TableCell>
                            <TableCell className="text-right font-bold">৳{item.total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-8 border-t bg-secondary/10 flex justify-end gap-3">
                <Button variant="outline" className="rounded-xl h-12 px-6" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
                <Button className="rounded-xl h-12 px-6 gap-2">
                  <Printer className="w-5 h-5" /> Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
