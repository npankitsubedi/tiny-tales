import { db } from '@/lib/db';
import ExpenseTable from '@/components/admin/accounts/ExpenseTable';
import { getExpenseTransactions } from '@/app/actions/accounting';
import { requireSuperadmin } from '@/lib/authz';

export const dynamic = 'force-dynamic';
export const metadata = {
    title: 'Purchases & Expenses Ledger | Accounts',
}

export default async function ExpensesLedgerPage() {
    await requireSuperadmin();

    const expenses = await getExpenseTransactions();

    const vendors = await db.vendor.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    });

    const tableData = expenses.map(e => ({
        id: e.id,
        date: e.date,
        category: e.category,
        vendorName: e.vendorName,
        paymentMethod: e.paymentMethod || 'Unknown',
        amount: e.amount,
        notes: e.notes || '',
    }));

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Purchases & Expenses</h2>
                    <p className="text-sm text-slate-500">Track operating costs, COGS, and vendor payments.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <ExpenseTable data={tableData} vendors={vendors} />
            </div>
        </div>
    );
}
