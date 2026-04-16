import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ListTodo
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStock: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);

  useEffect(() => {
    // Fetch stats
    const fetchStats = async () => {
      const productsSnap = await getDocs(collection(db, 'products'));
      const invoicesSnap = await getDocs(collection(db, 'invoices'));
      
      let sales = 0;
      invoicesSnap.forEach(doc => {
        sales += doc.data().subtotal || 0;
      });

      setStats({
        totalSales: sales,
        totalOrders: invoicesSnap.size,
        totalProducts: productsSnap.size,
        lowStock: 0 // Placeholder for now
      });
    };

    fetchStats();

    // Listen for recent invoices
    const q = query(collection(db, 'invoices'), orderBy('date', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentInvoices(docs);
    });

    return unsubscribe;
  }, []);

  const statCards = [
    {
      title: 'Total Sales',
      value: `৳${stats.totalSales.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      trend: '+5.2%',
      trendUp: true
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      trend: '0%',
      trendUp: true
    },
    {
      title: 'Low Stock',
      value: stats.lowStock.toString(),
      icon: AlertCircle,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
      trend: '-2',
      trendUp: false
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} p-3 rounded-2xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.trend}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold">Recent Invoices</CardTitle>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-background p-2 rounded-xl shadow-sm">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">#{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.customerName || 'Walk-in Customer'} • {invoice.date?.toDate ? format(invoice.date.toDate(), 'MMM d, h:mm a') : 'Just now'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">৳{invoice.subtotal}</p>
                    <Badge variant={invoice.status === 'Paid' ? 'default' : 'destructive'} className="rounded-lg">
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {recentInvoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No recent invoices found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full h-12 rounded-xl justify-start gap-3" variant="outline">
              <ShoppingCart className="w-5 h-5" /> New Billing
            </Button>
            <Button className="w-full h-12 rounded-xl justify-start gap-3" variant="outline">
              <Package className="w-5 h-5" /> Add Product
            </Button>
            <Button className="w-full h-12 rounded-xl justify-start gap-3" variant="outline">
              <ListTodo className="w-5 h-5" /> View Shortlist
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
