import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { Product, CartItem, Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  Phone, 
  MapPin,
  Printer,
  Save,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function POS() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(docs);
    });
    return unsubscribe;
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, total: product.price }];
    });
    setSearchQuery('');
    toast.success(`Added ${product.name} to cart`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const dueAmount = Math.max(0, subtotal - paidAmount);

  const handleSaveInvoice = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsSaving(true);
    try {
      // Get and increment invoice counter
      const metaRef = doc(db, 'meta', 'settings');
      const metaSnap = await getDoc(metaRef);
      let currentCounter = 1000;
      
      if (metaSnap.exists()) {
        currentCounter = metaSnap.data().invoiceCounter || 1000;
      }
      
      const newInvoiceNumber = currentCounter + 1;
      await setDoc(metaRef, { invoiceCounter: newInvoiceNumber }, { merge: true });

      const invoiceData: Omit<Invoice, 'id'> = {
        invoiceNumber: newInvoiceNumber,
        date: serverTimestamp(),
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        items: cart,
        subtotal,
        paidAmount,
        dueAmount,
        status: dueAmount === 0 ? 'Paid' : (paidAmount === 0 ? 'Due' : 'Partial'),
        createdBy: user?.email || 'Unknown'
      };

      await addDoc(collection(db, 'invoices'), invoiceData);
      
      toast.success(`Invoice #${newInvoiceNumber} saved successfully`);
      setCart([]);
      setCustomer({ name: '', phone: '', address: '' });
      setPaidAmount(0);
    } catch (error: any) {
      toast.error('Failed to save invoice: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-120px)]">
      {/* Left Side: Product Search & Selection */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Find Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by product name..."
                className="pl-12 h-14 text-lg rounded-2xl border-secondary bg-secondary/20 focus:bg-background transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {searchQuery && (
              <div className="mt-4 border rounded-2xl overflow-hidden bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <ScrollArea className="h-[300px]">
                  {filteredProducts.length > 0 ? (
                    <div className="divide-y">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
                          onClick={() => addToCart(product)}
                        >
                          <div>
                            <p className="font-bold text-lg">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.unit}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-lg">৳{product.price}</p>
                            <Badge variant="secondary" className="mt-1">In Stock</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      No products found matching "{searchQuery}"
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 border-none shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Current Cart
            </CardTitle>
            <Badge variant="secondary" className="text-sm px-3 py-1 rounded-full">
              {cart.length} Items
            </Badge>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-6">
              {cart.length > 0 ? (
                <div className="divide-y pb-6">
                  {cart.map(item => (
                    <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">৳{item.price} / {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-secondary/50 p-1 rounded-xl">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-bold w-8 text-center">{item.quantity}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-bold text-lg">৳{item.total}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground space-y-2">
                  <ShoppingCart className="w-12 h-12 opacity-20" />
                  <p>Your cart is empty</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Side: Customer Info & Checkout */}
      <div className="lg:col-span-5 flex flex-col space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" /> Name
                </Label>
                <Input 
                  placeholder="Customer Name" 
                  className="rounded-xl border-secondary"
                  value={customer.name}
                  onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" /> Phone
                </Label>
                <Input 
                  placeholder="01XXXXXXXXX" 
                  className="rounded-xl border-secondary"
                  value={customer.phone}
                  onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" /> Address
                </Label>
                <Input 
                  placeholder="Customer Address" 
                  className="rounded-xl border-secondary"
                  value={customer.address}
                  onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 border-none shadow-lg bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-xl">Checkout Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-lg opacity-90">
                <span>Subtotal</span>
                <span>৳{subtotal}</span>
              </div>
              <div className="flex justify-between text-lg opacity-90">
                <span>Discount</span>
                <span>৳0</span>
              </div>
              <Separator className="bg-primary-foreground/20" />
              <div className="flex justify-between text-3xl font-bold">
                <span>Total</span>
                <span>৳{subtotal}</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-primary-foreground">Paid Amount (৳)</Label>
                <Input 
                  type="number" 
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-14 text-2xl font-bold rounded-2xl"
                  value={paidAmount || ''}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                />
              </div>
              
              <div className="flex justify-between items-center p-4 bg-white/10 rounded-2xl border border-white/20">
                <span className="font-medium">Due Amount</span>
                <span className="text-2xl font-bold">৳{dueAmount}</span>
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0 grid grid-cols-2 gap-4">
            <Button 
              variant="secondary" 
              className="h-14 rounded-2xl font-bold text-lg shadow-xl"
              onClick={handleSaveInvoice}
              disabled={isSaving || cart.length === 0}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Save
            </Button>
            <Button 
              className="h-14 rounded-2xl font-bold text-lg bg-white text-primary hover:bg-white/90 shadow-xl"
              onClick={() => {
                handleSaveInvoice();
                // Print logic would go here
              }}
              disabled={isSaving || cart.length === 0}
            >
              <Printer className="w-5 h-5 mr-2" />
              Print
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
