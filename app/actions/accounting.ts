'use server';

import { db } from '@/lib/db';
import { TransactionType, PaymentMethod } from '@prisma/client';
import { z } from 'zod';

const expenseSchema = z.object({
    category: z.string().min(1, "Category is required"),
    amount: z.number().positive("Amount must be positive"),
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
    const transactions = await db.transaction.findMany({});

    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const t of transactions) {
        if (t.type === 'INCOME') {
            totalRevenue += Number(t.amount);
        } else if (t.type === 'EXPENSE') {
            totalExpenses += Number(t.amount);
        }
    }

    // Cost of Goods Sold is fetched from Purchase Orders
    const purchaseOrders = await db.purchaseOrder.findMany({});
    const totalCogs = purchaseOrders.reduce((acc, po) => acc + Number(po.totalAmount), 0);

    // We could also add Expenses directly from Expense table, but Transaction should ideally reflect actual cash flow.
    // For safety, let's treat Operations explicitly. Assuming operating expenses are logged in Expense:
    const operations = await db.expense.findMany({});
    const operationsTotal = operations.reduce((acc, op) => acc + Number(op.amount), 0);

    // Actually, wait, let's look at the instruction:
    // Operating Expenses (Rs.)
    // Total Cost of Goods / Purchases (Rs.)
    // Net Profit: Revenue - (COGS + Operating Expenses)

    // Calculate Net Profit
    const netProfit = totalRevenue - (totalCogs + operationsTotal);

    return {
        totalRevenue,
        totalCogs,
        operatingExpenses: operationsTotal,
        netProfit,
    };
}

/**
 * Helper to fetch last 30 days cash flow.
 */
export async function getCashFlowData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await db.transaction.findMany({
        where: {
            createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'asc' }
    });

    // Aggregate by day
    const dailyData: Record<string, { income: number; expense: number }> = {};

    for (const t of transactions) {
        // YYYY-MM-DD
        const day = t.createdAt.toISOString().split('T')[0];
        if (!dailyData[day]) {
            dailyData[day] = { income: 0, expense: 0 };
        }

        if (t.type === 'INCOME') {
            dailyData[day].income += Number(t.amount);
        } else {
            dailyData[day].expense += Number(t.amount);
        }
    }

    const chartData = Object.entries(dailyData).map(([date, data]) => ({
        date,
        income: data.income,
        expense: data.expense,
    }));

    // Sort chronologically just to be sure
    chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return chartData;
}

export async function recordExpense(formData: unknown) {
    const parsed = expenseSchema.safeParse(formData);
    if (!parsed.success) {
        throw new Error(parsed.error.issues[0].message);
    }
    
    const data = parsed.data;

    return await db.$transaction(async (tx) => {
        // 1. Create the Expense record
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

        // 2. Create the unified Transaction tracking real cash flow out
        await tx.transaction.create({
            data: {
                type: 'EXPENSE',
                category: data.category,
                amount: data.amount,
                paymentMethod: data.paymentMethod as PaymentMethod,
                referenceId: expense.id,
                createdAt: new Date(data.date), // Sync the date with the expense date
            }
        });

        return { success: true, expenseId: expense.id };
    });
}

/**
 * Fetches all INCOME transactions for the Sales Ledger grid.
 * Safely maps Decimals to numbers.
 */
export async function getIncomeTransactions() {
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
