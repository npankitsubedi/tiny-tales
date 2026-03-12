import { db } from '@/lib/db';
import SalesTable from '@/components/admin/accounts/SalesTable';
import { getIncomeTransactions } from '@/app/actions/accounting';
import { requireSuperadmin } from '@/lib/authz';

export const dynamic = 'force-dynamic';
export const metadata = {
    title: 'Sales & Billing Ledger | Accounts',
}

export default async function SalesLedgerPage() {
    await requireSuperadmin();

    const transactions = await getIncomeTransactions();

    // Extract reference IDs that might be Order IDs
    const orderIds = transactions
        .map(t => t.referenceId)
        .filter((id): id is string => Boolean(id));

    // Fetch related orders to get Customer Names
    const relatedOrders = await db.order.findMany({
        where: { id: { in: orderIds } },
        select: { id: true, customerName: true },
    });

    const orderMap = new Map<string, string | null>();
    for (const o of relatedOrders) {
        orderMap.set(o.id, o.customerName);
    }

    // Map to flat, serialization-safe objects
    const tableData = transactions.map(t => ({
        id: t.id,
        date: t.createdAt,
        source: t.category,
        referenceId: t.referenceId || 'N/A',
        customerName: t.referenceId ? (orderMap.get(t.referenceId) || 'Unknown Customer') : 'N/A',
        paymentMethod: t.paymentMethod || 'Unknown',
        amount: t.amount,
    }));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Sales & Billing Ledger</h2>
                    <p className="text-sm text-slate-500">Record of all captured income and web/POS sales.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <SalesTable data={tableData} />
            </div>
        </div>
    );
}
