'use server';

import { db } from '@tinytales/db';
import { TransactionType, PaymentMethod } from '@tinytales/db';
import { revalidatePath } from 'next/cache';
import { actionError, actionSuccess } from '@/lib/action-utils';
import { requireSuperadmin } from '@/lib/authz';
import { z } from 'zod';

const expenseSchema = z.object({
    category: z.string().min(1, "Category is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    paymentMethod: z.enum(['CASH', 'FONEPAY', 'CARD', 'BANK']),
    date: z.string().min(1, "Date is required"),
    vendorId: z.string().optional(),
    notes: z.string().optional(),
});

/**
 * Fetches dashboard KPI numbers for the current month vs lifetime, etc.
 * For simplicity, we are returning lifetime/all-time totals.
 */
export async function getDashboardKPIs() {
    try {
        await requireSuperadmin();

        const [transactions, purchaseOrders, operations] = await Promise.all([
            db.transaction.findMany({}),
            db.purchaseOrder.findMany({}),
            db.expense.findMany({}),
        ]);

        let totalRevenue = 0;
        for (const t of transactions) {
            if (t.type === 'INCOME') totalRevenue += Number(t.amount);
        }

        // Cost of Goods Sold from Purchase Orders
        const totalCogs = purchaseOrders.reduce((acc, po) => acc + Number(po.totalAmount), 0);

        // Operating Expenses from Expense table (cash outflows not tied to COGS)
        const operationsTotal = operations.reduce((acc, op) => acc + Number(op.amount), 0);

        const netProfit = totalRevenue - (totalCogs + operationsTotal);

        return {
            totalRevenue,
            totalCogs,
            operatingExpenses: operationsTotal,
            netProfit,
        };
    } catch (error) {
        console.error('[ACCOUNTING_ERROR] Failed to fetch dashboard KPIs:', error);
        return {
            totalRevenue: 0,
            totalCogs: 0,
            operatingExpenses: 0,
            netProfit: 0,
        };
    }
}

/**
 * Helper to fetch last 30 days cash flow.
 */
export async function getCashFlowData() {
    try {
        await requireSuperadmin();

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const transactions = await db.transaction.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            orderBy: { createdAt: 'asc' },
        });

        // Aggregate by YYYY-MM-DD day key
        const dailyData: Record<string, { income: number; expense: number }> = {};

        for (const t of transactions) {
            const day = t.createdAt.toISOString().split('T')[0];
            if (!dailyData[day]) dailyData[day] = { income: 0, expense: 0 };

            if (t.type === 'INCOME') {
                dailyData[day].income += Number(t.amount);
            } else {
                dailyData[day].expense += Number(t.amount);
            }
        }

        const chartData = Object.entries(dailyData)
            .map(([date, data]) => ({ date, income: data.income, expense: data.expense }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return chartData;
    } catch (error) {
        console.error('[ACCOUNTING_ERROR] Failed to fetch cash flow data:', error);
        return [];
    }
}

export async function recordExpense(formData: unknown) {
    try {
        await requireSuperadmin();
        const data = expenseSchema.parse(formData);

        const result = await db.$transaction(async (tx) => {
            const expense = await tx.expense.create({
                data: {
                    category: data.category,
                    amount: data.amount,
                    paymentMethod: data.paymentMethod as PaymentMethod,
                    date: new Date(data.date),
                    vendorId: data.vendorId || null,
                    notes: data.notes,
                }
            });

            await tx.transaction.create({
                data: {
                    type: TransactionType.EXPENSE,
                    category: data.category,
                    amount: data.amount,
                    paymentMethod: data.paymentMethod as PaymentMethod,
                    referenceId: expense.id,
                    createdAt: new Date(data.date),
                }
            });

            return { expenseId: expense.id };
        });

        revalidatePath('/accounts');
        revalidatePath('/accounts/expenses');
        return actionSuccess(result);
    } catch (error) {
        console.error('[ACCOUNTING_ERROR] Failed to record expense:', error);
        return actionError(error, 'Failed to record expense');
    }
}

/**
 * Fetches all INCOME transactions for the Sales Ledger grid.
 * Safely maps Decimals to numbers.
 */
export async function getIncomeTransactions() {
    await requireSuperadmin();
    const transactions = await db.transaction.findMany({
        where: { type: 'INCOME' },
        orderBy: { createdAt: 'desc' },
    });

    return transactions.map(t => ({
        id: t.id,
        category: t.category,
        amount: Number(t.amount), // Prevent Next.js Decimal serialization crash
        paymentMethod: t.paymentMethod,
        referenceId: t.referenceId,
        createdAt: t.createdAt.toISOString(),
    }));
}

/**
 * Fetches all Expenses for the Expense Ledger grid.
 * Retrieves vendor relations and maps Decimals to numbers.
 */
export async function getExpenseTransactions() {
    await requireSuperadmin();
    const expenses = await db.expense.findMany({
        include: { vendor: true },
        orderBy: { date: 'desc' },
    });

    return expenses.map(e => ({
        id: e.id,
        category: e.category,
        amount: Number(e.amount),
        date: e.date.toISOString(),
        paymentMethod: e.paymentMethod,
        vendorName: e.vendor?.name || 'N/A',
        notes: e.notes,
    }));
}
